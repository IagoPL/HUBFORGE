"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorFallback } from "@/components/shared/error-fallback";
import "./globals.css";

const labels = {
  title: "Something went wrong",
  body: "HubForge hit an unexpected error. Try again, or return home.",
  retry: "Try again",
  home: "Home",
};

/**
 * Replaces the root layout when it fails. Must include its own html/body.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" data-theme="light" data-density="comfortable">
      <body className="min-h-dvh bg-[var(--hf-ground-0)] text-[var(--hf-ink)] antialiased">
        <ErrorFallback labels={labels} error={error} reset={reset} />
      </body>
    </html>
  );
}
