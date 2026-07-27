import { describe, expect, it, afterEach } from "vitest";
import { getPublicSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

describe("supabase config", () => {
  const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of KEYS) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("treats placeholder URLs as unconfigured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    expect(isSupabaseConfigured()).toBe(false);
    expect(getPublicSupabaseConfig()).toBeNull();
  });

  it("accepts publishable key when URL is real", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(isSupabaseConfigured()).toBe(true);
    expect(getPublicSupabaseConfig()?.key).toBe("sb_publishable_test");
  });
});
