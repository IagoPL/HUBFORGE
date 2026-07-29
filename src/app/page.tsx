import Link from "next/link";
import { ArrowRight, CalendarRange, GitBranch, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  const problems = [
    { title: t.landing.problem1Title, body: t.landing.problem1Body },
    { title: t.landing.problem2Title, body: t.landing.problem2Body },
    { title: t.landing.problem3Title, body: t.landing.problem3Body },
  ];

  const capabilities = [
    { icon: Users, title: t.landing.cap1Title, body: t.landing.cap1Body },
    { icon: CalendarRange, title: t.landing.cap2Title, body: t.landing.cap2Body },
    { icon: GitBranch, title: t.landing.cap3Title, body: t.landing.cap3Body },
    { icon: ShieldCheck, title: t.landing.cap4Title, body: t.landing.cap4Body },
  ];

  const boardTasks = [t.landing.taskReady, t.landing.taskProgress, t.landing.taskReview];
  const columns = [t.landing.ready, t.landing.inProgress, t.landing.review];

  return (
    <>
      <SiteHeader locale={locale} dictionary={t} />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pt-20">
          <div className="space-y-6">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hf-brand)]">
              {t.common.brand}
            </p>
            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--hf-fg)] sm:text-5xl lg:text-6xl">
              {t.landing.headline}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--hf-fg-muted)] sm:text-lg">
              {t.landing.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
                {t.common.openWorkspace}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                {t.common.signIn}
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative overflow-hidden rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
          >
            <div className="mb-4 flex items-center justify-between text-xs text-[var(--hf-fg-muted)]">
              <span className="font-medium text-[var(--hf-fg)]">
                {t.landing.boardProject}
              </span>
              <span>{t.landing.boardOrg}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {columns.map((column, index) => (
                <div key={column} className="rounded-xl bg-[var(--hf-surface-2)] p-3">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--hf-fg-muted)]">
                    {column}
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-[var(--hf-surface)] p-3 text-sm">
                      {boardTasks[index]}
                    </div>
                    {index !== 2 ? (
                      <div className="rounded-lg border border-dashed border-[var(--hf-border)] p-3 text-xs text-[var(--hf-fg-muted)]">
                        {t.landing.dropZone}
                      </div>
                    ) : null}
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
              {t.landing.productTitle}
            </h2>
            <p className="text-[var(--hf-fg-muted)]">{t.landing.productSubtitle}</p>
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
                {t.landing.securityTitle}
              </h2>
              <p className="text-[var(--hf-fg-muted)]">{t.landing.securityBody}</p>
            </div>
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              {t.common.openWorkspace}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--hf-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[var(--hf-fg-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t.landing.footerTagline}</p>
          <p>{t.landing.footerStatus}</p>
        </div>
      </footer>
    </>
  );
}
