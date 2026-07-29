# Contribuir a HubForge

Gracias por ayudar a construir HubForge.

## Normas básicas

1. No subas secretos (`.env`, claves, tokens).
2. No desarrolles directamente en `main`.
3. Usa ramas de corta duración y Pull Requests.
4. Mantén la configuración de IA/agentes en local: `.cursor/`, `AGENTS.md` y rutas similares están en `.gitignore`.
5. Verifica la identidad de Git antes de hacer commit (`pnpm verify:git-identity`).

## Nombres de rama

```text
feat/<slug>
fix/<slug>
refactor/<slug>
docs/<slug>
test/<slug>
chore/<slug>
```

## Mensajes de commit

Usa Conventional Commits:

```text
feat(auth): add GitHub OAuth login
fix(webhooks): prevent duplicate issue events
docs(architecture): document module boundaries
```

## Configuración local

1. Instala Node.js 20+ y pnpm 11+.
2. Copia `.env.example` a `.env.local` y completa los valores al integrar Supabase.
3. `pnpm install`
4. `pnpm dev`

## Comprobaciones antes del PR

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Smoke opcional:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Expectativas del PR

- Alcance pequeño y revisable
- Documentación actualizada cuando cambie el comportamiento o la arquitectura
- Sin módulos vacíos especulativos
- Accesibilidad considerada en cambios de UI
