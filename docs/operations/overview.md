# Notas de operaciones

## Entornos

| Entorno    | Propósito                                 |
| ---------- | ----------------------------------------- |
| Local      | `pnpm dev` + `.env.local` opcional        |
| Preview    | Previews de PR en Vercel (por configurar) |
| Production | Vercel + Supabase (más adelante)          |

## Secretos

Guardarlos solo en proveedores de entorno (Vercel/Supabase/GitHub Actions). Nunca en Git.

## Observabilidad (más adelante)

Añadir logs estructurados en servidor sin contenido privado de mensajes ni tokens.
