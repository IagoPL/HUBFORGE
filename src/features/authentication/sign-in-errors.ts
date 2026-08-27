export const PUBLIC_SIGN_IN_ERROR = "signin";

const SIGN_IN_ERROR_PARAMS = new Set([
  PUBLIC_SIGN_IN_ERROR,
  "oauth-start",
  "auth-code",
  "supabase-not-configured",
]);

export function isPublicSignInError(error: string | undefined) {
  return Boolean(error && SIGN_IN_ERROR_PARAMS.has(error));
}
