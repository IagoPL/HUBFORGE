import { afterEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/features/github/sync-persist", async () => {
  const actual = await vi.importActual<typeof import("@/features/github/sync-persist")>(
    "@/features/github/sync-persist",
  );
  return {
    ...actual,
    resolveLinkedRepository: vi.fn(async (_admin, fullName: string) =>
      fullName === "owner/linked"
        ? {
            id: "repo-1",
            project_id: "proj-1",
            organization_id: "org-1",
            installation_id: 9,
          }
        : null,
    ),
    persistSyncedCheckRun: vi.fn(async () => ({ applied: true })),
  };
});

import {
  isAuthorizedInstallation,
  persistSyncedCheckRun,
  resolveLinkedRepository,
} from "@/features/github/sync-persist";
import { processGitHubWebhook } from "@/features/github/webhook-processor";

describe("processGitHubWebhook check events", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockDeliveryInsert(code?: string) {
    insertMock.mockResolvedValue(
      code ? { error: { code, message: "duplicate" } } : { error: null },
    );
    fromMock.mockImplementation((table: string) => {
      if (table === "github_webhook_deliveries") {
        return { insert: insertMock };
      }
      return { insert: insertMock };
    });
  }

  it("marks duplicate deliveries as idempotent", async () => {
    mockDeliveryInsert("23505");
    const result = await processGitHubWebhook({
      deliveryId: "d1",
      event: "check_run",
      action: "completed",
      payload: { repository: { full_name: "owner/linked" }, check_run: { id: 1 } },
    });
    expect(result).toEqual({ ok: true, duplicate: true });
    expect(persistSyncedCheckRun).not.toHaveBeenCalled();
  });

  it("ignores unlinked repositories after recording delivery", async () => {
    mockDeliveryInsert();
    const result = await processGitHubWebhook({
      deliveryId: "d2",
      event: "check_run",
      action: "completed",
      payload: {
        repository: { full_name: "owner/other" },
        check_run: {
          id: 2,
          name: "lint",
          status: "completed",
          conclusion: "failure",
          head_sha: "abc",
          updated_at: "2026-08-04T10:00:00.000Z",
        },
      },
    });
    expect(result.ok).toBe(true);
    expect(resolveLinkedRepository).toHaveBeenCalled();
    expect(persistSyncedCheckRun).not.toHaveBeenCalled();
  });

  it("persists check_run for linked repositories", async () => {
    mockDeliveryInsert();
    const result = await processGitHubWebhook({
      deliveryId: "d3",
      event: "check_run",
      action: "completed",
      payload: {
        repository: { full_name: "owner/linked" },
        installation: { id: 9 },
        check_run: {
          id: 3,
          name: "lint",
          status: "completed",
          conclusion: "failure",
          html_url: "https://github.com/owner/linked/runs/3",
          head_sha: "abc",
          completed_at: "2026-08-04T10:00:00.000Z",
          updated_at: "2026-08-04T10:00:00.000Z",
          pull_requests: [],
        },
      },
    });
    expect(result).toEqual({ ok: true, duplicate: false });
    expect(persistSyncedCheckRun).toHaveBeenCalled();
  });

  it("rejects wrong installation for a linked repository", async () => {
    mockDeliveryInsert();
    const result = await processGitHubWebhook({
      deliveryId: "d4",
      event: "check_run",
      action: "completed",
      payload: {
        repository: { full_name: "owner/linked" },
        installation: { id: 999 },
        check_run: {
          id: 4,
          name: "lint",
          status: "completed",
          conclusion: "failure",
          head_sha: "abc",
          updated_at: "2026-08-04T10:00:00.000Z",
        },
      },
    });
    expect(result.ok).toBe(true);
    expect(persistSyncedCheckRun).not.toHaveBeenCalled();
  });

  it("authorizes matching installation ids", () => {
    expect(
      isAuthorizedInstallation(
        {
          id: "r",
          project_id: "p",
          organization_id: "o",
          installation_id: 9,
        },
        9,
      ),
    ).toBe(true);
    expect(
      isAuthorizedInstallation(
        {
          id: "r",
          project_id: "p",
          organization_id: "o",
          installation_id: 9,
        },
        1,
      ),
    ).toBe(false);
  });
});
