import { describe, expect, it } from "vitest";
import { buildEvidenceBundle } from "@/lib/signals/build-bundle";
import { briefingFactCounts, runSignalEngine } from "@/lib/signals/briefing";
import { generateSignals } from "@/lib/signals/generate";
import { prioritizeSignals, PRIORITY_FORMULA } from "@/lib/signals/prioritize";
import { validatedSourceUrl } from "@/lib/signals/urls";
import { northlightAuroraEvidence } from "@/features/signals/demo-evidence";
import type { EvidenceBundle, NormalizedTask } from "@/lib/signals/types";

function task(
  partial: Partial<NormalizedTask> & Pick<NormalizedTask, "id" | "title">,
): NormalizedTask {
  return {
    status: "ready",
    priority: "medium",
    assigneeIds: [],
    updatedAt: "2026-08-01T00:00:00.000Z",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...partial,
  };
}

function baseBundle(overrides: Partial<EvidenceBundle> = {}): EvidenceBundle {
  return buildEvidenceBundle({
    projectId: "p1",
    repositoryId: "r1",
    lastVisitAt: "2026-08-01T09:00:00.000Z",
    tasks: [],
    config: { now: "2026-08-03T12:00:00.000Z", demo: false, staleDaysThreshold: 5 },
    ...overrides,
  });
}

describe("validatedSourceUrl", () => {
  it("accepts only http(s)", () => {
    expect(validatedSourceUrl("https://github.com/org/repo/pull/1")).toContain(
      "https://",
    );
    expect(validatedSourceUrl("demo://github/pr/42")).toBeNull();
    expect(validatedSourceUrl("not a url")).toBeNull();
    expect(validatedSourceUrl(null)).toBeNull();
  });
});

describe("generateSignals", () => {
  it("emits work_blocked as fact from explicit dependencies", () => {
    const bundle = baseBundle({
      tasks: [
        task({ id: "a", title: "Asset", status: "in_progress", priority: "high" }),
        task({ id: "b", title: "Integrate", status: "ready", priority: "high" }),
        task({ id: "c", title: "UI", status: "ready" }),
      ],
      dependencies: [
        { taskId: "b", dependsOnTaskId: "a", createdAt: null },
        { taskId: "c", dependsOnTaskId: "a", createdAt: null },
      ],
    });
    const signals = generateSignals(bundle);
    const blocked = signals.find((s) => s.kind === "work_blocked");
    expect(blocked?.classification).toBe("fact");
    expect(blocked?.blockedCount).toBe(2);
    expect(blocked?.evidenceType).toBe("rule.dependency_unresolved");
  });

  it("emits review_waiting only for real pull requests", () => {
    const bundle = baseBundle({
      tasks: [task({ id: "t1", title: "In review", status: "review", priority: "high" })],
      pullRequests: [
        {
          id: "pr1",
          number: 7,
          title: "Real PR",
          state: "open",
          merged: false,
          htmlUrl: "https://github.com/org/repo/pull/7",
          authorLogin: "dev",
          updatedAt: "2026-08-02T00:00:00.000Z",
          mergedAt: null,
        },
      ],
    });
    const signals = generateSignals(bundle);
    expect(
      signals.some(
        (s) => s.kind === "review_waiting" && s.subjectType === "pull_request",
      ),
    ).toBe(true);
    expect(
      signals.some((s) => s.kind === "review_waiting" && s.subjectType === "task"),
    ).toBe(false);
    const review = signals.find((s) => s.kind === "review_waiting");
    expect(review?.sourceUrl).toContain("github.com");
  });

  it("emits ci_failed only with check run evidence", () => {
    const empty = generateSignals(baseBundle());
    expect(empty.some((s) => s.kind === "ci_failed")).toBe(false);

    const withCi = generateSignals(
      baseBundle({
        checkRuns: [
          {
            id: "c1",
            name: "lint",
            status: "completed",
            conclusion: "failure",
            htmlUrl: "https://github.com/org/repo/actions/runs/1",
            completedAt: "2026-08-03T08:00:00.000Z",
            pullRequestId: null,
            headSha: "abc",
          },
        ],
      }),
    );
    expect(
      withCi.some((s) => s.kind === "ci_failed" && s.classification === "fact"),
    ).toBe(true);
  });

  it("marks work_stale as inference using threshold", () => {
    const rebuilt = buildEvidenceBundle({
      projectId: "p1",
      tasks: [
        task({
          id: "stale",
          title: "Slow art",
          status: "in_progress",
          updatedAt: "2026-07-20T00:00:00.000Z",
        }),
      ],
      config: { now: "2026-08-03T12:00:00.000Z", staleDaysThreshold: 5 },
    });
    const stale = generateSignals(rebuilt).find((s) => s.kind === "work_stale");
    expect(stale?.classification).toBe("inference");
    expect(stale?.confidence).toBeLessThan(1);
  });

  it("distinguishes work_completed from pull_request_merged", () => {
    const bundle = baseBundle({
      tasks: [task({ id: "done", title: "Internal", status: "done" })],
      pullRequests: [
        {
          id: "pr2",
          number: 9,
          title: "Merged PR",
          state: "closed",
          merged: true,
          htmlUrl: "https://github.com/org/repo/pull/9",
          authorLogin: "dev",
          updatedAt: "2026-08-02T12:00:00.000Z",
          mergedAt: "2026-08-02T12:00:00.000Z",
        },
      ],
    });
    const signals = generateSignals(bundle);
    expect(signals.some((s) => s.kind === "work_completed")).toBe(true);
    expect(signals.some((s) => s.kind === "pull_request_merged")).toBe(true);
    expect(signals.find((s) => s.kind === "work_completed")?.headline).not.toMatch(
      /merged/i,
    );
  });

  it("emits unassigned_critical for high priority without owner", () => {
    const signals = generateSignals(
      baseBundle({
        tasks: [task({ id: "u", title: "Critical", priority: "high", status: "ready" })],
      }),
    );
    expect(
      signals.some(
        (s) => s.kind === "unassigned_critical" && s.classification === "fact",
      ),
    ).toBe(true);
  });

  it("emits dependency_released when blocker is done", () => {
    const signals = generateSignals(
      baseBundle({
        tasks: [
          task({
            id: "blocker",
            title: "Done blocker",
            status: "done",
            priority: "high",
          }),
          task({ id: "child", title: "Waiting", status: "ready" }),
        ],
        dependencies: [{ taskId: "child", dependsOnTaskId: "blocker", createdAt: null }],
      }),
    );
    expect(signals.some((s) => s.kind === "dependency_released")).toBe(true);
  });
});

