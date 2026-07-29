#!/usr/bin/env node
/**
 * Writes local (gitignored) Cursor rules for HubForge + Ponytail.
 * Safe to re-run. Does not touch global Cursor config.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rulesDir = join(root, ".cursor", "rules");
mkdirSync(rulesDir, { recursive: true });

const files = {
  "ponytail.mdc": `---
description: Ponytail, lazy senior dev mode. Always pick the simplest solution that works.
alwaysApply: true
---

# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Intensity: **full** (not ultra).

Not lazy about: input validation at trust boundaries, error handling that prevents data loss, security, accessibility, multi-tenant authorization, anything explicitly requested.
`,

  "project-architecture.mdc": `---
description: HubForge modular monolith boundaries
alwaysApply: true
---

# Architecture

- Modular monolith: Next.js app + Supabase managed services.
- Organize by domain when modules have real code; do not create empty feature folders.
- Keep presentation, domain, data access, authz, and external integrations separated.
- Demo data must stay behind clear adapters (\`getDemoWorkspace\`).
- Do not edit applied migrations; add new ones.
- Do not introduce microservices, Redux, CQRS, or generic repository layers without a documented need.
`,

  "git-workflow.mdc": `---
description: HubForge git identity and PR workflow
alwaysApply: true
---

# Git workflow

- Never commit on \`main\` directly for product work.
- Branch from updated \`main\` using feat/fix/refactor/docs/test/chore prefixes.
- Conventional Commits; author must be Iago Prieto Lamas with the configured noreply email.
- Run \`pnpm verify:git-identity\` before committing.
- No Co-authored-by AI trailers.
- No secrets in diffs.
- Open a PR; do not force-push \`main\`.

## Autoría de Git

Cursor puede analizar, editar, ejecutar pruebas y preparar cambios, pero nunca debe atribuirse commits.

Antes de cada commit debe comprobar:

- La cuenta GitHub activa es \`IagoPL\`.
- El remoto pertenece a \`IagoPL/HubForge\`.
- El nombre local es \`Iago Prieto Lamas\`.
- El correo local está verificado para \`IagoPL\`.
- El mensaje no contiene coautorías ni atribuciones a herramientas de IA.
- El script de validación de identidad ha finalizado correctamente.

Cursor no puede:

- Utilizar \`cursoragent\` como autor o committer.
- Añadirse como coautor.
- Añadir trailers \`Generated-by\`.
- Usar \`--no-verify\`.
- Hacer push directo a \`main\`.
- Modificar la identidad Git sin autorización.
- Crear commits desde agentes remotos que impongan una identidad propia.

Dependabot mantiene la autoría de sus propios commits.

Si Cursor Cloud Agent o Background Agent obliga a usar \`cursoragent\`, esos agentes no pueden publicar commits en este repositorio. Deben limitarse a proponer cambios o parches. Los commits y ramas deben crearse desde el entorno local autenticado como \`IagoPL\`.
`,

  "frontend-quality.mdc": `---
description: Frontend TypeScript and React quality
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Frontend quality

- TypeScript strict; no \`any\` unless documented exception.
- Server Components by default; Client Components only when needed.
- Do not silence ESLint/TS to hide problems.
- Prefer small components; avoid kitchen-sink utils.
- No unnecessary global state.
`,

  "ui-design-system.mdc": `---
description: HubForge visual system
globs: src/**/*.{ts,tsx,css}
alwaysApply: false
---

# UI design

- Use CSS tokens (\`--hf-*\`); no random one-off palette values.
- Avoid purple SaaS clichés and cream+terracotta template aesthetics.
- Mobile first; verify key widths (360–1440).
- One job per section; strong brand presence on marketing surfaces.
`,

  "accessibility.mdc": `---
description: Accessibility requirements
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Accessibility

- Target WCAG 2.2 AA.
- Keyboard navigation and visible focus required.
- Semantic HTML first; ARIA as supplement.
- Honor \`prefers-reduced-motion\`.
`,

  "backend-security.mdc": `---
description: Security defaults for HubForge
alwaysApply: true
---

# Security

- Secrets only in env; never log them.
- Validate boundaries with Zod.
- Verify sessions on the server.
- Never expose service role keys to the browser.
- Webhooks must verify signatures and be idempotent when added.
`,

  "database.mdc": `---
description: Supabase and Postgres rules
globs: supabase/**/*.{sql,toml}
alwaysApply: false
---

# Database

- RLS on exposed tables.
- Every project resource ties to organization + project.
- Prefer security invoker views.
- Do not trust UI hiding for authorization.
`,

  "testing.mdc": `---
description: Testing strategy
globs: "**/*.{test,spec}.{ts,tsx}"
alwaysApply: false
---

# Testing

- Prefer critical behavior over coverage percentage.
- Unit: validators, permissions, transforms.
- E2E: auth/org/project/task/availability flows as they land.
- Include accessibility checks on primary pages.
`,

  "documentation.mdc": `---
description: Documentation expectations
globs: docs/**/*.md
alwaysApply: false
---

# Documentation

- Update ADRs for significant decisions.
- Keep README status honest (implemented vs planned).
- Do not invent metrics or users.
`,
};

for (const [name, contents] of Object.entries(files)) {
  writeFileSync(join(rulesDir, name), contents, "utf8");
}

writeFileSync(
  join(root, "AGENTS.md"),
  `# HubForge agents

Local-only guidance. This file is gitignored.

- Read \`docs/architecture/overview.md\` and ADRs before large changes.
- Follow Ponytail **full** mode without sacrificing security or accessibility.
- Work on feature branches; verify git identity before commits.
- Keep secrets out of the repo.

## Autoría de Git

Cursor puede analizar, editar, ejecutar pruebas y preparar cambios, pero nunca debe atribuirse commits.

Antes de cada commit debe comprobar:

- La cuenta GitHub activa es \`IagoPL\`.
- El remoto pertenece a \`IagoPL/HubForge\`.
- El nombre local es \`Iago Prieto Lamas\`.
- El correo local está verificado para \`IagoPL\`.
- El mensaje no contiene coautorías ni atribuciones a herramientas de IA.
- El script \`pnpm verify:git-identity\` ha finalizado correctamente.

Cursor no puede:

- Utilizar \`cursoragent\` como autor o committer.
- Añadirse como coautor.
- Añadir trailers \`Generated-by\`.
- Usar \`--no-verify\`.
- Hacer push directo a \`main\`.
- Modificar la identidad Git sin autorización.
- Crear commits desde agentes remotos que impongan una identidad propia.

Dependabot mantiene la autoría de sus propios commits.

Si Cursor Cloud Agent o Background Agent obliga a usar \`cursoragent\`, esos agentes no pueden publicar commits en este repositorio. Deben limitarse a proponer cambios o parches. Los commits y ramas deben crearse desde el entorno local autenticado como \`IagoPL\`.
`,
  "utf8",
);

console.log(`Wrote local agent files to ${rulesDir} and AGENTS.md (gitignored).`);
