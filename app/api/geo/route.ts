import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const vercelFwd = request.headers.get("x-vercel-forwarded-for");
  if (vercelFwd) {
    const first = vercelFwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip");
}

function isNonPublicIp(ip: string | null): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (m) {
    const second = Number.parseInt(m[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

type IpApiCoPayload = {
  error?: boolean;
  reason?: string;
  country_code?: string;
  region?: string;
  region_name?: string;
  city?: string;
};

type IpApiComPayload = {
  status?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
};

type GeoFields = {
  countryCode: string;
  regionCode?: string;
  regionName?: string;
  city?: string;
};

async function lookupIpApiCo(ip: string): Promise<GeoFields | undefined> {
  const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as IpApiCoPayload;
  if (data.error || !data.country_code) return undefined;
  return {
    countryCode: data.country_code.toUpperCase(),
    regionCode: data.region?.trim() || undefined,
    regionName: data.region_name?.trim() || undefined,
    city: data.city?.trim() || undefined,
  };
}

/** Free HTTP JSON API (fallback when ipapi.co is rate-limited). */
async function lookupIpApiCom(ip: string): Promise<GeoFields | undefined> {
  const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as IpApiComPayload;
  if (data.status !== "success" || !data.countryCode) return undefined;
  return {
    countryCode: data.countryCode.toUpperCase(),
    regionCode: data.region?.trim() || undefined,
    regionName: data.regionName?.trim() || undefined,
    city: data.city?.trim() || undefined,
  };
}

/**
 * IP-based geolocation for auto-filling region dropdowns.
 * Uses the client IP when public: tries ipapi.co, then ip-api.com; falls back to Vercel geo headers.
 */
export async function GET(request: NextRequest) {
  const vercelCountry = request.headers.get("x-vercel-ip-country")?.trim();
  const vercelCity = request.headers.get("x-vercel-ip-city")?.trim();
  const vercelRegion = request.headers.get("x-vercel-ip-country-region")?.trim();

  const ip = getClientIp(request);

  let resolved: (GeoFields & { source: "ipapi" | "ip-api" }) | undefined;

  if (!isNonPublicIp(ip)) {
    const publicIp = ip!;
    try {
      const fromCo = await lookupIpApiCo(publicIp);
      if (fromCo) {
        resolved = { ...fromCo, source: "ipapi" };
      }
    } catch {
      /* try next */
    }
    if (!resolved) {
      try {
        const fromCom = await lookupIpApiCom(publicIp);
        if (fromCom) {
          resolved = { ...fromCom, source: "ip-api" };
        }
      } catch {
        /* use Vercel or fail */
      }
    }
  }

  if (resolved) {
    const { source, ...rest } = resolved;
    return NextResponse.json({
      ok: true as const,
      ...rest,
      source,
    });
  }

  if (vercelCountry && vercelCountry.length === 2) {
    return NextResponse.json({
      ok: true as const,
      countryCode: vercelCountry.toUpperCase(),
      regionCode: vercelRegion || undefined,
      city: vercelCity || undefined,
      source: "vercel" as const,
    });
  }

  return NextResponse.json({ ok: false as const });
}
