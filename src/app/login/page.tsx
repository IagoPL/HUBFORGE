import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { signInWithGitHub } from "@/features/authentication/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";
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
  const configured = isSupabaseConfigured();
  const next = safeRedirectPath(params.next);
  const showConfigError = params.error === "supabase-not-configured" || !configured;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold"
        >
          HubForge
        </Link>
        <ThemeToggle />
      </div>
      <section className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-6 shadow-[0_20px_50px_-40px_rgba(16,21,28,0.5)]">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--hf-fg-muted)]">
          Continue with GitHub through Supabase Auth. Sessions are cookie-based and
          refreshed by the Next.js proxy.
        </p>

        {showConfigError ? (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[var(--hf-warning-soft)] px-3 py-2 text-sm text-[var(--hf-warning)]"
          >
            Supabase is not configured yet. Add{" "}
            <code className="font-[family-name:var(--font-mono)] text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and a publishable/anon key to{" "}
            <code className="font-[family-name:var(--font-mono)] text-xs">
              .env.local
            </code>
            , then enable the GitHub provider. See{" "}
            <code className="font-[family-name:var(--font-mono)] text-xs">
              docs/operations/supabase-auth-setup.md
            </code>
            .
          </p>
        ) : null}

        <form action={signInWithGitHub} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={!configured}
            className={cn(buttonVariants({ size: "lg" }), "w-full disabled:opacity-60")}
          >
            Continue with GitHub
          </button>
        </form>

        {!configured ? (
          <Link
            href="/app"
            className={cn(buttonVariants({ variant: "outline" }), "mt-3 flex w-full")}
          >
            Enter demo workspace
          </Link>
        ) : null}
      </section>
    </main>
  );
}
