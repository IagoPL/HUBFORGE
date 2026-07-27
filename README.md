# HubForge

Collaborative project workspace with GitHub synchronization, team availability, roles, planning, communication and real-time notifications.

> Build together without losing context.

## Problem

Small technical and creative teams scatter planning, availability, ownership, chat, and GitHub activity across tools. Context gets lost; blockers stay invisible; the next right task is unclear.

## Solution

HubForge centralizes planning, availability, responsibilities, communication, and technical activity so teams know what to do, who can do it, and what is blocking progress.

## Status

**Bootstrap / foundation** — public demo UI with typed mock data. Authentication, Supabase persistence, and GitHub App sync are planned next.

| Area                                                                | Status                  |
| ------------------------------------------------------------------- | ----------------------- |
| Landing + app shell                                                 | Implemented (demo)      |
| Tasks board + team + calendar views                                 | Implemented (demo data) |
| Design tokens + light/dark                                          | Implemented             |
| Quality tooling (lint, format, typecheck, vitest, playwright smoke) | Implemented             |
| CI workflow                                                         | Implemented             |
| Supabase Auth + RLS data                                            | Planned                 |
| GitHub App sync                                                     | Planned                 |
| Chat + realtime                                                     | Planned                 |

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS
- Zod
- Supabase (prepared, not required for demo UI)
- Vitest + Playwright + axe
- Vercel-ready deployment

## Architecture

Modular monolith: one Next.js app with domain-oriented folders under `src/`. Demo data is isolated behind `getDemoWorkspace()` so screens can later switch to Supabase without a rewrite.

See `docs/architecture/` for ADRs and boundaries.

## Local setup

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` when connecting Supabase. Leave placeholders empty to run the visual demo.

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

## Testing

- Unit: domain parsing and demo graph integrity
- E2E smoke: landing CTA, demo workspace, axe serious/critical gate on landing

## Roadmap (high level)

1. Auth + organizations + projects (vertical slice with real data)
2. Members, roles, tasks, notifications, availability
3. GitHub App integration
4. Chat/realtime and richer planning

## Security

See [SECURITY.md](./SECURITY.md). Never commit secrets. Service role keys stay server-side only.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). AI/agent configuration is intentionally excluded from Git (see `.gitignore`).

## License

MIT — see [LICENSE](./LICENSE).
