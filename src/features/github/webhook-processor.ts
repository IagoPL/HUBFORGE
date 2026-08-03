import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  persistSyncedCommits,
  persistSyncedIssue,
  persistSyncedPullRequest,
  resolveLinkedRepository,
} from "@/features/github/sync-persist";

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

async function upsertIssueFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  const issue = payload.issue as IssuePayload;
  if (!repository.full_name || !issue?.id) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;

  await persistSyncedIssue(admin, linked, issue);
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

  await persistSyncedPullRequest(admin, linked, {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    state: pullRequest.state,
    merged: pullRequest.merged,
    html_url: pullRequest.html_url,
    author_login: pullRequest.user?.login,
  });
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

  await persistSyncedCommits(
    admin,
    linked,
    commits.map((commit) => ({
      sha: commit.id,
      message: commit.message ?? "",
      html_url: commit.url,
      author_login: commit.author?.username ?? commit.author?.name,
      committed_at: commit.timestamp ?? null,
    })),
  );
}
