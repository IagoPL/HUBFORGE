import { afterEach, describe, expect, it, vi } from "vitest";

const listIssues = vi.fn();
const listPrs = vi.fn();
const listCommits = vi.fn();
const listChecks = vi.fn();
const persistIssue = vi.fn();
const persistPr = vi.fn();
const persistCommits = vi.fn();
const persistCheck = vi.fn();

vi.mock("@/features/github/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/features/github/api-client")>(
    "@/features/github/api-client",
  );
  return {
    ...actual,
    listRepositoryIssues: (...args: unknown[]) => listIssues(...args),
    listRepositoryPullRequests: (...args: unknown[]) => listPrs(...args),
    listRepositoryCommits: (...args: unknown[]) => listCommits(...args),
    listRepositoryCheckRuns: (...args: unknown[]) => listChecks(...args),
  };
});

vi.mock("@/features/github/app-auth", () => ({
  createInstallationAccessToken: vi.fn(async () => ({ ok: true, token: "t" })),
}));

const isConfigured = vi.fn(() => true);

vi.mock("@/features/github/config", () => ({
  isGitHubAppConfigured: () => isConfigured(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: vi.fn() }),
}));

vi.mock("@/features/github/sync-persist", () => ({
  persistSyncedIssue: (...args: unknown[]) => persistIssue(...args),
  persistSyncedPullRequest: (...args: unknown[]) => persistPr(...args),
  persistSyncedCommits: (...args: unknown[]) => persistCommits(...args),
  persistSyncedCheckRun: (...args: unknown[]) => persistCheck(...args),
}));

import { GitHubRateLimitError } from "@/features/github/api-client";
import { backfillLinkedRepository } from "@/features/github/backfill";

describe("backfillLinkedRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("fails clearly when the GitHub App is not configured", async () => {
    isConfigured.mockReturnValueOnce(false);
    const result = await backfillLinkedRepository({
      fullName: "owner/repo",
      installationId: 1,
      linked: {
        id: "repo-1",
        project_id: "proj-1",
        organization_id: "org-1",
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not configured/i);
  });

  it("keeps issue sync when check runs hit a partial error", async () => {
    listIssues.mockResolvedValue([
      {
        id: 1,
        number: 1,
        title: "A",
        state: "open",
        html_url: "https://github.com/o/r/issues/1",
      },
    ]);
    listPrs.mockResolvedValue([]);
    listCommits.mockResolvedValue([
      {
        sha: "abc",
        html_url: "https://github.com/o/r/commit/abc",
        commit: { message: "m", author: { date: "2026-08-04T00:00:00.000Z" } },
      },
    ]);
    listChecks.mockRejectedValue(new Error("checks exploded"));
    persistIssue.mockResolvedValue(undefined);
    persistPr.mockResolvedValue(undefined);
    persistCommits.mockResolvedValue(undefined);

    const result = await backfillLinkedRepository({
      fullName: "owner/repo",
      installationId: 1,
      linked: {
        id: "repo-1",
        project_id: "proj-1",
        organization_id: "org-1",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.counts.issues).toBe(1);
    expect(result.counts.checkRuns).toBe(0);
    expect(result.partialErrors.some((e) => /Check run sync failed/i.test(e))).toBe(true);
  });

  it("records rate-limited check sync without failing the backfill", async () => {
    listIssues.mockResolvedValue([]);
    listPrs.mockResolvedValue([]);
    listCommits.mockResolvedValue([
      {
        sha: "abc",
        html_url: "https://github.com/o/r/commit/abc",
        commit: { message: "m" },
      },
    ]);
    listChecks.mockResolvedValue({
      runs: [
        {
          id: 10,
          name: "lint",
          status: "completed",
          conclusion: "failure",
          html_url: null,
          head_sha: "abc",
          completed_at: "2026-08-04T10:00:00.000Z",
          started_at: null,
          pull_requests: [],
        },
      ],
      rateLimited: true,
      pages: 1,
    });
    persistCommits.mockResolvedValue(undefined);
    persistCheck.mockResolvedValue({ applied: true });

    const result = await backfillLinkedRepository({
      fullName: "owner/repo",
      installationId: 1,
      linked: {
        id: "repo-1",
        project_id: "proj-1",
        organization_id: "org-1",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.counts.checkRuns).toBe(1);
    expect(result.rateLimited).toBe(true);
    expect(result.partialErrors.some((e) => /Rate limited/i.test(e))).toBe(true);
    expect(GitHubRateLimitError.name).toBe("GitHubRateLimitError");
  });
});
