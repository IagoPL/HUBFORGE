import { NextResponse } from "next/server";
import { getEnvReadiness } from "@/lib/env/readiness";

/**
 * Ops readiness probe. Returns booleans only — never secrets.
 * Core (auth) ready → 200; otherwise 503.
 */
export async function GET() {
  const readiness = getEnvReadiness();
  return NextResponse.json(
    {
      ok: readiness.ok,
      authReady: readiness.authReady,
      githubReady: readiness.githubReady,
      emailReady: readiness.emailReady,
      sentryReady: readiness.sentryReady,
      flags: readiness.flags.map(({ id, ok, requiredFor, hint }) => ({
        id,
        ok,
        requiredFor,
        hint,
      })),
    },
    {
      status: readiness.ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
