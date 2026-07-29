# Visión general de la arquitectura

HubForge es un **monolito modular**: una aplicación Next.js con servicios gestionados de Supabase.

```text
src/
  app/                 # routes (landing, auth preview, app shell pages)
  components/          # ui + shared + shell + landing
  data/                # demo workspace adapters (swap later for Supabase)
  lib/                 # utils, domain types, supabase clients
  server/              # reserved for privileged server modules (auth, github, security)
```

## Límites

| Ámbito       | Regla                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Presentation | Sin acceso privilegiado directo a Supabase desde componentes visuales |
| Domain types | Esquemas Zod en `lib/domain`                                          |
| Demo data    | Detrás de `getDemoWorkspace()`                                        |
| Secrets      | Solo en env; nunca en logs                                            |
| Multi-tenant | Toda entidad de proyecto debe resolver a org + project; RLS después   |

## Dominios a corto plazo

Authentication → Organizations → Projects → Members/Roles → Tasks → Availability → Notifications → GitHub integration → Chat

Solo crea carpetas de feature cuando contengan código real.
