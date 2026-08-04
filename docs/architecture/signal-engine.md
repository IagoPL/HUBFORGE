# Motor de señales operativas

## Propósito

Transformar eventos y estado (GitHub + HubForge) en elementos de atención deterministas y comprobables. No es un feed cronológico ni un contador de actividad.

## Contrato de una señal

| Campo                      | Descripción                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `type`                     | Identificador estable (`work_blocked`, `review_waiting`, …) |
| `origin`                   | Sistema de origen (`github` \| `hubforge`)                  |
| `evidence`                 | Datos mínimos que justifican la señal                       |
| `occurredAt`               | Fecha del hecho o de la detección                           |
| `projectId` / `repository` | Contexto multi-tenant                                       |
| `subject`                  | Issue, PR, tarea u otro elemento afectado                   |
| `severity`                 | Ordenación dentro de la cola                                |
| `recommendedAction`        | Qué hacer a continuación                                    |
| `href`                     | Enlace al origen (GitHub o ruta interna)                    |
| `kind`                     | `fact` o `inference`                                        |

## Tipos iniciales

| Tipo                    | Naturaleza típica                                          |
| ----------------------- | ---------------------------------------------------------- |
| `work_blocked`          | Hecho (dependencia o bloqueo declarado)                    |
| `review_waiting`        | Hecho (PR abierta sin merge)                               |
| `ci_failed`             | Hecho cuando exista evidencia de check; si no, no inventar |
| `work_stale`            | Inferencia o hecho según umbral documentado                |
| `unassigned_critical`   | Hecho (prioridad alta sin responsable)                     |
| `dependency_released`   | Hecho (dependencia resuelta desde la visita)               |
| `completed_since_visit` | Hecho (cierre/completado desde `lastVisitAt`)              |

## Reglas

1. Determinista: misma entrada → misma salida (fixtures en tests).
2. No inventar relaciones que GitHub no justifique; las inferencias se etiquetan.
3. “Completado” distingue merge/cierre en GitHub de tarea interna marcada como hecha.
4. La cola de atención ordena por impacto (p. ej. bloqueos que frenan más trabajo) antes que por recencia sola.
5. El briefing usa `lastVisitAt` real; no sustituirlo por “todo lo vivo ahora” sin decirlo.

## Implementación prevista

Capa pura en `src/lib/` (o dominio `signals`) consumida por Briefing y Atención. Reutilizará `task_events`, `task_dependencies`, `project_visits` y tablas `github_synced_*`. Los adaptadores de demo alimentan el mismo motor con fixtures etiquetados.
