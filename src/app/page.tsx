import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

/**
 * Marketing surface for the same product grammar as the app: brand first,
 * one job per section, no decorative board mockups.
 */
export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  const problems = [
    { title: t.landing.problem1Title, body: t.landing.problem1Body },
    { title: t.landing.problem2Title, body: t.landing.problem2Body },
    { title: t.landing.problem3Title, body: t.landing.problem3Body },
  ];

  const capabilities = [
    { title: t.landing.cap1Title, body: t.landing.cap1Body },
    { title: t.landing.cap2Title, body: t.landing.cap2Body },
    { title: t.landing.cap3Title, body: t.landing.cap3Body },
    { title: t.landing.cap4Title, body: t.landing.cap4Body },
  ];

  return (
    <>
      <SiteHeader locale={locale} dictionary={t} />

      <main>
        {/* One composition: brand, headline, support, CTAs, product sheet. */}
        <section className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-0)]">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pt-20">
            <div className="grid gap-6">
              <p className="t-display text-[var(--hf-accent)]">{t.common.brand}</p>
              <h1 className="t-display-lg max-w-[18ch] text-[var(--hf-ink)]">
                {t.landing.headline}
              </h1>
              <p className="t-body-lg max-w-[46ch] text-[var(--hf-ink-muted)]">
                {t.landing.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/demo" className={cn(buttonVariants({ size: "lg" }))}>
                  {t.landing.enterDemo}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  {t.landing.signInPreview}
                </Link>
              </div>
            </div>

            {/* Product truth, not a fake kanban: the briefing the app opens on. */}
            <aside
              aria-hidden="true"
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
            >
              <div className="border-b border-[var(--hf-rule)] px-4 py-3">
                <p className="t-body-sm text-[var(--hf-ink-faint)]">
                  {t.landing.boardOrg}
                  <span className="mx-1.5" aria-hidden>
                    ›
                  </span>
                  {t.landing.boardProject}
                  <span className="mx-1.5" aria-hidden>
                    ›
                  </span>
                  {t.operations.briefing}
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="t-display-sm text-[var(--hf-ink)]">
                    {t.operations.briefing}
                  </p>
                  <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    active · 5 tasks · 1 blocked
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4">
                <p className="t-label text-[var(--hf-ink-faint)]">
                  {t.operations.briefing}
                </p>
                <p className="t-body text-[var(--hf-ink)]">
                  {t.operations.sinceLastVisit.replace(
                    "{facts}",
                    [
                      t.operations.factMergedOne,
                      t.operations.factBlockedOne,
                      t.operations.factReviewOne,
                    ].join(t.operations.factJoin),
                  )}
                </p>

                <ul className="grid gap-2">
                  {[
                    {
                      kind: t.operations.revisionBlocked,
                      title: t.landing.taskReady,
                      tone: "text-[var(--hf-caution)]",
                    },
                    {
                      kind: t.operations.revisionNew,
                      title: t.landing.taskReview,
                      tone: "text-[var(--hf-revision)]",
                    },
                    {
                      kind: t.operations.revisionChanged,
                      title: t.landing.taskProgress,
                      tone: "text-[var(--hf-revision)]",
                    },
                  ].map((item) => (
                    <li
                      key={item.title}
                      className="rounded-[var(--radius-md)] border border-[var(--hf-rule)] bg-[var(--hf-ground-2)] px-3 py-2.5"
                    >
                      <p className={cn("t-mono-sm font-medium capitalize", item.tone)}>
                        {item.kind}
                      </p>
                      <p className="t-body mt-1 text-[var(--hf-ink)]">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="problem"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
            {problems.map((item, index) => (
              <article key={item.title} className="grid gap-2">
                <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="t-display-sm text-[var(--hf-ink)]">{item.title}</h2>
                <p className="t-body text-[var(--hf-ink-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="product" className="bg-[var(--hf-ground-0)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 max-w-2xl grid gap-2">
              <h2 className="t-display text-[var(--hf-ink)]">{t.landing.productTitle}</h2>
              <p className="t-body-lg text-[var(--hf-ink-muted)]">
                {t.landing.productSubtitle}
              </p>
            </div>

            <ol className="grid gap-0 border-t border-[var(--hf-rule)] md:grid-cols-2">
              {capabilities.map((item, index) => (
                <li
                  key={item.title}
                  className="grid gap-2 border-b border-[var(--hf-rule)] py-5 md:odd:border-r md:odd:pr-6 md:even:pl-6"
                >
                  <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="t-display-sm text-[var(--hf-ink)]">{item.title}</h3>
                  <p className="t-body max-w-[52ch] text-[var(--hf-ink-muted)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="security"
          className="border-t border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl grid gap-2">
              <h2 className="t-display text-[var(--hf-ink)]">
                {t.landing.securityTitle}
              </h2>
              <p className="t-body-lg text-[var(--hf-ink-muted)]">
                {t.landing.securityBody}
              </p>
            </div>
            <Link href="/demo" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
              {t.landing.exploreDemo}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hf-rule)] bg-[var(--hf-ground-0)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="t-body-sm text-[var(--hf-ink-muted)]">
            {t.landing.footerTagline}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/privacy"
              className="t-body-sm text-[var(--hf-ink-muted)] underline-offset-2 hover:underline"
            >
              {t.legal.privacyTitle}
            </Link>
            <Link
              href="/terms"
              className="t-body-sm text-[var(--hf-ink-muted)] underline-offset-2 hover:underline"
            >
              {t.legal.termsTitle}
            </Link>
            <p className="t-mono-sm text-[var(--hf-ink-faint)]">{t.landing.footerStatus}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
