# Contribuir a HubForge

Gracias por ayudar a construir HubForge.

## Reglas básicas

1. No subas secretos (`.env`, claves, tokens).
2. No desarrolles ni hagas commits directamente en `main`.
3. Usa ramas de vida corta y Pull Requests.
4. La configuración de agentes/IA es local: `.cursor/`, `AGENTS.md`, etc. están en `.gitignore`.
5. Verifica la identidad Git antes de hacer commit (`pnpm verify:git-identity`).
6. Autoría: commits solo como IagoPL en este repositorio; sin coautores de herramientas de IA.
7. Dependabot mantiene la autoría de sus propios commits.

## Política permanente de ramas

Obligatoria para humanos y agentes:

1. Nunca modificar ni hacer commits directamente sobre `main`.
2. Antes de tocar archivos, comprobar: repositorio, rama actual, estado del worktree, SHA de la base e identidad Git (`pnpm verify:git-identity`).
3. Cada funcionalidad, corrección, refactorización o bloque documental va en una rama dedicada.
4. Nombres descriptivos: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`.
5. No mezclar trabajos independientes en una misma rama.
6. No reutilizar una rama ya integrada para trabajo nuevo.
7. No hacer force push ni reescribir historial compartido.
8. No hacer push, abrir PR, mergear o desplegar sin autorización expresa.
9. Antes de cada commit, ejecutar `pnpm verify:git-identity`.
10. Autor y committer exclusivamente: `Iago Prieto Lamas <50492345+IagoPL@users.noreply.github.com>`.
11. No añadir `Co-authored-by` de Cursor, Codex, Claude ni ninguna IA.
12. Si el worktree contiene cambios ajenos, detenerse y explicar su procedencia antes de continuar.
13. No versionar configuraciones privadas de Cursor u otras herramientas de agente.

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

Usa `node scripts/commit-clean.mjs "title" "body"` para evitar trailers inyectados por el IDE.

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

Finales de línea: el repo usa **LF** (`.gitattributes`, `.editorconfig`, Prettier `endOfLine: "lf"`). En Windows configura `git config --local core.autocrlf false` y lee [`docs/operations/line-endings.md`](./docs/operations/line-endings.md). No ejecutes `git add --renormalize .` sin autorización.

## Asignación pendiente (persona aún no en GitHub)

Cuando debas asignar trabajo a alguien que todavía no es miembro/colaborador del repositorio:

1. No inventes usernames ni elijas a alguien “parecido”.
2. No asignes temporalmente a IagoPL ni a otro integrante.
3. Crea la tarea/issue **sin assignee**.
4. Añade la nota de asignación pendiente (sin duplicarla si ya existe). Ver [`docs/operations/work-assignment.md`](./docs/operations/work-assignment.md).
5. La asignación definitiva la hace Iago manualmente cuando la persona entre al repositorio.

## Producto

Lee [`docs/product/vision.md`](./docs/product/vision.md) y [`docs/product/mvp.md`](./docs/product/mvp.md) antes de proponer features. HubForge no es un Kanban genérico ni un chat que compita con Discord.

## Licencia

Al contribuir aceptas que tu trabajo se publique bajo la licencia MIT del repositorio.
