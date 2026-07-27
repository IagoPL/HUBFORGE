# ADR 0005 — Multi-tenant permissions

- Status: Accepted
- Date: 2026-07-28

## Context

HubForge hosts multiple organizations. Cross-tenant reads/writes are unacceptable.

## Decision

Model `organization → project → resources`. Enforce authorization in:

1. Server actions / route handlers
2. Postgres RLS policies
3. Realtime channel authorization

Separate **access roles** (Owner, Admin, Project Manager, Lead, Member, Guest) from **functional roles** (job titles/responsibilities).

## Consequences

- Slightly more complex membership model
- Clearer product language and safer defaults
