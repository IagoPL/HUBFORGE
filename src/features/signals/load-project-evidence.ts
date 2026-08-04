"use server";

import { listAvailabilityAction } from "@/features/availability/actions";
import {
  listMembersAction,
  listOperationsTasksAction,
  listTaskEventsSinceAction,
} from "@/features/collaboration/actions";
import {
  listLinkedRepositoryAction,
  listSyncedCommitsAction,
  listSyncedIssuesAction,
  listSyncedPullRequestsAction,
} from "@/features/github/actions";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildEvidenceBundle } from "@/lib/signals/build-bundle";
import type { EvidenceBundle, NormalizedCheckRun } from "@/lib/signals/types";

export type LoadEvidenceResult =
  { ok: true; data: EvidenceBundle; warnings: string[] } | { ok: false; error: string };

/**
 * Infrastructure adapter: loads typed evidence for the pure signal engine.
 * Never invents CI rows — empty checkRuns until synced evidence exists.
 */
export async function loadProjectEvidence(input: {
  projectId: string;
  organizationId: string;
  lastVisitAt: string | null;
  now?: string;
}): Promise<LoadEvidenceResult> {
  const warnings: string[] = [];

  const nowIso = input.now ?? new Date().toISOString();
  const eventsSince =
    input.lastVisitAt ??
    new Date(Date.parse(nowIso) - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    ops,
    members,
    availability,
    repo,
    issues,
    pullRequests,
    commits,
    checkRuns,
    events,
  ] = await Promise.all([
    listOperationsTasksAction(input.projectId),
    listMembersAction(input.organizationId),
    listAvailabilityAction(input.organizationId),
    listLinkedRepositoryAction(input.projectId),
    listSyncedIssuesAction(input.projectId),
    listSyncedPullRequestsAction(input.projectId),
    listSyncedCommitsAction(input.projectId),
    listSyncedCheckRunsAction(input.projectId),
    listTaskEventsSinceAction(input.projectId, eventsSince),
  ]);

  if (!ops.ok) return { ok: false, error: ops.error };
  if (!members.ok) {
    warnings.push(members.error);
  }
  if (!availability.ok) {
    warnings.push(availability.error);
  }
  if (!repo.ok) {
    warnings.push(repo.error);
  }
  if (!issues.ok) {
    warnings.push(issues.error);
  }
  if (!pullRequests.ok) {
    warnings.push(pullRequests.error);
  }
  if (!commits.ok) {
    warnings.push(commits.error);
  }
  if (!checkRuns.ok) {
    warnings.push(checkRuns.error);
  }
  if (!events.ok) {
    warnings.push(events.error);
  }

  const tasks = ops.data.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assigneeIds: task.assigneeIds,
    updatedAt: task.updatedAt,
    createdAt: null as string | null,
  }));

  const dependencies = ops.data.flatMap((task) =>
    task.dependsOn.map((dependsOnTaskId) => ({
      taskId: task.id,
      dependsOnTaskId,
      createdAt: null as string | null,
    })),
  );

  const bundle = buildEvidenceBundle({
    projectId: input.projectId,
    repositoryId: repo.ok ? (repo.data?.id ?? null) : null,
    lastVisitAt: input.lastVisitAt,
    tasks,
    dependencies,
    events: events.ok
      ? events.data.map((event) => ({
          taskId: event.taskId,
          kind: event.kind,
          summary: event.summary,
          fromValue: event.fromValue,
          toValue: event.toValue,
          createdAt: event.createdAt,
          actorId: event.actorId,
        }))
      : [],
    pullRequests: pullRequests.ok
      ? pullRequests.data.map((pr) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state,
          merged: pr.merged,
          htmlUrl: pr.htmlUrl,
          authorLogin: pr.authorLogin,
          updatedAt: pr.updatedAt ?? null,
          mergedAt: pr.merged ? (pr.updatedAt ?? null) : null,
        }))
      : [],
    issues: issues.ok
      ? issues.data.map((issue) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          htmlUrl: issue.htmlUrl,
          taskId: null,
          updatedAt: null,
        }))
      : [],
    commits: commits.ok
      ? commits.data.map((commit) => ({
          id: commit.id,
          sha: commit.sha,
          message: commit.message,
          htmlUrl: commit.htmlUrl,
          committedAt: commit.committedAt,
        }))
      : [],
    checkRuns: checkRuns.ok ? checkRuns.data : [],
    members: members.ok
      ? members.data.map((member) => ({
          id: member.id,
          name: member.name,
          functionalRole: member.functionalRole,
        }))
      : [],
    availability: availability.ok
      ? availability.data.map((entry) => ({
          memberId: entry.memberId,
          startsAt: entry.startsAt,
          endsAt: entry.endsAt,
          kind: entry.kind,
        }))
      : [],
    config: {
      now: nowIso,
      demo: false,
    },
  });

  if (!repo.ok || !repo.data) {
    warnings.push("No repository linked — GitHub facts limited to HubForge work.");
  }
  if (checkRuns.ok && checkRuns.data.length === 0) {
    warnings.push("No synced check runs — CI failure signals will not appear.");
  }

  return { ok: true, data: bundle, warnings };
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Reads github_synced_check_runs when the additive migration is applied.
 * Returns empty list (not an error) if the table is missing.
 */
export async function listSyncedCheckRunsAction(
  projectId: string,
): Promise<ActionResult<NormalizedCheckRun[]>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("github_synced_check_runs")
    .select(
      "id, name, status, conclusion, html_url, completed_at, pull_request_id, head_sha",
    )
    .eq("project_id", projectId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(40);

  if (error) {
    // Table may not exist yet before migration apply — honest empty.
    if (/does not exist|Could not find the table/i.test(error.message)) {
      return { ok: true, data: [] };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status as NormalizedCheckRun["status"],
      conclusion: row.conclusion as NormalizedCheckRun["conclusion"],
      htmlUrl: row.html_url,
      completedAt: row.completed_at,
      pullRequestId: row.pull_request_id,
      headSha: row.head_sha,
    })),
  };
}
