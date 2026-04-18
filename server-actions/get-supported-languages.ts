"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getSupportedLanguages(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("supported_languages")
    .select("language")
    .order("language")

  return data?.map((row) => row.language) ?? []
}

export async function getUserLanguage(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return null

  const { data } = await supabase
    .from("subscriptions")
    .select("preferred_language")
    .eq("contact", user.email)
    .maybeSingle()

  return data?.preferred_language ?? null
}
