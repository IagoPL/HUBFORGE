"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { cn } from "@/lib/utils";

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
    liveHint: string;
  };
}) {
  const {
    mode,
    state,
    activeOrganization,
    addOrganization,
    setActiveOrganization,
    pending,
    error,
  } = useWorkspace();
  const [name, setName] = useState("");

  return (
    <div className="grid gap-5 px-4 py-5 sm:px-6">
      <div className="grid gap-1">
        <p className="lead">{labels.subtitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-faint)]">
          {mode === "live" ? labels.liveHint : labels.switchHint}
        </p>
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {state.organizations.map((organization) => {
          const active = organization.id === activeOrganization?.id;

          return (
            <li key={organization.id}>
              <button
                type="button"
                onClick={() => setActiveOrganization(organization.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "panel w-full p-4 text-left transition-colors",
                  "duration-[var(--motion-feedback)] hover:bg-[var(--hf-ground-3)]",
                  active && "bg-[var(--hf-accent-quiet)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="t-body font-medium text-[var(--hf-ink)]">
                    {organization.name}
                  </span>
                  {active ? <Badge tone="brand">{labels.current}</Badge> : null}
                </span>
                <span className="t-mono-sm mt-1 block text-[var(--hf-ink-faint)]">
                  {organization.slug}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="panel grid max-w-lg gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || pending) return;
          void addOrganization(name).then(() => setName(""));
        }}
      >
        <h2 className="t-display-sm text-[var(--hf-ink)]">{labels.create}</h2>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">{labels.name}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            required
            disabled={pending}
          />
        </label>
        {error ? (
          <p role="alert" className="t-body-sm text-[var(--hf-error)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="justify-self-start">
          {labels.create}
        </Button>
      </form>
    </div>
  );
}
