"use client";

import { Badge } from "@/components/ui/badge";
import type { DemoSignal } from "@/features/demo/types";
import { cn } from "@/lib/utils";

export type AttentionQueueLabels = {
  title: string;
  empty: string;
  fact: string;
  inference: string;
  evidence: string;
  why: string;
  action: string;
  origin: string;
  simulatedOrigin: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
};

export function AttentionQueue({
  signals,
  labels,
  demo = false,
}: {
  signals: DemoSignal[];
  labels: AttentionQueueLabels;
  demo?: boolean;
}) {
  if (signals.length === 0) {
    return <p className="t-body text-[var(--hf-ink-muted)]">{labels.empty}</p>;
  }

  return (
    <ul className="grid gap-3">
      {signals.map((signal) => (
        <li
          key={signal.id}
          className="panel grid gap-3 p-4"
          data-severity={signal.severity}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={signal.severity === "high" ? "warning" : "neutral"}>
              {signal.severity === "high"
                ? labels.severityHigh
                : signal.severity === "medium"
                  ? labels.severityMedium
                  : labels.severityLow}
            </Badge>
            <Badge tone={signal.kind === "fact" ? "success" : "neutral"}>
              {signal.kind === "fact" ? labels.fact : labels.inference}
            </Badge>
            <span className="t-mono-sm text-[var(--hf-ink-faint)]">{signal.type}</span>
          </div>

          <div className="grid gap-1">
            <h3 className="t-display-sm text-[var(--hf-ink)]">{signal.title}</h3>
            <p className="t-body-sm text-[var(--hf-ink-muted)]">
              <span className="font-medium text-[var(--hf-ink)]">
                {labels.evidence}:{" "}
              </span>
              {signal.evidence}
            </p>
            <p className="t-body-sm text-[var(--hf-ink-muted)]">
              <span className="font-medium text-[var(--hf-ink)]">{labels.why}: </span>
              {signal.whyItMatters}
            </p>
            <p className="t-body-sm text-[var(--hf-ink)]">
              <span className="font-medium">{labels.action}: </span>
              {signal.recommendedAction}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 t-mono-sm text-[var(--hf-ink-faint)]">
            <span data-tabular>
              {new Date(signal.occurredAt).toISOString().slice(0, 10)}
            </span>
            <span>{signal.assigneeLabel}</span>
            <span
              className={cn(
                demo &&
                  "rounded-[var(--radius-sm)] bg-[var(--hf-caution-quiet)] px-1.5 py-0.5 text-[var(--hf-caution)]",
              )}
              title={demo ? labels.simulatedOrigin : undefined}
            >
              {labels.origin}: {signal.originRef}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
