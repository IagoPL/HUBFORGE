import { latestChecksByNameSha } from "@/features/github/check-run-normalize";
import { validatedSourceUrl } from "@/lib/signals/urls";
import type {
  EvidenceBundle,
  NormalizedTask,
  OperationalSignal,
  WorkPriority,
} from "@/lib/signals/types";

function daysBetween(laterIso: string, earlierIso: string): number {
  const ms = Date.parse(laterIso) - Date.parse(earlierIso);
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function taskById(bundle: EvidenceBundle) {
  return new Map(bundle.tasks.map((task) => [task.id, task]));
}

function blockersOf(bundle: EvidenceBundle) {
  /** blockerId → tasks waiting on it */
  const map = new Map<string, string[]>();
  for (const edge of bundle.dependencies) {
    const list = map.get(edge.dependsOnTaskId) ?? [];
    list.push(edge.taskId);
    map.set(edge.dependsOnTaskId, list);
  }
  return map;
}

function memberUnavailable(bundle: EvidenceBundle, memberId: string): boolean {
  const now = Date.parse(bundle.config.now);
  return bundle.availability.some(
    (entry) =>
      entry.memberId === memberId &&
      entry.kind === "unavailable" &&
      Date.parse(entry.startsAt) <= now &&
      Date.parse(entry.endsAt) > now,
  );
}

function priorityRank(priority: WorkPriority): number {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function severityForBlock(blockedCount: number, priority: WorkPriority) {
  if (blockedCount >= 3 || priority === "high") return "high" as const;
  if (blockedCount >= 1 || priority === "medium") return "medium" as const;
  return "low" as const;
}

function base(
  bundle: EvidenceBundle,
  partial: Omit<OperationalSignal, "projectId" | "repositoryId">,
): OperationalSignal {
  return {
    ...partial,
    projectId: bundle.projectId,
    repositoryId: bundle.repositoryId,
  };
}

/** Pure: EvidenceBundle → OperationalSignal[] (unsorted). */
export function generateSignals(bundle: EvidenceBundle): OperationalSignal[] {
  const signals: OperationalSignal[] = [];
  const tasks = taskById(bundle);
  const blockedBy = blockersOf(bundle);
  const source: OperationalSignal["source"] = bundle.config.demo ? "demo" : "hubforge";

  for (const task of bundle.tasks) {
    if (task.status === "done") continue;

    const waiting = blockedBy.get(task.id) ?? [];
    if (waiting.length > 0) {
      const maxPri = waiting.reduce((rank, id) => {
        const child = tasks.get(id);
        return Math.max(rank, child ? priorityRank(child.priority) : 0);
      }, priorityRank(task.priority));
      const age = daysBetween(
        bundle.config.now,
        task.updatedAt ?? task.createdAt ?? bundle.config.now,
      );
      signals.push(
        base(bundle, {
          id: `sig_block_${task.id}`,
          kind: "work_blocked",
          source: bundle.config.demo ? "demo" : "hubforge",
          evidenceType: "rule.dependency_unresolved",
          subjectId: task.id,
          subjectType: "task",
          headline: `${task.title} blocks ${waiting.length} work item${waiting.length === 1 ? "" : "s"}`,
          explanation: `Explicit unresolved dependency: ${waiting.length} item(s) wait on this work. Age ${age} day(s).`,
          occurredAt: task.updatedAt ?? task.createdAt ?? bundle.config.now,
          severity: severityForBlock(
            waiting.length,
            maxPri >= 3 ? "high" : maxPri >= 2 ? "medium" : "low",
          ),
          confidence: 1,
          classification: "fact",
          actorId: task.assigneeIds[0] ?? null,
          assigneeIds: task.assigneeIds,
          blockedCount: waiting.length,
          recommendedAction:
            task.assigneeIds.length === 0
              ? "Assign an owner and clear or re-scope the blocker."
              : "Confirm delivery or re-scope dependents waiting on this.",
          sourceUrl: null,
          metadata: { waitingIds: waiting, ageDays: age },
        }),
      );
    }

    if (task.priority === "high" && task.assigneeIds.length === 0) {
      signals.push(
        base(bundle, {
          id: `sig_unassigned_${task.id}`,
          kind: "unassigned_critical",
          source,
          evidenceType: "rule.unassigned_high_priority",
          subjectId: task.id,
          subjectType: "task",
          headline: `${task.title} has no owner yet`,
          explanation: "High-priority work with no assignee in HubForge.",
          occurredAt: task.updatedAt ?? task.createdAt ?? bundle.config.now,
          severity: "high",
          confidence: 1,
          classification: "fact",
          actorId: null,
          assigneeIds: [],
          blockedCount: waiting.length,
          recommendedAction: "Assign someone with matching capacity and functional role.",
          sourceUrl: null,
          metadata: { priority: task.priority },
        }),
      );
    }

    const lastActivity = task.updatedAt ?? task.createdAt;
    if (lastActivity) {
      const idle = daysBetween(bundle.config.now, lastActivity);
      if (idle >= bundle.config.staleDaysThreshold) {
        signals.push(
          base(bundle, {
            id: `sig_stale_${task.id}`,
            kind: "work_stale",
            source,
            evidenceType: "rule.work_stale_threshold",
            subjectId: task.id,
            subjectType: "task",
            headline: `${task.title} may be stalled`,
            explanation: `No status change for ${idle} day(s) (threshold ${bundle.config.staleDaysThreshold}). Lack of commits is not treated as proof of no work for creative roles.`,
            occurredAt: lastActivity,
            severity: waiting.length > 0 ? "medium" : "low",
            confidence: 0.55,
            classification: "inference",
            actorId: task.assigneeIds[0] ?? null,
            assigneeIds: task.assigneeIds,
            blockedCount: waiting.length,
            recommendedAction: "Ask for a status update before escalating.",
            sourceUrl: null,
            metadata: { idleDays: idle, threshold: bundle.config.staleDaysThreshold },
          }),
        );
      }
    }

    for (const assigneeId of task.assigneeIds) {
      if (!memberUnavailable(bundle, assigneeId)) continue;
      if (task.priority !== "high") continue;
      signals.push(
        base(bundle, {
          id: `sig_unavailable_${task.id}_${assigneeId}`,
          kind: "work_changed",
          source,
          evidenceType: "rule.assignee_unavailable",
          subjectId: task.id,
          subjectType: "task",
          headline: `${task.title}: owner unavailable this window`,
          explanation:
            "Inference from availability_entries: the assignee has an unavailable window covering now. Role fit is not assumed for reassignment.",
          occurredAt: bundle.config.now,
          severity: "medium",
          confidence: 0.7,
          classification: "inference",
          actorId: assigneeId,
          assigneeIds: task.assigneeIds,
          blockedCount: waiting.length,
          recommendedAction:
            "Consider people who are available and share a compatible functional role — do not auto-reassign.",
          sourceUrl: null,
          metadata: { unavailableMemberId: assigneeId },
        }),
      );
    }
  }

  // Critical work with nobody available (capacity inference)
  const availableMemberIds = new Set(
    bundle.members
      .filter((member) => !memberUnavailable(bundle, member.id))
      .map((member) => member.id),
  );
  for (const task of bundle.tasks) {
    if (task.status === "done" || task.priority !== "high") continue;
    if (task.assigneeIds.length > 0) continue;
    if (availableMemberIds.size === 0) {
      signals.push(
        base(bundle, {
          id: `sig_no_capacity_${task.id}`,
          kind: "unassigned_critical",
          source,
          evidenceType: "rule.critical_without_available_owner",
          subjectId: task.id,
          subjectType: "task",
          headline: `${task.title}: no available owner this week`,
          explanation:
            "High-priority unassigned work and no member currently marked available. Suggestion only — roles still matter.",
          occurredAt: task.updatedAt ?? bundle.config.now,
          severity: "high",
          confidence: 0.6,
          classification: "inference",
          actorId: null,
          assigneeIds: [],
          blockedCount: (blockedBy.get(task.id) ?? []).length,
          recommendedAction: "Review capacity windows or defer the milestone.",
          sourceUrl: null,
          metadata: {},
        }),
      );
    }
  }

  for (const pr of bundle.pullRequests) {
    if (pr.state === "open" && !pr.merged) {
      signals.push(
        base(bundle, {
          id: `sig_review_${pr.id}`,
          kind: "review_waiting",
          source: bundle.config.demo ? "demo" : "github",
          evidenceType: "rule.pull_request_awaiting_review",
          subjectId: pr.id,
          subjectType: "pull_request",
          headline: `Pull request waiting for review: ${pr.title}`,
          explanation: `Open pull request #${pr.number} is not merged.`,
          occurredAt: pr.updatedAt ?? bundle.config.now,
          severity: "high",
          confidence: 1,
          classification: "fact",
          actorId: null,
          assigneeIds: [],
          blockedCount: 0,
          recommendedAction: "Assign an available reviewer.",
          sourceUrl: validatedSourceUrl(pr.htmlUrl),
          metadata: { number: pr.number, authorLogin: pr.authorLogin },
        }),
      );
    }

    if (pr.merged) {
      const when = pr.mergedAt ?? pr.updatedAt ?? bundle.config.now;
      signals.push(
        base(bundle, {
          id: `sig_merged_${pr.id}`,
          kind: "pull_request_merged",
          source: bundle.config.demo ? "demo" : "github",
          evidenceType: "rule.pull_request_merged",
          subjectId: pr.id,
          subjectType: "pull_request",
          headline: `Pull request merged: ${pr.title}`,
          explanation: `GitHub pull request #${pr.number} is marked merged in synced data.`,
          occurredAt: when,
          severity: "low",
          confidence: 1,
          classification: "fact",
          actorId: null,
          assigneeIds: [],
          blockedCount: 0,
          recommendedAction: "Skim the merge, then focus on remaining blockers.",
          sourceUrl: validatedSourceUrl(pr.htmlUrl),
          metadata: { number: pr.number },
        }),
      );
    }
  }

  // Only the latest check per name+SHA counts — recovery clears prior failures.
  for (const check of latestChecksByNameSha(bundle.checkRuns)) {
    if (check.status !== "completed" || check.conclusion !== "failure") continue;
    signals.push(
      base(bundle, {
        id: `sig_ci_${check.id}`,
        kind: "ci_failed",
        source: bundle.config.demo ? "demo" : "github",
        evidenceType: "rule.check_run_failed",
        subjectId: check.id,
        subjectType: "check_run",
        headline: `CI failed: ${check.name}`,
        explanation:
          "Latest synced check run for this name and head SHA completed with conclusion failure. Cancelled, skipped, neutral, timed_out, and incomplete checks do not emit ci_failed.",
        occurredAt: check.completedAt ?? bundle.config.now,
        severity: "high",
        confidence: 1,
        classification: "fact",
        actorId: null,
        assigneeIds: [],
        blockedCount: 0,
        recommendedAction: "Open the failing check and fix the errors.",
        sourceUrl: validatedSourceUrl(check.htmlUrl),
        metadata: {
          pullRequestId: check.pullRequestId,
          headSha: check.headSha,
        },
      }),
    );
  }

  for (const task of bundle.tasks) {
    if (task.status !== "done") continue;
    signals.push(
      base(bundle, {
        id: `sig_done_${task.id}`,
        kind: "work_completed",
        source,
        evidenceType: "rule.work_completed",
        subjectId: task.id,
        subjectType: "task",
        headline: `${task.title} completed`,
        explanation: "Internal HubForge work item marked done (not a GitHub merge).",
        occurredAt: task.updatedAt ?? bundle.config.now,
        severity: "low",
        confidence: 1,
        classification: "fact",
        actorId: task.assigneeIds[0] ?? null,
        assigneeIds: task.assigneeIds,
        blockedCount: 0,
        recommendedAction:
          "Acknowledge progress; check dependents that may now be unblocked.",
        sourceUrl: null,
        metadata: {},
      }),
    );
  }

  // dependency_released: blocker became done while dependents still open
  for (const task of bundle.tasks) {
    if (task.status !== "done") continue;
    const waiting = blockedBy.get(task.id) ?? [];
    const openWaiting = waiting.filter((id) => {
      const child = tasks.get(id);
      return child && child.status !== "done";
    });
    if (openWaiting.length === 0) continue;
    // Only if release is recent relative to visit or always emit as fact of state
    signals.push(
      base(bundle, {
        id: `sig_released_${task.id}`,
        kind: "dependency_released",
        source,
        evidenceType: "rule.dependency_released",
        subjectId: task.id,
        subjectType: "dependency",
        headline: `${task.title} no longer blocks ${openWaiting.length} item(s)`,
        explanation: "Blocker completed; dependent work can proceed.",
        occurredAt: task.updatedAt ?? bundle.config.now,
        severity: "medium",
        confidence: 1,
        classification: "fact",
        actorId: task.assigneeIds[0] ?? null,
        assigneeIds: task.assigneeIds,
        blockedCount: openWaiting.length,
        recommendedAction: "Move dependents forward or assign owners.",
        sourceUrl: null,
        metadata: { releasedFor: openWaiting },
      }),
    );
  }

  // work_changed from events (skip completions already covered by work_completed)
  for (const event of bundle.events) {
    if (event.kind === "created" || event.kind === "dependency_added") continue;
    if (event.kind === "status_changed" && event.toValue === "done") continue;
    const task = tasks.get(event.taskId);
    if (!task || task.status === "done") continue;
    signals.push(
      base(bundle, {
        id: `sig_changed_${event.taskId}_${event.createdAt}`,
        kind: "work_changed",
        source,
        evidenceType: "rule.work_changed_since_visit",
        subjectId: event.taskId,
        subjectType: "task",
        headline: `${task.title} changed`,
        explanation: event.summary || event.kind,
        occurredAt: event.createdAt,
        severity: "low",
        confidence: 0.9,
        classification: "fact",
        actorId: event.actorId,
        assigneeIds: task.assigneeIds,
        blockedCount: (blockedBy.get(task.id) ?? []).length,
        recommendedAction: "Review the change in context of open blockers.",
        sourceUrl: null,
        metadata: { eventKind: event.kind },
      }),
    );
  }

  return dedupe(signals);
}

function dedupe(signals: OperationalSignal[]): OperationalSignal[] {
  const seen = new Set<string>();
  const out: OperationalSignal[] = [];
  for (const signal of signals) {
    if (seen.has(signal.id)) continue;
    seen.add(signal.id);
    out.push(signal);
  }
  return out;
}

export function openTasks(bundle: EvidenceBundle): NormalizedTask[] {
  return bundle.tasks.filter((task) => task.status !== "done");
}
