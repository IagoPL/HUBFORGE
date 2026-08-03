"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { UsagePanel } from "@/features/packaging/usage-panel";
import { usePackagingUsage } from "@/features/packaging/use-packaging-usage";
import { atProjectLimit } from "@/lib/packaging/limits";
import { cn } from "@/lib/utils";

export function ProjectsPanel({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    organization: string;
    create: string;
    name: string;
    description: string;
    emptyHint: string;
    limitReached: string;
    packaging: {
      title: string;
      plan: string;
      organizations: string;
      projects: string;
      members: string;
      ofLimit: string;
    };
  };
}) {
  const {
    activeOrganization,
    organizationProjects,
    activeProject,
    addProject,
    setActiveProject,
    pending,
    error,
  } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const usage = usePackagingUsage(activeOrganization?.id, organizationProjects.length);
  const limited = usage ? atProjectLimit(usage) : false;

  return (
    <div className="grid gap-5 px-4 py-5 sm:px-6">
      <p className="lead">{labels.subtitle}</p>

      {usage ? <UsagePanel usage={usage} labels={labels.packaging} /> : null}

      {organizationProjects.length === 0 ? (
        <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyHint}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {organizationProjects.map((project) => {
            const active = project.id === activeProject?.id;

            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => setActiveProject(project.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "panel h-full w-full p-4 text-left transition-colors",
                    "duration-[var(--motion-feedback)] hover:bg-[var(--hf-ground-3)]",
                    active && "bg-[var(--hf-accent-quiet)]",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="t-display-sm text-[var(--hf-ink)]">
                      {project.name}
                    </span>
                    <Badge tone={active ? "brand" : "neutral"}>{project.status}</Badge>
                  </span>
                  <span className="t-body-sm mt-1.5 block text-[var(--hf-ink-muted)]">
                    {project.description}
                  </span>
                  {activeOrganization ? (
                    <span className="t-mono-sm mt-3 block text-[var(--hf-ink-faint)]">
                      {activeOrganization.name}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="panel grid max-w-lg gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || pending || limited) return;
          void addProject({ name, description }).then(() => {
            setName("");
            setDescription("");
          });
        }}
      >
        <h2 className="t-display-sm text-[var(--hf-ink)]">{labels.create}</h2>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">
            {labels.name}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            required
            disabled={pending || !activeOrganization || limited}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">
            {labels.description}
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="input min-h-24"
            disabled={pending || !activeOrganization || limited}
          />
        </label>
        {limited ? (
          <p role="status" className="t-body-sm text-[var(--hf-ink-muted)]">
            {labels.limitReached}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="t-body-sm text-[var(--hf-error)]">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || !activeOrganization || limited}
          className="justify-self-start"
        >
          {labels.create}
        </Button>
      </form>
    </div>
  );
}
