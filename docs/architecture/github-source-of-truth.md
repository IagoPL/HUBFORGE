# GitHub como fuente de verdad

## Regla

GitHub es la fuente de verdad de los objetos que originan en GitHub: issues, pull requests y metadatos de actividad asociados (commits relevantes vía webhook/API).

HubForge es la fuente de verdad de:

- Visitas al proyecto (`project_visits`).
- Dependencias operativas internas y bloqueos declarados por el equipo.
- Roles de acceso y roles funcionales.
- Capacidad / disponibilidad semanal.
- Prioridades y contexto operativo añadido.
- Señales derivadas (hechos e inferencias etiquetadas).

## Implicaciones

- No se borran registros locales ante payloads ambiguos.
- Los webhooks son idempotentes (`github_webhook_deliveries`).
- El backfill y Sync now reconcilian estado reciente sin convertir HubForge en un espejo completo de GitHub Projects.
- Los marcadores de origen evitan bucles de sincronización.
- La UI debe enlazar siempre al HTML de GitHub del elemento cuando exista.

## Relación con el ADR 0004

El ADR 0004 permanece válido en lo esencial. Queda **parcialmente supersedido** en cuanto a “HubForge posee el chat”: el chat deja de ser dominio de producto del MVP (ADR 0006). La propiedad de disponibilidad, roles y planificación operativa se mantiene.
