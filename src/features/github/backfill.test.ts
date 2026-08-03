import { afterEach, describe, expect, it, vi } from "vitest";
import { backfillLinkedRepository } from "@/features/github/backfill";

describe("backfillLinkedRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fails clearly when the GitHub App is not configured", async () => {
    vi.stubEnv("GITHUB_APP_ID", "");
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

  it("fails clearly when the service role is missing", async () => {
    vi.stubEnv("GITHUB_APP_ID", "1");
    vi.stubEnv("GITHUB_APP_CLIENT_ID", "cid");
    vi.stubEnv("GITHUB_APP_CLIENT_SECRET", "secret");
    vi.stubEnv(
      "GITHUB_APP_PRIVATE_KEY",
      "-----BEGIN PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END PRIVATE KEY-----",
    );
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", "whsec");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pub");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

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
    if (!result.ok) expect(result.error).toMatch(/service role|not configured/i);
  });
});
