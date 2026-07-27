# Operations notes

## Environments

| Environment | Purpose                            |
| ----------- | ---------------------------------- |
| Local       | `pnpm dev` + optional `.env.local` |
| Preview     | Vercel PR previews (to configure)  |
| Production  | Vercel + Supabase (later)          |

## Secrets

Store only in environment providers (Vercel/Supabase/GitHub Actions). Never in Git.

## Observability (later)

Add structured server logs without private message content or tokens.
