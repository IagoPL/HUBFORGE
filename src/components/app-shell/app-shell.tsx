"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FolderGit,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type ShellLabels = {
  brand: string;
  organization: string;
  demoWorkspace: string;
  mockData: string;
  language: string;
  english: string;
  spanish: string;
  appNav: string;
  mobileNav: string;
  overview: string;
  projects: string;
  tasks: string;
  team: string;
  calendar: string;
  organizations: string;
  github: string;
};

export function AppShell({
  locale,
  labels,
  userSlot,
  children,
}: {
  locale: Locale;
  labels: ShellLabels;
  userSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { activeOrganization, activeProject } = useWorkspace();

  const nav = [
    { href: "/app", label: labels.overview, icon: LayoutDashboard },
    { href: "/app/organizations", label: labels.organizations, icon: Building2 },
    { href: "/app/projects", label: labels.projects, icon: FolderKanban },
    { href: "/app/tasks", label: labels.tasks, icon: ListTodo },
    { href: "/app/team", label: labels.team, icon: Users },
    { href: "/app/calendar", label: labels.calendar, icon: CalendarDays },
    { href: "/app/github", label: labels.github, icon: FolderGit },
  ] as const;

  const organizationName = activeOrganization?.name ?? "—";
  const projectName = activeProject?.name ?? "—";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--hf-border)] bg-[var(--hf-surface)] p-4 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-semibold"
          >
            {labels.brand}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mb-6 space-y-2 rounded-xl bg-[var(--hf-surface-2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
            {labels.organization}
          </p>
          <p className="text-sm font-medium">{organizationName}</p>
          <p className="text-xs text-[var(--hf-fg-muted)]">
            {labels.projects} · {projectName}
          </p>
        </div>
        <nav aria-label={labels.appNav} className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--hf-brand-soft)] text-[var(--hf-brand-strong)]"
                    : "text-[var(--hf-fg-muted)] hover:bg-[var(--hf-surface-2)] hover:text-[var(--hf-fg)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--hf-border)] bg-[var(--hf-bg)] px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <div>
              <p className="text-sm font-medium">{projectName}</p>
              <p className="text-xs text-[var(--hf-fg-muted)]">{labels.demoWorkspace}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{labels.mockData}</Badge>
            <LanguageSwitcher
              locale={locale}
              labels={{
                language: labels.language,
                english: labels.english,
                spanish: labels.spanish,
              }}
            />
            {userSlot}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <nav
          aria-label={labels.mobileNav}
          className="sticky bottom-0 grid grid-cols-7 border-t border-[var(--hf-border)] bg-[var(--hf-surface)] px-1 py-2 lg:hidden"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px]",
                  active ? "text-[var(--hf-brand)]" : "text-[var(--hf-fg-muted)]",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
