import { Badge } from "@/components/ui/badge";
import { getDemoWorkspace } from "@/data/demo-workspace";
import type { AccessRole } from "@/lib/domain/types";

export const metadata = {
  title: "Team",
};

const accessLabels: Record<AccessRole, string> = {
  organization_owner: "Org Owner",
  organization_admin: "Org Admin",
  project_manager: "Project Manager",
  project_lead: "Project Lead",
  member: "Member",
  guest: "Guest",
};

export default function TeamPage() {
  const { members } = getDemoWorkspace();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Team
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">
          Access roles control permissions. Functional roles describe what people do.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--hf-brand-soft)] text-sm font-semibold text-[var(--hf-brand-strong)]">
                {member.avatarInitials}
              </span>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-[var(--hf-fg-muted)]">{member.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{accessLabels[member.accessRole]}</Badge>
              <Badge>{member.functionalRole}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
