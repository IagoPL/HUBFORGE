"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PUBLIC_SIGN_IN_ERROR } from "@/features/authentication/sign-in-errors";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function signInWithGitHub(formData: FormData) {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth environment is incomplete.");
    }
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth environment is incomplete.");
    }
    redirect("/login");
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
    redirect(`/login?error=${PUBLIC_SIGN_IN_ERROR}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}
