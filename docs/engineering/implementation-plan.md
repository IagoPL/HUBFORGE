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
4. `feat/members-roles-tasks` — invitations, roles, tasks board (in progress)
5. `feat/availability-notifications`
6. `feat/github-app-sync`
7. `feat/chat-realtime`

Trunk-based: short feature branches into `main`. No `develop` unless coordination pain appears.
