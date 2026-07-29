import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="t-display-sm text-[var(--hf-ink)]">
          {t.common.brand}
        </Link>

        <nav
          aria-label={t.nav.marketing}
          className="hidden items-center gap-5 md:flex"
        >
          {(
            [
              ["#problem", t.nav.problem],
              ["#product", t.nav.product],
              ["#security", t.nav.security],
            ] as const
          ).map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="t-body-sm text-[var(--hf-ink-muted)] transition-colors duration-[var(--motion-feedback)] hover:text-[var(--hf-ink)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher
            locale={locale}
            labels={{
              language: t.common.language,
              english: t.common.english,
              spanish: t.common.spanish,
            }}
          />
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            {t.common.signIn}
          </Link>
          <Link
            href="/app"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            {t.common.openWorkspace}
          </Link>
          <Link href="/app" className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}>
            {t.common.open}
          </Link>
        </div>
      </div>
    </header>
  );
}
