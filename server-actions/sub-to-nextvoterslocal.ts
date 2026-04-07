"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export const handleSubscribe = async (
  contact: string,
  topics: string[],
  city: string
) => {
  const supabase = await createSupabaseServerClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("contact, premium")
    .eq("contact", contact)
    .maybeSingle()

  if (existing) {
    // Allow re-subscribing to a new city/topics if already exists
    // but don't downgrade premium
    return { error: "Contact already subscribed" }
  }

  // Server-side topic count enforcement
  const isPremium = false // new subscribers start free
  if (!isPremium && topics.length > 1) {
    return { error: "Free subscribers can only select 1 topic. Please upgrade to Pro." }
  }

  // Fetch topic IDs for the given topic names
  const normalizedTopics = topics.map((t) => t.toLowerCase())
  const { data: topicRows, error: topicError } = await supabase
    .from("supported_topics")
    .select("topic_id, topic_name")
    .in("topic_name", normalizedTopics)

  if (topicError) {
    return { error: "Failed to look up topics." }
  }

  // Insert subscription row
  const { error: subError } = await supabase
    .from("subscriptions")
    .insert({ contact, city, premium: false })

  if (subError) {
    return { error: subError.message }
  }

  // Insert topic associations
  if (topicRows && topicRows.length > 0) {
    const topicInserts = topicRows.map((row) => ({
      subscription_id: contact,
      topic_id: row.topic_id,
    }))

    const { error: topicsError } = await supabase
      .from("subscription_topics")
      .insert(topicInserts)

    if (topicsError) {
      return { error: topicsError.message }
    }
  }
}
