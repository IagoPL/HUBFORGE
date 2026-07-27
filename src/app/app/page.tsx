import { Badge } from "@/components/ui/badge";
import { getDemoWorkspace } from "@/data/demo-workspace";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Overview",
};

export default async function AppOverviewPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const { project, members, tasks, notifications } = getDemoWorkspace();
  const openTasks = tasks.filter((task) => task.status !== "done").length;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">{project.description}</p>
      </header>

      <section aria-label="Workspace summary" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t.app.openTasks, value: String(openTasks) },
          { label: t.app.members, value: String(members.length) },
          {
            label: t.app.unread,
            value: String(notifications.filter((item) => !item.read).length),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
              {stat.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            {t.app.latestNotifications}
          </h2>
          <ul className="space-y-3">
            {notifications.map((item) => (
              <li key={item.id} className="rounded-xl bg-[var(--hf-surface-2)] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  {!item.read ? <Badge tone="brand">{t.app.new}</Badge> : null}
                </div>
                <p className="text-sm text-[var(--hf-fg-muted)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            {t.app.teamPresence}
          </h2>
          <ul className="space-y-3">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--hf-brand-soft)] text-xs font-semibold text-[var(--hf-brand-strong)]">
                    {member.avatarInitials}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-[var(--hf-fg-muted)]">
                      {member.functionalRole}
                    </p>
                  </div>
                </div>
                <Badge tone={member.presence === "online" ? "success" : "neutral"}>
                  {member.presence}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
