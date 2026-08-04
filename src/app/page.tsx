import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

/**
 * Marketing surface: product positioning for indie multidisciplinary teams.
 * Visual grammar matches the app; the preview board is labeled demonstration.
 */
export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  const problems = [
    { title: t.landing.problem1Title, body: t.landing.problem1Body },
    { title: t.landing.problem2Title, body: t.landing.problem2Body },
    { title: t.landing.problem3Title, body: t.landing.problem3Body },
  ];

  const howSteps = [
    t.landing.howStep1,
    t.landing.howStep2,
    t.landing.howStep3,
    t.landing.howStep4,
  ];

  const signals = [
    { title: t.landing.signal1Title, body: t.landing.signal1Body },
    { title: t.landing.signal2Title, body: t.landing.signal2Body },
    { title: t.landing.signal3Title, body: t.landing.signal3Body },
  ];

  return (
    <>
      <SiteHeader locale={locale} dictionary={t} />

      <main>
        <section className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-0)]">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pt-20">
            <div className="grid gap-6">
              <p className="t-display text-[var(--hf-accent)]">{t.common.brand}</p>
              <h1 className="t-display-lg max-w-[22ch] text-[var(--hf-ink)]">
                {t.landing.headline}
              </h1>
              <p className="t-body-lg max-w-[46ch] text-[var(--hf-ink-muted)]">
                {t.landing.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
                  {t.landing.ctaConnect}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/demo"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  {t.landing.ctaDemo}
                </Link>
              </div>
            </div>

            <aside
              aria-label={t.landing.exampleTitle}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
            >
              <div className="border-b border-[var(--hf-rule)] px-4 py-3">
                <p className="t-mono-sm text-[var(--hf-caution)]">
                  {t.landing.demoBadge}
                </p>
                <p className="t-body-sm mt-1 text-[var(--hf-ink-faint)]">
                  {t.landing.exampleMeta}
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="t-display-sm text-[var(--hf-ink)]">
                    {t.operations.briefing}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4">
                <p className="t-body text-[var(--hf-ink)]">
                  {t.operations.sinceLastVisit.replace(
                    "{facts}",
                    [
                      t.operations.factCompletedOne,
                      t.operations.factBlockedOne,
                      t.operations.factReviewOne,
                    ].join(t.operations.factJoin),
                  )}
                </p>

                <ul className="grid gap-2">
                  {[
                    {
                      kind: t.operations.revisionBlocked,
                      title: t.landing.previewBlocked,
                      tone: "text-[var(--hf-caution)]",
                    },
                    {
                      kind: t.operations.revisionNew,
                      title: t.landing.previewReview,
                      tone: "text-[var(--hf-revision)]",
                    },
                    {
                      kind: t.operations.revisionChanged,
                      title: t.landing.previewCompleted,
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
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="t-display mb-8 text-[var(--hf-ink)]">
              {t.landing.problemsTitle}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {problems.map((item, index) => (
                <article key={item.title} className="grid gap-2">
                  <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="t-display-sm text-[var(--hf-ink)]">{item.title}</h3>
                  <p className="t-body text-[var(--hf-ink-muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="product"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-0)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:px-6">
            <h2 className="t-display text-[var(--hf-ink)]">{t.landing.resultTitle}</h2>
            <p className="t-body-lg max-w-3xl text-[var(--hf-ink-muted)]">
              {t.landing.resultBody}
            </p>
          </div>
        </section>

        <section
          id="how"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="t-display mb-8 text-[var(--hf-ink)]">{t.landing.howTitle}</h2>
            <ol className="grid gap-0 border-t border-[var(--hf-rule)] md:grid-cols-2">
              {howSteps.map((step, index) => (
                <li
                  key={step}
                  className="grid gap-2 border-b border-[var(--hf-rule)] py-5 md:odd:border-r md:odd:pr-6 md:even:pl-6"
                >
                  <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="t-body max-w-[52ch] text-[var(--hf-ink)]">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="signals"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-0)]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="t-display mb-8 text-[var(--hf-ink)]">
              {t.landing.signalsTitle}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {signals.map((item, index) => (
                <article key={item.title} className="grid gap-2">
                  <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="t-display-sm text-[var(--hf-ink)]">{item.title}</h3>
                  <p className="t-body text-[var(--hf-ink-muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="audience"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:px-6">
            <h2 className="t-display text-[var(--hf-ink)]">{t.landing.audienceTitle}</h2>
            <p className="t-body-lg max-w-3xl text-[var(--hf-ink)]">
              {t.landing.audienceFor}
            </p>
            <p className="t-body max-w-3xl text-[var(--hf-ink-muted)]">
              {t.landing.audienceNot}
            </p>
          </div>
        </section>

        <section
          id="limits"
          className="border-b border-[var(--hf-rule)] bg-[var(--hf-ground-0)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:px-6">
            <h2 className="t-display text-[var(--hf-ink)]">{t.landing.limitsTitle}</h2>
            <p className="t-body-lg max-w-3xl text-[var(--hf-ink-muted)]">
              {t.landing.limitsBody}
            </p>
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
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
              >
                {t.landing.ctaConnect}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/demo"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "shrink-0",
                )}
              >
                {t.landing.ctaDemo}
              </Link>
            </div>
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
            <p className="t-mono-sm text-[var(--hf-ink-faint)]">
              {t.landing.footerStatus}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
