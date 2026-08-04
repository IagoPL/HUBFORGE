# Gestión de trabajo y asignaciones

## Asignación pendiente (persona aún no en GitHub)

Cuando una tarea, issue o elemento deba asignarse a alguien que **todavía no** sea miembro, colaborador o usuario disponible en el repositorio:

1. No inventes un username.
2. No selecciones una persona “parecida”.
3. No la asignes temporalmente a IagoPL ni a otro integrante.
4. No bloquees la creación de la tarea.
5. Créala **sin assignee**.
6. Añade en notas/cuerpo (sin duplicar si ya existe):

```markdown
**Asignación pendiente:** asignar manualmente a `[nombre]` cuando se incorpore al repositorio de GitHub.
```

7. Si se conoce el rol:

```markdown
**Rol previsto:** `[rol funcional]`.
```

8. Si debe empezar antes de su incorporación:

```markdown
**Responsable temporal:** sin definir.
```

9. No elimines esa nota automáticamente.
10. La asignación definitiva la hace **Iago** manualmente cuando la persona esté en el repositorio.

Helpers: `src/features/collaboration/pending-assignment.ts`.

## Sincronización CI (check runs)

- Eventos webhook: `check_run`, `check_suite` (además de `issues`, `pull_request`, `push`).
- Persistencia: `github_synced_check_runs` (migración aditiva; escrituras solo service role).
- Repos no vinculados e instalaciones que no coinciden con `project_repositories.installation_id` se ignoran (delivery registrada para idempotencia).
- Señal `ci_failed`: solo `status=completed` y `conclusion=failure` del **último** check por `(name, head_sha)`.
- No generan `ci_failed`: `cancelled`, `skipped`, `neutral`, `timed_out`, `action_required`, ni checks incompletos (`queued` / `in_progress` / conclusion null).
- Recuperación: un success posterior del mismo name+SHA elimina la señal de fallo.
- Issues sincronizados: tarea HubForge **sin assignee**; no se inventan usernames ni se mapean logins a miembros.
