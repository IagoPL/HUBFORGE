import { createHash } from "node:crypto";
import { createInstallationAccessToken } from "@/features/github/app-auth";
import { parseCheckRunPayload } from "@/features/github/check-run-normalize";
import { listRepositoryCheckRuns } from "@/features/github/api-client";
import {
  isAuthorizedInstallation,
  persistSyncedCheckRun,
  persistSyncedCommits,
  persistSyncedIssue,
  persistSyncedPullRequest,
  resolveLinkedRepository,
} from "@/features/github/sync-persist";
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
  assignees?: { login?: string }[];
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

  const installationId =
    typeof (input.payload.installation as { id?: number } | undefined)?.id === "number"
      ? (input.payload.installation as { id: number }).id
      : null;

  const repositoryFullName =
    typeof (input.payload.repository as { full_name?: string } | undefined)?.full_name ===
    "string"
      ? (input.payload.repository as { full_name: string }).full_name
      : null;

  const { error: insertDeliveryError } = await admin
    .from("github_webhook_deliveries")
    .insert({
      delivery_id: input.deliveryId,
      event: input.event,
      action: input.action,
      installation_id: installationId,
      repository_full_name: repositoryFullName,
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

  if (
    input.event === "check_run" &&
    input.payload.check_run &&
    input.payload.repository
  ) {
    await upsertCheckRunFromWebhook(admin, input.payload);
  }

  if (
    input.event === "check_suite" &&
    input.payload.check_suite &&
    input.payload.repository &&
    installationId != null
  ) {
    await upsertCheckSuiteFromWebhook(admin, input.payload, installationId);
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
  if (!isAuthorizedInstallation(linked, installationIdFromPayload(payload))) return;

  // Never invent HubForge assignees from GitHub logins (no login→member map yet).
  await persistSyncedIssue(admin, linked, {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    html_url: issue.html_url,
  });
}

function installationIdFromPayload(payload: Record<string, unknown>): number | null {
  return typeof (payload.installation as { id?: number } | undefined)?.id === "number"
    ? (payload.installation as { id: number }).id
    : null;
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
  if (!isAuthorizedInstallation(linked, installationIdFromPayload(payload))) return;

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
  if (!isAuthorizedInstallation(linked, installationIdFromPayload(payload))) return;

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

async function upsertCheckRunFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  if (!repository.full_name) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;
  if (!isAuthorizedInstallation(linked, installationIdFromPayload(payload))) return;

  const checkRun = payload.check_run;
  if (!checkRun || typeof checkRun !== "object") return;

  const parsed = parseCheckRunPayload(checkRun as Record<string, unknown>);
  if (!parsed) return;

  await persistSyncedCheckRun(admin, linked, parsed);
}

/**
 * check_suite does not include individual runs — fetch recent runs for head_sha
 * when the suite completes (or is requested) for a linked repository.
 */
async function upsertCheckSuiteFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
  installationId: number,
) {
  const repository = payload.repository as { full_name?: string };
  const suite = payload.check_suite as {
    head_sha?: string;
    status?: string;
  };
  if (!repository.full_name || !suite?.head_sha) return;

  const linked = await resolveLinkedRepository(admin, repository.full_name);
  if (!linked) return;
  if (!isAuthorizedInstallation(linked, installationId)) return;

  const tokenResult = await createInstallationAccessToken(installationId);
  if (!tokenResult.ok) return;

  const listed = await listRepositoryCheckRuns(tokenResult.token, repository.full_name, {
    ref: suite.head_sha,
    limit: 40,
  });

  for (const run of listed.runs) {
    const parsed = parseCheckRunPayload(run as unknown as Record<string, unknown>);
    if (!parsed) continue;
    await persistSyncedCheckRun(admin, linked, parsed);
  }
}
