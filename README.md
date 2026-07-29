<div align="center">

# HubForge

**Plataforma colaborativa para gestionar proyectos, equipos e integración con GitHub**

HubForge centraliza tareas, disponibilidad, responsabilidades, comunicación y actividad técnica para equipos pequeños.

<br>

<p align="center">
  <a href="https://hubforge-six.vercel.app" title="Demo de HubForge">
    <img
      src="https://skillicons.dev/icons?i=vercel&theme=dark"
      width="48"
      height="48"
      alt="Demo de HubForge"
    />
  </a>
  &nbsp;
  <a href="https://github.com/IagoPL/HubForge" title="Repositorio de GitHub">
    <img
      src="https://skillicons.dev/icons?i=github&theme=dark"
      width="48"
      height="48"
      alt="Repositorio de GitHub"
    />
  </a>
</p>

<p align="center">
  <a href="https://github.com/IagoPL/HubForge/actions/workflows/ci.yml">
    <img src="https://github.com/IagoPL/HubForge/actions/workflows/ci.yml/badge.svg" alt="Estado de CI" />
  </a>
  &nbsp;
  <a href="https://github.com/IagoPL/HubForge/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/IagoPL/HubForge" alt="Licencia MIT" />
  </a>
  &nbsp;
  <a href="https://hubforge-six.vercel.app">
    <img src="https://img.shields.io/badge/demo-Vercel-black" alt="Demo en Vercel" />
  </a>
</p>

</div>

---

## Descripción

HubForge es un espacio de trabajo colaborativo para equipos técnicos y creativos pequeños. Une planificación, disponibilidad, roles, tareas, chat de proyecto y actividad de GitHub en una sola aplicación, con modo demo y modo conectado a Supabase.

---

## Problema que resuelve

Los equipos pequeños suelen repartir tareas, calendario, chats y actividad de GitHub entre varias herramientas. El contexto se pierde, los bloqueos quedan ocultos y no queda claro quién puede asumir la siguiente tarea.

---

## Solución

HubForge centraliza esa información en un monolito modular: organizaciones, proyectos, miembros, tablero de tareas, calendario de disponibilidad, notificaciones internas, canales de chat e integración con GitHub App, sin convertirlo en una aplicación genérica de tareas.

---

## Estado actual

El código del MVP está implementado. El **modo demo** funciona sin credenciales. El **modo conectado** requiere configurar Supabase, GitHub OAuth y, para la sincronización de repositorios, una GitHub App.

| Área                                  | Estado                 |
| ------------------------------------- | ---------------------- |
| Landing y estructura de la aplicación | Implementado           |
| Internacionalización (EN/ES)          | Implementado           |
| Organizaciones y proyectos            | Implementado           |
| Miembros, roles y tareas              | Implementado           |
| Calendario de disponibilidad          | Implementado           |
| Notificaciones internas               | Implementado           |
| Canales de chat                       | Implementado           |
| Integración con GitHub App            | Requiere configuración |
| Inicio de sesión con GitHub           | Requiere configuración |
| CI y protección de `main`             | Implementado           |
| Despliegue público                    | Disponible             |

---

## Funcionalidades

### Implementadas

- Landing, shell de aplicación e i18n EN/ES.
- Organizaciones y proyectos con PostgreSQL y RLS.
- Miembros, roles de acceso/funcionales y tablero de tareas.
- Calendario de disponibilidad y notificaciones internas.
- Canales de chat de proyecto con Supabase Realtime.
- Herramientas de calidad: ESLint, Prettier, TypeScript, Vitest y Playwright.
- Validación de identidad de commits y Dependabot activo.

### Requieren configuración

- GitHub OAuth mediante Supabase Auth.
- GitHub App, webhooks y sincronización de issues.
- Variables de entorno de producción en Vercel/Supabase.

### Planificadas

- Asistente de IA.
- Sprints, analítica de carga y roadmap avanzado.
- PWA y notificaciones push.
- Chat enriquecido (más allá de texto plano).

---

## Stack técnico

<p>
  <img
    src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,postgres,vercel,vitest,github&theme=dark&perline=9"
    alt="Stack principal de HubForge"
  />
</p>

**Tecnologías:** Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Zod, Vitest, Playwright, GitHub Actions y Vercel.

---

## Arquitectura

