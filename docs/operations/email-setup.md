# Invite email (optional Resend)

HubForge invites work without email. When `RESEND_API_KEY` is unset, creating an invite still returns a copyable accept URL in the Team UI.

## Environment

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=HubForge <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_APP_URL` is used to build `/invite?token=…` links. Use your public host in production.

## Behaviour

1. Owner/admin invites a member from Team
2. HubForge stores the invitation row and token
3. If Resend is configured, it sends the invite email
4. If not, the UI shows the link to copy (`emailDelivered: false`)

No Stripe or paid email plan is required for the free MVP.
