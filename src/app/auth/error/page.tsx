import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Authentication error",
};

const reasons: Record<string, string> = {
  "auth-code": "We could not complete the GitHub sign-in callback.",
  "oauth-start": "GitHub OAuth could not be started. Check Supabase provider settings.",
  "supabase-not-configured":
    "Supabase environment variables are missing. Copy .env.example to .env.local and configure your project.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "auth-code";
  const message = reasons[reason] ?? reasons["auth-code"];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-12">
      <section className="panel grid gap-4 p-5">
        <div className="grid gap-1">
          <p className="t-body-sm inline-flex items-center gap-1.5 font-medium text-[var(--hf-error)]">
            Error
          </p>
          <h1 className="t-display text-[var(--hf-ink)]">Sign-in failed</h1>
          <p className="t-body text-[var(--hf-ink-muted)]">{message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            Back to sign in
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
