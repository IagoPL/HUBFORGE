import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

/**
 * Refresh the auth session on the request/response cookie pair.
 * Returns null when Supabase is not configured.
 */
export async function updateSession(request: NextRequest) {
  const config = getPublicSupabaseConfig();
  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Validate JWT claims (do not trust getSession() alone for authz).
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const wantsDemo = request.cookies.get("hf_demo")?.value === "1";

  if (pathname === "/login" && isAuthenticated) {
    const next = request.nextUrl.searchParams.get("next");
    const appUrl = request.nextUrl.clone();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      appUrl.pathname = next.split("?")[0] ?? "/app";
      const nextUrl = new URL(next, request.url);
      appUrl.search = nextUrl.search;
    } else {
      appUrl.pathname = "/app";
      appUrl.search = "";
    }
    return NextResponse.redirect(appUrl);
  }

  // Production / configured: /app is live-only. Anonymous visitors use /demo
  // (sets hf_demo) instead of seeing fabricated workspace data as their own.
  if (
    pathname === "/app" ||
    pathname.startsWith("/app/")
  ) {
    if (!isAuthenticated && !wantsDemo) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
