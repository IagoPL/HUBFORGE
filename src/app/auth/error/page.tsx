import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sign-in failed",
};

export default async function AuthErrorPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-2">
        <Link href="/" className="t-display-sm text-[var(--hf-accent)]">
          {t.common.brand}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher
            locale={locale}
            labels={{
              language: t.common.language,
              english: t.common.english,
              spanish: t.common.spanish,
            }}
          />
          <ThemeToggle />
        </div>
      </div>

      <section className="panel grid gap-4 p-5">
        <div className="grid gap-1">
          <h1 className="t-display text-pretty text-[var(--hf-ink)]">
            {t.login.failedTitle}
          </h1>
          <p role="alert" className="t-body text-[var(--hf-ink-muted)]">
            {t.login.error}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            {t.login.backToSignIn}
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            {t.login.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
