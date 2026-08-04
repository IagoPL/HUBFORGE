import { describe, expect, it } from "vitest";
import {
  isFailingConclusion,
  latestChecksByNameSha,
  parseCheckRunPayload,
  shouldApplyCheckRunUpdate,
} from "@/features/github/check-run-normalize";
import {
  appendPendingAssignmentIfNeeded,
  buildPendingAssignmentNote,
  hasPendingAssignmentNote,
  PENDING_ASSIGNMENT_MARKER,
} from "@/features/collaboration/pending-assignment";
import { generateSignals } from "@/lib/signals/generate";
import { buildEvidenceBundle } from "@/lib/signals/build-bundle";

describe("check-run-normalize", () => {
  it("parses check_run payloads", () => {
    const parsed = parseCheckRunPayload({
      id: 99,
      name: "lint",
      status: "completed",
      conclusion: "failure",
      html_url: "https://github.com/o/r/runs/99",
      head_sha: "abc",
      completed_at: "2026-08-04T10:00:00.000Z",
      updated_at: "2026-08-04T10:00:00.000Z",
      pull_requests: [{ number: 3 }],
    });
    expect(parsed?.githubCheckRunId).toBe(99);
    expect(parsed?.pullRequestNumbers).toEqual([3]);
  });

  it("rejects out-of-order updates", () => {
    expect(
      shouldApplyCheckRunUpdate(
        {
          status: "completed",
          updatedAt: "2026-08-04T12:00:00.000Z",
          completedAt: "2026-08-04T12:00:00.000Z",
        },
        {
          status: "in_progress",
          updatedAt: "2026-08-04T11:00:00.000Z",
          completedAt: null,
        },
      ),
    ).toBe(false);
  });

  it("treats only failure as failing conclusion", () => {
    expect(isFailingConclusion("failure")).toBe(true);
    expect(isFailingConclusion("cancelled")).toBe(false);
    expect(isFailingConclusion("skipped")).toBe(false);
    expect(isFailingConclusion("neutral")).toBe(false);
    expect(isFailingConclusion("timed_out")).toBe(false);
    expect(isFailingConclusion(null)).toBe(false);
  });

  it("keeps latest check per name+sha for recovery", () => {
    const latest = latestChecksByNameSha([
      {
        id: "old",
        name: "lint",
        headSha: "sha1",
        status: "completed" as const,
        conclusion: "failure" as const,
        completedAt: "2026-08-04T09:00:00.000Z",
      },
      {
        id: "new",
        name: "lint",
        headSha: "sha1",
        status: "completed" as const,
        conclusion: "success" as const,
        completedAt: "2026-08-04T10:00:00.000Z",
      },
    ]);
    expect(latest).toHaveLength(1);
    expect(latest[0]?.id).toBe("new");
  });
});

