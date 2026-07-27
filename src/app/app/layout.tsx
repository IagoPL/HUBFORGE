import { AppShell } from "@/components/app-shell/app-shell";
import { getDemoWorkspace } from "@/data/demo-workspace";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = getDemoWorkspace();

  return (
    <AppShell
      organizationName={workspace.organization.name}
      projectName={workspace.project.name}
    >
      {children}
    </AppShell>
  );
}
