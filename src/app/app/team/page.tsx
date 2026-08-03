import { TeamPanel } from "@/features/collaboration/team-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Team",
};

export default async function TeamPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
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
  );
}
