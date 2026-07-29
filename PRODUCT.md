# Producto

<!-- impeccable:product-schema 1 -->
<!-- Los encabezados H2 se mantienen en inglés a propósito: Impeccable los lee -->
<!-- como señal de esquema (PRODUCT_V4_SECTIONS). El contenido va en español. -->
<!-- No traducir los encabezados ni el valor de Platform. -->

## Platform

web

## Users

Usuario primario: equipos técnicos pequeños y startups, aproximadamente de 3 a 10 desarrolladores, que entregan software cada semana.

Su situación real es un escritorio con uno o dos monitores y sesiones de trabajo de varias horas, con el editor de código, GitHub, una terminal y un navegador abiertos junto a HubForge. El equipo combina trabajo síncrono y asíncrono: un núcleo que coincide durante determinadas franjas horarias, más colaboradores externos, revisores y miembros que se incorporan más tarde.

Los estudios creativos y los grupos académicos o de código abierto siguen siendo bienvenidos y no deben romperse, pero no dirigen las decisiones de diseño.

El trabajo que el usuario viene a hacer es entender el estado de un proyecto en segundos y retomar el trabajo de inmediato. El caso hero es volver después de varios días de ausencia.

## Product Purpose

HubForge es el centro operativo de un proyecto de software.

Otras herramientas obligan a cambiar constantemente entre GitHub, documentación, chat, gestión de tareas y otros servicios. HubForge reúne en un único lugar el contexto necesario para trabajar. El éxito se mide en cambios de contexto eliminados, no en funcionalidades añadidas.

Un usuario que abre HubForge tras varios días fuera debe entender inmediatamente qué ha cambiado, qué requiere su atención, quién está trabajando en cada cosa, qué está bloqueado y dónde continuar.

## Positioning

HubForge no compite por tener mejores tareas ni mejor documentación. Su mecanismo es eliminar la fragmentación: es la única superficie donde planificación, propiedad del trabajo, disponibilidad, actividad del repositorio y comunicación del proyecto se resuelven en un contexto conectado.

Una herramienta vecina podría copiar cualquier funcionalidad aislada. Lo que no podría copiar honestamente es ser el lugar donde el contexto operativo de un equipo pequeño ya está ensamblado.

## Operating Context

- Herramienta de trabajo diario, no una consulta móvil de cinco minutos. El escritorio es el entorno principal; la tablet es un entorno real de trabajo ligero; el móvil sirve para consulta, seguimiento y acciones rápidas.
- Convive gran parte de la jornada junto a un editor de código y una terminal en oscuro, así que la fatiga visual en sesiones largas pesa más que la estética.
- Ritmo mixto, síncrono y asíncrono. La interfaz debe servir tanto a sesiones de ejecución de varias horas como a consultas de dos minutos.
- Flujo prioritario: recuperar el contexto del proyecto con el mínimo tiempo y esfuerzo.
- La superficie de entrada es un briefing operativo, no un panel de analítica: qué ha cambiado, qué requiere atención, qué está bloqueado, qué se puede hacer ahora y dónde continuar.
- La actividad se agrupa por significado (requiere atención, desbloquea trabajo, cambios relevantes, información secundaria), nunca como un feed cronológico sin filtrar.

## Capabilities and Constraints

Capacidades confirmadas dentro de alcance: autenticación; organizaciones y proyectos; invitación de miembros con roles de acceso y funcionales; creación y asignación de tareas en vista de lista y tablero; marcado de disponibilidad y calendario de equipo; notificaciones internas; canales de proyecto y mensajería en texto plano; conexión de repositorio de GitHub con sincronización de issues y actividad básica de pull requests y commits.

Explícitamente fuera de alcance por ahora: asistente de IA; sprints, roadmap y analítica de carga más allá de lo básico; PWA y notificaciones push; llamadas, voz y vídeo; chat con cifrado de extremo a extremo.

