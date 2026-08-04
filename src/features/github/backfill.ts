import {
  GitHubRateLimitError,
  listRepositoryCheckRuns,
  listRepositoryCommits,
  listRepositoryIssues,
  listRepositoryPullRequests,
} from "@/features/github/api-client";
import { createInstallationAccessToken } from "@/features/github/app-auth";
import { parseCheckRunPayload } from "@/features/github/check-run-normalize";
import { isGitHubAppConfigured } from "@/features/github/config";
import {
  persistSyncedCheckRun,
  persistSyncedCommits,
  persistSyncedIssue,
  persistSyncedPullRequest,
  type LinkedRepositoryRow,
} from "@/features/github/sync-persist";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type BackfillCounts = {
  issues: number;
  pullRequests: number;
  commits: number;
  checkRuns: number;
};

export type BackfillResult =
  | {
      ok: true;
      counts: BackfillCounts;
      partialErrors: string[];
      rateLimited: boolean;
    }
  | { ok: false; error: string };

export async function backfillLinkedRepository(input: {
  fullName: string;
  installationId: number;
  linked: LinkedRepositoryRow;
}): Promise<BackfillResult> {
  if (!isGitHubAppConfigured()) {
    return { ok: false, error: "GitHub App is not configured." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "Service role is not configured." };
  }

  const tokenResult = await createInstallationAccessToken(input.installationId);
  if (!tokenResult.ok) return tokenResult;

  const partialErrors: string[] = [];
  let rateLimited = false;
  const counts: BackfillCounts = {
    issues: 0,
    pullRequests: 0,
    commits: 0,
    checkRuns: 0,
  };

  try {
    const [issues, pullRequests, commits] = await Promise.all([
      listRepositoryIssues(tokenResult.token, input.fullName, 50),
      listRepositoryPullRequests(tokenResult.token, input.fullName, 40),
      listRepositoryCommits(tokenResult.token, input.fullName, 40),
    ]);

    for (const issue of issues) {
      await persistSyncedIssue(admin, input.linked, {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state === "closed" ? "closed" : "open",
        html_url: issue.html_url,
      });
      counts.issues += 1;
    }

    for (const pr of pullRequests) {
      await persistSyncedPullRequest(admin, input.linked, {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state === "closed" ? "closed" : "open",
        merged: Boolean(pr.merged_at),
        html_url: pr.html_url,
        author_login: pr.user?.login,
      });
      counts.pullRequests += 1;
    }

    await persistSyncedCommits(
      admin,
      input.linked,
      commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message ?? "",
        html_url: commit.html_url,
        author_login: commit.author?.login ?? commit.commit.author?.name,
        committed_at: commit.commit.author?.date ?? null,
      })),
    );
    counts.commits = commits.length;
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      return {
        ok: true,
        counts,
        partialErrors: ["Rate limited while syncing issues/PRs/commits."],
        rateLimited: true,
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "GitHub backfill failed.",
    };
  }

  // Check runs are best-effort and must not fail the primary sync.
  try {
    const headSha = (await listRepositoryCommits(tokenResult.token, input.fullName, 1))[0]
      ?.sha;
    const listed = await listRepositoryCheckRuns(tokenResult.token, input.fullName, {
      ref: headSha,
      limit: 40,
      perPage: 30,
    });
    rateLimited = listed.rateLimited;

    for (const run of listed.runs) {
      const parsed = parseCheckRunPayload(run as unknown as Record<string, unknown>);
      if (!parsed) continue;
      await persistSyncedCheckRun(admin, input.linked, parsed);
      counts.checkRuns += 1;
    }

    if (listed.rateLimited) {
      partialErrors.push("Rate limited while syncing check runs; partial results kept.");
    }
  } catch (error) {
    partialErrors.push(
      error instanceof Error
        ? `Check run sync failed: ${error.message}`
        : "Check run sync failed.",
    );
  }

  return { ok: true, counts, partialErrors, rateLimited };
}
