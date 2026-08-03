# Packaging limits

Soft free-tier caps until paid plans / Stripe are defined in `PRODUCT.md`.

| Resource                                   | Env override                | Default |
| ------------------------------------------ | --------------------------- | ------- |
| Organizations owned per user               | `HF_LIMIT_ORGS_PER_USER`    | 3       |
| Projects per organization                  | `HF_LIMIT_PROJECTS_PER_ORG` | 10      |
| Members + pending invites per organization | `HF_LIMIT_MEMBERS_PER_ORG`  | 15      |

Enforced in server actions (`createOrganizationAction`, `createProjectAction`, `inviteMemberAction`). Usage is shown on Organizations, Projects, and Team.

Invalid or missing env values fall back to the defaults above.
