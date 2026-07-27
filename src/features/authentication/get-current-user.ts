import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthUserSummary = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

/**
 * Returns the authenticated user after verifying claims, then loading the Auth user.
 */
export async function getCurrentUser(): Promise<AuthUserSummary | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  const metadata = data.user.user_metadata ?? {};

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    fullName:
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      null,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
  };
}
