import { DependencyImpactList } from "@/components/operations/dependency-impact";
import { northlightAuroraEvidence } from "@/features/signals/demo-evidence";
import { dependencyImpactFromBundle } from "@/lib/signals";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoDependenciesPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const edges = dependencyImpactFromBundle(northlightAuroraEvidence());

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <DependencyImpactList
        edges={edges}
        labels={{
          title: t.dependencies.title,
          empty: t.demo.emptyDependencies,
          blocked: t.dependencies.blocked,
          blocker: t.dependencies.blocker,
          affected: t.dependencies.affected,
          owner: t.dependencies.owner,
          age: t.dependencies.age,
          evidence: t.dependencies.evidence,
          days: t.dependencies.days,
        }}
      />
    </div>
  );
}
