# Configuración de la GitHub App (sincronización de repositorios)

HubForge sincroniza issues mediante una **GitHub App** (no personal access tokens). El login sigue siendo Supabase GitHub OAuth y es independiente.

## 1. Crear la GitHub App

1. Abre https://github.com/settings/apps/new
2. Homepage URL: la URL de tu app (`http://localhost:3000` en local)
3. Webhook URL: `https://<public-host>/api/github/webhooks`
4. Webhook secret: genera una cadena larga aleatoria
5. Permissions (Repository):
   - Issues: Read & write
   - Metadata: Read-only
   - Pull requests: Read-only (actividad más adelante)
6. Subscribe to events: `Issues`, `Installation`, `Installation repositories`
7. Crea la app y anota App ID, Client ID, Client secret, y genera una private key

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

`SUPABASE_SERVICE_ROLE_KEY` es necesaria para escrituras de idempotencia de webhooks. Nunca la expongas con `NEXT_PUBLIC_`.

## 3. Base de datos

Aplica `supabase/migrations/20260728240000_github_app_sync.sql` después de las migraciones anteriores de HubForge.

## 4. Vincular un repositorio

1. Instala la app en la org/usuario que posee el repo
2. Abre HubForge → GitHub
3. Vincula `owner/repo` al proyecto activo (opcionalmente guarda el installation id)
4. Abre/cierra un issue en GitHub; HubForge hace upsert de `github_synced_issues` y refleja una tarea de HubForge marcada con origen GitHub

Sin credenciales de la App, la página de GitHub sigue funcionando en modo demo con localStorage.
