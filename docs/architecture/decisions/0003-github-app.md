# ADR 0003 — GitHub App over personal tokens

- Status: Accepted
- Date: 2026-07-28

## Context

Repository sync requires durable, least-privilege access across installations.

## Decision

Integrate via a GitHub App (installations, webhooks, Octokit). Personal access tokens are not the permanent architecture.

## Consequences

- Better permission scoping and customer installs
- Requires webhook signature verification and idempotency
- Implementation starts after org/project/task vertical slice stabilizes
