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
    <header className="sticky top-0 z-40 border-b border-[var(--hf-border)] bg-[var(--hf-bg)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--hf-fg)]"
        >
          {t.common.brand}
        </Link>
        <nav
          aria-label={t.nav.marketing}
          className="hidden items-center gap-6 text-sm text-[var(--hf-fg-muted)] md:flex"
        >
          <a href="#problem" className="hover:text-[var(--hf-fg)]">
            {t.nav.problem}
          </a>
          <a href="#product" className="hover:text-[var(--hf-fg)]">
            {t.nav.product}
          </a>
          <a href="#security" className="hover:text-[var(--hf-fg)]">
            {t.nav.security}
          </a>
        </nav>
        <div className="flex items-center gap-2">
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
            href="/login"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            {t.common.openWorkspace}
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}>
            {t.common.open}
          </Link>
        </div>
      </div>
    </header>
  );
}
