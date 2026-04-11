import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000';

  // Look up existing Stripe customer ID from subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('contact', user.email)
    .maybeSingle();

  let stripeCustomerId = subscription?.stripe_customer_id;

  // Create a new Stripe customer if none exists
  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;

    // Save the Stripe customer ID if the subscription row exists
    if (subscription !== null) {
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('contact', user.email);
    }
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${origin}/local?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/local?checkout=cancel`,
    metadata: { contact: user.email },
    subscription_data: {
      metadata: { contact: user.email },
    },
  });

  return NextResponse.json({ url: session.url });
}
