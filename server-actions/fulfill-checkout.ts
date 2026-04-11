"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

export async function fulfillCheckout(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "Not authenticated" }

  let session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
  } catch {
    return { success: false, error: "Invalid session" }
  }

  if (session.mode !== "subscription") {
    return { success: false, error: "Session not completed" }
  }

  // Accept both "paid" (pro) and "no_payment_required" (free/basic) as valid
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { success: false, error: "Session not completed" }
  }

  if (session.metadata?.contact !== user.email) {
    return { success: false, error: "Session mismatch" }
  }

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("subscriptions")
    .upsert(
      {
        contact: user.email,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        stripe_status: "active",
      },
      { onConflict: "contact" }
    )

  if (error) return { success: false, error: error.message }
  return { success: true }
}
