import { NextResponse, NextRequest } from "next/server";
import { protectedRegularRoutes } from "./data/protected-routes";

const isPathAdminMatch = (route: string) => {
  return route.startsWith("/admin");
};

export default async function proxy(req: NextRequest) {
  const route = req.nextUrl.pathname;

  // Skip middleware for auth API routes to avoid infinite loops
  if (route.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  let sessionData = null;
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  try {
    const sessionRes = await fetch(`${baseURL}/api/auth/get-session`, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });
    if (sessionRes.ok) {
      sessionData = await sessionRes.json();
    }
  } catch (error) {
    console.error("Better Auth session fetch error in proxy:", error);
  }

  const isAuthenticated = !!sessionData?.session;

  // RBAC: Admin routes require authentication + admin role
  if (isPathAdminMatch(route)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const email = sessionData?.user?.email;
    if (!email) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check admin role via API route (Edge Runtime can't use Kysely directly)
    try {
      const adminRes = await fetch(
        `${baseURL}/api/auth/admin-check?email=${encodeURIComponent(email)}`,
        {
          headers: {
            authorization: `Bearer ${process.env.BETTER_AUTH_SECRET}`,
          },
        }
      );
      const adminData = await adminRes.json();

      if (!adminData?.isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Admin check error in proxy:", error);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protected routes: require authentication
  if (protectedRegularRoutes.includes(route)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ]
};