describe("ci_failed signal recovery", () => {
  it("drops ci_failed after a later success on the same name+sha", () => {
    const bundle = buildEvidenceBundle({
      projectId: "p1",
      tasks: [],
      checkRuns: [
        {
          id: "fail",
          name: "lint",
          status: "completed",
          conclusion: "failure",
          htmlUrl: "https://github.com/o/r/runs/1",
          completedAt: "2026-08-04T09:00:00.000Z",
          pullRequestId: null,
          headSha: "abc",
        },
        {
          id: "ok",
          name: "lint",
          status: "completed",
          conclusion: "success",
          htmlUrl: "https://github.com/o/r/runs/2",
          completedAt: "2026-08-04T10:00:00.000Z",
          pullRequestId: null,
          headSha: "abc",
        },
      ],
      config: { now: "2026-08-04T12:00:00.000Z" },
    });
    expect(generateSignals(bundle).some((s) => s.kind === "ci_failed")).toBe(false);
  });

  it("emits ci_failed for the latest failing check", () => {
    const bundle = buildEvidenceBundle({
      projectId: "p1",
      tasks: [],
      checkRuns: [
        {
          id: "fail",
          name: "lint",
          status: "completed",
          conclusion: "failure",
          htmlUrl: "https://github.com/o/r/runs/1",
          completedAt: "2026-08-04T10:00:00.000Z",
          pullRequestId: null,
          headSha: "abc",
        },
        {
          id: "cancelled",
          name: "lint",
          status: "completed",
          conclusion: "cancelled",
          htmlUrl: null,
          completedAt: "2026-08-04T09:00:00.000Z",
          pullRequestId: null,
          headSha: "abc",
        },
      ],
      config: { now: "2026-08-04T12:00:00.000Z" },
    });
    const signals = generateSignals(bundle).filter((s) => s.kind === "ci_failed");
    expect(signals).toHaveLength(1);
    expect(signals[0]?.subjectId).toBe("fail");
  });

  it("ignores in-progress and cancelled checks", () => {
    const bundle = buildEvidenceBundle({
      projectId: "p1",
      tasks: [],
      checkRuns: [
        {
          id: "wip",
          name: "lint",
          status: "in_progress",
          conclusion: null,
          htmlUrl: null,
          completedAt: null,
          pullRequestId: null,
          headSha: "abc",
        },
        {
          id: "cancel",
          name: "build",
          status: "completed",
          conclusion: "cancelled",
          htmlUrl: null,
          completedAt: "2026-08-04T10:00:00.000Z",
          pullRequestId: null,
          headSha: "abc",
        },
      ],
    });
    expect(generateSignals(bundle).some((s) => s.kind === "ci_failed")).toBe(false);
  });
});

describe("pending assignment notes", () => {
  it("builds and does not duplicate notes", () => {
    const note = buildPendingAssignmentNote({
      personName: "Mar Okada",
      functionalRole: "Art",
      needsToStartBeforeJoin: true,
    });
    expect(note).toContain(PENDING_ASSIGNMENT_MARKER);
    expect(note).toContain("Mar Okada");
    expect(note).toContain("Rol previsto");
    expect(note).toContain("Responsable temporal");

    const once = appendPendingAssignmentIfNeeded("Synced from GitHub", {
      personName: "Mar Okada",
    });
    const twice = appendPendingAssignmentIfNeeded(once, { personName: "Mar Okada" });
    expect(twice).toBe(once);
    expect(hasPendingAssignmentNote(twice)).toBe(true);
    expect(twice.split(PENDING_ASSIGNMENT_MARKER)).toHaveLength(2);
  });

  it("never invents usernames when person name is empty", () => {
    expect(appendPendingAssignmentIfNeeded("body", { personName: "  " })).toBe("body");
  });
});

describe("task_events evidence", () => {
  it("emits work_changed from events without duplicating completions", () => {
    const bundle = buildEvidenceBundle({
      projectId: "p1",
      tasks: [
        {
          id: "t1",
          title: "Work",
          status: "in_progress",
          priority: "medium",
          assigneeIds: [],
          updatedAt: "2026-08-04T10:00:00.000Z",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
        {
          id: "t2",
          title: "Done",
          status: "done",
          priority: "medium",
          assigneeIds: [],
          updatedAt: "2026-08-04T11:00:00.000Z",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      events: [
        {
          taskId: "t1",
          kind: "priority_changed",
          summary: "Priority → high",
          fromValue: "medium",
          toValue: "high",
          createdAt: "2026-08-04T10:30:00.000Z",
          actorId: null,
        },
        {
          taskId: "t2",
          kind: "status_changed",
          summary: "Status → done",
          fromValue: "review",
          toValue: "done",
          createdAt: "2026-08-04T11:00:00.000Z",
          actorId: null,
        },
      ],
      config: { now: "2026-08-04T12:00:00.000Z" },
    });
    const signals = generateSignals(bundle);
    expect(signals.some((s) => s.kind === "work_changed" && s.subjectId === "t1")).toBe(
      true,
    );
    expect(
      signals.some(
        (s) =>
          s.kind === "work_changed" &&
          s.subjectId === "t2" &&
          s.evidenceType === "rule.work_changed_since_visit",
      ),
    ).toBe(false);
    expect(signals.some((s) => s.kind === "work_completed" && s.subjectId === "t2")).toBe(
      true,
    );
  });
});
