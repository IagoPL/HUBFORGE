import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

/**
 * Browser Supabase client.
 * Returns null when env is not configured so the demo UI can still render.
 */
export function createSupabaseBrowserClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.key);
}
