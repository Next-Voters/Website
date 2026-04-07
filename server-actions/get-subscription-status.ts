"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getSubscriptionStatus(): Promise<{
  isPro: boolean;
  isAuthenticated: boolean;
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { isPro: false, isAuthenticated: false }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("premium")
    .eq("contact", user.email)
    .maybeSingle()

  return {
    isPro: data?.premium === true,
    isAuthenticated: true,
  }
}
