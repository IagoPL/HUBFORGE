# MVP definition

## Target users

- Small technical teams and startups
- Creative studios and indie projects
- Academic and open-source project groups

## Problems

- Planning, availability, ownership, and GitHub activity live in different tools
- Unclear who can take the next task
- Communication loses project context

## In scope (MVP)

1. Sign up / sign in
2. Create organization and project
3. Invite members; define access + functional roles
4. Create/assign tasks; list + Kanban
5. Mark availability; team calendar view
6. Internal notifications
7. Project channels and messaging (plain text first)
8. Connect GitHub repository; sync issues; basic PR/commit activity

## Out of scope (post-MVP)

- AI assistant
- Sprints/roadmap/workload analytics (beyond basics)
- PWA / push notifications
- Calls/voice/video
- End-to-end encryption for chat

## Primary success flow (first vertical slice)

Landing → sign in → create org → create project → dashboard → add member → set role → create/assign task → board update → notification → mark unavailability → calendar update

## Success criteria

- Flow works end-to-end with authorization on server + RLS
- Responsive and keyboard accessible
- Covered by critical automated tests
- Visual polish consistent with the design system
- No secrets in the repository
