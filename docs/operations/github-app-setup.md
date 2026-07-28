# GitHub App setup (repository sync)

HubForge syncs issues through a **GitHub App** (not personal access tokens). Auth login remains Supabase GitHub OAuth and is separate.

## 1. Create the GitHub App

1. Open https://github.com/settings/apps/new
2. Homepage URL: your app URL (`http://localhost:3000` locally)
3. Webhook URL: `https://<public-host>/api/github/webhooks`
4. Webhook secret: generate a long random string
5. Permissions (Repository):
   - Issues: Read & write
   - Metadata: Read-only
   - Pull requests: Read-only (activity later)
6. Subscribe to events: `Issues`, `Installation`, `Installation repositories`
7. Create the app and note App ID, Client ID, Client secret, and generate a private key

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

`SUPABASE_SERVICE_ROLE_KEY` is required for webhook idempotency writes. Never expose it with `NEXT_PUBLIC_`.

## 3. Database

Apply `supabase/migrations/20260728240000_github_app_sync.sql` after the earlier HubForge migrations.

## 4. Link a repository

1. Install the app on the org/user that owns the repo
2. Open HubForge → GitHub
3. Link `owner/repo` to the active project (optionally store the installation id)
4. Open/close an issue on GitHub; HubForge upserts `github_synced_issues` and mirrors a HubForge task marked with GitHub origin

Without App credentials, the GitHub page still works in demo mode using localStorage.
