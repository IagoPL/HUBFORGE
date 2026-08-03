import { describe, expect, it } from "vitest";
import { mapIssueStateToTaskStatus } from "@/features/github/sync-persist";

describe("sync persist helpers", () => {
  it("maps GitHub issue state to HubForge task status", () => {
    expect(mapIssueStateToTaskStatus("open")).toBe("backlog");
    expect(mapIssueStateToTaskStatus("closed")).toBe("done");
  });
});
