import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Internal API route used by the middleware (proxy.ts) to check
 * whether a given email belongs to an admin.
 *
 * Secured with a shared secret (BETTER_AUTH_SECRET) passed
 * in the Authorization header so it can't be called externally.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.BETTER_AUTH_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
        return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
    }

    try {
        const adminRecord = await db
            .selectFrom("admin_table")
            .where("email", "=", email)
            .executeTakeFirst();

        return NextResponse.json({ isAdmin: !!adminRecord });
    } catch (error) {
        console.error("Admin check DB error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