Restricciones técnicas que el trabajo futuro debe preservar:

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 con una capa de tokens en variables CSS.
- Supabase para autenticación y datos, con verificación de sesión en servidor y autorización multi-tenant; toda entidad de proyecto resuelve a una organización y un proyecto.
- Monolito modular; los datos de demostración permanecen detrás del adaptador `getDemoWorkspace()`.
- `motion` v12 y las View Transitions de React 19 son las primitivas de animación disponibles. No hay ninguna librería de drag & drop instalada; esa elección queda deliberadamente abierta.
- `lucide-react` es la infraestructura de iconos existente.
- Internacionalizado en inglés y español; todo el texto de interfaz se resuelve a través de `src/i18n/dictionaries`.
- Verificado con Vitest, Playwright y `@axe-core/playwright`.

Hechos de producto sin decidir: precios, licencia, fecha de lanzamiento y si los datos de disponibilidad llegarán a integrarse con calendarios externos.

## Brand Commitments

El nombre es HubForge, y el logotipo se mantiene fuerte en el primer viewport. La metáfora de marca es personas, herramientas y trabajo uniéndose en un mismo lugar, expresada como precisión industrial limpia, nunca como imaginería literal de forja o medieval.

La gramática visual está ligada a un centro de operaciones moderno: mesas de control, sistemas de monitorización, software de ingeniería, herramientas de desarrollo, interfaces de observabilidad, mapas de relaciones y paneles de misión. Excluidos explícitamente como mundos de referencia: militar, ciencia ficción y cyberpunk.

Restricciones negativas vinculantes, heredadas de `docs/design/design-system.md` y confirmadas en la entrevista: nada de clichés de dashboard de IA en morado sobre blanco, nada de la plantilla crema y terracota, nada de glassmorphism generalizado, nada de tarjetas anidadas dentro de tarjetas, nada de azul corporativo genérico, nada de degradados morados, y no se usa Inter.

El nivel de oficio se mide frente a Linear, Raycast, Arc, GitHub, Vercel, Warp, Figma, Stripe Dashboard y Notion Calendar. La intención es igualar su calidad de ejecución, no parecerse a ellos.

## Evidence on Hand

El producto es temprano pero realmente funcional. La sincronización con Supabase y GitHub es real y se utiliza durante el propio desarrollo de HubForge.

No existen clientes públicos, ni testimonios, ni métricas de tracción, ni casos de estudio. Nada de eso puede fabricarse, incluida actividad inventada o contenido de relleno que un visitante pudiera confundir con uso real.

Donde no existan datos reales, la interfaz usa estados vacíos de alta calidad, ejemplos claramente etiquetados como demostración, o guías de onboarding. La confianza del usuario se gana mostrando un producto sólido, nunca insinuando tracción.

Material real disponible: el adaptador de workspace de demostración en `src/data/demo-workspace.ts`, la actividad real del repositorio de GitHub, y la propia documentación del proyecto en `docs/`.

## Product Principles

1. **Eliminar la fragmentación; nunca añadir superficie.** Una funcionalidad que añade un sitio más al que mirar es una regresión.
2. **Responder "¿qué está ocurriendo y qué debería hacer ahora?" sin que nadie lo pida.** El sistema filtra y prioriza; no el usuario.
3. **El contexto nunca se pierde.** Navegar, seleccionar o profundizar no puede descartar dónde estaba el usuario.
4. **Nunca fabricar.** La ausencia de datos se diseña deliberadamente, nunca se rellena con contenido inventado.
5. **La accesibilidad es una señal de calidad.** El producto debe sentirse premium precisamente porque cualquiera puede usarlo con comodidad.

## Accessibility & Inclusion

WCAG 2.2 AA es el suelo, superado siempre que sea razonable, y tratado como criterio de calidad de producto más que como obligación normativa. No existe mandato legal externo.

Requisitos vinculantes:

- Contraste cercano a AAA para texto e información crítica.
- Nunca transmitir información únicamente mediante color.
- Operación completa de toda la aplicación mediante teclado.
- Estado de foco claro y visible en todo elemento interactivo.
- Toda acción de drag & drop tiene alternativa por teclado y alternativa por menú contextual.
- Toda animación respeta `prefers-reduced-motion`.
- Tipografía muy legible con jerarquía visual fuerte.
- Áreas táctiles amplias.
- Estados de error claros y comprensibles.
- Soporte sólido para lectores de pantalla.

La accesibilidad se resuelve durante el diseño, no se añade durante la implementación.
