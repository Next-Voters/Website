'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import topicOptions from '@/data/topic-options';
import { PreferredCommunication } from '@/types/preferences';

const MAX_TOPICS = 3;

function NextVotersLineInterestsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const contact = useMemo(() => (searchParams.get('contact') ?? '').trim(), [searchParams]);
  const preferredCommunication = useMemo<PreferredCommunication>(() => {
    const type = (searchParams.get('type') ?? 'email').toLowerCase();
    return type === 'sms' ? 'sms' : 'email';
  }, [searchParams]);

  const [selected, setSelected] = useState<string[]>([]);

  const progressPercent = 50;

  const toggleTopic = (topic: string) => {
    setSelected((prev) => {
      const exists = prev.includes(topic);
      if (exists) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_TOPICS) return prev;
      return [...prev, topic];
    });
  };

  const onFinish = () => {
    if (!contact) {
      router.push('/alerts');
      return;
    }
    if (selected.length === 0) {
      alert('Please select at least one interest.');
      return;
    }

    const q = new URLSearchParams({
      contact,
      type: preferredCommunication,
      topics: JSON.stringify(selected),
    });
    router.push(`/alerts/region?${q.toString()}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-page pb-20">
      <div className="w-full max-w-[980px] px-6 pt-20 pb-28">
        <h1 className="text-[44px] sm:text-[52px] font-bold text-gray-900 mb-6 font-plus-jakarta-sans leading-[1.05] tracking-tight">
          You&apos;re almost done.
          <br />
          Just select up to {MAX_TOPICS} interests.
        </h1>

        <p className="text-[16px] sm:text-[18px] text-gray-900 font-plus-jakarta-sans font-semibold leading-tight mb-10">
          We&apos;ll only send you updates
          <br />
          related to your interests.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          {topicOptions.map((topic) => {
            const isActive = selected.includes(topic);
            const isDisabled = !isActive && selected.length >= MAX_TOPICS;

            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                aria-pressed={isActive}
                className={[
                  'px-8 py-3 rounded-lg border-2 font-plus-jakarta-sans font-semibold text-[16px] transition-colors',
                  isActive
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-900 bg-white text-gray-900 hover:bg-gray-50',
                  isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-white' : '',
                ].join(' ')}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center justify-center px-10 py-3 text-[18px] font-bold text-white bg-[#E12D39] rounded-lg hover:bg-[#c92631] transition-colors font-plus-jakarta-sans"
        >
          Continue
        </button>
      </div>

      {/* Bottom progress bar (as in Figma) */}
      <div className="fixed bottom-0 left-0 right-0 bg-page">
        <div className="w-full px-0">
          <div className="h-[5px] w-full bg-gray-200">
            <div
              className="h-full bg-[#E12D39] rounded-r-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="py-2 text-center text-[11px] text-gray-500 font-plus-jakarta-sans">
            {progressPercent}% Complete
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NextVotersLineInterestsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading…</div>}>
      <NextVotersLineInterestsInner />
    </Suspense>
  );
}

