import {
  listRepositoryCommits,
  listRepositoryIssues,
  listRepositoryPullRequests,
} from "@/features/github/api-client";
import { createInstallationAccessToken } from "@/features/github/app-auth";
import { isGitHubAppConfigured } from "@/features/github/config";
import {
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
};

export async function backfillLinkedRepository(input: {
  fullName: string;
  installationId: number;
  linked: LinkedRepositoryRow;
}): Promise<{ ok: true; counts: BackfillCounts } | { ok: false; error: string }> {
  if (!isGitHubAppConfigured()) {
    return { ok: false, error: "GitHub App is not configured." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "Service role is not configured." };
  }

  const tokenResult = await createInstallationAccessToken(input.installationId);
  if (!tokenResult.ok) return tokenResult;

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

    return {
      ok: true,
      counts: {
        issues: issues.length,
        pullRequests: pullRequests.length,
        commits: commits.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "GitHub backfill failed.",
    };
  }
}
