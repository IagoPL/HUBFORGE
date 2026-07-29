"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Density = "comfortable" | "compact";

const KEY = "hubforge-density";
const OPTIONS: { value: Density; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

/**
 * Density is a stated preference, not an inference. Applied to the document so
 * the register travels through CSS instead of React state.
 *
 * Mirrors the external-store shape of `ThemeToggle`: the document is the source
 * of truth and React subscribes to it.
 */
let currentDensity: Density = "comfortable";
const listeners = new Set<() => void>();
let hydrated = false;

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  currentDensity =
    window.localStorage.getItem(KEY) === "compact" ? "compact" : "comfortable";
  document.documentElement.dataset.density = currentDensity;
}

function subscribe(onStoreChange: () => void) {
  ensureHydrated();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): Density {
  ensureHydrated();
  return currentDensity;
}

function getServerSnapshot(): Density {
  return "comfortable";
}

function setDensity(next: Density) {
  currentDensity = next;
  document.documentElement.dataset.density = next;
  window.localStorage.setItem(KEY, next);
  for (const listener of listeners) listener();
}

export function DensityToggle() {
  const density = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="radiogroup"
      aria-label="Row density"
      // Mobile is a triage register with touch targets; density stays desktop-only.
      className="hidden items-center rounded-[var(--radius-md)] border border-[var(--hf-rule)] p-0.5 sm:flex"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={density === value}
          onClick={() => setDensity(value)}
          className={cn(
            "t-label rounded-[var(--radius-sm)] px-2 py-1 transition-colors",
            "duration-[var(--motion-feedback)] focus-visible:outline-2",
            "focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]",
            density === value
              ? "bg-[var(--hf-ground-3)] text-[var(--hf-ink)]"
              : "text-[var(--hf-ink-faint)] hover:text-[var(--hf-ink)]",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
