import { Badge } from "@/components/ui/badge";
import { getDemoWorkspace } from "@/data/demo-workspace";

export const metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  const { availability, members } = getDemoWorkspace();
  const memberById = new Map(members.map((member) => [member.id, member]));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Availability
        </h1>
        <p className="text-[var(--hf-fg-muted)]">
          Team capacity sits next to planning so assignments respect real schedules.
        </p>
      </header>
      <ul className="space-y-3">
        {availability.map((entry) => {
          const member = memberById.get(entry.memberId);
          return (
            <li
              key={entry.id}
              className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="font-medium">{member?.name ?? "Unknown member"}</p>
                <Badge
                  tone={
                    entry.kind === "unavailable"
                      ? "danger"
                      : entry.kind === "busy"
                        ? "warning"
                        : "success"
                  }
                >
                  {entry.kind}
                </Badge>
              </div>
              <p className="text-sm text-[var(--hf-fg-muted)]">{entry.note}</p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--hf-fg-muted)]">
                {new Date(entry.startsAt).toLocaleString()} →{" "}
                {new Date(entry.endsAt).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
