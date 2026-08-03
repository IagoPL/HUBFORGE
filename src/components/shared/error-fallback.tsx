"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorFallbackLabels = {
  title: string;
  body: string;
  retry: string;
  home: string;
};

/**
 * Shared recovery surface for App Router error boundaries.
 * Keeps the drafting-system grammar: one job, no decorative chrome.
 */
export function ErrorFallback({
  labels,
  error,
  reset,
  homeHref = "/",
}: {
  labels: ErrorFallbackLabels;
  error: Error & { digest?: string };
  reset?: () => void;
  homeHref?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="t-display text-[var(--hf-ink)]">{labels.title}</h1>
      <p className="t-body text-[var(--hf-ink-muted)]">{labels.body}</p>
      {error.digest ? (
        <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
          {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {reset ? (
          <button type="button" onClick={reset} className={cn(buttonVariants())}>
            {labels.retry}
          </button>
        ) : null}
        <Link href={homeHref} className={cn(buttonVariants({ variant: "outline" }))}>
          {labels.home}
        </Link>
      </div>
    </main>
  );
}
