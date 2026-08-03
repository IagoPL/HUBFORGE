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

- Landing, login, app shell
- Live overview / projects / team / tasks / calendar (Supabase-backed)
- Light/dark + responsive + reduced motion

## Planned PR sequence

1. `chore/bootstrap-hubforge` — foundation (this PR)
2. `feat/authentication` — Supabase GitHub OAuth
3. `feat/organizations-projects` — Postgres CRUD + RLS
4. `feat/members-roles-tasks` — invitations, roles, tasks board
5. `feat/availability-notifications` — calendar + internal alerts
6. `feat/github-app-sync` — GitHub App link + signed webhooks (done)
7. `feat/chat-realtime` — project channels + Realtime messages (done)
8. `feat/github-api-backfill` — App JWT, installation token, Sync now / link backfill (done)

Trunk-based: short feature branches into `main`. No `develop` unless coordination pain appears.

## Phase 3 — Live ops

Infra already exists (Supabase project + Vercel `hubforge` + domain `hubforge-six.vercel.app`).
Remaining work is **secrets + provider config** — see `docs/operations/production-checklist.md`.

1. Confirm GitHub OAuth in Supabase + redirect allow list for prod/local
2. Set `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_APP_URL` in `.env.local` / Vercel (auth core)
3. Add `SUPABASE_SERVICE_ROLE_KEY` + GitHub App env for sync (`docs/operations/github-app-setup.md`)
4. Optional: Resend (`docs/operations/email-setup.md`), Sentry (`docs/operations/error-tracking.md`)
5. Verify with `pnpm verify:env` and `GET /api/ready`

## Phase 4 — Post-MVP (later)

- AI assistant for planning / triage
- Sprints, roadmap, and workload analytics
- PWA / push notifications
- Richer chat (threads, reactions) — still no E2E encryption in near term
- Billing stays deferred while the product remains free
