"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import topicOptions from "@/data/topic-options";
import { useSubscription } from "@/hooks/use-subscription";
import { TierBadge } from "@/components/alerts/tier-badge";
import { UpgradePrompt } from "@/components/alerts/upgrade-prompt";
import { getUserTopics } from "@/server-actions/get-user-topics";
import { updateUserTopics } from "@/server-actions/update-user-topics";

export function ManageTopics() {
  const { isPro, isAuthenticated, isLoading: subLoading, tier } = useSubscription();
  const MAX_TOPICS = isPro ? 3 : 1;

  const [selected, setSelected] = useState<string[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    if (subLoading) return;
    getUserTopics().then((topics) => {
      setSelected(topics);
      setTopicsLoading(false);
    });
  }, [subLoading]);

  const toggleTopic = (topic: string) => {
    setSelected((prev) => {
      const exists = prev.includes(topic);
      if (exists) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_TOPICS) {
        setShowUpgrade(true);
        return prev;
      }
      return [...prev, topic];
    });
    setSavedMsg("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    const result = await updateUserTopics(selected);
    setSaving(false);
    if (result.error) {
      setSavedMsg(result.error);
    } else {
      setSavedMsg("Topics saved!");
    }
  };

  if (subLoading || topicsLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-56px)] bg-page flex items-center justify-center">
        <p className="text-gray-400 text-[14px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-page flex flex-col">
      <div className="flex-1 w-full max-w-[560px] mx-auto px-5 sm:px-6 pt-12 pb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <h1 className="text-[30px] sm:text-[38px] font-bold text-gray-950 leading-tight tracking-tight">
            Manage your alerts
          </h1>
          <TierBadge tier={tier} />
        </div>
        <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
          {`Select up to ${MAX_TOPICS} topic${MAX_TOPICS === 1 ? "" : "s"}. We'll only send you updates related to your choice.`}
        </p>

        <div className="flex flex-wrap gap-2.5 mb-6">
          {topicOptions.map((topic) => {
            const isActive = selected.includes(topic);
            const isDisabled = !isActive && selected.length >= MAX_TOPICS;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                aria-pressed={isActive}
                className={[
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-[14.5px] transition-all",
                  isActive
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                  isDisabled && !isPro ? "opacity-40" : "",
                ].join(" ")}
              >
                {isActive && <Check className="w-4 h-4 shrink-0" />}
                {topic}
              </button>
            );
          })}
        </div>

        {!isPro && (
          <p className="text-[13px] text-gray-500 mb-8">
            Want all 3 topics?{" "}
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-brand font-semibold hover:underline"
            >
              Upgrade to Pro
            </button>
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[16px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 touch-manipulation"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {savedMsg && (
            <p className={`text-[13.5px] font-medium ${savedMsg === "Topics saved!" ? "text-green-600" : "text-red-500"}`}>
              {savedMsg}
            </p>
          )}
        </div>
      </div>

      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        isAuthenticated={isAuthenticated}
        redirectPath="/alerts"
      />
    </div>
  );
}
