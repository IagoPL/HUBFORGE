# Configuración de Supabase Auth (GitHub OAuth)

HubForge usa Supabase Auth con GitHub como primer proveedor y Next.js `proxy.ts` para refrescar la sesión.

## 1. Crear un proyecto Supabase

1. Crea un proyecto en https://supabase.com/dashboard
2. Copia Project URL y publishable (o anon) key

HubForge en producción usa actualmente el project ref `pnpkgfhpwvdkhbncfwqz`.

## 2. Entorno local

```bash
cp .env.example .env.local
```

Configura:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para producción en Vercel, configura `NEXT_PUBLIC_APP_URL` con el dominio público
(p. ej. `https://hubforge-six.vercel.app`).

`NEXT_PUBLIC_SUPABASE_ANON_KEY` sigue aceptándose como fallback.

Nunca pongas la service role key en variables `NEXT_PUBLIC_*`.

Comprueba la preparación sin imprimir secretos:

```bash
pnpm verify:env
```

## 3. GitHub OAuth App

1. Crea una OAuth App en https://github.com/settings/developers
2. Homepage URL: `http://localhost:3000` (y más tarde tu URL de producción)
3. Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copia Client ID y genera un Client Secret

## 4. Habilitar GitHub en Supabase

Dashboard → Authentication → Providers → GitHub:

- Enable provider
- Pega Client ID / Secret
- Save

## 5. Lista de redirecciones permitidas

Dashboard → Authentication → URL Configuration:

- Site URL: origen de producción (p. ej. `https://hubforge-six.vercel.app`)
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://hubforge-six.vercel.app/auth/callback`

## 6. Aplicar migraciones

```bash
# Tras vincular el proyecto con Supabase CLI
npx supabase db push
```

O pega estos archivos en el editor SQL, en orden:

1. `supabase/migrations/20260728190000_profiles.sql`
2. `supabase/migrations/20260728210000_organizations_projects.sql`
3. `supabase/migrations/20260728220000_members_roles_tasks.sql`
4. `supabase/migrations/20260728230000_availability_notifications.sql`
5. `supabase/migrations/20260728240000_github_app_sync.sql`
6. `supabase/migrations/20260728250000_chat_realtime.sql`
7. `supabase/migrations/20260803200000_operations_history_deps_github_activity.sql`
8. `supabase/migrations/20260804120000_github_synced_check_runs.sql` (presente en el repo; aplicación remota no verificada en la auditoría de staging)

Consulta también `docs/operations/github-app-setup.md` y `docs/operations/production-checklist.md`. No apliques migraciones remotas hasta que se autorice.

## 7. Verificar

1. `pnpm verify:env` (flags de auth OK)
2. `pnpm dev`
3. Abre `/login`
4. Continue with GitHub
5. Aterriza en `/app` con tu nombre en la cabecera
6. Sign out

Sin Auth configurada, `/login` muestra un estado neutro (“no disponible temporalmente”), el botón de GitHub permanece deshabilitado y `/app` redirige a `/login`. La UI pública no debe mostrar nombres de variables ni detalles de Supabase. No hay workspace demo offline.
