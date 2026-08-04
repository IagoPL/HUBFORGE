# Visión general de arquitectura

HubForge es un **monolito modular**: una aplicación Next.js con servicios gestionados de Supabase.

```text
src/
  app/                 # rutas (landing, auth, app shell, APIs)
  components/          # UI compartida, shell, operaciones, landing
  features/            # dominios con código real
  lib/                 # utilidades, dominio, operaciones, señales, supabase
```

## Fronteras

| Preocupación     | Regla                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Presentación     | Sin acceso privilegiado a Supabase desde componentes visuales      |
| Tipos de dominio | Schemas Zod en `lib/domain` (y señales deterministas comprobables) |
| Datos            | Postgres Supabase con RLS                                          |
| Secretos         | Solo en entorno; nunca en logs                                     |
| Multi-tenant     | Toda entidad de proyecto resuelve a org + proyecto                 |

## Dominios cercanos (producto)

Authentication → Organizations (infra) → Teams → GitHub → Work → Dependencies → Briefing → Attention → Capacity → Signals

Chat queda fuera del MVP de producto (ADR 0006); el código/schema pueden permanecer en soft-retire.

Solo se crean carpetas de feature cuando contienen código real. Ver [domain-model.md](./domain-model.md) y [signal-engine.md](./signal-engine.md).
