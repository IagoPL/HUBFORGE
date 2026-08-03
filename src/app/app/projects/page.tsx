import { ProjectsPanel } from "@/features/projects/projects-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <ProjectsPanel
      labels={{
        title: t.projects.title,
        subtitle: t.projects.subtitle,
        organization: t.projects.organization,
        create: t.projects.create,
        name: t.projects.name,
        description: t.projects.description,
        emptyHint: t.projects.emptyHint,
        limitReached: t.projects.limitReached,
        archive: t.projects.archive,
        unarchive: t.projects.unarchive,
        delete: t.projects.delete,
        confirmDelete: t.projects.confirmDelete,
        confirmDeleteAction: t.projects.confirmDeleteAction,
        cancel: t.projects.cancel,
        statusActive: t.projects.statusActive,
        statusPaused: t.projects.statusPaused,
        statusArchived: t.projects.statusArchived,
        packaging: t.packaging,
      }}
    />
  );
}
