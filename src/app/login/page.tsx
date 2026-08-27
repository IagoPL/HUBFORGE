import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LoginScreen } from "@/features/authentication/login-screen";
import { isPublicSignInError } from "@/features/authentication/sign-in-errors";
import { signInWithGitHub } from "@/features/authentication/actions";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
  const showError = configured && isPublicSignInError(params.error);

  if (!configured && process.env.NODE_ENV === "development") {
    console.warn("Auth environment is incomplete.");
  }

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

      <LoginScreen
        copy={t.login}
        configured={configured}
        showError={showError}
        next={next}
        action={signInWithGitHub}
      />
    </main>
  );
}
