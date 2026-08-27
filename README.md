<div align="center">

# HubForge

**Capa operativa sobre GitHub para equipos indie multidisciplinares**

[![CI](https://github.com/IagoPL/HUBFORGE/actions/workflows/ci.yml/badge.svg)](https://github.com/IagoPL/HUBFORGE/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

<br />

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,vercel,github&theme=dark" alt="Next.js, React, TypeScript, Tailwind, Supabase, Vercel, GitHub" width="336" height="48" />

<br />

Descubre qué está frenando vuestro proyecto antes de la próxima reunión.

HubForge convierte issues, pull requests, dependencias y disponibilidad en un briefing operativo que todo el equipo puede entender.

</div>

---

## Estado

**En desarrollo.** Hay código de autenticación, sincronización GitHub (webhooks + backfill), visitas, dependencias y superficies de briefing, pero el producto se está reposicionando. No está listo para producción como capa operativa completa mientras falten señales unificadas, navegación/copy alineados, modo demo y configuración real de OAuth / GitHub App.

| Área                                   | Estado                                 |
| -------------------------------------- | -------------------------------------- |
| Auth GitHub (Supabase)                 | Implementado (requiere env)            |
| Sync GitHub (webhooks + API backfill)  | Implementado (requiere GitHub App)     |
| Visitas, eventos, dependencias         | Base implementada                      |
| Briefing / Atención / motor de señales | En reposicionamiento                   |
| Modo demostración indie                | Pendiente                              |
| Chat en producto                       | Retirado del MVP (soft-retire técnico) |
| Documentación de producto              | Actualizada (ES)                       |

Documentación de producto: [`docs/product/vision.md`](./docs/product/vision.md) · [`docs/product/mvp.md`](./docs/product/mvp.md) · [`docs/roadmap.md`](./docs/roadmap.md)

---

## Problema

GitHub concentra actividad, pero no ofrece contexto comprensible para un equipo indie con programación, arte, diseño, guion, producción y sonido. Tras unos días fuera, cuesta saber qué cambió, qué está bloqueado y cuál es la siguiente acción.

## Solución

HubForge no sustituye GitHub ni Discord. Actúa como capa de interpretación:

1. Conectas el repositorio.
2. Analiza actividad y dependencias.
3. Entregas un briefing priorizado desde tu última visita.
4. Actúas sobre lo que impide avanzar.

---

## Para quién es

- Equipos indie de 3 a 15 personas.
- Estudios pequeños multidisciplinares.
- Proyectos que ya viven en GitHub.
- Equipos distribuidos o a tiempo parcial.

## Para quién no es

- Grandes corporaciones.
- Equipos que no usan GitHub.
- Quienes buscan sustituir Jira por completo.

---

## Stack

| Pieza                                     | Uso                                          |
| ----------------------------------------- | -------------------------------------------- |
| Next.js (App Router) + React + TypeScript | Aplicación                                   |
| Tailwind CSS                              | UI                                           |
| Zod                                       | Validación en fronteras                      |
| Supabase                                  | Auth, Postgres RLS, Realtime (legado chat)   |
| Vitest + Playwright + axe                 | Calidad                                      |
| Vercel                                    | Despliegue (cuando el entorno está cableado) |

Arquitectura: monolito modular. Ver [`docs/architecture/overview.md`](./docs/architecture/overview.md).

---

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Copia `.env.example` a `.env.local`. Sin Supabase configurado, `/app` redirige a login.

```bash
pnpm verify:env
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Guías ops: [`docs/operations/supabase-auth-setup.md`](./docs/operations/supabase-auth-setup.md) · [`docs/operations/github-app-setup.md`](./docs/operations/github-app-setup.md) · [`docs/operations/production-checklist.md`](./docs/operations/production-checklist.md)

---

## Seguridad

Ver [SECURITY.md](./SECURITY.md). Nunca subas secretos. Las service role keys solo viven en el servidor.

## Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licencia

MIT — [LICENSE](./LICENSE).
