"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  redirectPath: string;
}

export function UpgradePrompt({
  open,
  onClose,
  isAuthenticated,
  redirectPath,
}: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(redirectPath)}`;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm font-plus-jakarta-sans">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-bold text-gray-900 leading-tight">
            Unlock all 3 topics.
          </DialogTitle>
          <DialogDescription className="text-[15px] text-gray-600 mt-1">
            Upgrade to Pro to follow Immigration, Civil Rights, and Economy — all in one alert.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full px-6 py-3 text-[16px] font-bold text-white bg-[#E12D39] rounded-lg hover:bg-[#c92631] transition-colors disabled:opacity-60"
          >
            {loading ? "Redirecting…" : isAuthenticated ? "Upgrade to Pro" : "Log in to Upgrade"}
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-[15px] font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue with 1 topic
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
