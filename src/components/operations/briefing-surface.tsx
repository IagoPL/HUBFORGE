"use client";

import {
  AttentionQueue,
  type AttentionQueueLabels,
} from "@/components/operations/attention-queue";
import type { PrioritizedSignal } from "@/lib/signals/types";

/**
 * Briefing surface: visit-scoped signals only. Persistent problems live on /attention.
 */
export function BriefingSurface({
  summary,
  sinceLastVisit,
  firstVisitHint,
  labels,
  attentionLabels,
  demo = false,
}: {
  summary: string;
  sinceLastVisit: PrioritizedSignal[];
  firstVisitHint?: string;
  labels: { briefing: string };
  attentionLabels: AttentionQueueLabels;
  demo?: boolean;
}) {
  return (
    <div className="grid gap-6 px-4 py-5 sm:px-6">
      <section className="panel grid gap-3 p-4">
        <p className="t-label text-[var(--hf-ink-faint)]">{labels.briefing}</p>
        <p className="t-body text-[var(--hf-ink)]">{summary}</p>
        {firstVisitHint ? (
          <p className="t-body-sm text-[var(--hf-ink-muted)]">{firstVisitHint}</p>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h2 className="t-display-sm text-[var(--hf-ink)]">{attentionLabels.title}</h2>
        <AttentionQueue signals={sinceLastVisit} labels={attentionLabels} demo={demo} />
      </section>
    </div>
  );
}