- Monolito modular con Next.js App Router.
- Organización por dominios bajo `src/features`.
- Supabase Auth, PostgreSQL con RLS y Realtime.
- Integración mediante GitHub App y webhooks firmados.
- Modo demo (`getDemoWorkspace`) y modo conectado con sesión verificada en servidor.

Documentación técnica: [`docs/architecture/overview.md`](./docs/architecture/overview.md) y ADRs en [`docs/architecture/decisions/`](./docs/architecture/decisions/). Alcance de producto: [`docs/product/mvp.md`](./docs/product/mvp.md).

---

## Estructura del proyecto

```txt
HubForge
├── src
│   ├── app
│   ├── components
│   ├── features
│   ├── data
│   ├── i18n
│   └── lib
├── supabase
│   └── migrations
├── docs
├── e2e
├── scripts
└── .github
```

---

## Instalación y ejecución local

```bash
pnpm install
pnpm dev
```

Copia `.env.example` a `.env.local` cuando quieras conectar Supabase Auth. Si dejas los valores vacíos o sin configurar, la aplicación arranca en **modo demo**.

| Modo                  | Requisitos                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Demo                  | Solo `pnpm install` y `pnpm dev`                                                                                   |
| Conectado (Auth)      | Supabase + GitHub OAuth — ver [`docs/operations/supabase-auth-setup.md`](./docs/operations/supabase-auth-setup.md) |
| Sincronización GitHub | GitHub App + secretos — ver [`docs/operations/github-app-setup.md`](./docs/operations/github-app-setup.md)         |

### Scripts disponibles

| Comando                    | Descripción                          |
| -------------------------- | ------------------------------------ |
| `pnpm dev`                 | Inicia el entorno de desarrollo      |
| `pnpm lint`                | Ejecuta ESLint                       |
| `pnpm format:check`        | Comprueba el formato                 |
| `pnpm typecheck`           | Comprueba los tipos de TypeScript    |
| `pnpm test`                | Ejecuta las pruebas unitarias        |
| `pnpm test:e2e`            | Ejecuta las pruebas end-to-end       |
| `pnpm build`               | Genera la build de producción        |
| `pnpm verify:git-identity` | Verifica la identidad de los commits |

---

## Pruebas y calidad

- **Vitest** para esquemas de dominio, helpers de GitHub y mapeo del workspace.
- **Playwright** para smoke E2E (landing, flujos demo y acceso).
- **axe** como puerta de accesibilidad en la landing.
- ESLint, TypeScript estricto y Prettier.
- GitHub Actions (`Quality`, `E2E smoke`) y validación de autoría de commits.

---

## Seguridad

- Row Level Security en tablas expuestas.
- Validación de sesiones en el servidor.
- Secretos únicamente en variables de entorno.
- Webhooks de GitHub con verificación de firma.
- Claves de service role solo en servidor.
- Dependabot activo para dependencias y Actions.

Más detalle en [`SECURITY.md`](./SECURITY.md).

---

## Roadmap

### Completado

Auth cableada, organizaciones/proyectos, miembros/roles/tareas, disponibilidad/notificaciones, base de sincronización GitHub App y chat Realtime.

### En curso

Configuración operativa de OAuth en vivo, GitHub App y endurecimiento del despliegue público.

### Próximas fases

Asistente de IA, sprints/analítica, PWA/push y chat más rico.

---

## Documentación

| Documento                                                          | Contenido                 |
| ------------------------------------------------------------------ | ------------------------- |
| [`docs/architecture/overview.md`](./docs/architecture/overview.md) | Arquitectura              |
| [`docs/architecture/decisions/`](./docs/architecture/decisions/)   | ADRs                      |
| [`docs/product/mvp.md`](./docs/product/mvp.md)                     | Alcance del MVP           |
| [`docs/operations/`](./docs/operations/)                           | Operación y configuración |
| [`docs/design/design-system.md`](./docs/design/design-system.md)   | Sistema de diseño         |
| [`docs/engineering/`](./docs/engineering/)                         | Ingeniería y agentes      |

---

## Contribución

Consulta [`CONTRIBUTING.md`](./CONTRIBUTING.md). La configuración de agentes de IA se mantiene local (ver `.gitignore`).

---

## Autor

[Iago Prieto Lamas](https://github.com/IagoPL) — IagoPL

---

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
