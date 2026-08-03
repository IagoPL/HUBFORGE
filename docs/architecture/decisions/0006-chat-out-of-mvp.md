# ADR 0006 — Chat fuera del MVP

- Status: Accepted
- Date: 2026-08-04
- Supersedes (parcialmente): menciones de chat como dominio cercano en ADR 0001 y propiedad de chat en ADR 0004

## Context

HubForge se reposiciona como capa de interpretación operativa sobre GitHub para equipos indie. Un chat interno compite con Discord sin aportar el mecanismo central (briefing, atención, bloqueos, capacidad).

## Decision

1. El chat **no** forma parte del MVP de producto ni de la navegación, command palette, landing o documentación comercial.
2. El schema y el código de chat pueden permanecer temporalmente (soft-retire) para evitar migraciones destructivas.
3. No se eliminan tablas ni triggers de chat sin autorización explícita y una migración forward revisada.
4. La mensajería de equipo se abordará, si procede, mediante integración con Discord u otras herramientas externas.

## Consequences

- Menos superficie que mantener en el camino crítico.
- ADR 0001 y 0004 siguen históricos; esta decisión corrige el alcance de producto.
- Hay que actualizar copy, tests e IA que asuman chat como capacidad MVP.

## Soft-retire en la aplicación

- `/app/chat` redirige a `/app?notice=chat-retired` (sin bucle).
- El briefing puede mostrar un aviso no intrusivo cuando llega ese parámetro.
- El chat no aparece en rail, overflow móvil, command palette, landing ni onboarding.
- Tablas, triggers, migraciones e historial de chat **no** se eliminan en esta fase.
