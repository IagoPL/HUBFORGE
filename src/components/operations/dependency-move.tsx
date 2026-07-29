"use client";

import { CornerDownRight, Move } from "lucide-react";
import { useRef, useState } from "react";
import type { OperationsTask } from "@/data/demo-operations";
import { STATUS_ORDER } from "@/data/demo-operations";
import type { TaskStatus } from "@/lib/domain/types";
import { cn, fill } from "@/lib/utils";
import {
  plural,
  statusLabel,
  type OperationsLabels,
  type WorkLabels,
} from "./labels";

/**
 * The signature interaction: work does not move alone.
 *
 * Hovering or focusing the control tows the dependent rows so the relation is
 * visible before anything is committed; confirming states the consequence as a
 * counted list rather than a colour. There is no drag path yet — a hand-rolled
 * one could not meet the keyboard contract in COMPONENT_GUIDELINES.md, so the
 * menu is the single path until a vetted library is adopted.
 */
export function DependencyMove({
  task,
  dependents,
  labels,
  statusLabels,
  disabled,
  onPreview,
  onApply,
}: {
  task: OperationsTask;
  dependents: OperationsTask[];
  labels: WorkLabels;
  statusLabels: OperationsLabels;
  disabled?: boolean;
  onPreview: (ids: string[]) => void;
  onApply: (status: TaskStatus, carryIds: string[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [carry, setCarry] = useState(true);

  const hasDependents = dependents.length > 0;

  function open() {
    setStatus(task.status);
    setCarry(true);
    dialogRef.current?.showModal();
  }

  function confirm() {
    onApply(status, carry ? dependents.map((dependent) => dependent.id) : []);
    onPreview([]);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        onPointerEnter={() => hasDependents && onPreview(dependents.map((d) => d.id))}
        onPointerLeave={() => onPreview([])}
        onFocus={() => hasDependents && onPreview(dependents.map((d) => d.id))}
        onBlur={() => onPreview([])}
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1",
          "text-[var(--hf-ink-faint)] transition-colors duration-[var(--motion-feedback)]",
          "hover:bg-[var(--hf-ground-3)] hover:text-[var(--hf-ink)]",
          "focus-visible:outline-2 focus-visible:outline-offset-1",
          "focus-visible:outline-[var(--hf-accent)] disabled:opacity-50",
        )}
      >
        <Move className="size-3.5" aria-hidden />
        <span className="sr-only">
          {fill(labels.moveAria, { title: task.title })}
          {hasDependents ? fill(labels.moveCarriesAria, { n: dependents.length }) : ""}
        </span>
        {hasDependents ? (
          <span className="t-mono-sm" data-tabular aria-hidden>
            +{dependents.length}
          </span>
        ) : null}
      </button>

      {/* Native dialog: focus containment, Escape and light dismiss come free. */}
      <dialog
        ref={dialogRef}
        onClose={() => onPreview([])}
        aria-labelledby={`move-title-${task.id}`}
        className={cn(
          "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)]",
          "border border-[var(--hf-rule-strong)] bg-[var(--hf-ground-1)] p-0",
          "text-[var(--hf-ink)] backdrop:bg-[var(--hf-ground-0)]/70",
        )}
      >
        <form method="dialog" className="grid gap-4 p-4">
          <div>
            <h2 id={`move-title-${task.id}`} className="t-display-sm">
              {labels.moveTitle}
            </h2>
            <p className="t-body-sm mt-1 text-[var(--hf-ink-muted)]">{task.title}</p>
          </div>

          <fieldset className="grid gap-1">
            <legend className="t-label mb-1 text-[var(--hf-ink-faint)]">
              {labels.destination}
            </legend>
            {STATUS_ORDER.map((value) => (
              <label
                key={value}
                className={cn(
                  "t-body flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)]",
                  "px-2 py-1.5 hover:bg-[var(--hf-ground-2)]",
                  "has-[:checked]:bg-[var(--hf-accent-quiet)]",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1",
                  "has-[:focus-visible]:outline-[var(--hf-accent)]",
                )}
              >
                <input
                  type="radio"
                  name={`destination-${task.id}`}
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="accent-[var(--hf-accent)]"
                />
                {statusLabel(value, statusLabels)}
                {value === task.status ? (
                  <span className="t-mono-sm text-[var(--hf-ink-faint)]">{labels.current}</span>
                ) : null}
              </label>
            ))}
          </fieldset>

          {/* Consequence stated as a count and a list, never as a colour. */}
          {hasDependents ? (
            <div className="panel p-3">
              <p className="t-body-sm text-[var(--hf-ink)]">
                {plural(dependents.length, statusLabels.waitsOne, statusLabels.waitsOther)}
              </p>
              <ul className="mt-2 grid gap-1">
                {dependents.map((dependent) => (
                  <li
                    key={dependent.id}
                    className="t-body-sm flex items-start gap-1.5 text-[var(--hf-ink-muted)]"
                  >
                    <CornerDownRight
                      className="mt-0.5 size-3.5 shrink-0 text-[var(--hf-accent-line)]"
                      aria-hidden
                    />
                    {dependent.title}
                  </li>
                ))}
              </ul>

              <label className="t-body-sm mt-3 flex items-center gap-2 text-[var(--hf-ink)]">
                <input
                  type="checkbox"
                  checked={carry}
                  onChange={(event) => setCarry(event.target.checked)}
                  className="accent-[var(--hf-accent)]"
                />
                {labels.carry}
              </label>
            </div>
          ) : (
            <p className="t-body-sm text-[var(--hf-ink-muted)]">{labels.noDependents}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className={cn(
                "t-body h-9 rounded-[var(--radius-md)] border border-[var(--hf-rule)] px-3",
                "font-medium hover:bg-[var(--hf-ground-2)] focus-visible:outline-2",
                "focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
              )}
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={confirm}
              className={cn(
                "t-body h-9 rounded-[var(--radius-md)] px-3 font-medium",
                "bg-[var(--hf-accent)] text-[var(--hf-accent-ink)]",
                "transition-colors duration-[var(--motion-feedback)]",
                "hover:bg-[var(--hf-accent-hover)] focus-visible:outline-2",
                "focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
              )}
            >
              {carry && hasDependents
                ? fill(labels.moveCount, { n: dependents.length + 1 })
                : labels.move}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
