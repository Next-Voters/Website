"use client";

import { useAuth } from "@/wrappers/AuthProvider";
import Link from "next/link";

interface AuthButtonsProps {
  variant: "desktop" | "mobile";
}

export default function AuthButtons({ variant = "desktop" }: AuthButtonsProps) {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className={[
          "font-plus-jakarta-sans font-semibold text-[14px] text-gray-900 hover:text-[#E12D39] transition-colors",
          variant === "mobile" ? "block py-2" : "",
        ].join(" ")}
      >
        Log In
      </Link>
    );
  }

  const initial = user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className={`flex items-center gap-3 ${variant === "mobile" ? "py-2" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[13px] font-bold font-plus-jakarta-sans">
        {initial}
      </div>
      <button
        onClick={signOut}
        className="font-plus-jakarta-sans font-semibold text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
