import type {
  EvidenceBundle,
  OperationalSignal,
  PrioritizedSignal,
  SignalSeverity,
  WorkPriority,
} from "@/lib/signals/types";

/**
 * Deterministic priority score (higher first).
 *
 * score =
 *   severityWeight(severity) * 1000
 * + blockedCount * 120
 * + subjectPriorityWeight * 80
 * + ageDays * 15
 * + (no assignee on blocking/critical kinds ? 100 : 0)
 * + (kind === ci_failed ? 200 : 0)
 * + (kind === review_waiting ? 150 : 0)
 * + (assignee currently unavailable ? 60 : 0)
 *
 * Tie-break: score DESC, occurredAt DESC, id ASC.
 */
export const PRIORITY_FORMULA = {
  severityHigh: 3,
  severityMedium: 2,
  severityLow: 1,
  blockedCountWeight: 120,
  subjectPriorityWeight: 80,
  ageDayWeight: 15,
  unassignedBonus: 100,
  ciFailedBonus: 200,
  reviewWaitingBonus: 150,
  assigneeUnavailableBonus: 60,
  severityMultiplier: 1000,
} as const;

function severityWeight(severity: SignalSeverity): number {
  if (severity === "high") return PRIORITY_FORMULA.severityHigh;
  if (severity === "medium") return PRIORITY_FORMULA.severityMedium;
  return PRIORITY_FORMULA.severityLow;
}

function subjectPriorityWeight(metadata: Record<string, unknown>): number {
  const priority = metadata.subjectPriority;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 2;
}

function ageDays(occurredAt: string, now: string): number {
  const ms = Date.parse(now) - Date.parse(occurredAt);
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
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

export function scoreSignal(
  signal: OperationalSignal,
  bundle: EvidenceBundle,
): { score: number; reason: string } {
  const age = ageDays(signal.occurredAt, bundle.config.now);
  const sev = severityWeight(signal.severity);
  const subjectPri = subjectPriorityWeight(signal.metadata);
  const unassigned =
    signal.assigneeIds.length === 0 &&
    (signal.kind === "work_blocked" ||
      signal.kind === "unassigned_critical" ||
      signal.kind === "review_waiting");
  const unavailable = signal.assigneeIds.some((id) => memberUnavailable(bundle, id));

  let score =
    sev * PRIORITY_FORMULA.severityMultiplier +
    signal.blockedCount * PRIORITY_FORMULA.blockedCountWeight +
    subjectPri * PRIORITY_FORMULA.subjectPriorityWeight +
    age * PRIORITY_FORMULA.ageDayWeight;

  const parts: string[] = [];
  parts.push(`severity ${signal.severity}`);
  if (signal.blockedCount > 0) {
    parts.push(`blocks ${signal.blockedCount}`);
  }
  if (age > 0) parts.push(`${age} day(s) old`);
  if (unassigned) {
    score += PRIORITY_FORMULA.unassignedBonus;
    parts.push("no owner");
  }
  if (signal.kind === "ci_failed") {
    score += PRIORITY_FORMULA.ciFailedBonus;
    parts.push("CI failed");
  }
  if (signal.kind === "review_waiting") {
    score += PRIORITY_FORMULA.reviewWaitingBonus;
    parts.push("awaiting review");
  }
  if (unavailable) {
    score += PRIORITY_FORMULA.assigneeUnavailableBonus;
    parts.push("owner unavailable");
  }

  const reason = `Appears first because ${parts.join(", ")}.`;
  return { score, reason };
}

export function prioritizeSignals(
  signals: OperationalSignal[],
  bundle: EvidenceBundle,
): PrioritizedSignal[] {
  const enriched = signals.map((signal) => {
    const taskPriority = bundle.tasks.find((task) => task.id === signal.subjectId)
      ?.priority as WorkPriority | undefined;
    const withMeta: OperationalSignal = {
      ...signal,
      metadata: {
        ...signal.metadata,
        subjectPriority: taskPriority ?? signal.metadata.subjectPriority ?? "medium",
      },
    };
    const { score, reason } = scoreSignal(withMeta, bundle);
    return {
      ...withMeta,
      priorityScore: score,
      priorityReason: reason,
    } satisfies PrioritizedSignal;
  });

  return enriched.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    const byTime = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });
}
