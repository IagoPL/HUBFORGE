import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SyncedIssue = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  origin: "github" | "hubforge";
};

type IssuePayload = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url?: string;
};

type PullRequestPayload = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged?: boolean;
  html_url?: string;
  user?: { login?: string };
};

type CommitPayload = {
  id: string;
  message: string;
  url?: string;
  author?: { username?: string; name?: string };
  timestamp?: string;
};

export async function processGitHubWebhook(input: {
  deliveryId: string;
  event: string;
  action: string | null;
  payload: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Service role is not configured." };
  }

  const digest = createHash("sha256").update(JSON.stringify(input.payload)).digest("hex");

  const { error: insertDeliveryError } = await admin
    .from("github_webhook_deliveries")
    .insert({
      delivery_id: input.deliveryId,
      event: input.event,
      action: input.action,
      installation_id:
        typeof (input.payload.installation as { id?: number } | undefined)?.id ===
        "number"
          ? (input.payload.installation as { id: number }).id
          : null,
      repository_full_name:
        typeof (input.payload.repository as { full_name?: string } | undefined)
          ?.full_name === "string"
          ? (input.payload.repository as { full_name: string }).full_name
          : null,
      payload_digest: digest,
    });

  if (insertDeliveryError) {
    if (insertDeliveryError.code === "23505") {
      return { ok: true as const, duplicate: true };
    }
    return { ok: false as const, error: insertDeliveryError.message };
  }

  if (input.event === "issues" && input.payload.issue && input.payload.repository) {
    await upsertIssueFromWebhook(admin, input.payload);
  }

  if (
    input.event === "pull_request" &&
    input.payload.pull_request &&
    input.payload.repository
  ) {
    await upsertPullRequestFromWebhook(admin, input.payload);
  }

  if (input.event === "push" && input.payload.commits && input.payload.repository) {
    await upsertCommitsFromWebhook(admin, input.payload);
  }

  return { ok: true as const, duplicate: false };
}

async function resolveLinkedRepository(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  repositoryFullName: string,
) {
  const { data: linked } = await admin
    .from("project_repositories")
    .select("id, project_id, organization_id")
    .eq("full_name", repositoryFullName)
    .maybeSingle();

  return linked;
}

async function upsertIssueFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  const issue = payload.issue as IssuePayload;
  if (!repository.full_name || !issue?.id) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;

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

async function upsertPullRequestFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  const pullRequest = payload.pull_request as PullRequestPayload;
  if (!repository.full_name || !pullRequest?.id) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;

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
      author_login: pullRequest.user?.login ?? "",
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "repository_id,github_pull_request_id" },
  );
}

async function upsertCommitsFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  const commits = payload.commits as CommitPayload[] | undefined;
  if (!repository.full_name || !commits?.length) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;

  const now = new Date().toISOString();
  const rows = commits
    .filter((commit) => commit.id)
    .map((commit) => ({
      project_id: linked.project_id,
      organization_id: linked.organization_id,
      repository_id: linked.id,
      sha: commit.id,
      message: commit.message?.split("\n")[0] ?? "",
      html_url: commit.url ?? "",
      author_login: commit.author?.username ?? commit.author?.name ?? "",
      committed_at: commit.timestamp ?? null,
      last_synced_at: now,
    }));

  if (rows.length === 0) return;

  await admin.from("github_synced_commits").upsert(rows, {
    onConflict: "repository_id,sha",
  });
}
