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
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={labels.language}
      className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--hf-rule)] p-0.5"
    >
      {(
        [
          ["en", "EN", labels.english],
          ["es", "ES", labels.spanish],
        ] as const
      ).map(([value, short, full]) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          aria-pressed={locale === value}
          onClick={() => change(value)}
          className={cn(
            "t-label rounded-[var(--radius-sm)] px-2 py-1 transition-colors",
            "duration-[var(--motion-feedback)] focus-visible:outline-2",
            "focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]",
            locale === value
              ? "bg-[var(--hf-ground-3)] text-[var(--hf-ink)]"
              : "text-[var(--hf-ink-faint)] hover:text-[var(--hf-ink)]",
          )}
        >
          {short}
          <span className="sr-only">{full}</span>
        </button>
      ))}
    </div>
  );
}
