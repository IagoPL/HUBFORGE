"use client";

import type { DemoDependencyEdge } from "@/features/demo/types";

export type DependencyImpactLabels = {
  title: string;
  empty: string;
  blocked: string;
  blocker: string;
  affected: string;
  owner: string;
  age: string;
  evidence: string;
  days: string;
};

export function DependencyImpactList({
  edges,
  labels,
}: {
  edges: DemoDependencyEdge[];
  labels: DependencyImpactLabels;
}) {
  if (edges.length === 0) {
    return <p className="t-body text-[var(--hf-ink-muted)]">{labels.empty}</p>;
  }

  return (
    <ul className="grid gap-3">
      {edges.map((edge) => (
        <li key={edge.id} className="panel grid gap-2 p-4">
          <p className="t-display-sm text-[var(--hf-ink)]">
            <span className="text-[var(--hf-ink-faint)]">{labels.blocked}: </span>
            {edge.blockedTitle}
          </p>
          <p className="t-body text-[var(--hf-ink)]">
            <span className="text-[var(--hf-ink-faint)]">{labels.blocker}: </span>
            {edge.blockerTitle}
          </p>
          <p className="t-body-sm text-[var(--hf-caution)]">
            {labels.affected}: {edge.affectedCount}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 t-mono-sm text-[var(--hf-ink-faint)]">
            <span>
              {labels.owner}: {edge.assigneeLabel}
            </span>
            <span>{edge.status}</span>
            <span data-tabular>
              {labels.age}: {edge.blockedForDays} {labels.days}
            </span>
          </div>
          <p className="t-body-sm text-[var(--hf-ink-muted)]">
            <span className="font-medium text-[var(--hf-ink)]">{labels.evidence}: </span>
            {edge.evidence}
          </p>
        </li>
      ))}
    </ul>
  );
}
