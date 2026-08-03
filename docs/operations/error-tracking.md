# Error tracking (Sentry)

HubForge reports runtime errors through `@sentry/nextjs` when a DSN is set.

## Environment

```bash
NEXT_PUBLIC_SENTRY_DSN=https://…@….ingest.sentry.io/…
SENTRY_DSN=https://…@….ingest.sentry.io/…   # server/edge (can match public)
SENTRY_ENVIRONMENT=production                 # optional; falls back to VERCEL_ENV
SENTRY_AUTH_TOKEN=                            # optional source-map upload
SENTRY_ORG=
SENTRY_PROJECT=
```

Without a DSN, the SDK stays disabled. App Router `error.tsx` / `global-error.tsx` still show a recovery UI.

## Surfaces

- `src/instrumentation-client.ts` — browser
- `sentry.server.config.ts` / `sentry.edge.config.ts` — Node / Edge
- `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/app/error.tsx` — capture + recovery UI
