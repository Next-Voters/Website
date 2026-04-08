"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

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
    .select("premium")
    .eq("contact", user.email)
    .maybeSingle()

  if (data === null) {
    return { isPro: false, isAuthenticated: true, hasSubscription: false, tier: 'none' }
  }

  const isPro = data.premium === true
  return {
    isPro,
    isAuthenticated: true,
    hasSubscription: true,
    tier: isPro ? 'pro' : 'basic',
  }
}
