# GitHub App setup (repository sync)

HubForge syncs issues, pull requests, and commits through a **GitHub App** (not personal access tokens). Auth login remains Supabase GitHub OAuth and is separate.

Sync paths:

1. **Webhooks** — incremental updates when GitHub events fire
2. **API backfill** — after linking (or via **Sync now**), HubForge uses the App JWT + installation token to import recent issues (~50), PRs (~40), and commits (~40)

## 1. Create the GitHub App

1. Open https://github.com/settings/apps/new
2. Homepage URL: your app URL (`http://localhost:3000` locally)
3. Setup URL: `https://<public-host>/api/github/setup` (stores `installation_id`; pass `state=<organizationId>` from HubForge)
4. Webhook URL: `https://<public-host>/api/github/webhooks`
5. Webhook secret: generate a long random string
6. Permissions (Repository):
   - Issues: Read & write
   - Metadata: Read-only
   - Pull requests: Read-only
   - Contents: Read-only (commit metadata)
7. Subscribe to events: `Issues`, `Pull request`, `Push`, `Installation`, `Installation repositories`
8. Create the app and note App ID, Client ID, Client secret, and generate a private key

## 2. Environment

```bash
GITHUB_APP_ID=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_SLUG=your-app-slug
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for webhook idempotency writes and API backfill persistence. Never expose it with `NEXT_PUBLIC_`.

## 3. Database

Apply `supabase/migrations/20260728240000_github_app_sync.sql` and
`supabase/migrations/20260803200000_operations_history_deps_github_activity.sql`
after the earlier HubForge migrations.

## 4. Link a repository

1. Install the app on the org/user that owns the repo
2. Open HubForge → GitHub
3. Link `owner/repo` to the active project **with the installation id** (from the setup callback or GitHub App settings)
4. On link (when App env + installation id are present), HubForge backfills recent activity via the GitHub API
5. Use **Sync now** anytime to re-fetch; webhooks keep data fresh afterward
6. Open/close an issue on GitHub; HubForge upserts `github_synced_issues` and mirrors a HubForge task
7. Open or update a pull request; HubForge upserts `github_synced_pull_requests`
8. Push commits; HubForge upserts rows in `github_synced_commits`

Without App credentials or an installation id, you can still link a repository for display, but API backfill and **Sync now** stay disabled until both are configured.
