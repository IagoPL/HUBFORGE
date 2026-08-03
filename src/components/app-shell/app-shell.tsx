"use client";

import {
  Building2,
  CalendarDays,
  ChevronRight,
  Ellipsis,
  FolderGit,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentType } from "react";
import { DensityToggle } from "@/components/operations/density-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type ShellLabels = {
  brand: string;
  organization: string;
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
  chat: string;
  more: string;
  skipToContent: string;
};

type Destination = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Phones carry four destinations; the rest live behind "More". */
  onPhone: boolean;
};

/**
 * Global chrome: a rail of destinations and a title block that declares where
 * you are and how current the data is.
 *
 * The surface name comes from the route, so the block can never disagree with
 * the rail's active state.
 */
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
  const { activeOrganization, activeProject } = useWorkspace();
  const moreRef = useRef<HTMLDialogElement>(null);

  const destinations: Destination[] = [
    { href: "/app", label: labels.overview, icon: LayoutDashboard, onPhone: true },
    { href: "/app/tasks", label: labels.tasks, icon: ListTodo, onPhone: true },
    { href: "/app/team", label: labels.team, icon: Users, onPhone: true },
    { href: "/app/chat", label: labels.chat, icon: MessageSquare, onPhone: true },
    {
      href: "/app/organizations",
      label: labels.organizations,
      icon: Building2,
      onPhone: false,
    },
    { href: "/app/projects", label: labels.projects, icon: FolderKanban, onPhone: false },
    { href: "/app/calendar", label: labels.calendar, icon: CalendarDays, onPhone: false },
    { href: "/app/github", label: labels.github, icon: FolderGit, onPhone: false },
  ];

  const isActive = (href: string) => pathname === href;
  const current = destinations.find((destination) => isActive(destination.href));
  const overflow = destinations.filter((destination) => !destination.onPhone);
  const overflowActive = overflow.some((destination) => isActive(destination.href));

  // Only context that is actually known reaches the crumb trail.
  const crumbs = [activeOrganization?.name, activeProject?.name].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--hf-ground-0)] text-[var(--hf-ink)] lg:pl-14">
      {/* First in tab order, so it cannot live inside the header. Its own
          landmark keeps it from reading as content adrift of one. */}
      <nav aria-label={labels.skipToContent}>
        <a
          href="#app-content"
          className={cn(
            "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50",
            "focus:rounded-[var(--radius-md)] focus:bg-[var(--hf-accent)] focus:px-3 focus:py-2",
            "focus:t-body focus:font-medium focus:text-[var(--hf-accent-ink)]",
          )}
        >
          {labels.skipToContent}
        </a>
      </nav>

      <nav
        aria-label={labels.appNav}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch justify-around",
          "border-t border-[var(--hf-rule)] bg-[var(--hf-ground-1)]",
          "lg:inset-y-0 lg:right-auto lg:h-auto lg:w-14 lg:flex-col lg:justify-start",
          "lg:gap-1 lg:border-r lg:border-t-0 lg:py-3",
        )}
      >
        <Link
          href="/"
          aria-label={labels.brand}
          className={cn(
            "t-display-sm hidden select-none items-center justify-center pb-2",
            "text-[var(--hf-accent)] focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[var(--hf-accent)] lg:flex",
          )}
        >
          HF
        </Link>

        {destinations.map(({ href, label, icon: Icon, onPhone }) => (
          <RailLink
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={isActive(href)}
            hiddenOnPhone={!onPhone}
          />
        ))}

        {/* Phones reach the remaining destinations through a sheet rather than
            a cramped eight-cell bar. */}
        <button
          type="button"
          onClick={() => moreRef.current?.showModal()}
          className={cn(
            "group relative flex flex-1 flex-col items-center justify-center gap-1",
            "text-[var(--hf-ink-muted)] transition-colors duration-[var(--motion-feedback)]",
            "hover:text-[var(--hf-ink)] focus-visible:outline-2",
            "focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--hf-accent)]",
            overflowActive && "text-[var(--hf-accent)]",
            "sm:hidden",
          )}
        >
          <Ellipsis className="size-[1.125rem] shrink-0" aria-hidden />
          <span className="t-label text-[0.5625rem] tracking-[0.06em]">
            {labels.more}
          </span>
        </button>
      </nav>

      <MoreSheet
        ref={moreRef}
        title={labels.more}
        destinations={overflow}
        isActive={isActive}
        onClose={() => moreRef.current?.close()}
      />

      <header
        className={cn(
          "sticky top-0 z-20 border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)]/95",
          "px-4 pb-3 pt-3 backdrop-blur-sm sm:px-6",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <nav aria-label={labels.organization} className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1">
              {crumbs.map((crumb, index) => (
                <li
                  key={crumb}
                  className={cn(
                    "flex min-w-0 items-center gap-1",
                    index < crumbs.length - 1 && "hidden sm:flex",
                  )}
                >
                  {index > 0 ? (
                    <ChevronRight
                      className="size-3 shrink-0 text-[var(--hf-ink-faint)]"
                      aria-hidden
                    />
                  ) : null}
                  <span className="t-body-sm truncate text-[var(--hf-ink-faint)]">
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DensityToggle />
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
        </div>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="t-display text-[var(--hf-ink)]">
            {current?.label ?? labels.brand}
          </h1>
        </div>
      </header>

      <main id="app-content" className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
  hiddenOnPhone,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  hiddenOnPhone: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-1 flex-col items-center justify-center gap-1",
        "text-[var(--hf-ink-muted)] transition-colors duration-[var(--motion-feedback)]",
        "hover:text-[var(--hf-ink)] focus-visible:outline-2",
        "focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--hf-accent)]",
        "lg:h-11 lg:flex-none lg:rounded-[var(--radius-md)]",
        active && "text-[var(--hf-accent)]",
        hiddenOnPhone && "hidden sm:flex",
      )}
    >
      {/* Selection is a drawn edge, not a filled block. */}
      <span
        aria-hidden
        className={cn(
          "absolute bg-[var(--hf-accent)] transition-opacity duration-[var(--motion-feedback)]",
          "left-1/2 top-0 h-0.5 w-8 -translate-x-1/2",
          "lg:inset-y-1.5 lg:left-0 lg:top-auto lg:h-auto lg:w-0.5 lg:translate-x-0",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className="size-[1.125rem] shrink-0" aria-hidden />
      <span className="t-label text-[0.5625rem] tracking-[0.06em] lg:sr-only">
        {label}
      </span>

      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-full z-40 ml-2 hidden whitespace-nowrap",
          "rounded-[var(--radius-sm)] border border-[var(--hf-rule)] bg-[var(--hf-ground-3)]",
          "px-2 py-1 opacity-0 transition-opacity duration-[var(--motion-feedback)]",
          "group-hover:opacity-100 group-focus-visible:opacity-100 lg:block",
        )}
      >
        <span className="t-body-sm text-[var(--hf-ink)]">{label}</span>
      </span>
    </Link>
  );
}

function MoreSheet({
  ref,
  title,
  destinations,
  isActive,
  onClose,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  title: string;
  destinations: Destination[];
  isActive: (href: string) => boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Navigating away should not leave the sheet open behind the new surface.
  useEffect(() => {
    ref.current?.close();
  }, [pathname, ref]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={cn(
        "mb-0 mt-auto w-full max-w-none rounded-t-[var(--radius-lg)] p-0",
        "border-t border-[var(--hf-rule-strong)] bg-[var(--hf-ground-1)]",
        "text-[var(--hf-ink)] backdrop:bg-[var(--hf-ground-0)]/70",
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--hf-rule)] px-4 py-3">
        <p className="t-label text-[var(--hf-ink-faint)]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "grid size-8 place-items-center rounded-[var(--radius-md)]",
            "text-[var(--hf-ink-muted)] hover:bg-[var(--hf-ground-2)] hover:text-[var(--hf-ink)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[var(--hf-accent)]",
          )}
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">{title}</span>
        </button>
      </div>

      <ul className="grid p-2 pb-6">
        {destinations.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "t-body flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3",
                "text-[var(--hf-ink)] hover:bg-[var(--hf-ground-2)]",
                "focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                "focus-visible:outline-[var(--hf-accent)]",
                isActive(href) && "text-[var(--hf-accent)]",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
