import type { Dictionary } from "@/i18n/dictionaries/en";
import type { TaskStatus } from "@/lib/domain/types";
import { fill } from "@/lib/utils";

/** Every word the operations surfaces render comes from here. */
export type OperationsLabels = Dictionary["operations"];
export type WorkLabels = Dictionary["work"];

const STATUS_KEYS: Record<TaskStatus, keyof OperationsLabels> = {
  backlog: "statusBacklog",
  ready: "statusReady",
  in_progress: "statusInProgress",
  review: "statusReview",
  done: "statusDone",
};

export function statusLabel(status: TaskStatus, labels: OperationsLabels) {
  return labels[STATUS_KEYS[status]];
}

/** Picks the singular or plural form and substitutes the count. */
export function plural(
  n: number,
  one: string,
  other: string,
  values: Record<string, string | number> = {},
) {
  return fill(n === 1 ? one : other, { n, ...values });
}

/** The briefing sentence for a workspace that records what changed. */
export function changeSummary(
  counts: { merged: number; blocked: number; needsReview: number },
  labels: OperationsLabels,
) {
  const facts = [
    counts.merged > 0 &&
      plural(counts.merged, labels.factMergedOne, labels.factMergedOther),
    counts.blocked > 0 &&
      plural(counts.blocked, labels.factBlockedOne, labels.factBlockedOther),
    counts.needsReview > 0 &&
      plural(counts.needsReview, labels.factReviewOne, labels.factReviewOther),
  ].filter((fact): fact is string => typeof fact === "string");

  if (facts.length === 0) return labels.nothingChanged;

  const joined =
    facts.length === 1
      ? facts.join("")
      : `${facts.slice(0, -1).join(", ")}${labels.factJoin}${facts.slice(-1).join("")}`;

  return fill(labels.sinceLastVisit, { facts: joined });
}

/** The briefing sentence when only the present state is known. */
export function openWorkSummary(open: number, total: number, labels: OperationsLabels) {
  if (open === 0) return labels.noOpenWork;
  return plural(open, labels.openWorkOne, labels.openWorkOther, { total });
}
