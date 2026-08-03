/**
 * Shared Sentry init options. Disabled when no DSN is configured so local
 * and preview environments stay quiet without a Sentry project.
 */
export function getSentryOptions() {
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || "";

  return {
    dsn: dsn || undefined,
    enabled: Boolean(dsn),
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.VERCEL_ENV?.trim() ||
      process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    sendDefaultPii: false,
  };
}
