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

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${path} failed (${response.status}): ${body.slice(0, 200)}`);
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
