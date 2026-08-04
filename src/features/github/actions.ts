"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import {
  backfillLinkedRepository,
  type BackfillCounts,
} from "@/features/github/backfill";
import { isGitHubAppConfigured } from "@/features/github/config";
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

  if (data.installation_id != null && isGitHubAppConfigured()) {
    await backfillLinkedRepository({
      fullName: data.full_name,
      installationId: data.installation_id,
      linked: {
        id: data.id,
        project_id: data.project_id,
        organization_id: data.organization_id,
      },
    });
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

export async function backfillRepositorySyncAction(
  projectId: string,
): Promise<ActionResult<BackfillCounts>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  if (!isGitHubAppConfigured()) {
    return { ok: false, error: "GitHub App is not configured." };
  }

  const { data, error } = await gate.supabase
    .from("project_repositories")
    .select("id, project_id, organization_id, full_name, installation_id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Link a repository before syncing." };
  if (data.installation_id == null) {
    return {
      ok: false,
      error: "Installation id is required to sync from the GitHub API.",
    };
  }

  const result = await backfillLinkedRepository({
    fullName: data.full_name,
    installationId: data.installation_id,
    linked: {
      id: data.id,
      project_id: data.project_id,
      organization_id: data.organization_id,
    },
  });

  if (!result.ok) return result;

  revalidatePath("/app", "layout");
  return { ok: true, data: result.counts };
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

export type SyncedPullRequestSummary = {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  htmlUrl: string;
  authorLogin: string;
  updatedAt: string | null;
};

export type SyncedCommitSummary = {
  id: string;
  sha: string;
  message: string;
  htmlUrl: string;
  authorLogin: string;
  committedAt: string | null;
};

export async function listSyncedPullRequestsAction(
  projectId: string,
): Promise<ActionResult<SyncedPullRequestSummary[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("github_synced_pull_requests")
    .select("id, number, title, state, merged, html_url, author_login, updated_at")
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
      merged: row.merged,
      htmlUrl: row.html_url,
      authorLogin: row.author_login,
      updatedAt: row.updated_at ?? null,
    })),
  };
}

export async function listSyncedCommitsAction(
  projectId: string,
): Promise<ActionResult<SyncedCommitSummary[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("github_synced_commits")
    .select("id, sha, message, html_url, author_login, committed_at")
    .eq("project_id", projectId)
    .order("committed_at", { ascending: false, nullsFirst: false })
    .limit(40);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      sha: row.sha,
      message: row.message,
      htmlUrl: row.html_url,
      authorLogin: row.author_login,
      committedAt: row.committed_at,
    })),
  };
}

export async function recordGitHubInstallationAction(input: {
  organizationId: string;
  installationId: number;
  accountLogin?: string;
  accountType?: "Organization" | "User";
}): Promise<ActionResult<{ installationId: number }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  if (!Number.isFinite(input.installationId)) {
    return { ok: false, error: "Installation id must be a number." };
  }

  const { error } = await gate.supabase.from("github_installations").upsert(
    {
      organization_id: input.organizationId,
      installation_id: input.installationId,
      account_login: input.accountLogin?.trim() || "github",
      account_type: input.accountType ?? "Organization",
      created_by: gate.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "installation_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { installationId: input.installationId } };
}
