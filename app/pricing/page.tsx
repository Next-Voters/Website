'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';

export default function PricingPage() {
  const { isPro, isAuthenticated } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirectTo=/pricing';
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-page px-6 py-20">
      <div className="max-w-[760px] mx-auto">
        <h1 className="text-[44px] sm:text-[52px] font-bold text-gray-900 mb-4 font-plus-jakarta-sans leading-[1.05] tracking-tight">
          Simple pricing.
        </h1>
        <p className="text-[17px] text-gray-600 font-plus-jakarta-sans mb-14">
          Start free. Upgrade when you want more coverage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free plan */}
          <div className="rounded-xl border-2 border-gray-200 bg-white p-8 flex flex-col">
            <p className="text-[13px] font-semibold text-gray-500 font-plus-jakarta-sans uppercase tracking-wide mb-3">Free</p>
            <p className="text-[36px] font-bold text-gray-900 font-plus-jakarta-sans mb-1">$0</p>
            <p className="text-[14px] text-gray-500 font-plus-jakarta-sans mb-8">forever</p>

            <ul className="flex flex-col gap-3 mb-8 text-[15px] text-gray-700 font-plus-jakarta-sans flex-1">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">✓</span>
                <span>1 topic of your choice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">✓</span>
                <span>Weekly civic alerts via email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">✓</span>
                <span>Nonpartisan analysis</span>
              </li>
            </ul>

            <Link
              href="/alerts"
              className="w-full text-center px-6 py-3 text-[15px] font-bold text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-plus-jakarta-sans"
            >
              Get Started
            </Link>
          </div>

          {/* Pro plan */}
          <div className="rounded-xl border-2 border-gray-900 bg-gray-900 p-8 flex flex-col">
            <p className="text-[13px] font-semibold text-gray-400 font-plus-jakarta-sans uppercase tracking-wide mb-3">Pro</p>
            <p className="text-[36px] font-bold text-white font-plus-jakarta-sans mb-1">$5</p>
            <p className="text-[14px] text-gray-400 font-plus-jakarta-sans mb-8">per month</p>

            <ul className="flex flex-col gap-3 mb-8 text-[15px] text-gray-300 font-plus-jakarta-sans flex-1">
              <li className="flex items-start gap-2">
                <span className="text-[#E12D39] mt-0.5">✓</span>
                <span>All 3 topics (Immigration, Civil Rights, Economy)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E12D39] mt-0.5">✓</span>
                <span>Weekly civic alerts via email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E12D39] mt-0.5">✓</span>
                <span>Nonpartisan analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E12D39] mt-0.5">✓</span>
                <span>Cancel anytime</span>
              </li>
            </ul>

            {isPro ? (
              <button
                onClick={handlePortal}
                disabled={checkoutLoading}
                className="w-full px-6 py-3 text-[15px] font-bold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors font-plus-jakarta-sans disabled:opacity-60"
              >
                {checkoutLoading ? 'Loading…' : 'Manage Subscription'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full px-6 py-3 text-[15px] font-bold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors font-plus-jakarta-sans disabled:opacity-60"
              >
                {checkoutLoading ? 'Loading…' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
