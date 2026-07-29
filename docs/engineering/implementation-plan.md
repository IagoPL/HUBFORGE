# Plan de implementación

## Fase 0 — Auditoría (esta iteración)

- Entorno, autenticación de GitHub (`IagoPL`), bootstrap de repositorio vacío
- Auditoría de skills + política de instalación local de Ponytail
- ADRs + reglas de Cursor (locales/en `.gitignore`)
- Script de verificación de identidad Git + hook local

## Fase 1 — Herramientas de bootstrap

- App Next.js, TS estricto, lint/format, tokens de Tailwind
- Clientes de Supabase sin secretos
- Vitest + Playwright smoke + CI

## Fase 2 — Experiencia visual

- Landing, preview de login, app shell
- Demo overview / projects / team / tasks / calendar
- Claro/oscuro + responsive + reduced motion

## Secuencia planificada de PRs

1. `chore/bootstrap-hubforge` — fundación (este PR)
2. `feat/authentication` — Supabase GitHub OAuth
3. `feat/organizations-projects` — CRUD en Postgres + RLS
4. `feat/members-roles-tasks` — invitaciones, roles, tablero de tareas
5. `feat/availability-notifications` — calendario + alertas internas
6. `feat/github-app-sync` — enlace GitHub App + webhooks firmados (hecho)
7. `feat/chat-realtime` — canales de proyecto + mensajes Realtime (hecho)

Trunk-based: ramas de feature cortas hacia `main`. Sin `develop` salvo que aparezca dolor de coordinación.

## Fase 3 — Ops en vivo (manual)

- Configurar GitHub OAuth en Supabase (`docs/operations/supabase-auth-setup.md`)
- Crear GitHub App + env de webhook (`docs/operations/github-app-setup.md`)
- Despliegue opcional en Vercel con las mismas variables de entorno

## Fase 4 — Post-MVP (más adelante)

- Asistente de IA para planificación / triaje
- Sprints, roadmap y analítica de carga
- PWA / notificaciones push
- Chat más rico (hilos, reacciones) — sin cifrado E2E a corto plazo
