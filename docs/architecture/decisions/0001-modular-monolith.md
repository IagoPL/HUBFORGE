# ADR 0001 — Monolito modular

- Estado: Aceptado
- Fecha: 2026-07-28

## Contexto

HubForge necesita una base mantenible que pueda crecer hacia auth, datos multi-tenant, sincronización con GitHub y chat en tiempo real, sin complejidad distribuida prematura.

## Decisión

Entregar una única aplicación Next.js (monolito modular) con servicios gestionados de Supabase. Organizar por dominio a medida que los módulos tengan código real.

## Consecuencias

- Despliegue simple (Vercel + Supabase)
- Siguen haciendo falta límites claros entre módulos
- Microservicios/Kafka/Redis aplazados hasta que exista una necesidad demostrada
