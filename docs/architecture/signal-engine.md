# Motor de señales operativas

## Propósito

Transformar evidencia de GitHub y HubForge en elementos de briefing y atención deterministas. No es un feed cronológico ni un contador de actividad.

Implementación: `src/lib/signals/` (puro) + adaptadores en `src/features/signals/`.

## Capas

1. **Lectura** — `loadProjectEvidence` / `northlightAuroraEvidence`
2. **Normalización** — `EvidenceBundle` tipado
3. **Generación** — `generateSignals` (reglas puras)
4. **Priorización** — `prioritizeSignals`
5. **Partición** — `runSignalEngine` (briefing vs atención)
6. **Presentación** — UI (`AttentionQueue`, `BriefingSurface`)

## Contrato `OperationalSignal`

Campos: `id`, `kind`, `source`, `evidenceType` (regla), `projectId`, `repositoryId`, `subjectId`, `subjectType`, `headline`, `explanation`, `occurredAt`, `severity`, `confidence`, `classification` (`fact`|`inference`), `actorId`, `assigneeIds`, `blockedCount`, `recommendedAction`, `sourceUrl` (solo http/https validados), `metadata`.

Tras priorizar: `priorityScore`, `priorityReason`.

## Tipos

| Tipo                  | Clasificación típica                               |
| --------------------- | -------------------------------------------------- |
| `work_blocked`        | fact                                               |
| `review_waiting`      | fact (solo PR reales)                              |
| `ci_failed`           | fact (solo con check run sincronizado)             |
| `work_stale`          | inference (umbral `staleDaysThreshold`, default 5) |
| `unassigned_critical` | fact / inference (capacidad)                       |
| `dependency_released` | fact                                               |
| `work_completed`      | fact (tarea interna)                               |
| `pull_request_merged` | fact (PR merged en datos GitHub)                   |
| `work_changed`        | fact / inference (incl. responsable no disponible) |

## Priorización

```
score =
  severityWeight * 1000
+ blockedCount * 120
+ subjectPriorityWeight * 80
+ ageDays * 15
+ (sin responsable en kinds críticos ? 100 : 0)
+ (ci_failed ? 200 : 0)
+ (review_waiting ? 150 : 0)
+ (responsable no disponible ? 60 : 0)
```

Empate: `score` DESC → `occurredAt` DESC → `id` ASC.

Constantes: `PRIORITY_FORMULA` en `src/lib/signals/prioritize.ts`.

## Briefing vs Atención

|                | Briefing                                      | Atención                                 |
| -------------- | --------------------------------------------- | ---------------------------------------- |
| Ventana        | Después de `lastVisitAt`                      | Problemas abiertos (pueden ser antiguos) |
| Primera visita | `sinceLastVisit = []`                         | Cola persistente                         |
| Visita         | Leer `lastVisitAt` → calcular → luego `touch` | No altera la visita del briefing         |

## CI / check runs

Tabla aditiva `github_synced_check_runs` (migración `20260804120000_…`). Sin filas → sin `ci_failed` en espacios reales. La demo inyecta fixtures etiquetados `source: demo`.

El webhook todavía no persiste check runs; el adaptador lee la tabla cuando exista.

## Capacidad

`availability_entries` alimenta inferencias (`rule.assignee_unavailable`, `rule.critical_without_available_owner`). No hay reasignación automática.
