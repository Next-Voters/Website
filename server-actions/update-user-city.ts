"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function updateUserCity(city: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return { error: "Unauthorized" }

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("subscriptions")
    .update({ city })
    .eq("contact", user.email)

  if (error) return { error: error.message }
  return {}
}
