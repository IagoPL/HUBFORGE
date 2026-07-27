import { AppShell } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/authentication/user-menu";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { getDemoWorkspace } from "@/data/demo-workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = getDemoWorkspace();
  const user = await getCurrentUser();

  return (
    <AppShell
      organizationName={workspace.organization.name}
      projectName={workspace.project.name}
      userSlot={<UserMenu user={user} />}
    >
      {children}
    </AppShell>
  );
}
