# Production checklist (MVP usable with env)

Target production domain: `https://hubforge-six.vercel.app`  
Supabase project: `pnpkgfhpwvdkhbncfwqz` (eu-west-1) — schema/migrations already applied.

## Current status (local snapshot)

| Piece | Status |
| --- | --- |
| Supabase Postgres + RLS tables | Done |
| Local `NEXT_PUBLIC_SUPABASE_*` + `NEXT_PUBLIC_APP_URL` | Present in `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Missing locally |
| GitHub App env (`GITHUB_APP_*`, webhook secret) | Missing locally |
| Vercel project `hubforge` | Linked; production domain live |
| Resend / Sentry | Optional |

Run locally:

```bash
pnpm verify:env
curl -s http://localhost:3000/api/ready
```

## 1. Auth (required for usable MVP)

1. Supabase → Authentication → Providers → GitHub enabled with OAuth App credentials
2. URL Configuration:
   - Site URL: `https://hubforge-six.vercel.app`
   - Redirect URLs include:
     - `http://localhost:3000/auth/callback`
     - `https://hubforge-six.vercel.app/auth/callback`
3. `.env.local` / Vercel env:
   - `NEXT_PUBLIC_SUPABASE_URL=https://pnpkgfhpwvdkhbncfwqz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…`
   - `NEXT_PUBLIC_APP_URL=https://hubforge-six.vercel.app` (prod) or `http://localhost:3000` (local)
4. Verify: sign in at `/login` → land on `/app`

## 2. GitHub sync (required for full MVP capability #8)

1. Create GitHub App — `docs/operations/github-app-setup.md`
2. Webhook URL: `https://hubforge-six.vercel.app/api/github/webhooks`
3. Setup URL: `https://hubforge-six.vercel.app/api/github/setup`
4. Set in `.env.local` **and** Vercel (Production + Preview):
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`
   - `GITHUB_APP_PRIVATE_KEY` (PEM with `\n` escapes or multiline secret)
   - `GITHUB_APP_SLUG`, `GITHUB_WEBHOOK_SECRET`
5. Verify: link `owner/repo` with installation id → **Sync now** fills issues/PRs/commits

## 3. Optional

- Invite email: `docs/operations/email-setup.md`
- Sentry: `docs/operations/error-tracking.md`

## 4. Ship

1. Merge PR with readiness work
2. Confirm Vercel Production env matches the list above
3. Redeploy if env was added after the last deploy
4. Smoke: `/` → `/login` → `/app` → create task → Team invite link → GitHub Sync now

## Done when

- `pnpm verify:env` exits 0 for auth flags
- `/api/ready` returns `"authReady": true` in the deployed environment
- GitHub sync flags true if repository sync is in scope for the launch