describe("prioritizeSignals", () => {
  it("orders by impact with stable ties", () => {
    const bundle = baseBundle({
      tasks: [
        task({ id: "a", title: "A", priority: "high", status: "in_progress" }),
        task({ id: "b", title: "B", priority: "low", status: "ready" }),
        task({ id: "c", title: "C", priority: "high", status: "ready" }),
        task({ id: "d", title: "D", priority: "high", status: "ready" }),
      ],
      dependencies: [
        { taskId: "b", dependsOnTaskId: "a", createdAt: null },
        { taskId: "c", dependsOnTaskId: "a", createdAt: null },
        { taskId: "d", dependsOnTaskId: "a", createdAt: null },
      ],
    });
    const ranked = prioritizeSignals(generateSignals(bundle), bundle);
    expect(ranked[0]?.kind).toBe("work_blocked");
    expect(ranked[0]?.blockedCount).toBe(3);
    expect(ranked[0]?.priorityReason).toMatch(/blocks 3/);
    expect(PRIORITY_FORMULA.severityMultiplier).toBe(1000);

    const same = prioritizeSignals(generateSignals(bundle), bundle);
    expect(same.map((s) => s.id)).toEqual(ranked.map((s) => s.id));
  });
});

describe("runSignalEngine / briefing", () => {
  it("keeps first visit sinceLastVisit empty while attention stays populated", () => {
    const bundle = baseBundle({
      lastVisitAt: null,
      tasks: [
        task({ id: "a", title: "Blocker", priority: "high", status: "in_progress" }),
        task({ id: "b", title: "Child", status: "ready" }),
      ],
      dependencies: [{ taskId: "b", dependsOnTaskId: "a", createdAt: null }],
    });
    const part = runSignalEngine(bundle);
    expect(part.firstVisit).toBe(true);
    expect(part.sinceLastVisit).toEqual([]);
    expect(part.persistentAttention.length).toBeGreaterThan(0);
  });

  it("scopes briefing to changes after lastVisitAt and keeps older persistent problems", () => {
    const bundle = baseBundle({
      lastVisitAt: "2026-08-02T00:00:00.000Z",
      tasks: [
        task({
          id: "old",
          title: "Old blocker",
          priority: "high",
          status: "in_progress",
          updatedAt: "2026-07-01T00:00:00.000Z",
        }),
        task({
          id: "newdone",
          title: "Just finished",
          status: "done",
          updatedAt: "2026-08-02T18:00:00.000Z",
        }),
        task({
          id: "child",
          title: "Child",
          status: "ready",
          updatedAt: "2026-07-01T00:00:00.000Z",
        }),
      ],
      dependencies: [{ taskId: "child", dependsOnTaskId: "old", createdAt: null }],
    });
    const part = runSignalEngine(bundle);
    expect(part.sinceLastVisit.some((s) => s.kind === "work_completed")).toBe(true);
    expect(part.persistentAttention.some((s) => s.subjectId === "old")).toBe(true);
    const counts = briefingFactCounts(part.sinceLastVisit);
    expect(counts.completed).toBeGreaterThanOrEqual(1);
  });

  it("flags assignee unavailable as capacity inference", () => {
    const bundle = baseBundle({
      tasks: [
        task({
          id: "t",
          title: "Owned",
          priority: "high",
          status: "in_progress",
          assigneeIds: ["m1"],
        }),
      ],
      members: [{ id: "m1", name: "Art", functionalRole: "Art" }],
      availability: [
        {
          memberId: "m1",
          startsAt: "2026-08-01T00:00:00.000Z",
          endsAt: "2026-08-10T00:00:00.000Z",
          kind: "unavailable",
        },
      ],
    });
    const part = runSignalEngine(bundle);
    expect(
      part.persistentAttention.some(
        (s) => s.evidenceType === "rule.assignee_unavailable",
      ),
    ).toBe(true);
  });
});

describe("demo uses real engine", () => {
  it("produces fact and inference through the shared pipeline", () => {
    const part = runSignalEngine(northlightAuroraEvidence());
    expect(part.persistentAttention.some((s) => s.classification === "fact")).toBe(true);
    expect(part.persistentAttention.some((s) => s.classification === "inference")).toBe(
      true,
    );
    expect(part.persistentAttention.some((s) => s.kind === "ci_failed")).toBe(true);
    expect(part.persistentAttention.some((s) => s.kind === "review_waiting")).toBe(true);
    expect(part.sinceLastVisit.some((s) => s.kind === "work_completed")).toBe(true);
    for (const signal of [...part.sinceLastVisit, ...part.persistentAttention]) {
      if (signal.sourceUrl) {
        expect(signal.sourceUrl.startsWith("http")).toBe(true);
      }
    }
  });
});
