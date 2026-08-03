# Operations notes

## Environments

| Environment | Purpose                            |
| ----------- | ---------------------------------- |
| Local       | `pnpm dev` + optional `.env.local` |
| Preview     | Vercel PR previews (to configure)  |
| Production  | Vercel + Supabase (later)          |

## Secrets

Store only in environment providers (Vercel/Supabase/GitHub Actions). Never in Git.

## Observability

Optional Sentry — see [error-tracking.md](./error-tracking.md).

## Packaging

Free-tier org/project/member caps — see [packaging-limits.md](./packaging-limits.md). Billing is deferred until prices are decided.
