import { DependencyImpactList } from "@/components/operations/dependency-impact";
import { getProjectLastVisitAction } from "@/features/collaboration/actions";
import { loadProjectEvidence } from "@/features/signals/load-project-evidence";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { dependencyImpactFromBundle } from "@/lib/signals";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Dependencies",
};

export default async function DependenciesPage() {
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
    title: t.dependencies.title,
    empty: t.dependencies.empty,
    blocked: t.dependencies.blocked,
    blocker: t.dependencies.blocker,
    affected: t.dependencies.affected,
    owner: t.dependencies.owner,
    age: t.dependencies.age,
    evidence: t.dependencies.evidence,
    days: t.dependencies.days,
  };

  if (!project || !organization) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-ink-muted)]">{t.projects.emptyHint}</p>
      </div>
    );
  }

  const visitResult = await getProjectLastVisitAction(project.id);
  const evidenceResult = await loadProjectEvidence({
    projectId: project.id,
    organizationId: organization.id,
    lastVisitAt: visitResult.ok ? visitResult.data : null,
  });

  if (!evidenceResult.ok) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-error)]">{evidenceResult.error}</p>
      </div>
    );
  }

  const edges = dependencyImpactFromBundle(evidenceResult.data);

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <DependencyImpactList edges={edges} labels={labels} />
    </div>
  );
}
