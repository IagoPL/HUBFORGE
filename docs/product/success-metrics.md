# Métricas de éxito

Solo métricas ligadas al mecanismo del producto. Sin vanity metrics (commits totales sin contexto, “usuarios registrados” inventados).

## Indicadores cualitativos (validación temprana)

| Indicador              | Señal de éxito                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| Comprensión en 10 s    | Una persona nueva resume HubForge sin decir “otro Kanban”.                |
| Briefing útil          | Tras ausentarse, nombra cambios/bloqueos reales desde la última visita.   |
| Acción siguiente       | Elige el siguiente trabajo desde Atención, no desde un feed cronológico.  |
| Legibilidad no técnica | Arte/diseño/producción entienden PRs y bloqueos con el contexto ofrecido. |
| GitHub como origen     | Cada señal relevante enlaza al issue/PR/origen correcto.                  |

## Indicadores cuantitativos (cuando haya uso real)

| Métrica                       | Definición                                                 |
| ----------------------------- | ---------------------------------------------------------- |
| Tiempo hasta primer briefing  | Desde login hasta ver briefing con repo conectado.         |
| % señales con enlace a origen | Señales de atención que abren GitHub o la tarea correcta.  |
| Uso de Atención vs Trabajo    | Ratio de visitas a la cola frente al tablero.              |
| Reasignaciones por capacidad  | Asignaciones sugeridas o realizadas tras ver capacidad.    |
| Errores de sync percibidos    | Fallos de webhook/backfill reportados / sesiones con repo. |

## No medimos (aún)

- MAU/ARR inventados.
- Número bruto de commits sincronizados.
- Mensajes de chat (fuera de MVP).
- Comparativas de “productividad” genéricas.
