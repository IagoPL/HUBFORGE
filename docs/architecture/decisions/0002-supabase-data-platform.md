# ADR 0002 — Supabase as data platform

- Status: Accepted
- Date: 2026-07-28

## Context

HubForge needs auth, Postgres, RLS, realtime, and storage without operating a custom backend fleet.

## Decision

Use Supabase (Auth, Postgres, Realtime, Storage) with versioned SQL migrations and RLS on exposed tables. Bootstrap UI may run on typed demo data until credentials exist.

## Consequences

- Fast path to secure multi-tenant data
- Must never expose service role keys to the browser
- Authorization must be enforced in DB policies and server actions, not only UI
