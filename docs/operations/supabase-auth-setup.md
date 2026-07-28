# Supabase Auth setup (GitHub OAuth)

HubForge uses Supabase Auth with GitHub as the first provider and Next.js `proxy.ts` for session refresh.

## 1. Create a Supabase project

1. Create a project at https://supabase.com/dashboard
2. Copy Project URL and publishable (or anon) key

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

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is still accepted as a fallback.

Never put the service role key in `NEXT_PUBLIC_*` variables.

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

- Site URL: `http://localhost:3000`
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-production-domain>/auth/callback`

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

See also `docs/operations/github-app-setup.md` for GitHub App wiring.

## 7. Verify

1. `pnpm dev`
2. Open `/login`
3. Continue with GitHub
4. Land on `/app` with your name in the header
5. Sign out

Without env vars, HubForge stays in demo mode and `/app` remains reachable with mock data.
