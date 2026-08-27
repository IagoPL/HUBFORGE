# Protección de ramas

Aplicada en `main` vía GitHub API durante el seguimiento del bootstrap de HubForge (2026-07-28):

- Require pull request before merging
- Required status checks (strict): `Quality`, `E2E smoke`
- Dismiss stale reviews
- Required approving review count: `0` (solo maintainer; subir cuando entren colaboradores)
- Enforce for administrators
- Linear history required
- Conversation resolution required
- Force pushes blocked
- Branch deletions blocked

## Configuración de merge

- Squash merge enabled
- Merge commits disabled
- Rebase merge disabled
- Delete head branches on merge enabled

## Fallback manual

Si no hay acceso a la API, configura en:

**Settings → Branches → Branch protection rule** para `main`, luego **Settings → General → Pull Requests**.
