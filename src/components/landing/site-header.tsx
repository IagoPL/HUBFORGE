import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hf-border)] bg-[color-mix(in_oklab,var(--hf-bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--hf-fg)]"
        >
          HubForge
        </Link>
        <nav
          aria-label="Marketing"
          className="hidden items-center gap-6 text-sm text-[var(--hf-fg-muted)] md:flex"
        >
          <a href="#problem" className="hover:text-[var(--hf-fg)]">
            Problem
          </a>
          <a href="#product" className="hover:text-[var(--hf-fg)]">
            Product
          </a>
          <a href="#security" className="hover:text-[var(--hf-fg)]">
            Security
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            Open workspace
          </Link>
          <Link href="/app" className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}>
            Open
          </Link>
        </div>
      </div>
    </header>
  );
}
