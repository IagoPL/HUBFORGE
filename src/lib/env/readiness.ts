import { isGitHubAppConfigured } from "@/features/github/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ReadinessFlag = {
  id: string;
  ok: boolean;
  requiredFor: "auth" | "github-sync" | "email" | "observability" | "core";
  hint: string;
};

function hasEnv(name: string) {
  const value = process.env[name]?.trim();
  return Boolean(value);
}

export function getEnvReadiness() {
  const flags: ReadinessFlag[] = [
    {
      id: "supabase.public",
      ok: isSupabaseConfigured(),
      requiredFor: "auth",
      hint: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    },
    {
      id: "app.url",
      ok: hasEnv("NEXT_PUBLIC_APP_URL"),
      requiredFor: "auth",
      hint: "Set NEXT_PUBLIC_APP_URL to the public origin (OAuth redirectTo)",
    },
    {
      id: "supabase.serviceRole",
      ok: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
      requiredFor: "github-sync",
      hint: "Set SUPABASE_SERVICE_ROLE_KEY for webhooks and GitHub backfill writes",
    },
    {
      id: "github.app",
      ok: isGitHubAppConfigured(),
      requiredFor: "github-sync",
      hint: "Set GITHUB_APP_* and GITHUB_WEBHOOK_SECRET (see docs/operations/github-app-setup.md)",
    },
    {
      id: "email.resend",
      ok: hasEnv("RESEND_API_KEY"),
      requiredFor: "email",
      hint: "Optional: RESEND_API_KEY for invite emails (copyable links work without it)",
    },
    {
      id: "observability.sentry",
      ok: hasEnv("SENTRY_DSN") || hasEnv("NEXT_PUBLIC_SENTRY_DSN"),
      requiredFor: "observability",
      hint: "Optional: SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN",
    },
  ];

  const authReady = flags
    .filter((flag) => flag.requiredFor === "auth")
    .every((flag) => flag.ok);
  const githubReady = flags
    .filter((flag) => flag.requiredFor === "github-sync")
    .every((flag) => flag.ok);
  const coreReady = authReady;

  return {
    ok: coreReady,
    authReady,
    githubReady,
    emailReady: flags.find((flag) => flag.id === "email.resend")?.ok ?? false,
    sentryReady: flags.find((flag) => flag.id === "observability.sentry")?.ok ?? false,
    flags,
  };
}
