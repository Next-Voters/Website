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
    .select('stripe_subscription_id')
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

    // Already on pro
    const alreadyPro = stripeSub.items.data.some((item) => item.price?.id === proPriceId);
    if (alreadyPro) {
      return NextResponse.json({ error: 'Already on Pro' }, { status: 409 });
    }

    // Swap the price item from basic to pro
    const currentItem = stripeSub.items.data[0];
    await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
      items: [
        { id: currentItem.id, price: proPriceId },
      ],
      metadata: { contact: user.email, plan: 'pro' },
      proration_behavior: 'create_prorations',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upgrade';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
