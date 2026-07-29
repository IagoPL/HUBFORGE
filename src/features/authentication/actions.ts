"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function signInWithGitHub(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=supabase-not-configured");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?error=supabase-not-configured");
  }

  const next = safeRedirectPath(String(formData.get("next") ?? "/app"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${appOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "read:user user:email",
    },
  });

  if (error || !data.url) {
    redirect("/auth/error?reason=oauth-start");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}
