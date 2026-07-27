import Link from "next/link";
import { ArrowRight, CalendarRange, GitBranch, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const problems = [
  {
    title: "Work is scattered",
    body: "Plans live in one tool, availability in another, and GitHub activity somewhere else.",
  },
  {
    title: "Ownership is unclear",
    body: "Teams know the backlog exists, but not who can take the next critical task.",
  },
  {
    title: "Context gets lost",
    body: "Decisions, blockers, and chat drift away from the project they belong to.",
  },
];

const capabilities = [
  {
    icon: Users,
    title: "Roles that mean something",
    body: "Separate access permissions from functional responsibilities so leads, designers, and engineers stay aligned.",
  },
  {
    icon: CalendarRange,
    title: "Availability in the plan",
    body: "See who is free before you assign work. Calendar and capacity stay next to the board.",
  },
  {
    icon: GitBranch,
    title: "GitHub without context loss",
    body: "Connect repositories later to sync issues and surface PR activity beside project ownership.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    body: "Organization boundaries, server-side authorization, and RLS-ready multi-tenant design from day one.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pt-20">
          <div className="space-y-6">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hf-brand)]">
              HubForge
            </p>
            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--hf-fg)] sm:text-5xl lg:text-6xl">
              Build together without losing context.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--hf-fg-muted)] sm:text-lg">
              HubForge connects planning, availability, responsibilities, and GitHub
              activity in one collaborative workspace for small technical and creative
              teams.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app" className={cn(buttonVariants({ size: "lg" }))}>
                Enter demo workspace
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Sign in preview
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative overflow-hidden rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4 shadow-[0_24px_60px_-36px_rgba(16,21,28,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between text-xs text-[var(--hf-fg-muted)]">
              <span className="font-medium text-[var(--hf-fg)]">Aurora Launch</span>
              <span>Northlight Studio</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Ready", "In progress", "Review"].map((column, index) => (
                <div key={column} className="rounded-xl bg-[var(--hf-surface-2)] p-3">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--hf-fg-muted)]">
                    {column}
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-[var(--hf-surface)] p-3 text-sm">
                      {index === 0 && "Availability calendar polish"}
                      {index === 1 && "Build task board columns"}
                      {index === 2 && "Review access role matrix"}
                    </div>
                    {index !== 2 && (
                      <div className="rounded-lg border border-dashed border-[var(--hf-border)] p-3 text-xs text-[var(--hf-fg-muted)]">
                        Drop zone
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="problem"
          className="border-y border-[var(--hf-border)] bg-[var(--hf-surface)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
            {problems.map((item) => (
              <article key={item.title} className="space-y-3">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--hf-fg-muted)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="product" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              One workspace for people, work, and signal
            </h2>
            <p className="text-[var(--hf-fg-muted)]">
              HubForge is not another generic task board. It keeps ownership, capacity,
              and technical activity readable in the same place.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
              >
                <Icon className="mb-4 size-5 text-[var(--hf-brand)]" aria-hidden />
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--hf-fg-muted)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="security"
          className="border-t border-[var(--hf-border)] bg-[var(--hf-surface)]"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
                Built for trust between organizations
              </h2>
              <p className="text-[var(--hf-fg-muted)]">
                Multi-tenant boundaries, least privilege, and audit-ready actions are part
                of the product foundation—not a later patch.
              </p>
            </div>
            <Link href="/app" className={cn(buttonVariants({ size: "lg" }))}>
              Explore the demo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--hf-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[var(--hf-fg-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>HubForge · collaborative project workspace</p>
          <p>Bootstrap phase · demo data only</p>
        </div>
      </footer>
    </>
  );
}
