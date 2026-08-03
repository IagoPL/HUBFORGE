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
    archive: string;
    unarchive: string;
    delete: string;
    confirmDelete: string;
    confirmDeleteAction: string;
    cancel: string;
    statusActive: string;
    statusPaused: string;
    statusArchived: string;
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
    setProjectStatus,
    removeProject,
    pending,
    error,
  } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const activeCount = organizationProjects.filter((p) => p.status !== "archived").length;
  const usage = usePackagingUsage(activeOrganization?.id, activeCount);
  const limited = usage ? atProjectLimit(usage) : false;

  const statusLabel = {
    active: labels.statusActive,
    paused: labels.statusPaused,
    archived: labels.statusArchived,
  } as const;

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
            const confirming = confirmingId === project.id;
            const archived = project.status === "archived";

            return (
              <li key={project.id} className="panel grid h-full gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setActiveProject(project.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-full text-left transition-colors",
                    "duration-[var(--motion-feedback)]",
                    active &&
                      "rounded-[var(--radius-md)] bg-[var(--hf-accent-quiet)] p-2 -m-2",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="t-display-sm text-[var(--hf-ink)]">
                      {project.name}
                    </span>
                    <Badge tone={archived ? "neutral" : active ? "brand" : "neutral"}>
                      {statusLabel[project.status]}
                    </Badge>
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

                {confirming ? (
                  <div className="grid gap-2 border-t border-[var(--hf-rule-faint)] pt-3">
                    <p className="t-body-sm text-[var(--hf-ink-muted)]">
                      {labels.confirmDelete}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          void removeProject(project.id).then(() =>
                            setConfirmingId(null),
                          );
                        }}
                      >
                        {labels.confirmDeleteAction}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => setConfirmingId(null)}
                      >
                        {labels.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 border-t border-[var(--hf-rule-faint)] pt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        void setProjectStatus(
                          project.id,
                          archived ? "active" : "archived",
                        )
                      }
                    >
                      {archived ? labels.unarchive : labels.archive}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirmingId(project.id)}
                    >
                      {labels.delete}
                    </Button>
                  </div>
                )}
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
