'use client';

import { Suspense, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleSubscribe } from '@/server-actions/sub-to-civicline';
import { PreferredCommunication } from '@/types/preferences';

const REGIONS = [
  { id: 'toronto', label: 'Toronto', imageSrc: '/regions/toronto.png' },
  { id: 'new-york-city', label: 'New York City', imageSrc: '/regions/nyc.png' },
  { id: 'san-diego', label: 'San Diego', imageSrc: '/regions/san-diego.png' },
] as const;

function RegionSelectionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const contact = useMemo(() => (searchParams.get('contact') ?? '').trim(), [searchParams]);
  const preferredCommunication = useMemo<PreferredCommunication>(() => {
    const type = (searchParams.get('type') ?? 'email').toLowerCase();
    return type === 'sms' ? 'sms' : 'email';
  }, [searchParams]);

  const topics = useMemo(() => {
    const raw = searchParams.get('topics');
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [] as string[];
    }
  }, [searchParams]);

  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const progressPercent = 75;

  const referralUrl = useMemo(() => {
    const referrer = encodeURIComponent(contact);
    return `/alerts/referral?referrer=${referrer}`;
  }, [contact]);

  const onSelectRegion = async (regionId: string) => {
    if (!contact) {
      router.push('/alerts');
      return;
    }
    if (topics.length === 0) {
      router.push('/alerts');
      return;
    }

    setSubmittingId(regionId);
    try {
      let result: { error?: string } | void;
      try {
        result = await handleSubscribe(contact, topics, preferredCommunication);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        alert(`Could not save your signup right now: ${message}`);
        router.push(referralUrl);
        return;
      }

      if (result?.error) {
        alert(result.error);
        router.push(referralUrl);
        return;
      }

      router.push(referralUrl);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white">
      {/* Fill space below header; progress is in-flow (no fixed + no pb gap) */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {REGIONS.map((region) => {
          const isBusy = submittingId !== null;
          const isThis = submittingId === region.id;
          const isDisabled = isBusy;
          return (
            <button
              key={region.id}
              type="button"
              disabled={isDisabled}
              aria-label={isThis ? `Saving ${region.label}` : `Select ${region.label}`}
              onClick={() => onSelectRegion(region.id)}
              className={[
                'group relative flex min-h-[200px] flex-1 basis-0 flex-col overflow-hidden border-0 border-b border-white/10 bg-transparent p-0 text-left last:border-b-0 md:min-h-0 md:border-b-0 md:border-r md:border-white/10 last:md:border-r-0',
                'cursor-pointer transition-all duration-300 ease-out',
                'ring-0 ring-inset ring-black/0 hover:ring-[3px] hover:ring-black/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-black/40',
                'hover:shadow-[inset_0_0_80px_rgba(255,255,255,0.12)]',
                'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:ring-0 disabled:hover:shadow-none',
                isThis ? 'ring-[3px] ring-black/35 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)]' : '',
              ].join(' ')}
            >
              <div className="absolute inset-0 overflow-hidden bg-stone-300">
                <Image
                  src={region.imageSrc}
                  alt=""
                  fill
                  className="object-cover blur-sm scale-110 opacity-[0.26] transition-transform duration-500 ease-out group-hover:scale-[1.08] group-disabled:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={region.id === 'toronto'}
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:bg-black/5" aria-hidden />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/8 via-black/12 to-black/22 transition-opacity duration-300 group-hover:opacity-90"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 z-[5] bg-white/0 transition-colors duration-300 ease-out group-hover:bg-white/10 group-focus-visible:bg-white/10"
                aria-hidden
              />

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
                <span className="max-w-[16rem] text-center font-plus-jakarta-sans text-2xl font-bold leading-tight text-black transition-transform duration-300 ease-out group-hover:translate-y-[-1px] sm:text-3xl md:text-[30px]">
                  {region.label}
                </span>
                <span
                  className={[
                    'inline-flex min-h-[48px] w-full max-w-[220px] items-center justify-center rounded-lg font-plus-jakarta-sans text-[16px] font-bold transition-all duration-300 ease-out',
                    isThis
                      ? 'border border-white/15 bg-gray-800 text-white shadow-inner'
                      : 'bg-black text-white shadow-md group-hover:bg-gray-900 group-hover:shadow-lg',
                    'group-disabled:opacity-90',
                  ].join(' ')}
                >
                  {isThis ? 'Saving…' : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="h-2 w-full bg-gray-200">
          <div
            className="h-full rounded-r-full bg-[#E12D39] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="py-2.5 text-center font-plus-jakarta-sans text-[12px] text-gray-600">
          {progressPercent}% Complete
        </p>
      </div>
    </div>
  );
}

export default function RegionSelectionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 font-plus-jakarta-sans">Loading…</div>}>
      <RegionSelectionInner />
    </Suspense>
  );
}
