import { shouldApplyCheckRunUpdate } from "@/features/github/check-run-normalize";
import { appendPendingAssignmentIfNeeded } from "@/features/collaboration/pending-assignment";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type LinkedRepositoryRow = {
  id: string;
  project_id: string;
  organization_id: string;
  installation_id?: number | null;
};

export type PersistIssueInput = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url?: string;
  /** GitHub logins that could not be mapped to HubForge members. */
  pendingAssigneeNames?: string[];
  pendingAssigneeRole?: string | null;
};

export type PersistPullRequestInput = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged?: boolean;
  html_url?: string;
  author_login?: string;
};

export type PersistCommitInput = {
  sha: string;
  message: string;
  html_url?: string;
  author_login?: string;
  committed_at?: string | null;
};

export type PersistCheckRunInput = {
  githubCheckRunId: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  htmlUrl: string | null;
  headSha: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  pullRequestNumbers: number[];
};

export async function resolveLinkedRepository(
  admin: AdminClient,
  repositoryFullName: string,
) {
  const { data: linked } = await admin
    .from("project_repositories")
    .select("id, project_id, organization_id, installation_id")
    .eq("full_name", repositoryFullName)
    .maybeSingle();

  return linked as LinkedRepositoryRow | null;
}

/**
 * Rejects webhooks when the delivery installation does not match the linked repo.
 * Unlinked repositories are handled separately (no persist).
 */
export function isAuthorizedInstallation(
  linked: LinkedRepositoryRow,
  installationId: number | null,
): boolean {
  if (linked.installation_id == null) {
    // Linked without a bound installation: allow full_name-gated sync only.
    return true;
  }
  if (installationId == null) return false;
  return linked.installation_id === installationId;
}

export async function persistSyncedIssue(
  admin: AdminClient,
  linked: LinkedRepositoryRow,
  issue: PersistIssueInput,
) {
  const state = issue.state === "closed" ? "closed" : "open";

  const { data: synced } = await admin
    .from("github_synced_issues")
    .upsert(
      {
        project_id: linked.project_id,
        organization_id: linked.organization_id,
        repository_id: linked.id,
        github_issue_id: issue.id,
        number: issue.number,
        title: issue.title,
        state,
        html_url: issue.html_url ?? "",
        origin: "github",
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "repository_id,github_issue_id" },
    )
    .select("id, task_id")
    .single();

  if (!synced) return;

  if (synced.task_id) {
    await admin
      .from("tasks")
      .update({
        title: issue.title,
        status: state === "closed" ? "done" : "backlog",
        updated_at: new Date().toISOString(),
      })
      .eq("id", synced.task_id);
    return;
  }

  // Leave HubForge assignees empty — never invent member IDs from GitHub logins.
  // Pending-assignment notes are for people not yet on GitHub (createTask / planning).
  let description = `Synced from GitHub issue #${issue.number}`;
  for (const personName of issue.pendingAssigneeNames ?? []) {
    description = appendPendingAssignmentIfNeeded(description, {
      personName,
      functionalRole: issue.pendingAssigneeRole,
      needsToStartBeforeJoin: true,
    });
  }

  const { data: task } = await admin
    .from("tasks")
    .insert({
      project_id: linked.project_id,
      title: `[GH #${issue.number}] ${issue.title}`,
      description,
      status: state === "closed" ? "done" : "backlog",
      priority: "medium",
    })
    .select("id")
    .single();

  if (task?.id) {
    await admin
      .from("github_synced_issues")
      .update({ task_id: task.id })
      .eq("id", synced.id);
  }
}

export async function persistSyncedCheckRun(
  admin: AdminClient,
  linked: LinkedRepositoryRow,
  checkRun: PersistCheckRunInput,
): Promise<{ applied: boolean }> {
  const { data: existing } = await admin
    .from("github_synced_check_runs")
    .select("id, status, completed_at, updated_at")
    .eq("repository_id", linked.id)
    .eq("github_check_run_id", checkRun.githubCheckRunId)
    .maybeSingle();

  if (
    existing &&
    !shouldApplyCheckRunUpdate(
      {
        status: existing.status as PersistCheckRunInput["status"],
        updatedAt: existing.updated_at ?? null,
        completedAt: existing.completed_at ?? null,
      },
      {
        status: checkRun.status,
        updatedAt: checkRun.updatedAt,
        completedAt: checkRun.completedAt,
      },
    )
  ) {
    return { applied: false };
  }

  let pullRequestId: string | null = null;
  const prNumber = checkRun.pullRequestNumbers[0];
  if (prNumber != null) {
    const { data: pr } = await admin
      .from("github_synced_pull_requests")
      .select("id")
      .eq("repository_id", linked.id)
      .eq("number", prNumber)
      .maybeSingle();
    pullRequestId = pr?.id ?? null;
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("github_synced_check_runs").upsert(
    {
      project_id: linked.project_id,
      organization_id: linked.organization_id,
      repository_id: linked.id,
      github_check_run_id: checkRun.githubCheckRunId,
      name: checkRun.name,
      status: checkRun.status,
      conclusion: checkRun.conclusion,
      html_url: checkRun.htmlUrl,
      head_sha: checkRun.headSha,
      pull_request_id: pullRequestId,
      completed_at: checkRun.completedAt,
      last_synced_at: now,
      updated_at: checkRun.updatedAt ?? now,
    },
    { onConflict: "repository_id,github_check_run_id" },
  );

  if (error) throw new Error(error.message);
  return { applied: true };
}

export async function persistSyncedPullRequest(
  admin: AdminClient,
  linked: LinkedRepositoryRow,
  pullRequest: PersistPullRequestInput,
) {
  const state = pullRequest.state === "closed" ? "closed" : "open";

  await admin.from("github_synced_pull_requests").upsert(
    {
      project_id: linked.project_id,
      organization_id: linked.organization_id,
      repository_id: linked.id,
      github_pull_request_id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      state,
      merged: Boolean(pullRequest.merged),
      html_url: pullRequest.html_url ?? "",
      author_login: pullRequest.author_login ?? "",
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "repository_id,github_pull_request_id" },
  );
}

export async function persistSyncedCommits(
  admin: AdminClient,
  linked: LinkedRepositoryRow,
  commits: PersistCommitInput[],
) {
  if (commits.length === 0) return;

  const now = new Date().toISOString();
  const rows = commits
    .filter((commit) => commit.sha)
    .map((commit) => ({
      project_id: linked.project_id,
      organization_id: linked.organization_id,
      repository_id: linked.id,
      sha: commit.sha,
      message: commit.message?.split("\n")[0] ?? "",
      html_url: commit.html_url ?? "",
      author_login: commit.author_login ?? "",
      committed_at: commit.committed_at ?? null,
      last_synced_at: now,
    }));

  if (rows.length === 0) return;

  await admin.from("github_synced_commits").upsert(rows, {
    onConflict: "repository_id,sha",
  });
}

export function mapIssueStateToTaskStatus(state: "open" | "closed") {
  return state === "closed" ? "done" : "backlog";
}
