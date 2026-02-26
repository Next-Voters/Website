import { NextResponse } from "next/server";
import { handleGetRequestCount, handleGetResponseCount } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const responseCount = await handleGetResponseCount();
    const requestCount = await handleGetRequestCount();

    return NextResponse.json({
      requestCount,
      responseCount,
    });
  } catch (error) {
    console.error("[analytics] Failed to fetch counts:", error);
    // Return zeros so the ticker always shows a number instead of "—"
    return NextResponse.json({
      requestCount: 0,
      responseCount: 0,
    });
  }
}
