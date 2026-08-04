import { AttentionQueue } from "@/components/operations/attention-queue";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoAttentionPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const workspace = getNorthlightAuroraDemo();

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
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
    </div>
  );
}
