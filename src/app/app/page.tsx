import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BriefingSurface } from "@/components/operations/briefing-surface";
import { changeSummary, openWorkSummary } from "@/components/operations/labels";
import { NotificationsPanel } from "@/features/availability/notifications-panel";
import {
  getProjectLastVisitAction,
  listMembersAction,
  touchProjectVisitAction,
} from "@/features/collaboration/actions";
import { loadProjectEvidence } from "@/features/signals/load-project-evidence";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { briefingFactCounts, runSignalEngine } from "@/lib/signals";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Member } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Briefing",
};

export default async function AppOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const state = await getWorkspaceSnapshot();
  const { notice } = await searchParams;

  const notificationLabels = {
    title: t.app.latestNotifications,
    markRead: t.notifications.markRead,
    empty: t.notifications.empty,
    unread: t.app.unread,
    isNew: t.app.new,
  };

  const attentionLabels = {
    title: t.attention.title,
    empty: t.attention.empty,
    fact: t.attention.fact,
    inference: t.attention.inference,
    evidence: t.attention.evidence,
    why: t.attention.why,
    action: t.attention.action,
    origin: t.attention.origin,
    simulatedOrigin: t.attention.simulatedOrigin,
    severityHigh: t.attention.severityHigh,
    severityMedium: t.attention.severityMedium,
    severityLow: t.attention.severityLow,
  };

  const steps = [
    t.onboarding.step1,
    t.onboarding.step2,
    t.onboarding.step3,
    t.onboarding.step4,
    t.onboarding.step5,
    t.onboarding.step6,
    t.onboarding.step7,
    t.onboarding.step8,
  ];

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
        steps={steps}
        activeStep={2}
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
        steps={steps}
        activeStep={2}
      />
    );
  }

  const [membersResult, visitResult] = await Promise.all([
    listMembersAction(organization.id),
    getProjectLastVisitAction(project.id),
  ]);
  const lastVisitAt = visitResult.ok ? visitResult.data : null;

  const evidenceResult = await loadProjectEvidence({
    projectId: project.id,
    organizationId: organization.id,
    lastVisitAt,
  });

  // Touch after the visit window was captured for this render.
  void touchProjectVisitAction(project.id);

  const members = membersResult.ok ? membersResult.data : [];

  if (!evidenceResult.ok) {
    return (
      <div className="grid gap-3 px-4 py-5 sm:px-6">
        <p className="t-body text-[var(--hf-error)]">{evidenceResult.error}</p>
      </div>
    );
  }

  const partition = runSignalEngine(evidenceResult.data);
  const open = evidenceResult.data.tasks.filter((task) => task.status !== "done").length;
  const counts = briefingFactCounts(partition.sinceLastVisit);
  const summary = partition.firstVisit
    ? openWorkSummary(open, evidenceResult.data.tasks.length, t.operations)
    : changeSummary(
        {
          completed: counts.completed,
          blocked: counts.blocked,
          needsReview: counts.needsReview,
        },
        t.operations,
      );

  return (
    <>
      {notice === "chat-retired" ? (
        <p
          role="status"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-2)] px-4 py-2 t-body-sm text-[var(--hf-ink-muted)] sm:px-6"
        >
          {t.app.chatRetiredNotice}
        </p>
      ) : null}
      {evidenceResult.warnings.length > 0 ? (
        <p
          role="status"
          className="border-b border-[var(--hf-rule)] px-4 py-2 t-body-sm text-[var(--hf-ink-faint)] sm:px-6"
        >
          {evidenceResult.warnings[0]}
        </p>
      ) : null}
      <BriefingSurface
        summary={summary}
        sinceLastVisit={partition.sinceLastVisit}
        firstVisitHint={partition.firstVisit ? t.operations.firstVisitHint : undefined}
        labels={{ briefing: t.operations.briefing }}
        attentionLabels={attentionLabels}
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
  steps,
  activeStep,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
  steps: string[];
  activeStep: number;
}) {
  return (
    <div className="grid max-w-xl gap-4 px-4 py-5 sm:px-6">
      <div className="grid gap-2">
        <h2 className="t-display text-[var(--hf-ink)]">{title}</h2>
        <p className="lead">{body}</p>
      </div>
      <ol className="grid gap-2 border-t border-[var(--hf-rule)] pt-4">
        {steps.map((step, index) => {
          const n = index + 1;
          const current = n === activeStep;
          return (
            <li
              key={step}
              className={cn(
                "t-body flex gap-3",
                current ? "text-[var(--hf-ink)]" : "text-[var(--hf-ink-muted)]",
              )}
            >
              <span
                className="t-mono-sm shrink-0 text-[var(--hf-ink-faint)]"
                data-tabular
              >
                {String(n).padStart(2, "0")}
              </span>
              <span>
                {step}
                {current ? (
                  <span className="t-mono-sm ml-2 text-[var(--hf-accent)]">←</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: "primary" }), "justify-self-start")}
      >
        {action}
      </Link>
    </div>
  );
}
