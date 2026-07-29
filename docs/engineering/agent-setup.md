# Configuración local de IA / agentes

HubForge mantiene la configuración de IA y agentes **fuera de Git**.

Las rutas ignoradas incluyen:

- `AGENTS.md`
- `.cursor/`
- `.claude/`, `.codex/`, `.windsurf/`, `.mcp.json` y carpetas de agentes relacionadas

## Configuración local requerida

1. Crea `.cursor/rules/` en la raíz del repo (sin seguimiento).
2. Instala Ponytail en modo **full** copiando:

   https://raw.githubusercontent.com/DietrichGebert/ponytail/main/.cursor/rules/ponytail.mdc

   a `.cursor/rules/ponytail.mdc`

3. Añade las reglas de HubForge (arquitectura, flujo Git, frontend, UI, a11y, seguridad, base de datos, testing, documentación) como archivos `.mdc` hermanos. Un script generador puede crearlas en local; deben permanecer sin seguimiento.
4. Opcional: crea un `AGENTS.md` en la raíz resumiendo las restricciones del proyecto para agentes que lo lean.

## Overrides no negociables

Ponytail no debe anular:

- Seguridad / RLS / manejo de secretos
- Requisitos de accesibilidad
- Autorización multi-tenant
- Reglas de identidad Git y flujo de PR

Consulta `docs/engineering/skills-audit.md` para el registro de evaluaciones.
