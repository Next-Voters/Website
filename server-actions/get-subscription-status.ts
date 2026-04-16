"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"

export async function getSubscriptionStatus(): Promise<{
  isPro: boolean;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  tier: 'pro' | 'basic' | 'none';
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { isPro: false, isAuthenticated: false, hasSubscription: false, tier: 'none' }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("contact", user.email)
    .maybeSingle()

  // No row at all — never signed up
  if (!data?.stripe_subscription_id) {
    return { isPro: false, isAuthenticated: true, hasSubscription: false, tier: 'none' }
  }

  // Verify live status and determine tier from Stripe
  try {
    const stripeSub = await getStripe().subscriptions.retrieve(data.stripe_subscription_id)
    const isActive = stripeSub.status === 'active' || stripeSub.status === 'trialing'

    if (!isActive) {
      return { isPro: false, isAuthenticated: true, hasSubscription: true, tier: 'none' }
    }

    // Determine tier by checking the subscription's price against env vars
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID
    const items = stripeSub.items?.data ?? []
    const isPro = items.some((item) => item.price?.id === proPriceId)

    return {
      isPro,
      isAuthenticated: true,
      hasSubscription: true,
      tier: isPro ? 'pro' : 'basic',
    }
  } catch {
    return { isPro: false, isAuthenticated: true, hasSubscription: true, tier: 'none' }
  }
}
