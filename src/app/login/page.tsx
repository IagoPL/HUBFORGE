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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold"
        >
          {t.common.brand}
        </Link>
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
        </div>
      </div>
      <section className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t.login.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--hf-fg-muted)]">{t.login.body}</p>

        {showConfigError ? (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[var(--hf-warning-soft)] px-3 py-2 text-sm text-[var(--hf-warning)]"
          >
            {t.login.configWarning}
          </p>
        ) : null}

        <form action={signInWithGitHub} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={!configured}
            className={cn(buttonVariants({ size: "lg" }), "w-full disabled:opacity-60")}
          >
            {t.login.continueGithub}
          </button>
        </form>
      </section>
    </main>
  );
}
