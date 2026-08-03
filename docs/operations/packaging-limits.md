# Límites de empaquetado

HubForge es **gratuito por ahora** (sin Stripe / planes de pago). Los límites suaves existen solo como protección contra abuso y pueden subirse vía env.

| Recurso                                    | Override env                | Default |
| ------------------------------------------ | --------------------------- | ------- |
| Organizaciones propias por usuario         | `HF_LIMIT_ORGS_PER_USER`    | 3       |
| Proyectos no archivados por organización   | `HF_LIMIT_PROJECTS_PER_ORG` | 10      |
| Miembros + invitaciones pendientes por org | `HF_LIMIT_MEMBERS_PER_ORG`  | 15      |

Aplicado en server actions (`createOrganizationAction`, `createProjectAction`, `inviteMemberAction`). El uso se muestra en Organizations, Projects y Team.

Valores de env inválidos o ausentes vuelven a los defaults anteriores.
