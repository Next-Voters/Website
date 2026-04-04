"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Country, State, City } from "country-state-city";
import type { IState, ICity } from "country-state-city";
import { submitRegionWaitlist } from "@/server-actions/request-region";

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-[16px] font-semibold text-gray-900 shadow-sm font-plus-jakarta-sans " +
  "focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const labelClass = "mb-2 block text-[14px] font-semibold text-gray-900 font-plus-jakarta-sans";

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function matchState(states: IState[], regionCode?: string, regionName?: string): IState | undefined {
  if (regionCode) {
    const rc = regionCode.toUpperCase();
    const direct = states.find((s) => s.isoCode.toUpperCase() === rc);
    if (direct) return direct;
    const tail = rc.includes("-") ? rc.split("-").pop()! : rc;
    const byTail = states.find((s) => s.isoCode.toUpperCase() === tail);
    if (byTail) return byTail;
  }
  if (regionName?.trim()) {
    const n = regionName.trim().toLowerCase();
    return (
      states.find((s) => s.name.toLowerCase() === n) ||
      states.find(
        (s) => n.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(n)
      )
    );
  }
  return undefined;
}

function matchCityName(cities: ICity[], city?: string): string | undefined {
  if (!city?.trim()) return undefined;
  const n = city.trim().toLowerCase();
  const exact = cities.find((c) => c.name.toLowerCase() === n);
  if (exact) return exact.name;
  const partial = cities.find(
    (c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())
  );
  return partial?.name;
}

export default function RequestRegionPage() {
  const countries = useMemo(() => sortByName(Country.getAllCountries()), []);

  const [countryIso, setCountryIso] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo");
        const data = (await res.json()) as
          | {
              ok: true;
              countryCode: string;
              regionCode?: string;
              regionName?: string;
              city?: string;
            }
          | { ok: false };
        if (cancelled || !data.ok || userEditedRef.current) return;
        const iso = data.countryCode;
        if (!countries.some((c) => c.isoCode === iso)) return;

        const subdivisions = sortByName(State.getStatesOfCountry(iso));

        if (subdivisions.length > 0) {
          const stateMatch = matchState(subdivisions, data.regionCode, data.regionName);
          if (!stateMatch) {
            if (userEditedRef.current) return;
            setCountryIso(iso);
            setStateCode("");
            setCityName("");
            return;
          }
          const cityList = sortByName(City.getCitiesOfState(iso, stateMatch.isoCode));
          const cityPick = matchCityName(cityList, data.city);
          if (userEditedRef.current) return;
          setCountryIso(iso);
          setStateCode(stateMatch.isoCode);
          setCityName(cityPick ?? "");
          return;
        }

        const cityList = sortByName(City.getCitiesOfCountry(iso) ?? []);
        const cityPick = matchCityName(cityList, data.city);
        if (userEditedRef.current) return;
        setCountryIso(iso);
        setStateCode("");
        setCityName(cityPick ?? "");
      } catch {
        /* ignore — user can still pick manually */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countries]);

  const states: IState[] = useMemo(() => {
    if (!countryIso) return [];
    return sortByName(State.getStatesOfCountry(countryIso));
  }, [countryIso]);

  const cities: ICity[] = useMemo(() => {
    if (!countryIso) return [];
    if (states.length > 0) {
      if (!stateCode) return [];
      return sortByName(City.getCitiesOfState(countryIso, stateCode));
    }
    const all = City.getCitiesOfCountry(countryIso);
    return sortByName(all ?? []);
  }, [countryIso, stateCode, states.length]);

  const onCountryChange = useCallback((iso: string) => {
    userEditedRef.current = true;
    setCountryIso(iso);
    setStateCode("");
    setCityName("");
  }, []);

  const onStateChange = useCallback((code: string) => {
    userEditedRef.current = true;
    setStateCode(code);
    setCityName("");
  }, []);

  const countryLabel = useMemo(() => {
    if (!countryIso) return "";
    return countries.find((c) => c.isoCode === countryIso)?.name ?? countryIso;
  }, [countryIso, countries]);

  const stateLabel = useMemo(() => {
    if (!stateCode || states.length === 0) return "";
    return states.find((s) => s.isoCode === stateCode)?.name ?? stateCode;
  }, [stateCode, states]);

  const onDone = async () => {
    setError(null);
    if (!countryIso || !cityName.trim()) {
      setError("Please select a country and city.");
      return;
    }
    if (states.length > 0 && !stateCode) {
      setError("Please select a state or province.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRegionWaitlist({
        country: countryLabel,
        state: stateLabel || "—",
        city: cityName.trim(),
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center bg-white px-6 pb-16 pt-12">
        <p className="text-center text-[18px] font-bold text-gray-900 font-plus-jakarta-sans">
          Thanks — we&apos;ll notify you when it&apos;s ready.
        </p>
        <a
          href="/"
          className="mt-8 text-[15px] font-semibold text-[#E12D39] font-plus-jakarta-sans hover:underline"
        >
          Back to Next Voters
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-white">
      <div className="flex flex-1 flex-col items-center px-6 pt-12 sm:pt-16">
        <h1 className="text-center text-[22px] font-bold text-black sm:text-2xl font-plus-jakarta-sans">
          Select your region.
        </h1>
        <p className="mt-3 text-center text-[22px] font-bold text-black sm:text-2xl font-plus-jakarta-sans">
          We&apos;ll notify you when it&apos;s ready.
        </p>

        <div className="mt-12 w-full max-w-md flex-1 space-y-6">
          <div>
            <label htmlFor="request-country" className={labelClass}>
              Country
            </label>
            <select
              id="request-country"
              className={selectClass}
              value={countryIso}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="request-state" className={labelClass}>
              State / province
            </label>
            <select
              id="request-state"
              className={selectClass}
              value={stateCode}
              disabled={!countryIso || states.length === 0}
              onChange={(e) => onStateChange(e.target.value)}
            >
              <option value="">
                {states.length === 0 && countryIso ? "No subdivisions — pick a city below" : "Select state / province"}
              </option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="request-city" className={labelClass}>
              City
            </label>
            <select
              id="request-city"
              className={selectClass}
              value={cityName}
              disabled={
                !countryIso ||
                (states.length > 0 && !stateCode) ||
                (states.length === 0 && cities.length === 0)
              }
              onChange={(e) => {
                userEditedRef.current = true;
                setCityName(e.target.value);
              }}
            >
              <option value="">Select city</option>
              {cities.map((c, i) => (
                <option
                  key={`${c.name}-${c.latitude ?? i}-${c.longitude ?? ""}`}
                  value={c.name}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="text-center text-[14px] font-medium text-red-600 font-plus-jakarta-sans" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-6 pb-10 pt-6">
        <button
          type="button"
          disabled={submitting}
          onClick={onDone}
          className="min-h-[52px] min-w-[200px] rounded-xl bg-[#E12D39] px-10 text-[16px] font-bold text-white shadow-sm font-plus-jakarta-sans transition-colors hover:bg-[#c92631] disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Done"}
        </button>
      </div>
    </div>
  );
}
