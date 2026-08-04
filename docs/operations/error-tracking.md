# Seguimiento de errores (Sentry)

HubForge reporta errores en runtime mediante `@sentry/nextjs` cuando hay un DSN configurado.

## Entorno

```bash
NEXT_PUBLIC_SENTRY_DSN=https://…@….ingest.sentry.io/…
SENTRY_DSN=https://…@….ingest.sentry.io/…   # server/edge (can match public)
SENTRY_ENVIRONMENT=production                 # optional; falls back to VERCEL_ENV
SENTRY_AUTH_TOKEN=                            # optional source-map upload
SENTRY_ORG=
SENTRY_PROJECT=
```

Sin DSN, el SDK permanece deshabilitado. App Router `error.tsx` / `global-error.tsx` siguen mostrando una UI de recuperación.

## Superficies

- `src/instrumentation-client.ts` — browser
- `sentry.server.config.ts` / `sentry.edge.config.ts` — Node / Edge
- `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/app/error.tsx` — capture + recovery UI
