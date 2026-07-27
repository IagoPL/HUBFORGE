import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
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
          Authentication will use GitHub OAuth via Supabase. This bootstrap screen is
          visual only—continue into the demo workspace without credentials.
        </p>
        <form className="mt-6 space-y-4" aria-label="Sign in preview">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@studio.example"
              disabled
              className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3 text-[var(--hf-fg)] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <Button type="button" disabled className="w-full">
            Continue with GitHub (coming soon)
          </Button>
        </form>
        <Link
          href="/app"
          className={cn(buttonVariants({ variant: "outline" }), "mt-3 flex w-full")}
        >
          Enter demo workspace
        </Link>
      </section>
    </main>
  );
}
