# Contributing to HubForge

Thanks for helping build HubForge.

## Ground rules

1. Do not commit secrets (`.env`, keys, tokens).
2. Do not develop directly on `main`.
3. Use short-lived branches and Pull Requests.
4. Keep AI/agent config local — `.cursor/`, `AGENTS.md`, and similar paths are gitignored.
5. Verify Git identity before committing (`pnpm verify:git-identity`).

## Branch naming

```text
feat/<slug>
fix/<slug>
refactor/<slug>
docs/<slug>
test/<slug>
chore/<slug>
```

## Commit messages

Use Conventional Commits:

```text
feat(auth): add GitHub OAuth login
fix(webhooks): prevent duplicate issue events
docs(architecture): document module boundaries
```

## Local setup

1. Install Node.js 20+ and pnpm 11+.
2. Copy `.env.example` to `.env.local` and fill values when integrating Supabase.
3. `pnpm install`
4. `pnpm dev`

## Checks before PR

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Optional smoke:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## PR expectations

- Small, reviewable scope
- Updated docs when behavior or architecture changes
- No speculative empty modules
- Accessibility considered for UI changes
