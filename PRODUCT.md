# Producto

<!-- Encabezados H2 en inglés: esquema de producto (Platform, Users, …). -->
<!-- El contenido va en español. No traducir los encabezados ni el valor de Platform. -->

## Platform

web

## Users

Usuario primario: equipos indie multidisciplinares de aproximadamente 3 a 15 personas que ya trabajan con GitHub.

Incluyen programación, arte, diseño, guion, producción y sonido. Trabajan en escritorio durante sesiones largas o a tiempo parcial, con editor, GitHub, terminal y navegador abiertos. Necesitan recuperar contexto tras días fuera sin releer todo el repositorio.

Los estudios creativos pequeños son bienvenidos. Las grandes corporaciones que buscan sustituir Jira no dirigen el producto.

El trabajo que el usuario viene a hacer es entender qué cambió, qué está bloqueado, qué necesita revisión, quién puede encargarse y qué hacer a continuación.

## Product Purpose

HubForge es una capa operativa sobre GitHub: traduce actividad, dependencias y capacidad en un briefing comprensible para todo el equipo indie.

No sustituye GitHub, Discord ni las herramientas creativas. El éxito se mide en contexto recuperado y bloqueos resueltos, no en funciones añadidas.

Una persona que abre HubForge tras varios días fuera debe entender de inmediato qué ha cambiado desde su última visita, qué frena el avance y cuál es la siguiente acción recomendada.

## Positioning

HubForge no compite por tener el mejor tablero Kanban ni el mejor chat. Su mecanismo es interpretar GitHub: briefing desde la última visita, cola de atención, impacto de bloqueos y capacidad real del equipo.

Una herramienta vecina puede copiar una lista de tareas. No puede copiar honestamente ser el lugar donde la actividad de GitHub ya está traducida a señales operativas para perfiles técnicos y no técnicos.

## Operating Context

- Herramienta de trabajo diario en escritorio; móvil para consulta y acciones rápidas.
- Convive junto a editor y terminal en oscuro; la fatiga visual importa.
- Ritmo mixto síncrono/asíncrono.
- Entrada: briefing operativo, no panel de analítica.
- La actividad se agrupa por significado (requiere atención, bloquea trabajo, cambios desde la visita), no como feed sin filtrar.
- El Kanban, si existe, es vista secundaria de ejecución; no la propuesta de la landing.

## Capabilities and Constraints

Capacidades en alcance de producto (MVP en desarrollo): autenticación GitHub; conexión de repositorio e importación; briefing desde la última visita; cola de atención; bloqueos y dependencias; roles de acceso y funcionales; capacidad semanal; enlaces al origen en GitHub; modo demostración etiquetado; ES/EN; accesibilidad por teclado.

Explícitamente fuera: chat propio; videollamadas; archivos creativos; sustituir GitHub Projects; app nativa; IA como requisito central; facturación real; analítica enterprise; gamificación.

Restricciones técnicas a preservar:

- Next.js App Router, React, TypeScript, Tailwind CSS v4 con tokens CSS.
- Supabase Auth + Postgres RLS; sesión verificada en servidor; multi-tenant.
- Monolito modular; GitHub como fuente de verdad de issues/PRs.
- `motion` y View Transitions disponibles; sin librería DnD obligatoria.
- `lucide-react` como iconografía.
- i18n EN/ES vía diccionarios.
- Vitest, Playwright y axe.

Hechos de producto sin decidir: precios futuros (hoy gratuito con límites blandos), licencia de uso comercial ampliado y fecha de lanzamiento público.

## Brand Personality / Voice / Tone

Directo, operativo y legible para no programadores sin ocultar términos reales de GitHub (pull request, CI, merge) cuando aportan contexto. Evita slogans vacíos (“colabora mejor”, “centraliza todo”) sin explicar el mecanismo.

## Aesthetic Direction

Gramática de dibujo técnico / plano anotado (ver `DESIGN.md`): grafito, filetes, marcas de revisión reales, cuadro de rotulación, densidad adaptable. El color comunica estado, riesgo y acción; no decoración.

## Design System

Tokens y componentes en `docs/design/DESIGN_SYSTEM.md`. El archivo legado `docs/design/design-system.md` está retirado como normativa.

## Accessibility

Teclado completo, contraste WCAG AA, `prefers-reduced-motion`, estados vacíos útiles, foco visible. Las superficies nuevas (Briefing, Atención) deben mantener el listón de axe en críticos/serios.

## Responsive Behavior

Escritorio primero; tablet usable; móvil para briefing/atención y acciones rápidas. La densidad compacta no rompe mínimos táctiles.

## References

- `docs/product/vision.md`
- `docs/product/mvp.md`
- `docs/product/non-goals.md`
- `docs/architecture/signal-engine.md`
- `docs/ux/information-architecture.md`
