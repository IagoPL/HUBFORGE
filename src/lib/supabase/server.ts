import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

/**
 * Server Supabase client for App Router.
 * Never import the service role key into client components.
 */
export async function createSupabaseServerClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
          // Cache headers must be applied by Proxy / Route Handlers when available.
          void headers;
        } catch {
          // Called from a Server Component where cookies are read-only.
        }
      },
    },
  });
}
