/**
 * Only absolute http(s) URLs are accepted as navigable origins.
 * demo:// and hubforge:// stay in metadata, never as sourceUrl.
 */
export function validatedSourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
