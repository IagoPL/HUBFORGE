# Architecture overview

HubForge is a **modular monolith**: one Next.js application with managed Supabase services.

```text
src/
  app/                 # routes (landing, auth preview, app shell pages)
  components/          # ui + shared + shell + landing
  data/                # reserved; domain data lives in Supabase
  lib/                 # utils, domain types, supabase clients
  server/              # reserved for privileged server modules (auth, github, security)
```

## Boundaries

| Concern      | Rule                                                          |
| ------------ | ------------------------------------------------------------- |
| Presentation | No direct privileged Supabase access from visual components   |
| Domain types | Zod schemas in `lib/domain`                                   |
| Data         | Supabase Postgres with RLS                                    |
| Secrets      | Env only; never logged                                        |
| Multi-tenant | Every project entity must resolve to org + project; RLS later |

## Near-term domains

Authentication → Organizations → Projects → Members/Roles → Tasks → Availability → Notifications → GitHub integration → Chat

Only create feature folders when they contain real code.
