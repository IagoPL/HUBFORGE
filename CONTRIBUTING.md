# Contribuir a HubForge

Gracias por ayudar a construir HubForge.

## Reglas básicas

1. No subas secretos (`.env`, claves, tokens).
2. No desarrolles directamente en `main`.
3. Usa ramas de vida corta y Pull Requests.
4. La configuración de agentes/IA es local: `.cursor/`, `AGENTS.md`, etc. están en `.gitignore`.
5. Verifica la identidad Git antes de hacer commit (`pnpm verify:git-identity`).
6. Autoría: commits solo como IagoPL en este repositorio; sin coautores de herramientas de IA.

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

Conventional Commits:

```text
feat(auth): add GitHub OAuth login
fix(webhooks): prevent duplicate issue events
docs(product): redefinir visión operativa sobre GitHub
```

## Configuración local

1. Node.js 20+ y pnpm 11+.
2. Copia `.env.example` a `.env.local`.
3. `pnpm install`
4. `pnpm dev`
5. `pnpm verify:env` para ver flags de entorno (sin imprimir secretos).

## Comprobaciones

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Producto

Lee [`docs/product/vision.md`](./docs/product/vision.md) y [`docs/product/mvp.md`](./docs/product/mvp.md) antes de proponer features. HubForge no es un Kanban genérico ni un chat que compita con Discord.

## Licencia

Al contribuir aceptas que tu trabajo se publique bajo la licencia MIT del repositorio.
