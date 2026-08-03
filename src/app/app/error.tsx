"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorFallback } from "@/components/shared/error-fallback";

const labels = {
  title: "Workspace error",
  body: "This part of the workspace failed to load. Try again, or go back to the briefing.",
  retry: "Try again",
  home: "Briefing",
};

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorFallback labels={labels} error={error} reset={reset} homeHref="/app" />;
}
