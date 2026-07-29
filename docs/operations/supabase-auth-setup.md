# Configuración de Supabase Auth (GitHub OAuth)

HubForge usa Supabase Auth con GitHub como primer proveedor y el `proxy.ts` de Next.js para refrescar la sesión.

## 1. Crear un proyecto de Supabase

1. Crea un proyecto en https://supabase.com/dashboard
2. Copia la Project URL y la clave publishable (o anon)

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

`NEXT_PUBLIC_SUPABASE_ANON_KEY` sigue aceptándose como fallback.

Nunca pongas la service role key en variables `NEXT_PUBLIC_*`.

## 3. OAuth App de GitHub

1. Crea una OAuth App en https://github.com/settings/developers
2. Homepage URL: `http://localhost:3000` (y después tu URL de producción)
3. Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copia el Client ID y genera un Client Secret

## 4. Activar GitHub en Supabase

Dashboard → Authentication → Providers → GitHub:

- Activa el proveedor
- Pega Client ID / Secret
- Guarda

## 5. Lista de redirects permitidos

Dashboard → Authentication → URL Configuration:

- Site URL: `http://localhost:3000`
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-production-domain>/auth/callback`

## 6. Aplicar migraciones

```bash
# After linking the project with Supabase CLI
npx supabase db push
```

O pega estos archivos en el SQL editor, en orden:

1. `supabase/migrations/20260728190000_profiles.sql`
2. `supabase/migrations/20260728210000_organizations_projects.sql`
3. `supabase/migrations/20260728220000_members_roles_tasks.sql`
4. `supabase/migrations/20260728230000_availability_notifications.sql`
5. `supabase/migrations/20260728240000_github_app_sync.sql`
6. `supabase/migrations/20260728250000_chat_realtime.sql`

Consulta también `docs/operations/github-app-setup.md` para cablear la GitHub App.

## 7. Verificar

1. `pnpm dev`
2. Abre `/login`
3. Continúa con GitHub
4. Llega a `/app` con tu nombre en el header
5. Cierra sesión

Sin variables de entorno, HubForge permanece en modo demo y `/app` sigue accesible con datos mock.
