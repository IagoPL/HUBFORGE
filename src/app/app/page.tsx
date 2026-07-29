import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { NotificationsPanel } from "@/features/availability/notifications-panel";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { listMembersAction, listTasksAction } from "@/features/collaboration/actions";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { getDemoWorkspace } from "@/data/demo-workspace";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Overview",
};

export default async function AppOverviewPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const user = await getCurrentUser();
  const workspace = user
    ? await getWorkspaceSnapshot()
    : { mode: "demo" as const, state: undefined };

  if (workspace.mode === "live") {
    const state = workspace.state;
    const project =
      state.projects.find((item) => item.id === state.activeProjectId) ??
      state.projects[0] ??
      null;
    const organization =
      state.organizations.find((item) => item.id === state.activeOrganizationId) ??
      state.organizations[0] ??
      null;

    if (!organization) {
      return (
        <div className="space-y-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {t.onboarding.title}
          </h1>
          <p className="max-w-2xl text-[var(--hf-fg-muted)]">{t.onboarding.body}</p>
          <Link
            href="/app/organizations"
            className={cn(buttonVariants({ variant: "primary" }), "inline-flex")}
          >
            {t.organizations.create}
          </Link>
        </div>
      );
    }

    if (!project) {
      return (
        <div className="space-y-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {organization.name}
          </h1>
          <p className="max-w-2xl text-[var(--hf-fg-muted)]">{t.projects.emptyHint}</p>
          <Link
            href="/app/projects"
            className={cn(buttonVariants({ variant: "primary" }), "inline-flex")}
          >
            {t.projects.create}
          </Link>
        </div>
      );
    }

    const [membersResult, tasksResult] = await Promise.all([
      listMembersAction(organization.id),
      listTasksAction(project.id),
    ]);
    const members = membersResult.ok ? membersResult.data : [];
    const tasks = tasksResult.ok ? tasksResult.data : [];
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
            { label: t.app.unread, value: "—" },
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
          <NotificationsPanel
            labels={{
              title: t.app.latestNotifications,
              markRead: t.notifications.markRead,
              empty: t.notifications.empty,
              unread: t.app.unread,
            }}
          />
          <div className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
              {t.app.teamPresence}
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-[var(--hf-fg-muted)]">{t.team.empty}</p>
            ) : (
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
            )}
          </div>
        </section>
      </div>
    );
  }

  const { project, members, tasks } = getDemoWorkspace();
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
          { label: t.app.unread, value: "—" },
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
        <NotificationsPanel
          labels={{
            title: t.app.latestNotifications,
            markRead: t.notifications.markRead,
            empty: t.notifications.empty,
            unread: t.app.unread,
          }}
        />
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
