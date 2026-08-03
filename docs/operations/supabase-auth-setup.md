# Supabase Auth setup (GitHub OAuth)

HubForge uses Supabase Auth with GitHub as the first provider and Next.js `proxy.ts` for session refresh.

## 1. Create a Supabase project

1. Create a project at https://supabase.com/dashboard
2. Copy Project URL and publishable (or anon) key

HubForge production currently uses project ref `pnpkgfhpwvdkhbncfwqz`.

## 2. Local environment

```bash
cp .env.example .env.local
```

Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production on Vercel, set `NEXT_PUBLIC_APP_URL` to the public domain
(e.g. `https://hubforge-six.vercel.app`).

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is still accepted as a fallback.

Never put the service role key in `NEXT_PUBLIC_*` variables.

Check readiness without printing secrets:

```bash
pnpm verify:env
```

## 3. GitHub OAuth App

1. Create an OAuth App at https://github.com/settings/developers
2. Homepage URL: `http://localhost:3000` (and later your production URL)
3. Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and generate a Client Secret

## 4. Enable GitHub in Supabase

Dashboard → Authentication → Providers → GitHub:

- Enable provider
- Paste Client ID / Secret
- Save

## 5. Redirect allow list

Dashboard → Authentication → URL Configuration:

- Site URL: production origin (e.g. `https://hubforge-six.vercel.app`)
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://hubforge-six.vercel.app/auth/callback`

## 6. Apply migrations

```bash
# After linking the project with Supabase CLI
npx supabase db push
```

Or paste these files in the SQL editor, in order:

1. `supabase/migrations/20260728190000_profiles.sql`
2. `supabase/migrations/20260728210000_organizations_projects.sql`
3. `supabase/migrations/20260728220000_members_roles_tasks.sql`
4. `supabase/migrations/20260728230000_availability_notifications.sql`
5. `supabase/migrations/20260728240000_github_app_sync.sql`
6. `supabase/migrations/20260728250000_chat_realtime.sql`
7. `supabase/migrations/20260803200000_operations_history_deps_github_activity.sql`

See also `docs/operations/github-app-setup.md` and `docs/operations/production-checklist.md`.

## 7. Verify

1. `pnpm verify:env` (auth flags OK)
2. `pnpm dev`
3. Open `/login`
4. Continue with GitHub
5. Land on `/app` with your name in the header
6. Sign out

Without Supabase env vars, the sign-in button stays disabled and `/app` redirects to `/login`. There is no offline demo workspace.
