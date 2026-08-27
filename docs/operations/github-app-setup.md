# Configuración de GitHub App (sincronización de repositorios)

HubForge sincroniza issues, pull requests, commits y check runs mediante una **GitHub App** (no personal access tokens).

Eso es independiente del **login de usuarios**: el inicio de sesión usa una OAuth App de GitHub configurada en Supabase Authentication. Credenciales, callbacks y eventos no se comparten entre ambos sistemas.

Rutas de sincronización:

1. **Webhooks** — actualizaciones incrementales cuando GitHub dispara eventos
2. **API backfill** — tras vincular (o mediante **Sync now**), HubForge usa el JWT de la App + installation token para importar issues recientes (~50), PRs (~40), commits (~40) y check runs (best-effort)

## 1. Crear la GitHub App

1. Abrir https://github.com/settings/apps/new
2. Homepage URL: URL de producción de la app (`https://hubforge-six.vercel.app`) o `http://localhost:3000` mientras pruebas
3. Setup URL: `https://hubforge-six.vercel.app/api/github/setup` (almacena `installation_id`; pasa `state=<organizationId>` desde HubForge)
4. Webhook URL: `https://hubforge-six.vercel.app/api/github/webhooks`
5. Webhook secret: genera una cadena aleatoria larga
6. Permissions (Repository):
   - Issues: Read & write
   - Metadata: Read-only
   - Pull requests: Read-only
   - Contents: Read-only (commit metadata)
   - Checks: Read-only (check runs / check suites)
7. Subscribe to events: `Issues`, `Pull request`, `Push`, `Installation`, `Installation repositories`, `Check run`, `Check suite`
8. Crear la app y anotar App ID, Client ID, Client secret; generar una private key

El estado live de eventos y permisos de la App **no está verificado** en esta auditoría. No la modifiques todavía.

## 2. Entorno

```bash
GITHUB_APP_ID=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_SLUG=your-app-slug
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` es necesaria para escrituras idempotentes de webhooks y persistencia del API backfill. Nunca la expongas con `NEXT_PUBLIC_`.

## 3. Base de datos

Aplica, en orden y solo cuando se autorice, las migraciones de GitHub App:

1. `supabase/migrations/20260728240000_github_app_sync.sql`
2. `supabase/migrations/20260803200000_operations_history_deps_github_activity.sql`
3. `supabase/migrations/20260804120000_github_synced_check_runs.sql`

La migración `20260804120000_github_synced_check_runs.sql` está en el repositorio. **No está confirmada en el proyecto remoto** hasta listarla con la CLI de Supabase autenticada. No la apliques en esta fase de auditoría.

## 4. Vincular un repositorio

1. Instala la app en la org/usuario propietario del repo
2. Abre HubForge → GitHub
3. Vincula `owner/repo` al proyecto activo **con el installation id** (desde el callback de setup o la configuración de GitHub App)
4. Al vincular (cuando env de App + installation id están presentes), HubForge hace backfill de actividad reciente vía GitHub API
5. Usa **Sync now** cuando quieras para volver a obtener datos; los webhooks mantienen los datos actualizados después
6. Abre/cierra un issue en GitHub; HubForge hace upsert en `github_synced_issues` y refleja una tarea de HubForge
7. Abre o actualiza un pull request; HubForge hace upsert en `github_synced_pull_requests`
8. Haz push de commits; HubForge hace upsert de filas en `github_synced_commits`
9. Tras aplicar la migración de check runs y suscribir `Check run` / `Check suite`, HubForge hace upsert en `github_synced_check_runs` (best-effort; un fallo no tumba el resto de la sync)

Sin credenciales de App o un installation id, aún puedes vincular un repositorio para mostrarlo, pero el API backfill y **Sync now** permanecen deshabilitados hasta que ambos estén configurados.
