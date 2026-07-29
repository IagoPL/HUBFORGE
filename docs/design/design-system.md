# Design system de HubForge

## Principios

1. Claridad por encima de decoración
2. Control y confianza para el trabajo multi-tenant
3. Densidad con aire para respirar
4. Personalidad sin imaginería “forge” de parque temático
5. Accesibilidad por defecto, no como un pase posterior

## Metáfora de marca

Personas, herramientas y trabajo se juntan en un solo lugar. El lenguaje visual es industrial-limpio: neutros de acero frío con un acento de marca preciso—sin atrezzo medieval.

## Tokens

Definidos como variables CSS en `src/app/globals.css`:

| Familia de tokens | Ejemplos                                                                              |
| ----------------- | ------------------------------------------------------------------------------------- |
| Color             | `--hf-bg`, `--hf-fg`, `--hf-brand`, semánticos success/warning/danger                 |
| Tipografía        | `--font-display` (Sora), `--font-body` (IBM Plex Sans), `--font-mono` (IBM Plex Mono) |
| Radio             | `rounded-md` / `rounded-xl` / `rounded-2xl` usados de forma consistente               |
| Motion            | 100–180ms micro, 180–280ms componente; respetar `prefers-reduced-motion`              |
| Elevación         | Preferir contraste de superficies frente a sombras pesadas                            |

## Color

- Temas claro y oscuro vía `data-theme`
- Acento de marca: azul acero (`#1F6F8B` light / `#3FA7C9` dark)
- No codificar el estado solo con color—acompañar con etiquetas/badges
- Preferir superficies planas (`--hf-bg`, `--hf-surface`); evitar degradados decorativos de fondo

## Layout

- Marketing: hero de una sola composición, luego secciones con un único propósito
- App: sidebar en escritorio, drawer + bottom nav en móvil
- Preferir superficies frente a cards anidadas

## Componentes (bootstrap)

Primitivas incluidas: `Button`, `Badge`, app shell, landing header, columnas de tareas, cards de miembros, ítems de notificación, entradas de disponibilidad.

Estados requeridos en controles interactivos: default, hover, focus, active, disabled, loading (según haga falta), mensajes de error/éxito.

## Motion

Usar motion solo para orientación y confirmación. Preferir `opacity`/`transform`.

## Accesibilidad

Objetivo WCAG 2.2 AA. HTML semántico primero; ARIA solo cuando haga falta. Los anillos de foco visibles usan `--hf-ring`.

## Sí / No

**Sí**

- Mantener el wordmark de HubForge fuerte en el primer viewport
- Usar contenido demo que más adelante pueda convertirse en objetos reales del dominio

**No**

- Clichés de dashboard IA púrpura-sobre-blanco
- Aspecto plantilla cream + terracotta
- Glassmorphism por todas partes o cards dentro de cards
- Acciones ambiguas solo con icono sin etiqueta o nombre accesible
