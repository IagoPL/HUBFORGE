"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/organizations/workspace-provider";

export function OrganizationsPanel({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    create: string;
    name: string;
    current: string;
    switchHint: string;
  };
}) {
  const { state, activeOrganization, addOrganization, setActiveOrganization } =
    useWorkspace();
  const [name, setName] = useState("");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
        <p className="text-xs text-[var(--hf-fg-muted)]">{labels.switchHint}</p>
      </header>

      <section className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
          {labels.current}
        </p>
        <p className="font-medium">{activeOrganization?.name}</p>
      </section>

      <ul className="grid gap-3 md:grid-cols-2">
        {state.organizations.map((organization) => (
          <li key={organization.id}>
            <button
              type="button"
              onClick={() => setActiveOrganization(organization.id)}
              className="w-full rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4 text-left transition-colors hover:bg-[var(--hf-surface-2)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <p className="font-medium">{organization.name}</p>
                {organization.id === activeOrganization?.id ? (
                  <Badge tone="brand">{labels.current}</Badge>
                ) : null}
              </div>
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--hf-fg-muted)]">
                {organization.slug}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <form
        className="max-w-lg space-y-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          addOrganization(name);
          setName("");
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
          />
        </label>
        <Button type="submit">{labels.create}</Button>
      </form>
    </div>
  );
}
