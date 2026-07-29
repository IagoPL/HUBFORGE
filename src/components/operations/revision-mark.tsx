import { CircleDot, CircleSlash, PencilLine } from "lucide-react";
import type { AttentionSignal, RevisionKind } from "@/data/demo-operations";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";
import type { OperationsLabels } from "./labels";

/**
 * States why a record is worth looking at. Never rendered to suggest activity:
 * a revision needs a recorded change, and priority is a standing fact.
 *
 * Revision, caution and error are separated by icon and word as well as colour,
 * so the distinction survives greyscale and colour-vision differences.
 */
const REVISIONS = {
  new: { icon: CircleDot, tone: "text-[var(--hf-revision)]" },
  changed: { icon: PencilLine, tone: "text-[var(--hf-revision)]" },
  blocked: { icon: CircleSlash, tone: "text-[var(--hf-caution)]" },
} as const satisfies Record<RevisionKind, unknown>;

const PRIORITY_TONE = {
  high: "text-[var(--hf-caution)]",
  medium: "text-[var(--hf-ink-muted)]",
  low: "text-[var(--hf-ink-faint)]",
} as const;

export function revisionWord(kind: RevisionKind, labels: OperationsLabels) {
  if (kind === "new") return labels.revisionNew;
  if (kind === "blocked") return labels.revisionBlocked;
  return labels.revisionChanged;
}

export function RevisionMark({
  signal,
  now,
  locale,
  labels,
  note,
  className,
}: {
  signal: AttentionSignal;
  now: string;
  locale: Locale;
  labels: OperationsLabels;
  note?: string;
  className?: string;
}) {
  if (signal.kind === "priority") {
    const word =
      signal.priority === "high"
        ? labels.priorityHigh
        : signal.priority === "medium"
          ? labels.priorityMedium
          : labels.priorityLow;

    return (
      <span
        className={cn(
          "t-mono-sm inline-flex items-center gap-1.5",
          PRIORITY_TONE[signal.priority],
          className,
        )}
      >
        <CircleDot className="size-3 shrink-0" aria-hidden />
        <span className="font-medium">{word}</span>
      </span>
    );
  }

  const { icon: Icon, tone } = REVISIONS[signal.revision];

  return (
    <span className={cn("t-mono-sm inline-flex items-center gap-1.5", tone, className)}>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="font-medium">{revisionWord(signal.revision, labels)}</span>
      <span className="text-[var(--hf-ink-faint)]" aria-hidden>
        ·
      </span>
      <RelativeTime
        at={signal.at}
        now={now}
        locale={locale}
        justNowLabel={labels.justNow}
        className="text-[var(--hf-ink-muted)]"
      />
      {note ? <span className="sr-only">{note}</span> : null}
    </span>
  );
}
