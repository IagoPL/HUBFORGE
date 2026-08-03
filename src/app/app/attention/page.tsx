import { AttentionQueue } from "@/components/operations/attention-queue";
import { listOperationsTasksAction } from "@/features/collaboration/actions";
import { attentionSignalsFromTasks } from "@/features/operations/live-adapters";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
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

  if (!project) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-ink-muted)]">{t.projects.emptyHint}</p>
      </div>
    );
  }

  const opsResult = await listOperationsTasksAction(project.id);
  const tasks = opsResult.ok ? opsResult.data : [];
  const signals = attentionSignalsFromTasks(tasks, {
    unassigned: t.tasks.unassigned,
    origin: "HubForge",
  });

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <AttentionQueue signals={signals} labels={labels} />
    </div>
  );
}
