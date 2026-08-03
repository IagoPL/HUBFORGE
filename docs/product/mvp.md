# Definición del MVP

## Usuarios objetivo

- Equipos indie de 3 a 15 integrantes.
- Estudios pequeños multidisciplinares que ya usan GitHub.
- Proyectos con ritmo mixto (tiempo libre + sprints cortos) y roles técnicos y no técnicos.

## Problemas que el MVP resuelve

- La actividad de GitHub no se lee como contexto operativo.
- Los bloqueos y dependencias no se ven por impacto.
- No está claro quién puede asumir el siguiente trabajo.
- Tras una ausencia, el “qué cambió” queda enterrado en notificaciones.

## Dentro del alcance

1. Autenticación con GitHub.
2. Conexión de un repositorio (GitHub App) e importación de issues, pull requests y actividad relevante.
3. Briefing desde la última visita (qué se completó, qué cambió, qué se bloqueó, qué necesita revisión, qué lleva detenido).
4. Cola de atención priorizada (bloqueos de alto impacto, PRs en espera, trabajo estancado, críticos sin responsable, dependencias, cambios desde la visita).
5. Mapa de bloqueos y dependencias con impacto y acción recomendada.
6. Responsables y roles funcionales (separados del rol de acceso).
7. Capacidad semanal del equipo (disponibilidad orientada a asignación).
8. Enlaces al origen en GitHub.
9. Modo demostración determinista, solo lectura o reiniciable, claramente etiquetado.
10. Español e inglés en la aplicación.
11. Accesibilidad por teclado y pruebas de flujos críticos.

## Fuera del alcance del MVP

Ver [non-goals.md](./non-goals.md). En particular: chat propio, videollamadas, facturación, IA central, app nativa y sustitución de GitHub Projects.

## Flujo de éxito

1. Iniciar sesión con GitHub.
2. Crear o seleccionar un espacio.
3. Instalar la GitHub App y elegir repositorio.
4. Importar actividad relevante.
5. Configurar integrantes y roles funcionales.
6. Indicar disponibilidad semanal.
7. Abrir el primer briefing y actuar desde la cola de atención.

## Criterios de éxito del MVP

- Una persona entiende la propuesta en menos de 10 segundos (landing).
- El briefing explica qué cambió y por qué importa, no solo contadores.
- Los bloqueos se ordenan por impacto.
- La capacidad influye en recomendaciones de asignación.
- GitHub aparece como fuente de verdad.
- El chat no forma parte de la navegación ni de la propuesta comercial.
- `lint`, formato, tipos, pruebas, build y Playwright se mantienen en verde.
- RLS, autorización y multi-tenant no se degradan.

## Estado de implementación

El código de autenticación, sincronización GitHub (webhooks + backfill), visitas, eventos, dependencias y superficies de briefing existe en distinto grado de madurez. El MVP de producto se considera **en desarrollo**: falta unificar señales, reestructurar navegación/copy, modo demo indie y retirar el chat de las superficies visibles. No se afirma “MVP completo” ni “listo para producción” mientras OAuth, GitHub App o secretos de entorno requieran configuración manual.
