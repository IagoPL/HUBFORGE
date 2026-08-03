import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type LinkedRepositoryRow = {
  id: string;
  project_id: string;
  organization_id: string;
};

export type PersistIssueInput = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url?: string;
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

export async function resolveLinkedRepository(
  admin: AdminClient,
  repositoryFullName: string,
) {
  const { data: linked } = await admin
    .from("project_repositories")
    .select("id, project_id, organization_id")
    .eq("full_name", repositoryFullName)
    .maybeSingle();

  return linked as LinkedRepositoryRow | null;
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

  const { data: task } = await admin
    .from("tasks")
    .insert({
      project_id: linked.project_id,
      title: `[GH #${issue.number}] ${issue.title}`,
      description: `Synced from GitHub issue #${issue.number}`,
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
