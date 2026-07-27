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
      }}
    />
  );
}
