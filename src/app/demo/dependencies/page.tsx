import { DependencyImpactList } from "@/components/operations/dependency-impact";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoDependenciesPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const workspace = getNorthlightAuroraDemo();

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <DependencyImpactList
        edges={workspace.dependencies}
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
