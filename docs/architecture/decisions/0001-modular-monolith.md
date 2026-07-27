# ADR 0001 — Modular monolith

- Status: Accepted
- Date: 2026-07-28

## Context

HubForge needs a maintainable foundation that can grow into auth, multi-tenant data, GitHub sync, and realtime chat without premature distributed complexity.

## Decision

Ship a single Next.js application (modular monolith) with Supabase managed services. Organize by domain as modules gain real code.

## Consequences

- Simple deploy (Vercel + Supabase)
- Clear module boundaries still required
- Microservices/Kafka/Redis deferred until a proven need exists
