import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnvReadiness } from "@/lib/env/readiness";

describe("getEnvReadiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports auth not ready without Supabase public config", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const readiness = getEnvReadiness();
    expect(readiness.ok).toBe(false);
    expect(readiness.authReady).toBe(false);
  });

  it("is auth-ready with public Supabase + app URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pub");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hubforge-six.vercel.app");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GITHUB_APP_ID", "");

    const readiness = getEnvReadiness();
    expect(readiness.authReady).toBe(true);
    expect(readiness.ok).toBe(true);
    expect(readiness.githubReady).toBe(false);
  });
});
