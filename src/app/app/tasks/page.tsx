import { Suspense } from "react";
import { WorkSurface } from "@/features/collaboration/work-surface";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    // `useSearchParams` drives selection, so the surface needs a boundary.
    <Suspense fallback={null}>
      <WorkSurface
        locale={locale}
        labels={t.work}
        operationsLabels={t.operations}
        formLabels={{
          subtitle: t.tasks.subtitle,
          create: t.tasks.create,
          taskTitle: t.tasks.taskTitle,
          description: t.tasks.description,
          priority: t.tasks.priority,
          assignee: t.tasks.assignee,
          emptyProject: t.tasks.emptyProject,
          unassigned: t.tasks.unassigned,
        }}
      />
    </Suspense>
  );
}
