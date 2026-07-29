"use client";

import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { OperationsTask } from "@/data/demo-operations";
import { memberById } from "@/data/demo-operations";
import type { Locale } from "@/i18n/config";
import type { Member, Task } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./briefing";
import { statusLabel, type OperationsLabels, type WorkLabels } from "./labels";
import { RelativeTime } from "./relative-time";
import { RevisionMark } from "./revision-mark";

/**
 * Level 3 of the navigation model: detail arrives as a layer over the list, so
 * the row it came from stays on screen and the user never loses their place.
 */
export function Inspector({
  task,
  tasks,
  members,
  now,
  locale,
  labels,
  statusLabels,
  onClose,
  onSelect,
}: {
  task: OperationsTask;
  tasks: OperationsTask[];
  members: Member[];
  now: string;
  locale: Locale;
  labels: WorkLabels;
  statusLabels: OperationsLabels;
  onClose: () => void;
  onSelect: (taskId: string) => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const upstream = tasks.filter((candidate) => task.dependsOn.includes(candidate.id));
  const downstream = tasks.filter((candidate) => task.blocks.includes(candidate.id));
  const assignees = task.assigneeIds
    .map((id) => memberById(members, id))
    .filter((member): member is Member => member !== null);

  useEffect(() => {
    panelRef.current?.focus();
  }, [task.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Mobile only: the sheet covers the list, so it needs a dismiss surface. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-30 bg-[var(--hf-ground-0)]/60 lg:hidden"
      />

      <motion.aside
        ref={panelRef}
        tabIndex={-1}
        role="region"
        aria-labelledby="inspector-heading"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 bottom-14 z-40 max-h-[75vh] overflow-y-auto",
          "border-t border-[var(--hf-rule-strong)] bg-[var(--hf-ground-1)]",
          "lg:static lg:bottom-auto lg:max-h-none lg:w-[22rem] lg:shrink-0",
          "lg:border-l lg:border-t-0 lg:overflow-y-visible",
          // Focused on open so assistive tech lands inside the layer. No ring:
          // the accent marks user-driven focus, not a programmatic move.
          "outline-none",
        )}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[var(--hf-rule)] bg-[var(--hf-ground-1)] p-4">
          <div className="min-w-0">
            <p className="t-label text-[var(--hf-ink-faint)]">{labels.detail}</p>
            <h2 id="inspector-heading" className="t-display-sm mt-1 text-[var(--hf-ink)]">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)]",
              "text-[var(--hf-ink-muted)] hover:bg-[var(--hf-ground-2)]",
              "hover:text-[var(--hf-ink)] focus-visible:outline-2",
              "focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
            )}
          >
            <X className="size-4" aria-hidden />
            <span className="sr-only">{labels.close}</span>
          </button>
        </div>

        <div className="grid gap-5 p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <Field label={labels.status}>{statusLabel(task.status, statusLabels)}</Field>
            <Field label={labels.priority}>{priorityLabel(task.priority, labels)}</Field>
            {/* Timestamps and refs are machine data, so these read in mono.
                A workspace with no modification time simply omits the row. */}
            {task.updatedAt ? (
              <Field label={labels.updated} mono>
                <RelativeTime
                  at={task.updatedAt}
                  now={now}
                  locale={locale}
                  justNowLabel={statusLabels.justNow}
                />
              </Field>
            ) : null}
            <Field label={labels.reference} mono>
              {task.id}
            </Field>
          </dl>

          {task.revision ? (
            <RevisionMark
              signal={{ kind: "revision", revision: task.revision.kind, at: task.revision.at }}
              now={now}
              locale={locale}
              labels={statusLabels}
              note={task.revision.note}
            />
          ) : null}

          {task.description ? (
            <p className="t-body text-[var(--hf-ink-muted)]">{task.description}</p>
          ) : null}

          <section>
            <h3 className="t-label text-[var(--hf-ink-faint)]">{labels.assignees}</h3>
            {assignees.length === 0 ? (
              <p className="t-body mt-2 text-[var(--hf-ink-faint)]">{labels.nobody}</p>
            ) : (
              <ul className="mt-2 grid gap-2">
                {assignees.map((member) => (
                  <li key={member.id} className="flex items-center gap-2">
                    <Avatar member={member} />
                    <span className="t-body text-[var(--hf-ink)]">{member.name}</span>
                    <span className="t-body-sm text-[var(--hf-ink-faint)]">
                      {member.functionalRole}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Dependency lines are drawn only because these relations exist. */}
          {upstream.length > 0 || downstream.length > 0 ? (
            <section>
              <h3 className="t-label text-[var(--hf-ink-faint)]">{labels.dependencies}</h3>

              <div className="mt-2 border-l border-[var(--hf-rule-strong)] pl-3">
                <DependencyGroup
                  caption={`${labels.dependsOn} ${upstream.length}`}
                  tasks={upstream}
                  onSelect={onSelect}
                  hidden={upstream.length === 0}
                />

                <p className="t-body relative py-1.5 font-medium text-[var(--hf-accent)]">
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-px w-2 bg-[var(--hf-accent-line)]"
                  />
                  {labels.thisTask}
                </p>

                <DependencyGroup
                  caption={`${labels.blocks} ${downstream.length}`}
                  tasks={downstream}
                  onSelect={onSelect}
                  hidden={downstream.length === 0}
                />
              </div>
            </section>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}

function priorityLabel(priority: Task["priority"], labels: WorkLabels) {
  if (priority === "high") return labels.priorityHigh;
  if (priority === "medium") return labels.priorityMedium;
  return labels.priorityLow;
}

function Field({
  label,
  mono,
  className,
  children,
}: {
  label: string;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="t-label pt-0.5 text-[var(--hf-ink-faint)]">{label}</dt>
      <dd
        className={cn(mono ? "t-mono-sm" : "t-body-sm", "text-[var(--hf-ink)]", className)}
        data-tabular={mono ? "" : undefined}
      >
        {children}
      </dd>
    </>
  );
}

function DependencyGroup({
  caption,
  tasks,
  onSelect,
  hidden,
}: {
  caption: string;
  tasks: OperationsTask[];
  onSelect: (taskId: string) => void;
  hidden: boolean;
}) {
  if (hidden) return null;

  return (
    <div className="py-1">
      <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
        {caption}
      </p>
      <ul className="grid">
        {tasks.map((task) => (
          <li key={task.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-3 top-1/2 h-px w-2 bg-[var(--hf-rule-strong)]"
            />
            <button
              type="button"
              onClick={() => onSelect(task.id)}
              className={cn(
                "t-body w-full truncate rounded-[var(--radius-sm)] py-1 text-left",
                "text-[var(--hf-ink-muted)] hover:text-[var(--hf-ink)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1",
                "focus-visible:outline-[var(--hf-accent)]",
              )}
            >
              {task.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
