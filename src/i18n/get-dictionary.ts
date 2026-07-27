import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/config";
import { en, type Dictionary } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  es,
};

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const resolved = locale ?? (await getLocale());
  return dictionaries[resolved];
}

export function getDictionarySync(locale: Locale): Dictionary {
  return dictionaries[locale];
}
