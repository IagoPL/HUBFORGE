# Checklist de producción (MVP usable con env)

Dominio de producción objetivo: `https://hubforge-six.vercel.app`  
Proyecto Supabase: `pnpkgfhpwvdkhbncfwqz` (eu-west-1) — esquema/migraciones ya aplicadas.

## Estado actual (instantánea local)

| Pieza                                                  | Estado                         |
| ------------------------------------------------------ | ------------------------------ |
| Supabase Postgres + tablas RLS                         | Hecho                          |
| `NEXT_PUBLIC_SUPABASE_*` + `NEXT_PUBLIC_APP_URL` local | Presentes en `.env.local`      |
| `SUPABASE_SERVICE_ROLE_KEY`                            | Ausente localmente             |
| Env de GitHub App (`GITHUB_APP_*`, webhook secret)     | Ausente localmente             |
| Proyecto Vercel `hubforge`                             | Vinculado; dominio prod activo |
| Resend / Sentry                                        | Opcional                       |

Ejecutar localmente:

```bash
pnpm verify:env
curl -s http://localhost:3000/api/ready
```

## 1. Auth (requerido para un MVP usable)

1. Supabase → Authentication → Providers → GitHub habilitado con credenciales de OAuth App
2. URL Configuration:
   - Site URL: `https://hubforge-six.vercel.app`
   - Redirect URLs incluyen:
     - `http://localhost:3000/auth/callback`
     - `https://hubforge-six.vercel.app/auth/callback`
3. `.env.local` / env de Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL=https://pnpkgfhpwvdkhbncfwqz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…`
   - `NEXT_PUBLIC_APP_URL=https://hubforge-six.vercel.app` (prod) o `http://localhost:3000` (local)
4. Verificar: iniciar sesión en `/login` → aterrizar en `/app`

## 2. Sincronización con GitHub (requerido para la capacidad MVP completa #8)

1. Crear GitHub App — `docs/operations/github-app-setup.md`
2. Webhook URL: `https://hubforge-six.vercel.app/api/github/webhooks`
3. Setup URL: `https://hubforge-six.vercel.app/api/github/setup`
4. Configurar en `.env.local` **y** Vercel (Production + Preview):
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`
   - `GITHUB_APP_PRIVATE_KEY` (PEM con escapes `\n` o secreto multilínea)
   - `GITHUB_APP_SLUG`, `GITHUB_WEBHOOK_SECRET`
5. Verificar: vincular `owner/repo` con installation id → **Sync now** rellena issues/PRs/commits

## 3. Opcional

- Email de invitación: `docs/operations/email-setup.md`
- Sentry: `docs/operations/error-tracking.md`

## 4. Desplegar

1. Fusionar PR con el trabajo de preparación
2. Confirmar que el env de Vercel Production coincide con la lista anterior
3. Redesplegar si se añadió env después del último deploy
4. Smoke: `/` → `/login` → `/app` → crear tarea → enlace de invitación en Team → GitHub Sync now

## Listo cuando

- `pnpm verify:env` termina con código 0 para los flags de auth
- `/api/ready` devuelve `"authReady": true` en el entorno desplegado
- Los flags de sincronización con GitHub son true si la sync de repositorios está en el alcance del lanzamiento
