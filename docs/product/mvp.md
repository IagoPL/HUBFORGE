# Definición del MVP

## Usuarios objetivo

- Equipos técnicos pequeños y startups
- Estudios creativos y proyectos indie
- Grupos académicos y de proyectos open-source

## Problemas

- Planificación, disponibilidad, ownership y actividad de GitHub viven en herramientas distintas
- No está claro quién puede asumir la siguiente tarea
- La comunicación pierde el contexto del proyecto

## En alcance (MVP)

1. Registro / inicio de sesión
2. Crear organización y proyecto
3. Invitar miembros; definir acceso + roles funcionales
4. Crear/asignar tareas; lista + Kanban
5. Marcar disponibilidad; vista de calendario del equipo
6. Notificaciones internas
7. Canales de proyecto y mensajería (texto plano primero)
8. Conectar repositorio de GitHub; sincronizar issues; actividad básica de PR/commit

## Fuera de alcance (post-MVP)

- Asistente de IA
- Sprints/roadmap/analítica de carga (más allá de lo básico)
- PWA / notificaciones push
- Llamadas/voz/vídeo
- Cifrado de extremo a extremo para el chat

## Flujo de éxito principal (primer vertical slice)

Landing → sign in → create org → create project → dashboard → add member → set role → create/assign task → board update → notification → mark unavailability → calendar update

## Criterios de éxito

- El flujo funciona de extremo a extremo con autorización en servidor + RLS
- Responsive y accesible por teclado
- Cubierto por tests automatizados críticos
- Acabado visual coherente con el design system
- Sin secretos en el repositorio
