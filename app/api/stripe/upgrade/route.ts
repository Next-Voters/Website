import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('contact', user.email)
    .maybeSingle();

  if (!subscription?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  try {
    const stripeSub = await getStripe().subscriptions.retrieve(subscription.stripe_subscription_id);

    if (stripeSub.status !== 'active' && stripeSub.status !== 'trialing') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    const alreadyPro = stripeSub.items.data.some((item) => item.price?.id === proPriceId);
    if (alreadyPro) {
      return NextResponse.json({ error: 'Already on Pro' }, { status: 409 });
    }

    // Check if customer has a payment method on file
    const customer = await getStripe().customers.retrieve(subscription.stripe_customer_id!) as { invoice_settings?: { default_payment_method?: string | null }; default_source?: string | null };
    const hasPaymentMethod = !!(customer.invoice_settings?.default_payment_method || customer.default_source);

    if (hasPaymentMethod) {
      // Swap the price directly
      const currentItem = stripeSub.items.data[0];
      await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          { id: currentItem.id, price: proPriceId },
        ],
        metadata: { contact: user.email, plan: 'pro' },
        proration_behavior: 'create_prorations',
      });
      return NextResponse.json({ success: true });
    }

    // No payment method — cancel the free sub and create a checkout session for Pro
    await getStripe().subscriptions.cancel(subscription.stripe_subscription_id);

    const origin = request.headers.get('origin') ?? 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: subscription.stripe_customer_id!,
      line_items: [{ price: proPriceId, quantity: 1 }],
      success_url: `${origin}/local?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/local?checkout=cancel`,
      metadata: { contact: user.email, plan: 'pro' },
      subscription_data: {
        metadata: { contact: user.email, plan: 'pro' },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upgrade';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
