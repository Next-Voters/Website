"use client";

import { signIn, signOut, useSession } from "@/lib/auth-client";

interface AuthButtonsProps {
  variant: "desktop" | "mobile"
}

export default function AuthButtons({ variant = "desktop" }: AuthButtonsProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="inline-flex items-center justify-center">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const base = "inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400";
  const desktop = "px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800";
  const mobile = "w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded";
  const className = `${base} ${variant === "desktop" ? desktop : mobile}`;

  return session ? (
    <button onClick={() => signOut()} className={className}>Sign Out</button>
  ) : (
    <button onClick={() => signIn.social({ provider: "google" })} className={className}>Sign In</button>
  );
}
