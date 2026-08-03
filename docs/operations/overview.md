# Operations notes

## Environments

| Environment | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| Local       | `pnpm dev` + `.env.local`                            |
| Preview     | Vercel PR previews (project `hubforge`)              |
| Production  | `https://hubforge-six.vercel.app` + Supabase         |

Production readiness: [production-checklist.md](./production-checklist.md). Probe: `GET /api/ready`.

## Secrets

Store only in environment providers (Vercel/Supabase/GitHub Actions). Never in Git.

## Observability

Optional Sentry — see [error-tracking.md](./error-tracking.md).

## Packaging

Free soft caps (abuse guards) — see [packaging-limits.md](./packaging-limits.md). No Stripe while the product stays free.

## Email

Optional Resend for member invites — see [email-setup.md](./email-setup.md).
