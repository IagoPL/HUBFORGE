# Modelo de dominio (orientación)

Monolito modular Next.js + Supabase. Los dominios evolucionan hacia fronteras de producto, no hacia carpetas vacías.

## Dominios objetivo

| Dominio | Responsabilidad |
| --- | --- |
| `authentication` | Sesión GitHub vía Supabase |
| `organizations` | Espacios y pertenencia (infra) |
| `teams` | Miembros, roles de acceso y funcionales |
| `github` | App, webhooks, backfill, vínculo de repo |
| `work` | Trabajo ejecutable (lista + Kanban secundario) |
| `dependencies` | Grafo e impacto de bloqueos |
| `briefing` | Resumen desde la última visita |
| `attention` | Cola priorizada de señales |
| `capacity` | Disponibilidad orientada a asignación |
| `signals` | Motor determinista hecho/inferencia |

## Dominios en retirada de producto (MVP)

| Dominio | Estado |
| --- | --- |
| `chat` | Soft-retire: schema/código pueden permanecer; fuera de nav, landing y docs de producto |

## Entidades clave (existentes)

- Organización, proyecto, miembro, invitación.
- Tarea, asignación, dependencia, evento de tarea, visita.
- Repositorio vinculado, issue/PR/commit sincronizados, entregas de webhook.
- Entrada de disponibilidad, notificación interna.
- Canales/mensajes de chat (legado; no MVP).

## Multi-tenant

Toda entidad de proyecto resuelve a organización + proyecto. RLS y comprobaciones de servidor se conservan. Ver ADR 0005.
