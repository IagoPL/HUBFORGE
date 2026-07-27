/**
 * Public Supabase configuration helpers.
 * Prefer publishable key when present; fall back to legacy anon key.
 */

export type PublicSupabaseConfig = {
  url: string;
  key: string;
};

function isPlaceholderUrl(url: string) {
  return url.includes("your-project") || url.includes("example.supabase");
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key || isPlaceholderUrl(url)) {
    return null;
  }

  return { url, key };
}

export function isSupabaseConfigured() {
  return getPublicSupabaseConfig() !== null;
}
