/**
 * Prevent open redirects after OAuth by allowing only same-origin relative paths.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/app",
) {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  return candidate;
}
