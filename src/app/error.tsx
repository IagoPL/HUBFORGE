"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorFallback } from "@/components/shared/error-fallback";

const labels = {
  title: "Something went wrong",
  body: "The page failed to render. You can try again, or return home.",
  retry: "Try again",
  home: "Home",
};

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorFallback labels={labels} error={error} reset={reset} />;
}
