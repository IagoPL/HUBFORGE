# ADR 0004 — Estrategia de sincronización con GitHub

- Estado: Aceptado
- Fecha: 2026-07-28

## Contexto

Issues/PRs nacen en GitHub; HubForge posee disponibilidad, chat, roles funcionales y campos de planificación interna.

## Decisión

- GitHub es la fuente de verdad de los objetos originados en GitHub
- HubForge es la fuente de verdad de los datos de colaboración interna
- Persistir IDs externos; procesar webhooks de forma idempotente; reconciliar periódicamente
- Nunca borrar registros locales ante payloads de webhook ambiguos
- Evitar bucles de sincronización con marcadores claros de origen

## Consecuencias

- Propiedad explícita de campos en la UI
- Más ingeniería de reconciliación, menos bugs silenciosos de pérdida de datos
