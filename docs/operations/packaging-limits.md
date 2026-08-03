# Packaging limits

HubForge is **free for now** (no Stripe / paid plans). Soft caps exist only as abuse guards and can be raised via env.

| Resource                                   | Env override                | Default |
| ------------------------------------------ | --------------------------- | ------- |
| Organizations owned per user               | `HF_LIMIT_ORGS_PER_USER`    | 3       |
| Non-archived projects per organization     | `HF_LIMIT_PROJECTS_PER_ORG` | 10      |
| Members + pending invites per organization | `HF_LIMIT_MEMBERS_PER_ORG`  | 15      |

Enforced in server actions (`createOrganizationAction`, `createProjectAction`, `inviteMemberAction`). Usage is shown on Organizations, Projects, and Team.

Invalid or missing env values fall back to the defaults above.
