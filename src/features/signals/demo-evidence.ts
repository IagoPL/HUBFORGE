import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { buildEvidenceBundle } from "@/lib/signals/build-bundle";
import type {
  EvidenceBundle,
  NormalizedCheckRun,
  NormalizedPullRequest,
} from "@/lib/signals/types";

const DEMO_NOW = "2026-08-03T12:00:00.000Z";

/**
 * Demo fixtures → same EvidenceBundle contract as live data.
 * Simulated GitHub artefacts never use live github.com URLs as sourceUrl inputs
 * that would pass validation; check htmlUrl stays null / non-http.
 */
export function northlightAuroraEvidence(): EvidenceBundle {
  const demo = getNorthlightAuroraDemo();

  const tasks = demo.work.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    priority: item.priority,
    assigneeIds: item.assigneeId ? [item.assigneeId] : [],
    updatedAt: item.staleDays
      ? new Date(Date.parse(DEMO_NOW) - item.staleDays * 86400000).toISOString()
      : item.completedSinceVisit
        ? "2026-08-01T18:00:00.000Z"
        : "2026-08-02T10:00:00.000Z",
    createdAt: "2026-07-20T10:00:00.000Z",
  }));

  const dependencies = demo.work.flatMap((item) =>
    item.dependsOn.map((dependsOnTaskId) => ({
      taskId: item.id,
      dependsOnTaskId,
      createdAt: "2026-07-25T10:00:00.000Z",
    })),
  );

  const members = demo.members.map((member) => ({
    id: member.id,
    name: member.name,
    functionalRole: member.functionalRole,
  }));

  const availability = demo.members
    .filter((member) => !member.availableThisWeek)
    .map((member) => ({
      memberId: member.id,
      startsAt: "2026-08-01T00:00:00.000Z",
      endsAt: "2026-08-08T00:00:00.000Z",
      kind: "unavailable" as const,
    }));

  const pullRequests: NormalizedPullRequest[] = [
    {
      id: "pr_42",
      number: 42,
      title: "Input remapping pull request",
      state: "open",
      merged: false,
      htmlUrl: "", // not a real URL — engine must leave sourceUrl null
      authorLogin: "alex-demo",
      updatedAt: "2026-08-01T11:00:00.000Z",
      mergedAt: null,
    },
  ];

  const checkRuns: NormalizedCheckRun[] = [
    {
      id: "check_ci_lint",
      name: "lint suite on remapping branch",
      status: "completed",
      conclusion: "failure",
      htmlUrl: null,
      completedAt: "2026-08-03T08:30:00.000Z",
      pullRequestId: "pr_42",
      headSha: "demo-sha-remapping",
    },
  ];

  return buildEvidenceBundle({
    projectId: "demo_aurora",
    repositoryId: "demo_repo_aurora",
    lastVisitAt: demo.lastVisitAt,
    tasks,
    dependencies,
    pullRequests,
    checkRuns,
    members,
    availability,
    config: {
      now: DEMO_NOW,
      demo: true,
      staleDaysThreshold: 5,
    },
  });
}
