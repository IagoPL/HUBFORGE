import { generateSignals } from "@/lib/signals/generate";
import { prioritizeSignals } from "@/lib/signals/prioritize";
import type {
  BriefingPartition,
  EvidenceBundle,
  PrioritizedSignal,
  SignalKind,
} from "@/lib/signals/types";

const ATTENTION_KINDS: ReadonlySet<SignalKind> = new Set([
  "work_blocked",
  "review_waiting",
  "ci_failed",
  "work_stale",
  "unassigned_critical",
]);

const CAPACITY_INFERENCE_RULES = new Set([
  "rule.assignee_unavailable",
  "rule.critical_without_available_owner",
]);

/** Progress / change kinds for the visit-scoped briefing. */
const BRIEFING_KINDS: ReadonlySet<SignalKind> = new Set([
  "work_completed",
  "pull_request_merged",
  "dependency_released",
  "work_changed",
  "work_blocked",
  "review_waiting",
  "ci_failed",
  "unassigned_critical",
  "work_stale",
]);

function occurredAfter(iso: string, since: string): boolean {
  return Date.parse(iso) > Date.parse(since);
}

function isPersistentAttention(signal: PrioritizedSignal): boolean {
  if (ATTENTION_KINDS.has(signal.kind)) return true;
  return CAPACITY_INFERENCE_RULES.has(signal.evidenceType);
}

/**
 * Run the full pure pipeline: generate → prioritize → partition.
 * Briefing = signals after lastVisitAt (or empty first-visit set of "what exists now" summaries).
 * Attention = persistent open problems (may predate the visit).
 */
export function runSignalEngine(bundle: EvidenceBundle): BriefingPartition {
  const generated = generateSignals(bundle);
  const ranked = prioritizeSignals(generated, bundle);
  const firstVisit = bundle.lastVisitAt == null;

  const persistentAttention = ranked.filter(isPersistentAttention);

  let sinceLastVisit: PrioritizedSignal[];
  if (firstVisit) {
    // First visit: do not pretend old items "just happened". Show empty since-visit;
    // Attention still carries open problems.
    sinceLastVisit = [];
  } else {
    const since = bundle.lastVisitAt!;
    sinceLastVisit = ranked.filter(
      (signal) =>
        BRIEFING_KINDS.has(signal.kind) && occurredAfter(signal.occurredAt, since),
    );
  }

  return {
    sinceLastVisit,
    persistentAttention,
    firstVisit,
    lastVisitAt: bundle.lastVisitAt,
  };
}

export function briefingFactCounts(signals: PrioritizedSignal[]) {
  return {
    completed: signals.filter((s) => s.kind === "work_completed").length,
    merged: signals.filter((s) => s.kind === "pull_request_merged").length,
    blocked: signals.filter((s) => s.kind === "work_blocked").length,
    needsReview: signals.filter((s) => s.kind === "review_waiting").length,
  };
}
