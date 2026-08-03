import { fill } from "@/lib/utils";
import type { PackagingUsage } from "@/lib/packaging/limits";

export function UsagePanel({
  usage,
  labels,
}: {
  usage: PackagingUsage;
  labels: {
    title: string;
    plan: string;
    organizations: string;
    projects: string;
    members: string;
    ofLimit: string;
  };
}) {
  const rows = [
    {
      label: labels.organizations,
      used: usage.organizations,
      max: usage.limits.organizationsPerUser,
    },
    {
      label: labels.projects,
      used: usage.projects,
      max: usage.limits.projectsPerOrganization,
    },
    {
      label: labels.members,
      used: usage.members,
      max: usage.limits.membersPerOrganization,
    },
  ];

  return (
    <section aria-labelledby="usage-heading" className="panel grid gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="usage-heading" className="t-display-sm text-[var(--hf-ink)]">
          {labels.title}
        </h2>
        <p className="t-mono-sm text-[var(--hf-ink-faint)]">{labels.plan}</p>
      </div>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-[var(--hf-rule-faint)] py-2 last:border-b-0"
          >
            <span className="t-body text-[var(--hf-ink)]">{row.label}</span>
            <span className="t-mono-sm text-[var(--hf-ink-muted)]" data-tabular>
              {fill(labels.ofLimit, { used: row.used, max: row.max })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
