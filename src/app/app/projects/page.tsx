import { Badge } from "@/components/ui/badge";
import { getDemoWorkspace } from "@/data/demo-workspace";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  const { organization, project } = getDemoWorkspace();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Projects
        </h1>
        <p className="text-[var(--hf-fg-muted)]">
          Projects belong to an organization and carry their own members, roles, and
          boards.
        </p>
      </header>
      <article className="max-w-2xl rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            {project.name}
          </h2>
          <Badge tone="success">{project.status}</Badge>
        </div>
        <p className="text-sm text-[var(--hf-fg-muted)]">{project.description}</p>
        <p className="mt-4 text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
          Organization · {organization.name}
        </p>
      </article>
    </div>
  );
}
