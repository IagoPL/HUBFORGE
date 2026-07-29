"use client";

import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, CornerDownRight, Inbox, RotateCcw } from "lucide-react";
import type { OperationsTask } from "@/data/demo-operations";
import { memberById } from "@/data/demo-operations";
import type { Locale } from "@/i18n/config";
import type { Member, TaskStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./briefing";
import { DependencyMove } from "./dependency-move";
import { plural, statusLabel, type OperationsLabels, type WorkLabels } from "./labels";
import { RevisionMark } from "./revision-mark";

export type ListState = "ready" | "loading" | "empty" | "error";

const STATUS_TONE: Record<TaskStatus, string> = {
  backlog: "text-[var(--hf-ink-faint)] border-[var(--hf-rule)]",
  ready: "text-[var(--hf-ink-muted)] border-[var(--hf-rule)]",
  in_progress: "text-[var(--hf-info)] border-[var(--hf-info)]",
  review: "text-[var(--hf-accent)] border-[var(--hf-accent)]",
  done: "text-[var(--hf-ok)] border-[var(--hf-ok)]",
};

export function WorkList({
  tasks,
  members,
  now,
  locale,
  labels,
  statusLabels,
  selectedId,
  towedIds,
  state,
  pending,
  onSelect,
  onPreview,
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
  towedIds: string[];
  state: ListState;
  pending?: boolean;
  onSelect: (taskId: string) => void;
  onPreview: (ids: string[]) => void;
  onApplyMove: (taskId: string, status: TaskStatus, carryIds: string[]) => void;
  onRetry: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="work-heading" className="px-4 pb-6 sm:px-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--hf-rule)] pb-2">
        <h2 id="work-heading" className="t-label text-[var(--hf-ink-faint)]">
          {labels.heading}
        </h2>
        {state === "ready" ? (
          <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
            {plural(tasks.length, labels.itemsOne, labels.itemsOther)}
          </p>
        ) : null}
      </div>

      {state === "loading" ? <LoadingRows label={labels.loading} /> : null}
      {state === "empty" ? (
        <EmptyState title={labels.emptyTitle} body={labels.emptyBody} />
      ) : null}
      {state === "error" ? <ErrorState labels={labels} onRetry={onRetry} /> : null}

      {state === "ready" ? (
        <ul className="grid" style={{ gap: "var(--list-gap)" }}>
          {tasks.map((task) => {
            const selected = task.id === selectedId;
            const towed = towedIds.includes(task.id);
            const assignee = memberById(members, task.assigneeIds[0] ?? null);
            const dependents = tasks.filter((candidate) =>
              task.blocks.includes(candidate.id),
            );

            return (
              <motion.li
                key={task.id}
                animate={{ x: towed && !reduceMotion ? 10 : 0 }}
                transition={{ duration: 0.17, ease: [0.22, 0.61, 0.36, 1] }}
                className={cn(
                  "group relative flex items-center gap-3 border-b border-[var(--hf-rule-faint)]",
                  "transition-colors duration-[var(--motion-feedback)]",
                  "hover:bg-[var(--hf-ground-2)] has-[:focus-visible]:bg-[var(--hf-ground-2)]",
                  selected && "bg-[var(--hf-accent-quiet)]",
                )}
                style={{
                  minHeight: "var(--row-h)",
                  paddingTop: "var(--row-pad-y)",
                  paddingBottom: "var(--row-pad-y)",
                  paddingInline: "var(--row-pad-x)",
                }}
              >
                {/* Drawn edge marks selection; a towed row is annotated instead. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-0.5 transition-opacity",
                    "duration-[var(--motion-feedback)] bg-[var(--hf-accent)]",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />

                {towed ? (
                  <CornerDownRight
                    className="absolute -left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--hf-accent-line)]"
                    aria-hidden
                  />
                ) : null}

                <span
                  className={cn(
                    "t-mono-sm w-[6.5rem] shrink-0 truncate rounded-[var(--radius-sm)] border",
                    "px-1.5 text-center",
                    STATUS_TONE[task.status],
                  )}
                >
                  {statusLabel(task.status, statusLabels)}
                </span>

                {/* The button hugs its label so the focus ring does too, while
                    the stretched pseudo-element keeps the whole row clickable. */}
                <span className="min-w-0 flex-1">
                  <button
                    type="button"
                    id={`work-row-${task.id}`}
                    onClick={() => onSelect(task.id)}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "t-body block max-w-full truncate rounded-[var(--radius-sm)] text-left",
                      "font-medium text-[var(--hf-ink)]",
                      "after:absolute after:inset-0 after:content-['']",
                      "focus-visible:outline-2 focus-visible:outline-offset-2",
                      "focus-visible:outline-[var(--hf-accent)]",
                    )}
                  >
                    {task.title}
                    {towed ? <span className="sr-only"> — {labels.towed}</span> : null}
                  </button>
                </span>

                <div className="flex shrink-0 items-center gap-3">
                  {/* What changed survives every density: it is the whole point. */}
                  {task.revision ? (
                    <RevisionMark
                      signal={{
                        kind: "revision",
                        revision: task.revision.kind,
                        at: task.revision.at,
                      }}
                      now={now}
                      locale={locale}
                      labels={statusLabels}
                      note={task.revision.note}
                    />
                  ) : null}

                  <span data-density-optional>
                    {assignee ? (
                      <span className="flex items-center gap-1.5">
                        <Avatar member={assignee} />
                        <span className="t-body-sm hidden text-[var(--hf-ink-muted)] xl:inline">
                          {assignee.name}
                        </span>
                      </span>
                    ) : (
                      <span className="t-body-sm text-[var(--hf-ink-faint)]">
                        {statusLabels.unassigned}
                      </span>
                    )}
                  </span>
                </div>

                {/* Above the stretched title target so it stays clickable. */}
                <div className="relative z-10 shrink-0">
                  <DependencyMove
                    task={task}
                    dependents={dependents}
                    labels={labels}
                    statusLabels={statusLabels}
                    disabled={pending}
                    onPreview={onPreview}
                    onApply={(status, carryIds) => onApplyMove(task.id, status, carryIds)}
                  />
                </div>
              </motion.li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-px pt-1">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-[var(--hf-rule-faint)] py-3"
          style={{ minHeight: "var(--row-h)" }}
        >
          <span className="h-4 w-[6.5rem] shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-[var(--hf-ground-3)]" />
          <span
            className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--hf-ground-3)]"
            style={{ width: `${52 - index * 6}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid justify-items-start gap-2 py-10">
      <Inbox className="size-5 text-[var(--hf-ink-faint)]" aria-hidden />
      <p className="t-body-lg text-[var(--hf-ink)]">{title}</p>
      <p className="t-body max-w-[52ch] text-[var(--hf-ink-muted)]">{body}</p>
    </div>
  );
}

function ErrorState({ labels, onRetry }: { labels: WorkLabels; onRetry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-start gap-2 py-10">
      {/* Error keeps its own icon and wording, so it never relies on hue alone. */}
      <span className="t-body-sm inline-flex items-center gap-1.5 font-medium text-[var(--hf-error)]">
        <AlertTriangle className="size-4" aria-hidden />
        {labels.errorLabel}
      </span>
      <p className="t-body-lg text-[var(--hf-ink)]">{labels.errorTitle}</p>
      <p className="t-body max-w-[52ch] text-[var(--hf-ink-muted)]">{labels.errorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "t-body mt-1 inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)]",
          "border border-[var(--hf-rule-strong)] px-3 font-medium text-[var(--hf-ink)]",
          "hover:bg-[var(--hf-ground-2)] focus-visible:outline-2",
          "focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
        )}
      >
        <RotateCcw className="size-4" aria-hidden />
        {labels.retry}
      </button>
    </div>
  );
}
