# HubForge

Collaborative project workspace with GitHub synchronization, team availability, roles, planning, communication and real-time notifications.

> Build together without losing context.

## Problem

Small technical and creative teams scatter planning, availability, ownership, chat, and GitHub activity across tools. Context gets lost; blockers stay invisible; the next right task is unclear.

## Solution

HubForge centralizes planning, availability, responsibilities, communication, and technical activity so teams know what to do, who can do it, and what is blocking progress.

## Status

**MVP code complete** — free to use (soft abuse caps, no billing). Sign in needs Supabase + GitHub OAuth env; repository sync needs a GitHub App.

| Area                                                                | Status                                      |
| ------------------------------------------------------------------- | ------------------------------------------- |
| Landing + app shell + i18n (EN/ES)                                  | Implemented                                 |
| Organizations + projects (Postgres + RLS)                           | Implemented                                 |
| Members, access/functional roles, task board                        | Implemented                                 |
| Availability calendar + internal notifications                      | Implemented                                 |
| Project chat channels + Realtime messages                           | Implemented                                 |
| GitHub App link, webhooks, API backfill (issues/PRs/commits)        | Implemented (requires App + env)            |
| GitHub OAuth via Supabase Auth                                      | Implemented (requires env + provider setup) |
| Soft free-tier packaging limits                                     | Implemented (no Stripe)                     |
| Quality tooling (lint, format, typecheck, vitest, playwright smoke) | Implemented                                 |
| CI + branch protection on `main`                                    | Implemented                                 |

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS
- Zod
- Supabase (Auth, Postgres RLS, Realtime)
- Vitest + Playwright + axe
- Vercel-ready deployment

## Architecture

Modular monolith: one Next.js app with domain-oriented folders under `src/`. Signed-in sessions use Supabase with RLS.

See `docs/architecture/` for ADRs and boundaries. Product scope: `docs/product/mvp.md`.

## Local setup

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill Supabase (and optional GitHub App) values. Without Supabase configured, `/app` redirects to login — there is no offline demo workspace.

```bash
pnpm verify:env   # reports missing env flags (no secret values)
```

Production checklist: `docs/operations/production-checklist.md` (domain `hubforge-six.vercel.app`).

- Auth: `docs/operations/supabase-auth-setup.md`
- GitHub App sync: `docs/operations/github-app-setup.md`
- Invite email (optional): `docs/operations/email-setup.md`
- Soft limits: `docs/operations/packaging-limits.md`

### Scripts

| Script                              | Purpose            |
| ----------------------------------- | ------------------ |
| `pnpm dev`                          | Local development  |
| `pnpm lint`                         | ESLint             |
| `pnpm format` / `pnpm format:check` | Prettier           |
| `pnpm typecheck`                    | TypeScript         |
| `pnpm test`                         | Unit tests         |
| `pnpm test:e2e`                     | Playwright smoke   |
| `pnpm build`                        | Production build   |
| `pnpm verify:git-identity`          | Commit author gate |
| `pnpm verify:env`                   | Env readiness flags |

## Testing

- Unit: domain schemas, GitHub helpers (webhooks, App JWT, backfill gates), workspace mapping
- E2E smoke: landing, login CTA, i18n, legal pages, unauthenticated `/app` redirect, axe on landing

## Roadmap

**Done (MVP):** auth wiring, orgs/projects, members/roles/tasks, availability/notifications, GitHub App webhooks + API backfill, chat Realtime, free soft limits.

**Next (ops):** configure live OAuth + GitHub App, optional Vercel deployment.

**Post-MVP:** AI assistant, sprints/analytics, PWA/push, richer chat. Billing remains deferred while the product stays free.

## Security

See [SECURITY.md](./SECURITY.md). Never commit secrets. Service role keys stay server-side only.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). AI/agent configuration is intentionally excluded from Git (see `.gitignore`).

## License

MIT — see [LICENSE](./LICENSE).
