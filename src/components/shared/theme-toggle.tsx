"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

let currentTheme: Theme = "light";
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  for (const listener of listeners) listener();
}

function readPreferredTheme(): Theme {
  const stored = window.localStorage.getItem("hubforge-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  currentTheme = readPreferredTheme();
  document.documentElement.dataset.theme = currentTheme;
}

function subscribe(onStoreChange: () => void) {
  ensureHydrated();
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (window.localStorage.getItem("hubforge-theme")) return;
    currentTheme = media.matches ? "dark" : "light";
    document.documentElement.dataset.theme = currentTheme;
    emit();
  };
  media.addEventListener("change", onMedia);
  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onMedia);
  };
}

function getSnapshot(): Theme {
  ensureHydrated();
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  currentTheme = next;
  document.documentElement.dataset.theme = next;
  window.localStorage.setItem("hubforge-theme", next);
  emit();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Toggle color theme</span>
    </Button>
  );
}
