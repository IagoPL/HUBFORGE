"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/tasks", label: "Tasks", icon: ListTodo },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function AppShell({
  organizationName,
  projectName,
  children,
}: {
  organizationName: string;
  projectName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
            HubForge
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
            Organization
          </p>
          <p className="text-sm font-medium">{organizationName}</p>
          <p className="text-xs text-[var(--hf-fg-muted)]">Project · {projectName}</p>
        </div>
        <nav aria-label="App" className="space-y-1">
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--hf-border)] bg-[color-mix(in_oklab,var(--hf-bg)_90%,transparent)] px-4 backdrop-blur-md sm:px-6">
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
              <p className="text-xs text-[var(--hf-fg-muted)]">Demo workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">Mock data</Badge>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <nav
          aria-label="Mobile"
          className="sticky bottom-0 grid grid-cols-5 border-t border-[var(--hf-border)] bg-[var(--hf-surface)] px-1 py-2 lg:hidden"
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
