"use server";

import { getCurrentUser } from "@/features/authentication/get-current-user";
import { getPackagingLimits, type PackagingUsage } from "@/lib/packaging/limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireLive() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in required." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, user, supabase };
}

export async function getPackagingUsageAction(
  organizationId?: string | null,
): Promise<ActionResult<PackagingUsage>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const limits = getPackagingLimits();

  const { count: orgCount, error: orgError } = await gate.supabase
    .from("organization_members")
    .select("organization_id", { count: "exact", head: true })
    .eq("user_id", gate.user.id)
    .eq("access_role", "organization_owner");

  if (orgError) return { ok: false, error: orgError.message };

  let projects = 0;
  let members = 0;

  if (organizationId) {
    const [projectResult, memberResult, inviteResult] = await Promise.all([
      gate.supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("status", "archived"),
      gate.supabase
        .from("organization_members")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      gate.supabase
        .from("organization_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
    ]);

    if (projectResult.error) return { ok: false, error: projectResult.error.message };
    if (memberResult.error) return { ok: false, error: memberResult.error.message };
    if (inviteResult.error) return { ok: false, error: inviteResult.error.message };

    projects = projectResult.count ?? 0;
    members = (memberResult.count ?? 0) + (inviteResult.count ?? 0);
  }

  return {
    ok: true,
    data: {
      limits,
      organizations: orgCount ?? 0,
      projects,
      members,
    },
  };
}
