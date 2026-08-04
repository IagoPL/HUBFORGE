import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GitHubRateLimitError,
  listRepositoryCheckRuns,
} from "@/features/github/api-client";

describe("listRepositoryCheckRuns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("paginates until the limit and stops", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          total_count: 60,
          check_runs: Array.from({ length: 30 }, (_, i) => ({
            id: (page - 1) * 30 + i + 1,
            name: "lint",
            status: "completed",
            conclusion: "success",
            html_url: null,
            head_sha: "abc",
            completed_at: null,
            started_at: null,
          })),
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listRepositoryCheckRuns("token", "owner/repo", {
      ref: "abc",
      limit: 40,
      perPage: 30,
    });

    expect(result.runs).toHaveLength(40);
    expect(result.rateLimited).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns partial results on rate limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          total_count: 2,
          check_runs: [
            {
              id: 1,
              name: "lint",
              status: "completed",
              conclusion: "failure",
              html_url: null,
              head_sha: "abc",
              completed_at: null,
              started_at: null,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1" }),
        text: async () => "rate limited",
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listRepositoryCheckRuns("token", "owner/repo", {
      ref: "abc",
      limit: 40,
      perPage: 1,
    });

    expect(result.runs).toHaveLength(1);
    expect(result.rateLimited).toBe(true);
  });

  it("treats HTTP 429 as a soft rate-limit stop", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        headers: new Headers({ "x-ratelimit-remaining": "0" }),
        text: async () => "slow down",
      })),
    );

    const listed = await listRepositoryCheckRuns("token", "owner/repo", { perPage: 30 });
    expect(listed.rateLimited).toBe(true);
    expect(listed.runs).toHaveLength(0);
    expect(new GitHubRateLimitError("x", null).name).toBe("GitHubRateLimitError");
  });
});
