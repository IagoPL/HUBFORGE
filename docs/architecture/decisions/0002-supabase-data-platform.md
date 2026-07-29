# ADR 0002 — Supabase como plataforma de datos

- Estado: Aceptado
- Fecha: 2026-07-28

## Contexto

HubForge necesita auth, Postgres, RLS, realtime y storage sin operar una flota de backends propios.

## Decisión

Usar Supabase (Auth, Postgres, Realtime, Storage) con migraciones SQL versionadas y RLS en las tablas expuestas. La UI de bootstrap puede funcionar con datos demo tipados hasta que existan credenciales.

## Consecuencias

- Camino rápido hacia datos multi-tenant seguros
- Nunca exponer service role keys al navegador
- La autorización debe aplicarse en políticas de BD y server actions, no solo en la UI
