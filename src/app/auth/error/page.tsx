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
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm text-[var(--hf-fg-muted)]">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
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
