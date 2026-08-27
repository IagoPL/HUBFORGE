# Checklist de producción (MVP usable con env)

Dominio de producción objetivo: `https://hubforge-six.vercel.app`  
Proyecto Supabase: `pnpkgfhpwvdkhbncfwqz` (eu-west-1)

Auth de usuario (GitHub OAuth vía Supabase) y la GitHub App (sincronización de repositorios) son sistemas independientes. Configurar uno no habilita el otro.

## Estado conocido (auditoría de staging)

Esta tabla describe lo verificado en auditoría, no un estado de lanzamiento.

| Pieza                                                   | Estado conocido                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Código en `main` con `/api/ready` y sync de check runs  | Integrado en el repositorio                                                                                                        |
| Despliegue en `https://hubforge-six.vercel.app`         | Desactualizado respecto a `main` (`GET /api/ready` responde 404)                                                                   |
| `.env.local` en esta máquina de trabajo                 | Ausente — flags de auth locales en MISS                                                                                            |
| Env de Vercel Production (nombres)                      | No listado: CLI/MCP de Vercel sin autenticar en esta máquina                                                                       |
| GitHub OAuth (Supabase Authentication → GitHub)         | No verificado en dashboard — no modificar todavía                                                                                  |
| Redirect URLs de Auth                                   | Deben incluir `http://localhost:3000/auth/callback` y `https://hubforge-six.vercel.app/auth/callback` — no verificado en dashboard |
| Migración `20260804120000_github_synced_check_runs.sql` | Presente en el repo; **aplicación remota no verificada**                                                                           |
| Eventos GitHub App `Check run` / `Check suite`          | Requeridos por el código; estado live de la App no verificado                                                                      |

Nunca imprimas valores de secretos. Usa `pnpm verify:env` (nombres y OK/MISS).

```bash
pnpm verify:env
curl -s http://localhost:3000/api/ready
```

En producción, cuando el deploy esté al día:

```bash
curl -s https://hubforge-six.vercel.app/api/ready
```

## 1. Auth (login de usuarios — OAuth GitHub)

No confundir con la GitHub App.

1. Supabase → Authentication → Providers → GitHub habilitado con credenciales de **OAuth App** (no App de sincronización)
2. URL Configuration:
   - Site URL: `https://hubforge-six.vercel.app`
   - Redirect URLs incluyen:
     - `http://localhost:3000/auth/callback`
     - `https://hubforge-six.vercel.app/auth/callback`
3. Env local y Vercel (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `NEXT_PUBLIC_APP_URL` — origen público usado en `redirectTo` de OAuth
4. Verificar: `/login` muestra el botón de GitHub habilitado, sin avisos técnicos, y el flujo aterriza en `/app`

`SUPABASE_SERVICE_ROLE_KEY` no es necesaria para el login; sí lo es para sync.

## 2. Sincronización con GitHub (GitHub App)

1. Crear/actualizar GitHub App — `docs/operations/github-app-setup.md`
2. Webhook URL: `https://hubforge-six.vercel.app/api/github/webhooks`
3. Setup URL: `https://hubforge-six.vercel.app/api/github/setup`
4. Eventos: Issues, Pull request, Push, Installation, Installation repositories, **Check run**, **Check suite**
5. Configurar en `.env.local` **y** Vercel (Production + Preview):
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`
   - `GITHUB_APP_PRIVATE_KEY`
   - `GITHUB_APP_SLUG`, `GITHUB_WEBHOOK_SECRET`
6. Base de datos: además de las migraciones anteriores, existe `supabase/migrations/20260804120000_github_synced_check_runs.sql`. **No afirmar que está aplicada en remoto hasta listar migraciones con la CLI autenticada.** No aplicar todavía desde esta fase.
7. Verificar: vincular `owner/repo` con installation id → **Sync now** rellena issues/PRs/commits (check runs son best-effort)

## 3. Opcional

- Email de invitación: `docs/operations/email-setup.md`
- Sentry: `docs/operations/error-tracking.md`

## 4. Desplegar

No desplegar hasta terminar la auditoría de staging y tener Auth + env de producción listos.

1. Fusionar el trabajo de preparación cuando se autorice
2. Confirmar que el env de Vercel Production coincide con las variables de Auth (y de App si la sync entra en el lanzamiento)
3. Redesplegar si se añadió env después del último deploy
4. Smoke: `/` → `/login` (copy pública, sin variables de entorno) → `/app` → crear tarea → enlace de invitación en Team → GitHub Sync now
5. `GET /api/ready` en producción debe devolver JSON con `authReady` (y `githubReady` si aplica)

## Listo cuando

- `pnpm verify:env` termina con código 0 para los flags de auth
- `/api/ready` en el entorno desplegado devuelve `"authReady": true`
- Los flags de sincronización con GitHub son true si la sync de repositorios está en el alcance del lanzamiento
- El login público no menciona Supabase, cookies, proxy ni nombres de variables
