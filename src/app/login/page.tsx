import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { signInWithGitHub } from "@/features/authentication/actions";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const configured = isSupabaseConfigured();
  const next = safeRedirectPath(params.next);
  const showConfigError = params.error === "supabase-not-configured" || !configured;

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
          <h1 className="t-display text-[var(--hf-ink)]">{t.login.title}</h1>
          <p className="t-body text-[var(--hf-ink-muted)]">{t.login.body}</p>
        </div>

        {showConfigError ? (
          <p
            role="status"
            className="t-body-sm rounded-[var(--radius-md)] bg-[var(--hf-caution-quiet)] px-3 py-2 text-[var(--hf-caution)]"
          >
            {t.login.configWarning}
          </p>
        ) : null}

        <form action={signInWithGitHub} className="grid gap-3">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={!configured}
            className={cn(buttonVariants({ size: "lg" }), "w-full disabled:opacity-60")}
          >
            {t.login.continueGithub}
          </button>
        </form>

        {!configured ? (
          <Link
            href="/app"
            className={cn(buttonVariants({ variant: "outline" }), "flex w-full")}
          >
            {t.login.enterDemo}
          </Link>
        ) : null}
      </section>
    </main>
  );
}
