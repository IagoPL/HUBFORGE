# Implementation plan

## Phase 0 — Audit (this iteration)

- Environment, GitHub auth (`IagoPL`), empty repo bootstrap
- Skills audit + Ponytail local install policy
- ADRs + Cursor rules (local/gitignored)
- Git identity verification script + local hook

## Phase 1 — Bootstrap tooling

- Next.js app, strict TS, lint/format, Tailwind tokens
- Supabase clients without secrets
- Vitest + Playwright smoke + CI

## Phase 2 — Visual experience

- Landing, login preview, app shell
- Demo overview / projects / team / tasks / calendar
- Light/dark + responsive + reduced motion

## Planned PR sequence

1. `chore/bootstrap-hubforge` — foundation (this PR)
2. `feat/authentication` — Supabase GitHub OAuth
3. `feat/organizations-projects` — Postgres CRUD + RLS
4. `feat/members-roles-tasks` — invitations, roles, tasks board
5. `feat/availability-notifications` — calendar + internal alerts
6. `feat/github-app-sync` — GitHub App link + signed webhooks (done)
7. `feat/chat-realtime` — project channels + Realtime messages (done)

Trunk-based: short feature branches into `main`. No `develop` unless coordination pain appears.

## Phase 3 — Live ops (manual)

- Configure GitHub OAuth in Supabase (`docs/operations/supabase-auth-setup.md`)
- Create GitHub App + webhook env (`docs/operations/github-app-setup.md`)
- Optional Vercel deployment with the same env vars

## Phase 4 — Post-MVP (later)

- AI assistant for planning / triage
- Sprints, roadmap, and workload analytics
- PWA / push notifications
- Richer chat (threads, reactions) — still no E2E encryption in near term
