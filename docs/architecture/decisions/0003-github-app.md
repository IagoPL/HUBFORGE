# ADR 0003 — GitHub App frente a tokens personales

- Estado: Aceptado
- Fecha: 2026-07-28

## Contexto

La sincronización de repositorios exige acceso durable y de mínimo privilegio entre instalaciones.

## Decisión

Integrar mediante una GitHub App (instalaciones, webhooks, Octokit). Los personal access tokens no son la arquitectura permanente.

## Consecuencias

- Mejor acotación de permisos e instalaciones por cliente
- Exige verificación de firma de webhooks e idempotencia
- La implementación empieza cuando se estabilice el vertical org/project/task
