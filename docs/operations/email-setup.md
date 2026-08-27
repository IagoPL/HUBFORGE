# Email de invitación (Resend opcional)

Las invitaciones de HubForge funcionan sin email. Cuando `RESEND_API_KEY` no está configurada, crear una invitación sigue devolviendo una URL de aceptación copiable en la UI de Team.

## Entorno

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=HubForge <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_APP_URL` se usa para construir enlaces `/invite?token=…`. Usa tu host público en producción.

## Comportamiento

1. Owner/admin invita a un miembro desde Team
2. HubForge almacena la fila de invitación y el token
3. Si Resend está configurado, envía el email de invitación
4. Si no, la UI muestra el enlace para copiar (`emailDelivered: false`)

No se requiere Stripe ni un plan de email de pago para el MVP gratuito.
