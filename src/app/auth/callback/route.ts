import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PUBLIC_SIGN_IN_ERROR } from "@/features/authentication/sign-in-errors";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";

function signInErrorUrl(origin: string, next: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", PUBLIC_SIGN_IN_ERROR);
  if (next && next !== "/app") {
    url.searchParams.set("next", next);
  }
  return url;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Auth environment is incomplete.");
      }
      return NextResponse.redirect(signInErrorUrl(origin, next));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(signInErrorUrl(origin, next));
}
