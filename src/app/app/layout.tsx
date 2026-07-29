import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/authentication/user-menu";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { getWorkspaceSnapshot } from "@/features/organizations/get-workspace";
import { WorkspaceProvider } from "@/features/organizations/workspace-provider";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/app");
  }

  const workspace = await getWorkspaceSnapshot();

  return (
    <WorkspaceProvider initialState={workspace.state}>
      <AppShell
        locale={locale}
        labels={{
          brand: t.common.brand,
          organization: t.nav.organization,
          liveWorkspace: t.app.liveWorkspace,
          language: t.common.language,
          english: t.common.english,
          spanish: t.common.spanish,
          appNav: t.nav.app,
          mobileNav: t.nav.app,
          overview: t.nav.overview,
          projects: t.nav.projects,
          tasks: t.nav.tasks,
          team: t.nav.team,
          calendar: t.nav.calendar,
          organizations: t.organizations.title,
          github: t.nav.github,
          chat: t.nav.chat,
        }}
        userSlot={<UserMenu user={user} signOutLabel={t.common.signOut} />}
      >
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
}
