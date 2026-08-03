import { describe, expect, it } from "vitest";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";

describe("Northlight Aurora demo", () => {
  it("is deterministic and labeled without live GitHub URLs", () => {
    const a = getNorthlightAuroraDemo();
    const b = getNorthlightAuroraDemo();
    expect(a).toEqual(b);
    expect(a.organizationName).toBe("Northlight Studio");
    expect(a.projectName).toBe("Aurora");
    expect(a.mode).toBe("demo");

    const origins = a.signals.map((signal) => signal.originRef).join(" ");
    expect(origins).not.toMatch(/https?:\/\/github\.com/i);
    expect(origins).toMatch(/demo:\/\//);

    expect(a.signals.some((s) => s.kind === "fact")).toBe(true);
    expect(a.signals.some((s) => s.kind === "inference")).toBe(true);
    expect(a.signals.some((s) => s.type === "ci_failed")).toBe(true);
    expect(a.signals.some((s) => s.type === "review_waiting")).toBe(true);
    expect(a.signals.some((s) => s.type === "unassigned_critical")).toBe(true);
    expect(a.dependencies.some((d) => d.affectedCount >= 3)).toBe(true);
    expect(a.members.some((m) => !m.availableThisWeek)).toBe(true);
    expect(a.work.some((w) => w.completedSinceVisit)).toBe(true);
  });
});
