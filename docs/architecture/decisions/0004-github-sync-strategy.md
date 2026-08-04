# ADR 0004 — GitHub synchronization strategy

- Status: Accepted (parcialmente supersedido por ADR 0006 respecto al chat)
- Date: 2026-07-28

## Context

Issues/PRs originate on GitHub; HubForge owns availability, functional roles, and internal planning fields. Chat was listed historically and is no longer an MVP product surface (ADR 0006).

## Decision

- GitHub is source of truth for GitHub-originated objects
- HubForge is source of truth for internal collaboration data
- Persist external IDs; process webhooks idempotently; reconcile periodically
- Never delete local records on ambiguous webhook payloads
- Avoid sync loops with clear origin markers

## Consequences

- Explicit field ownership in UI
- More engineering for reconciliation, fewer silent data-loss bugs
