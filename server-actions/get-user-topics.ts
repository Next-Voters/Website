"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

type TopicRow = { supported_topics: { topic_name: string } | null }

export async function getUserTopics(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return []

  const { data } = await supabase
    .from("subscription_topics")
    .select("supported_topics(topic_name)")
    .eq("subscription_id", user.email)

  if (!data) return []

  return (data as unknown as TopicRow[])
    .map((row) => row.supported_topics?.topic_name ?? "")
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
}
