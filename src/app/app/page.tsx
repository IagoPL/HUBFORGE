import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BriefingSurface } from "@/components/operations/briefing-surface";
import { changeSummary, openWorkSummary } from "@/components/operations/labels";
import { NotificationsPanel } from "@/features/availability/notifications-panel";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { listMembersAction, listTasksAction } from "@/features/collaboration/actions";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { buildLiveAttention, getDemoOperations } from "@/data/demo-operations";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Member } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Briefing",
};

export default async function AppOverviewPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const user = await getCurrentUser();
  const workspace = user
    ? await getWorkspaceSnapshot()
    : { mode: "demo" as const, state: undefined };

  const notificationLabels = {
    title: t.app.latestNotifications,
    markRead: t.notifications.markRead,
    empty: t.notifications.empty,
    unread: t.app.unread,
    isNew: t.app.new,
  };

  if (workspace.mode === "live") {
    const state = workspace.state;
    const organization =
      state.organizations.find((item) => item.id === state.activeOrganizationId) ??
      state.organizations[0] ??
      null;

    if (!organization) {
      return (
        <Onboarding
          title={t.onboarding.title}
          body={t.onboarding.body}
          href="/app/organizations"
          action={t.organizations.create}
        />
      );
    }

    const project =
      state.projects.find((item) => item.id === state.activeProjectId) ??
      state.projects[0] ??
      null;

    if (!project) {
      return (
        <Onboarding
          title={organization.name}
          body={t.projects.emptyHint}
          href="/app/projects"
          action={t.projects.create}
        />
      );
    }

    const [membersResult, tasksResult] = await Promise.all([
      listMembersAction(organization.id),
      listTasksAction(project.id),
    ]);
    const members = membersResult.ok ? membersResult.data : [];
    const tasks = tasksResult.ok ? tasksResult.data : [];
    const open = tasks.filter((task) => task.status !== "done").length;

    return (
      <>
        {/* No task history exists yet, so the briefing states the present
            instead of claiming to know what changed. */}
        <BriefingSurface
          summary={openWorkSummary(open, tasks.length, t.operations)}
          attention={buildLiveAttention(tasks)}
          members={members}
          now={new Date().toISOString()}
          locale={locale}
          labels={t.operations}
        />
        <Aside
          notificationLabels={notificationLabels}
          presenceTitle={t.app.teamPresence}
          emptyLabel={t.team.empty}
          members={members}
        />
      </>
    );
  }

  const snapshot = getDemoOperations();

  return (
    <>
      <BriefingSurface
        summary={changeSummary(snapshot.changeCounts, t.operations)}
        attention={snapshot.attention}
        members={snapshot.members}
        now={snapshot.nowAt}
        locale={locale}
        labels={t.operations}
      />
      <Aside
        notificationLabels={notificationLabels}
        presenceTitle={t.app.teamPresence}
        emptyLabel={t.team.empty}
        members={snapshot.members}
      />
    </>
  );
}

function Aside({
  notificationLabels,
  presenceTitle,
  emptyLabel,
  members,
}: {
  notificationLabels: React.ComponentProps<typeof NotificationsPanel>["labels"];
  presenceTitle: string;
  emptyLabel: string;
  members: Member[];
}) {
  return (
    <div className="grid gap-3 px-4 pb-6 sm:px-6 lg:grid-cols-2">
      <NotificationsPanel labels={notificationLabels} />

      <section aria-labelledby="presence-heading" className="panel p-4">
        <h2 id="presence-heading" className="t-display-sm mb-3 text-[var(--hf-ink)]">
          {presenceTitle}
        </h2>
        {members.length === 0 ? (
          <p className="t-body text-[var(--hf-ink-muted)]">{emptyLabel}</p>
        ) : (
          <ul className="grid gap-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "t-mono-sm grid size-8 shrink-0 place-items-center rounded-full",
                      "bg-[var(--hf-ground-3)] text-[var(--hf-ink-muted)]",
                    )}
                  >
                    {member.avatarInitials}
                  </span>
                  <span className="min-w-0">
                    <span className="t-body block truncate font-medium text-[var(--hf-ink)]">
                      {member.name}
                    </span>
                    <span className="t-body-sm block truncate text-[var(--hf-ink-muted)]">
                      {member.functionalRole}
                    </span>
                  </span>
                </span>
                <Badge tone={member.presence === "online" ? "success" : "neutral"}>
                  {member.presence}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Onboarding({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="grid max-w-xl gap-3 px-4 py-5 sm:px-6">
      <h2 className="t-display text-[var(--hf-ink)]">{title}</h2>
      <p className="lead">{body}</p>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: "primary" }), "justify-self-start")}
      >
        {action}
      </Link>
    </div>
  );
}
