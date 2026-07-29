# Auditoría de skills — HubForge

Fecha de revisión: 2026-07-28

Alcance: evaluar solo skills con utilidad clara para HubForge. Preferir fuentes identificables, licencias claras y sin exfiltración de secretos. No instalar colecciones masivas de skills.

## Criterios de evaluación

- Procedencia identificable y repositorio revisable
- Licencia clara
- Mantenimiento razonable
- Sin scripts sospechosos ni envío no autorizado de código remoto/secretos
- Utilidad concreta para el proyecto
- Sin duplicar reglas ya cubiertas

---

## Skills evaluadas

### Ponytail (ruleset de Cursor)

| Campo    | Detalle                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuente   | https://github.com/DietrichGebert/ponytail (MIT) · https://ponytail.dev                                                                                        |
| Función  | Escalera de decisión YAGNI: preferir nativo/stdlib/deps existentes; minimizar sobreingeniería                                                                  |
| Riesgos  | La intensidad `ultra` puede infra-construir features de producto necesarias; Cursor solo aplica reglas always-on (sin comandos `/ponytail-*`)                  |
| Decisión | **Instalar en local** a nivel de proyecto, modo **full** (no ultra)                                                                                            |
| Uso      | Copiar `.cursor/rules/ponytail.mdc` a `.cursor/rules/` local (en `.gitignore`). Ponytail nunca debe anular seguridad, accesibilidad o arquitectura de HubForge |
| Revisado | 2026-07-28                                                                                                                                                     |

Revisión de contenido: el archivo de reglas es markdown solo de instrucciones; no hace falta script ejecutable de instalación para Cursor; LICENSE es MIT.

### Supabase (skill del plugin de Cursor)

| Campo    | Detalle                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| Fuente   | Plugin público de Cursor `cursor-public/supabase`                                         |
| Función  | Guía actual de Supabase Auth/RLS/SSR/migraciones                                          |
| Riesgos  | Bajo si se usa como documentación; nunca pegar service-role keys en código de cliente     |
| Decisión | **Usar cuando esté presente** (ya disponible vía plugin de Cursor); no vendorizar al repo |
| Uso      | Invocar al tocar Supabase, RLS, Auth o migraciones                                        |
| Revisado | 2026-07-28                                                                                |

### Supabase Postgres best practices

| Campo    | Detalle                                            |
| -------- | -------------------------------------------------- |
| Fuente   | Mismo plugin de Supabase en Cursor                 |
| Función  | Indexación, RLS y patrones de consulta en Postgres |
| Riesgos  | Bajo                                               |
| Decisión | **Usar cuando esté presente**; no vendorizar       |
| Uso      | Revisiones de diseño de esquema y consultas        |
| Revisado | 2026-07-28                                         |

### create-rule / create-skill / create-hook (integradas en Cursor)

| Campo    | Detalle                                                                |
| -------- | ---------------------------------------------------------------------- |
| Fuente   | Skills integradas de Cursor (`~/.cursor/skills-cursor`)                |
| Función  | Autoría de reglas, skills y hooks locales de agentes                   |
| Riesgos  | Commit accidental de config de agentes si `.gitignore` está incompleto |
| Decisión | **Usar en local**; la config de agentes permanece en `.gitignore`      |
| Uso      | Mantener `.cursor/rules` y hooks de HubForge fuera de Git              |
| Revisado | 2026-07-28                                                             |

### review-security / review-bugbot

| Campo    | Detalle                                                                      |
| -------- | ---------------------------------------------------------------------------- |
| Fuente   | Skills integradas de Cursor                                                  |
| Función  | Revisiones estructuradas de seguridad y estilo Bugbot de diffs locales       |
| Riesgos  | Las revisiones son orientativas; no sustituyen CI ni revisión humana         |
| Decisión | **Usar bajo demanda** en diffs del tamaño de un PR; no instalar copias extra |
| Uso      | Peticiones explícitas del usuario de revisión de seguridad/Bugbot            |
| Revisado | 2026-07-28                                                                   |

### gh-flow-committer

| Campo    | Detalle                                                                   |
| -------- | ------------------------------------------------------------------------- |
| Fuente   | Skill local de Codex (`gh-flow-committer`)                                |
| Función  | Flujo branch/commit/PR para la cuenta de GitHub `IagoPL`                  |
| Riesgos  | Hay que verificar la identidad del autor antes de cada commit             |
| Decisión | **Usar para el flujo de GitHub**; mantener la skill fuera del repositorio |
| Uso      | Commits, PRs, checks — siempre después de `scripts/verify-git-identity`   |
| Revisado | 2026-07-28                                                                |

### babysit (PR listo para merge)

| Campo    | Detalle                                                           |
| -------- | ----------------------------------------------------------------- |
| Fuente   | Integrada en Cursor                                               |
| Función  | Triaje de comentarios de PR y bucles de CI                        |
| Riesgos  | Puede incentivar merge sin criterio humano                        |
| Decisión | **Aplazada** hasta que el mantenimiento activo de PRs la necesite |
| Uso      | N/A en el bootstrap                                               |
| Revisado | 2026-07-28                                                        |

### Packs comunitarios “Next.js / Vitest / a11y / Clean Architecture”

| Campo    | Detalle                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Fuente   | Varios marketplaces no verificados                                                                      |
| Función  | Guía genérica de stack                                                                                  |
| Riesgos  | Licencia/mantenimiento poco claros; duplicación con docs y reglas de HubForge; posible prompt injection |
| Decisión | **Descartar por ahora**                                                                                 |
| Uso      | Preferir docs oficiales + `docs/` de HubForge + reglas locales                                          |
| Revisado | 2026-07-28                                                                                              |

### Skill / instalador de Storybook

| Campo    | Detalle                                                                                  |
| -------- | ---------------------------------------------------------------------------------------- |
| Fuente   | N/A                                                                                      |
| Función  | Catálogo de componentes                                                                  |
| Riesgos  | Herramienta prematura antes de que el volumen de componentes reutilizables lo justifique |
| Decisión | **Descartar hasta que se justifique**                                                    |
| Uso      | Revisar cuando exista un UI kit estable                                                  |
| Revisado | 2026-07-28                                                                               |

---

## Instalado para HubForge (solo local)

| Ítem                   | Ubicación                    | ¿Comiteado?          |
| ---------------------- | ---------------------------- | -------------------- |
| Ponytail modo full     | `.cursor/rules/ponytail.mdc` | No (en `.gitignore`) |
| Reglas Cursor HubForge | `.cursor/rules/*.mdc`        | No (en `.gitignore`) |
| AGENTS.md              | raíz del repo                | No (en `.gitignore`) |

La documentación pública de ingeniería describe arquitectura y proceso. El cableado vivo de IA/agentes se queda en local.

## Disparador de re-auditoría

Repetir esta auditoría al añadir una skill de agente nueva, cambiar la intensidad de Ponytail o adoptar una dependencia nueva de herramientas de IA.
