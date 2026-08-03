import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TeamPanel } from "@/features/collaboration/team-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Team",
};

export default async function TeamPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6">
        <Link
          href="/app/calendar"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          {t.nav.capacity}
        </Link>
        <Link
          href="/app/settings"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {t.nav.settings}
        </Link>
      </div>
      <TeamPanel
        labels={{
          title: t.team.title,
          subtitle: t.team.subtitle,
          invite: t.team.invite,
          email: t.team.email,
          accessRole: t.team.accessRole,
          functionalRole: t.team.functionalRole,
          pending: t.team.pending,
          saveRoles: t.team.saveRoles,
          empty: t.team.empty,
          copyLink: t.team.copyLink,
          inviteSent: t.team.inviteSent,
          inviteLinkHint: t.team.inviteLinkHint,
          emailNotDelivered: t.team.emailNotDelivered,
          removeMember: t.team.removeMember,
          revokeInvite: t.team.revokeInvite,
          limitReached: t.team.limitReached,
          packaging: t.packaging,
        }}
      />
    </div>
  );
}
