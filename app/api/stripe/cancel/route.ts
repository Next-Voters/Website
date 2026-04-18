import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();

  // Look up customer and active subscription via Stripe SDK
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];

  if (!customer) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  });

  const subscription = subscriptions.data[0];

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
  }

  try {
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // cancel_at is set by Stripe when cancel_at_period_end is true
    const periodEnd = updated.cancel_at
      ? new Date(updated.cancel_at * 1000).toISOString()
      : null;

    return NextResponse.json({ success: true, periodEnd });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
