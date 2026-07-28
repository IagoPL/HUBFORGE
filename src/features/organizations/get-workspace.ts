import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import {
  buildWorkspaceState,
  emptyWorkspaceState,
  mapOrganizationRow,
  mapProjectRow,
  type OrganizationRow,
  type ProjectRow,
} from "@/features/organizations/workspace-mapping";
import type { WorkspaceState } from "@/features/organizations/workspace-state";

export type WorkspaceMode = "demo" | "live";

export async function getWorkspaceSnapshot(prefs?: {
  preferredOrganizationId?: string | null;
  preferredProjectId?: string | null;
}): Promise<{ mode: WorkspaceMode; state: WorkspaceState }> {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  if (!user || !supabase) {
    return { mode: "demo", state: emptyWorkspaceState() };
  }

  const [orgResult, projectResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug")
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select("id, organization_id, name, slug, description, status")
      .order("created_at", { ascending: true }),
  ]);

  if (orgResult.error || projectResult.error) {
    return { mode: "live", state: emptyWorkspaceState() };
  }

  const organizations = ((orgResult.data ?? []) as OrganizationRow[]).map(
    mapOrganizationRow,
  );
  const projects = ((projectResult.data ?? []) as ProjectRow[]).map(mapProjectRow);

  return {
    mode: "live",
    state: buildWorkspaceState({
      organizations,
      projects,
      preferredOrganizationId: prefs?.preferredOrganizationId,
      preferredProjectId: prefs?.preferredProjectId,
    }),
  };
}
