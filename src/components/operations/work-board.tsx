"use client";

import { STATUS_ORDER, type OperationsTask } from "@/lib/operations";
import type { Locale } from "@/i18n/config";
import type { Member, TaskStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { statusLabel, type OperationsLabels, type WorkLabels } from "./labels";
import type { ListState } from "./work-list";

/**
 * Kanban columns over the same task data as WorkList.
 * Moves use the existing status action path — no drag library.
 */
export function WorkBoard({
  tasks,
  members,
  labels,
  statusLabels,
  selectedId,
  state,
  pending,
  onSelect,
  onApplyMove,
  onRetry,
}: {
  tasks: OperationsTask[];
  members: Member[];
  now: string;
  locale: Locale;
  labels: WorkLabels;
  statusLabels: OperationsLabels;
  selectedId: string | null;
  state: ListState;
  pending: boolean;
  onSelect: (taskId: string) => void;
  onApplyMove: (taskId: string, status: TaskStatus, carryIds: string[]) => void;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <p className="t-body px-4 pb-6 text-[var(--hf-ink-muted)] sm:px-6">
        {labels.loading}
      </p>
    );
  }

  if (state === "error") {
    return (
      <div className="grid gap-2 px-4 pb-6 sm:px-6">
        <p className="t-body font-medium text-[var(--hf-ink)]">{labels.errorTitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-muted)]">{labels.errorBody}</p>
        <button
          type="button"
          onClick={onRetry}
          className="t-body-sm w-fit text-[var(--hf-accent)] underline-offset-2 hover:underline"
        >
          {labels.retry}
        </button>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="grid gap-1 px-4 pb-6 sm:px-6">
        <p className="t-body font-medium text-[var(--hf-ink)]">{labels.emptyTitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-muted)]">{labels.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-6 sm:px-6">
      {STATUS_ORDER.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            aria-labelledby={`board-col-${status}`}
            className="flex w-[15.5rem] shrink-0 flex-col gap-2"
          >
            <header className="flex items-baseline justify-between gap-2 border-b border-[var(--hf-rule)] pb-2">
              <h3
                id={`board-col-${status}`}
                className="t-label text-[var(--hf-ink-faint)]"
              >
                {statusLabel(status, statusLabels)}
              </h3>
              <span className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                {column.length}
              </span>
            </header>
            <ul className="grid gap-2">
              {column.map((task) => {
                const assignee = members.find((m) => m.id === task.assigneeIds[0]);
                return (
                  <li key={task.id}>
                    <article
                      className={cn(
                        "panel grid gap-2 p-3",
                        selectedId === task.id && "ring-1 ring-[var(--hf-accent)]",
                      )}
                    >
                      <button
                        type="button"
                        id={`work-row-${task.id}`}
                        onClick={() => onSelect(task.id)}
                        className={cn(
                          "t-body text-left font-medium text-[var(--hf-ink)]",
                          "focus-visible:outline-2 focus-visible:outline-offset-2",
                          "focus-visible:outline-[var(--hf-accent)]",
                        )}
                      >
                        {task.title}
                      </button>
                      <div className="flex items-center justify-between gap-2">
                        <span className="t-mono-sm truncate text-[var(--hf-ink-faint)]">
                          {assignee?.name ?? labels.nobody}
                        </span>
                        <label className="sr-only" htmlFor={`board-status-${task.id}`}>
                          {labels.status}
                        </label>
                        <select
                          id={`board-status-${task.id}`}
                          value={task.status}
                          disabled={pending}
                          onChange={(event) =>
                            onApplyMove(task.id, event.target.value as TaskStatus, [])
                          }
                          className="input t-mono-sm max-w-[7.5rem] py-1"
                        >
                          {STATUS_ORDER.map((option) => (
                            <option key={option} value={option}>
                              {statusLabel(option, statusLabels)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
