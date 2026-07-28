import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

/**
 * Service-role client for trusted server jobs (webhooks).
 * Never import into client components.
 */
export function createSupabaseAdminClient() {
  const config = getPublicSupabaseConfig();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRole) return null;

  return createClient(config.url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
