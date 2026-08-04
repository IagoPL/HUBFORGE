# Plan de implementación (histórico + puente)

Este documento conserva el historial de fases técnicas tempranas. La definición de producto vigente está en:

- [`docs/product/vision.md`](../product/vision.md)
- [`docs/product/mvp.md`](../product/mvp.md)
- [`docs/roadmap.md`](../roadmap.md)

## Fases 0–2 (hechas)

Bootstrap, tooling, shell visual y verticales iniciales (auth, orgs, tasks, availability, GitHub webhooks, chat Realtime).

## GitHub API backfill (hecho)

`feat/github-api-backfill` integrado en `main`: JWT de App, backfill, Sync now, command palette, `pnpm verify:env`, `GET /api/ready`.

## Reposicionamiento de producto (en curso)

Rama de trabajo: `refactor/product-positioning`.

1. Documentación de producto en español (esta oleada).
2. IA, microcopy, landing, soft-retire de chat en UI.
3. Motor de señales, briefing visit-scoped, Atención, dependencias, capacidad.
4. Modo demostración indie.
5. Pruebas y limpieza de contradicciones restantes en la app.

## Ops en vivo (manual)

Sigue siendo necesario cablear OAuth, GitHub App y secretos. Ver [`docs/operations/production-checklist.md`](../operations/production-checklist.md).

## Post-MVP

Discord (no chat propio), mejoras de señales, posible IA opcional. Sin compromiso de fechas.
