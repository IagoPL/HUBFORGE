import { AttentionQueue } from "@/components/operations/attention-queue";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoBriefingPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const workspace = getNorthlightAuroraDemo();

  return (
    <div className="grid gap-6 px-4 py-5 sm:px-6">
      <section className="panel grid gap-3 p-4">
        <p className="t-label text-[var(--hf-ink-faint)]">{t.operations.briefing}</p>
        <p className="t-body text-[var(--hf-ink)]">
          {t.operations.sinceLastVisit.replace(
            "{facts}",
            workspace.briefingFacts.join(t.operations.factJoin),
          )}
        </p>
        <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
          {workspace.lastVisitAt}
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="t-display-sm text-[var(--hf-ink)]">{t.attention.title}</h2>
        <AttentionQueue
          demo
          signals={workspace.signals}
          labels={{
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
          }}
        />
      </section>
    </div>
  );
}
