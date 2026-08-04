import { BriefingSurface } from "@/components/operations/briefing-surface";
import { changeSummary } from "@/components/operations/labels";
import { northlightAuroraEvidence } from "@/features/signals/demo-evidence";
import { briefingFactCounts, runSignalEngine } from "@/lib/signals";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoBriefingPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const bundle = northlightAuroraEvidence();
  const partition = runSignalEngine(bundle);
  const counts = briefingFactCounts(partition.sinceLastVisit);
  const summary = changeSummary(
    {
      completed: counts.completed,
      blocked: counts.blocked,
      needsReview: counts.needsReview,
    },
    t.operations,
  );

  const attentionLabels = {
    title: t.attention.title,
    empty: t.demo.emptyAttention,
    fact: t.attention.fact,
    inference: t.attention.inference,
    evidence: t.attention.evidence,
    why: t.attention.why,
    action: t.attention.action,
    origin: t.attention.origin,
    simulatedOrigin: t.attention.simulatedOrigin,
    severityHigh: t.attention.severityHigh,
    severityMedium: t.attention.severityMedium,
    severityLow: t.attention.severityLow,
  };

  return (
    <BriefingSurface
      demo
      summary={summary}
      sinceLastVisit={partition.sinceLastVisit}
      labels={{ briefing: t.operations.briefing }}
      attentionLabels={attentionLabels}
    />
  );
}
