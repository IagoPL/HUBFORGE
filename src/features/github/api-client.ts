const GITHUB_API = "https://api.github.com";

export type GitHubApiIssue = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  pull_request?: unknown;
};

export type GitHubApiPullRequest = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  html_url: string;
  user?: { login?: string };
};

export type GitHubApiCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { date?: string; name?: string };
  };
  author?: { login?: string } | null;
};

export class GitHubRateLimitError extends Error {
  constructor(
    message: string,
    readonly resetAt: string | null,
  ) {
    super(message);
    this.name = "GitHubRateLimitError";
  }
}

async function githubGet<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "HubForge",
    },
    cache: "no-store",
  });

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || response.status === 429) {
      throw new GitHubRateLimitError(
        `GitHub API rate limited (${response.status})`,
        response.headers.get("x-ratelimit-reset"),
      );
    }
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${path} failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  return (await response.json()) as T;
}

function encodeRepo(fullName: string) {
  const [owner = "", repo = ""] = fullName.split("/");
  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

/** Issues only (excludes PRs that appear in the issues endpoint). */
export async function listRepositoryIssues(
  token: string,
  fullName: string,
  limit = 50,
): Promise<GitHubApiIssue[]> {
  const path = `/repos/${encodeRepo(fullName)}/issues?state=all&per_page=${Math.min(limit, 100)}&sort=updated&direction=desc`;
  const rows = await githubGet<GitHubApiIssue[]>(token, path);
  return rows.filter((row) => !row.pull_request).slice(0, limit);
}

export async function listRepositoryPullRequests(
  token: string,
  fullName: string,
  limit = 40,
): Promise<GitHubApiPullRequest[]> {
  const path = `/repos/${encodeRepo(fullName)}/pulls?state=all&per_page=${Math.min(limit, 100)}&sort=updated&direction=desc`;
  const rows = await githubGet<GitHubApiPullRequest[]>(token, path);
  return rows.slice(0, limit);
}

export async function listRepositoryCommits(
  token: string,
  fullName: string,
  limit = 40,
): Promise<GitHubApiCommit[]> {
  const path = `/repos/${encodeRepo(fullName)}/commits?per_page=${Math.min(limit, 100)}`;
  const rows = await githubGet<GitHubApiCommit[]>(token, path);
  return rows.slice(0, limit);
}

export type GitHubApiCheckRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string | null;
  head_sha: string;
  completed_at: string | null;
  updated_at: string | null;
  pull_requests?: { number: number }[];
};

/**
 * Paginates check runs for a commit SHA (or HEAD). Caps at `limit` total rows.
 * Stops early on rate limit and returns what was collected.
 */
export async function listRepositoryCheckRuns(
  token: string,
  fullName: string,
  options: { ref?: string; limit?: number; perPage?: number } = {},
): Promise<{ runs: GitHubApiCheckRun[]; rateLimited: boolean; pages: number }> {
  const limit = options.limit ?? 40;
  const perPage = Math.min(options.perPage ?? 30, 100);
  const commitRef = options.ref?.trim() || "HEAD";
  const runs: GitHubApiCheckRun[] = [];
  let page = 1;
  let rateLimited = false;

  while (runs.length < limit && page <= 5) {
    const listPath = `/repos/${encodeRepo(fullName)}/commits/${encodeURIComponent(commitRef)}/check-runs?per_page=${perPage}&page=${page}`;

    try {
      const payload = await githubGet<{
        check_runs: GitHubApiCheckRun[];
        total_count: number;
      }>(token, listPath);
      const batch = payload.check_runs ?? [];
      if (batch.length === 0) break;
      for (const run of batch) {
        runs.push(run);
        if (runs.length >= limit) break;
      }
      if (batch.length < perPage) break;
      page += 1;
    } catch (error) {
      if (error instanceof GitHubRateLimitError) {
        rateLimited = true;
        break;
      }
      throw error;
    }
  }

  return { runs: runs.slice(0, limit), rateLimited, pages: page };
}
