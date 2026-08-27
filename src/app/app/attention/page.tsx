import { AttentionQueue } from "@/components/operations/attention-queue";
import { getProjectLastVisitAction } from "@/features/collaboration/actions";
import { loadProjectEvidence } from "@/features/signals/load-project-evidence";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { runSignalEngine } from "@/lib/signals";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Attention",
};

export default async function AttentionPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const state = await getWorkspaceSnapshot();
  const project =
    state.projects.find((item) => item.id === state.activeProjectId) ??
    state.projects[0] ??
    null;
  const organization =
    state.organizations.find((item) => item.id === state.activeOrganizationId) ??
    state.organizations[0] ??
    null;

  const labels = {
    title: t.attention.title,
    empty: t.attention.empty,
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

  if (!project || !organization) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-ink-muted)]">{t.projects.emptyHint}</p>
      </div>
    );
  }

  const visitResult = await getProjectLastVisitAction(project.id);
  const lastVisitAt = visitResult.ok ? visitResult.data : null;
  const evidenceResult = await loadProjectEvidence({
    projectId: project.id,
    organizationId: organization.id,
    lastVisitAt,
  });

  if (!evidenceResult.ok) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-error)]">{evidenceResult.error}</p>
      </div>
    );
  }

  const { persistentAttention } = runSignalEngine(evidenceResult.data);

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <AttentionQueue signals={persistentAttention} labels={labels} />
    </div>
  );
}
