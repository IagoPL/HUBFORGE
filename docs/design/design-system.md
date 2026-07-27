# HubForge design system

## Principles

1. Clarity over decoration
2. Control and trust for multi-tenant work
3. Density with breathing room
4. Personality without theme-park “forge” imagery
5. Accessibility as a default, not a pass later

## Brand metaphor

People, tools, and work join in one place. Visual language is industrial-clean: cool steel neutrals with a precise brand accent—not medieval props.

## Tokens

Defined as CSS variables in `src/app/globals.css`:

| Token family | Examples                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| Color        | `--hf-bg`, `--hf-fg`, `--hf-brand`, semantic success/warning/danger                   |
| Typography   | `--font-display` (Sora), `--font-body` (IBM Plex Sans), `--font-mono` (IBM Plex Mono) |
| Radius       | `rounded-md` / `rounded-xl` / `rounded-2xl` used consistently                         |
| Motion       | 100–180ms micro, 180–280ms component; honor `prefers-reduced-motion`                  |
| Elevation    | Prefer surface contrast over heavy shadows                                            |

## Color

- Light and dark themes via `data-theme`
- Brand accent: steel blue (`#1F6F8B` light / `#3FA7C9` dark)
- Do not encode status with color alone—pair with labels/badges

## Layout

- Marketing: single composition hero, then one-job sections
- App: sidebar on desktop, drawer + bottom nav on mobile
- Prefer surfaces over nested cards

## Components (bootstrap)

Shipped primitives: `Button`, `Badge`, app shell, landing header, task columns, member cards, notification items, availability entries.

States required for interactive controls: default, hover, focus, active, disabled, loading (as needed), error/success messaging.

## Motion

Use motion for orientation and confirmation only. Prefer `opacity`/`transform`.

## Accessibility

Target WCAG 2.2 AA. Semantic HTML first; ARIA only when needed. Visible focus rings use `--hf-ring`.

## Do / Don't

**Do**

- Keep HubForge wordmark strong in the first viewport
- Use demo content that could later become real domain objects

**Don't**

- Purple-on-white AI dashboard clichés
- Cream + terracotta template look
- Glassmorphism everywhere or cards inside cards
- Icon-only ambiguous actions without labels or accessible names
