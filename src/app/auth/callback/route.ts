import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

function appOrigin(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin.replace(/\/$/, "")
  );
}

/**
 * Exchange the OAuth code for a session and redirect into the app.
 * Cookies must be written onto the redirect response or the first load
 * after GitHub login appears signed-out (lands on marketing home).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/app");
  const origin = appOrigin(request);
  const config = getPublicSupabaseConfig();

  if (!code || !config) {
    return NextResponse.redirect(`${origin}/auth/error?reason=auth-code`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.redirect(`${origin}${next}`);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=auth-code`);
  }

  return response;
}
