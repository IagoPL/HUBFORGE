"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/organizations/workspace-provider";

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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
      </header>

      {organizationProjects.length === 0 ? (
        <p className="text-sm text-[var(--hf-fg-muted)]">{labels.emptyHint}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {organizationProjects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => setActiveProject(project.id)}
                className="w-full rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5 text-left transition-colors hover:bg-[var(--hf-surface-2)]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {project.name}
                  </h2>
                  <Badge tone="success">{project.status}</Badge>
                  {project.id === activeProject?.id ? (
                    <Badge tone="brand">Active</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--hf-fg-muted)]">{project.description}</p>
                <p className="mt-4 text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
                  {labels.organization} · {activeOrganization?.name ?? "—"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="max-w-lg space-y-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || pending) return;
          void addProject({ name, description }).then(() => {
            setName("");
            setDescription("");
          });
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {labels.create}
        </h2>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.name}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            required
            disabled={pending || !activeOrganization}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.description}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3 py-2"
            disabled={pending || !activeOrganization}
          />
        </label>
        {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}
        <Button type="submit" disabled={pending || !activeOrganization}>
          {labels.create}
        </Button>
      </form>
    </div>
  );
}
