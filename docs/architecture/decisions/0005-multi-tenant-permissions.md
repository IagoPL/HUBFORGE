# ADR 0005 — Permisos multi-tenant

- Estado: Aceptado
- Fecha: 2026-07-28

## Contexto

HubForge aloja múltiples organizaciones. Las lecturas/escrituras entre tenants son inaceptables.

## Decisión

Modelar `organization → project → resources`. Aplicar autorización en:

1. Server actions / route handlers
2. Políticas RLS de Postgres
3. Autorización de canales Realtime

Separar **roles de acceso** (Owner, Admin, Project Manager, Lead, Member, Guest) de **roles funcionales** (puestos/responsabilidades).

## Consecuencias

- Modelo de membresía un poco más complejo
- Lenguaje de producto más claro y valores por defecto más seguros
