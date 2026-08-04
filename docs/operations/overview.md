# Notas de operaciones

## Entornos

| Entorno    | Propósito                                      |
| ---------- | ---------------------------------------------- |
| Local      | `pnpm dev` + `.env.local`                      |
| Preview    | Previews de PR en Vercel (proyecto `hubforge`) |
| Production | `https://hubforge-six.vercel.app` + Supabase   |

Preparación para producción: [production-checklist.md](./production-checklist.md). Sonda: `GET /api/ready`.

## Secretos

Almacénalos solo en los proveedores de entorno (Vercel/Supabase/GitHub Actions). Nunca en Git.

## Observabilidad

Sentry opcional — consulta [error-tracking.md](./error-tracking.md).

## Empaquetado

Límites suaves gratuitos (protección contra abuso) — consulta [packaging-limits.md](./packaging-limits.md). Sin Stripe mientras el producto siga siendo gratuito.

## Email

Resend opcional para invitaciones de miembros — consulta [email-setup.md](./email-setup.md).
