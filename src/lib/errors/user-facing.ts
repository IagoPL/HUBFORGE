import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type ErrorKey = keyof Dictionary["errors"];

export async function translatedError(key: ErrorKey): Promise<string> {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return t.errors[key];
}

export function mapProviderError(message: string | undefined | null): ErrorKey {
  if (!message) return "generic";
  const value = message.toLowerCase();
  if (value.includes("not authenticated") || value.includes("sign in")) {
    return "authRequired";
  }
  if (value.includes("not configured")) {
    return "notConfigured";
  }
  if (
    value.includes("row-level security") ||
    value.includes("permission denied") ||
    value.includes("42501")
  ) {
    return "permissionDenied";
  }
  if (value.includes("slug already exists") || value.includes("duplicate")) {
    return "slugTaken";
  }
  if (value.includes("name is required") || value.includes("required")) {
    return "nameRequired";
  }
  return "generic";
}
