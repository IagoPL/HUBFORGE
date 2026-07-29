# Protección de ramas

Aplicada en `main` vía GitHub API durante el seguimiento del bootstrap de HubForge (2026-07-28):

- Exigir pull request antes de fusionar
- Required status checks (strict): `Quality`, `E2E smoke`
- Descartar reviews obsoletas
- Required approving review count: `0` (mantenedor en solitario; subir cuando entren colaboradores)
- Enforce for administrators
- Historial lineal obligatorio
- Resolución de conversaciones obligatoria
- Force pushes bloqueados
- Eliminación de ramas bloqueada

## Ajustes de merge

- Squash merge activado
- Merge commits desactivados
- Rebase merge desactivado
- Borrar ramas head al fusionar activado

## Alternativa manual

Si no hay acceso a la API, configura en:

**Settings → Branches → Branch protection rule** para `main`, y después **Settings → General → Pull Requests**.
