"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type LinkedRepository = {
  id: string;
  projectId: string;
  organizationId: string;
  fullName: string;
  htmlUrl: string;
  installationId: number | null;
};

export type SyncedIssueSummary = {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  origin: "github" | "hubforge";
};

async function requireLive() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to manage GitHub sync." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, user, supabase };
}

export async function listLinkedRepositoryAction(
  projectId: string,
): Promise<ActionResult<LinkedRepository | null>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("project_repositories")
    .select("id, project_id, organization_id, full_name, html_url, installation_id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, data: null };

  return {
    ok: true,
    data: {
      id: data.id,
      projectId: data.project_id,
      organizationId: data.organization_id,
      fullName: data.full_name,
      htmlUrl: data.html_url,
      installationId: data.installation_id,
    },
  };
}

export async function listSyncedIssuesAction(
  projectId: string,
): Promise<ActionResult<SyncedIssueSummary[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("github_synced_issues")
    .select("id, number, title, state, html_url, origin")
    .eq("project_id", projectId)
    .order("number", { ascending: false })
    .limit(40);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      number: row.number,
      title: row.title,
      state: row.state as "open" | "closed",
      htmlUrl: row.html_url,
      origin: row.origin as "github" | "hubforge",
    })),
  };
}

export async function linkRepositoryAction(input: {
  projectId: string;
  organizationId: string;
  fullName: string;
  installationId?: string;
}): Promise<ActionResult<LinkedRepository>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const fullName = normalizeRepoFullName(input.fullName);
  if (!isValidRepoFullName(fullName)) {
    return { ok: false, error: "Use owner/repo format." };
  }

  const installationId = input.installationId?.trim()
    ? Number(input.installationId.trim())
    : null;
  if (installationId !== null && !Number.isFinite(installationId)) {
    return { ok: false, error: "Installation id must be a number." };
  }

  if (installationId !== null) {
    await gate.supabase.from("github_installations").upsert(
      {
        organization_id: input.organizationId,
        installation_id: installationId,
        account_login: fullName.split("/")[0],
        account_type: "Organization",
        created_by: gate.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "installation_id" },
    );
  }

  const { data, error } = await gate.supabase
    .from("project_repositories")
    .upsert(
      {
        project_id: input.projectId,
        organization_id: input.organizationId,
        installation_id: installationId,
        full_name: fullName,
        html_url: `https://github.com/${fullName}`,
        created_by: gate.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    )
    .select("id, project_id, organization_id, full_name, html_url, installation_id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not link repository." };
  }

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: {
      id: data.id,
      projectId: data.project_id,
      organizationId: data.organization_id,
      fullName: data.full_name,
      htmlUrl: data.html_url,
      installationId: data.installation_id,
    },
  };
}

export async function unlinkRepositoryAction(
  projectId: string,
): Promise<ActionResult<{ projectId: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from("project_repositories")
    .delete()
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { projectId } };
}
