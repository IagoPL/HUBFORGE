"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { language: string; english: string; spanish: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-md border border-[var(--hf-border)] bg-[var(--hf-surface)] p-0.5"
      role="group"
      aria-label={labels.language}
    >
      <button
        type="button"
        disabled={pending}
        aria-pressed={locale === "en"}
        onClick={() => change("en")}
        className={cn(
          "rounded px-2 py-1 text-xs font-medium transition-colors",
          locale === "en"
            ? "bg-[var(--hf-brand-soft)] text-[var(--hf-brand-strong)]"
            : "text-[var(--hf-fg-muted)] hover:text-[var(--hf-fg)]",
        )}
      >
        EN
        <span className="sr-only">{labels.english}</span>
      </button>
      <button
        type="button"
        disabled={pending}
        aria-pressed={locale === "es"}
        onClick={() => change("es")}
        className={cn(
          "rounded px-2 py-1 text-xs font-medium transition-colors",
          locale === "es"
            ? "bg-[var(--hf-brand-soft)] text-[var(--hf-brand-strong)]"
            : "text-[var(--hf-fg-muted)] hover:text-[var(--hf-fg)]",
        )}
      >
        ES
        <span className="sr-only">{labels.spanish}</span>
      </button>
    </div>
  );
}
