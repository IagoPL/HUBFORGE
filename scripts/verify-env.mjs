#!/usr/bin/env node
/**
 * Reports which HubForge env flags are set (never prints values).
 * Loads `.env.local` then `.env` into process.env when present.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

function has(name) {
  return Boolean(process.env[name]?.trim());
}

function isPlaceholderUrl(url) {
  return !url || url.includes("your-project") || url.includes("example.supabase");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

const flags = [
  {
    id: "supabase.public",
    ok: Boolean(supabaseUrl && supabaseKey && !isPlaceholderUrl(supabaseUrl)),
    required: true,
    hint: "NEXT_PUBLIC_SUPABASE_URL + PUBLISHABLE/ANON key",
  },
  {
    id: "app.url",
    ok: has("NEXT_PUBLIC_APP_URL"),
    required: true,
    hint: "NEXT_PUBLIC_APP_URL (prod: https://hubforge-six.vercel.app)",
  },
  {
    id: "supabase.serviceRole",
    ok: has("SUPABASE_SERVICE_ROLE_KEY"),
    required: false,
    hint: "SUPABASE_SERVICE_ROLE_KEY (needed for GitHub webhooks/backfill)",
  },
  {
    id: "github.app",
    ok:
      has("GITHUB_APP_ID") &&
      has("GITHUB_APP_CLIENT_ID") &&
      has("GITHUB_APP_CLIENT_SECRET") &&
      has("GITHUB_APP_PRIVATE_KEY") &&
      has("GITHUB_WEBHOOK_SECRET"),
    required: false,
    hint: "GITHUB_APP_* + GITHUB_WEBHOOK_SECRET",
  },
  {
    id: "email.resend",
    ok: has("RESEND_API_KEY"),
    required: false,
    hint: "RESEND_API_KEY (optional; invites still copyable)",
  },
  {
    id: "observability.sentry",
    ok: has("SENTRY_DSN") || has("NEXT_PUBLIC_SENTRY_DSN"),
    required: false,
    hint: "SENTRY_DSN (optional)",
  },
];

const authReady = flags.filter((f) => f.required).every((f) => f.ok);
const githubReady =
  flags.find((f) => f.id === "supabase.serviceRole")?.ok &&
  flags.find((f) => f.id === "github.app")?.ok;

console.log("HubForge env readiness\n");
for (const flag of flags) {
  const mark = flag.ok ? "OK " : "MISS";
  const tier = flag.required ? "required" : "optional";
  console.log(`[${mark}] ${flag.id} (${tier}) — ${flag.hint}`);
}

console.log("");
console.log(`Auth / core MVP: ${authReady ? "READY" : "NOT READY"}`);
console.log(`GitHub sync:     ${githubReady ? "READY" : "NOT READY"}`);
console.log("");
console.log("Docs: docs/operations/production-checklist.md");

process.exit(authReady ? 0 : 1);
