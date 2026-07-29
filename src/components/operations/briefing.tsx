"use client";

import { ArrowRight } from "lucide-react";
import type { AttentionItem } from "@/data/demo-operations";
import { memberById } from "@/data/demo-operations";
import type { Locale } from "@/i18n/config";
import type { Member } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { plural, statusLabel, type OperationsLabels } from "./labels";
import { RevisionMark } from "./revision-mark";

/**
 * The entry surface. Answers what changed, why it matters and what the user can
 * do about it — in that order, in prose, before any table appears.
 *
 * `summary` is assembled by the caller from real counts, so this component
 * never asserts anything the workspace cannot back up.
 */
export function Briefing({
  summary,
  attention,
  members,
  now,
  locale,
  labels,
  onOpen,
}: {
  summary: string;
  attention: AttentionItem[];
  members: Member[];
  now: string;
  locale: Locale;
  labels: OperationsLabels;
  onOpen: (taskId: string) => void;
}) {
  return (
    <section aria-labelledby="briefing-heading" className="px-4 py-5 sm:px-6">
      <h2 id="briefing-heading" className="t-label text-[var(--hf-ink-faint)]">
        {labels.briefing}
      </h2>

      <p className="t-body-lg mt-2 max-w-[60ch] text-[var(--hf-ink)]">{summary}</p>

      {attention.length === 0 ? (
        <p className="t-body mt-3 text-[var(--hf-ink-muted)]">{labels.nothingNeedsAttention}</p>
      ) : (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {attention.map((item) => {
            const actor = memberById(members, item.actorId);
            const blocked = item.signal.kind === "revision" && item.signal.revision === "blocked";

            return (
              <li key={item.id}>
                {/* Urgency is carried by order and by the mark's icon, word and
                    colour — an accent side tab would be decoration. */}
                <article
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-[var(--radius-lg)] border p-3",
                    "border-[var(--hf-rule)] bg-[var(--hf-ground-2)]",
                  )}
                >
                  <RevisionMark
                    signal={item.signal}
                    now={now}
                    locale={locale}
                    labels={labels}
                    note={item.headline}
                  />

                  <h3 className="t-body font-medium text-[var(--hf-ink)]">{item.headline}</h3>
                  <p className="t-body-sm text-[var(--hf-ink-muted)]">
                    {consequence(item, labels)}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {actor ? (
                      <span className="t-body-sm flex items-center gap-1.5 text-[var(--hf-ink-muted)]">
                        <Avatar member={actor} />
                        {actor.name}
                      </span>
                    ) : (
                      <span className="t-body-sm text-[var(--hf-ink-faint)]">
                        {labels.unassigned}
                      </span>
                    )}

                    {item.taskId ? (
                      <button
                        type="button"
                        onClick={() => onOpen(item.taskId as string)}
                        className={cn(
                          "t-body-sm inline-flex items-center gap-1 rounded-[var(--radius-sm)]",
                          "px-1.5 py-1 font-medium text-[var(--hf-accent)]",
                          "transition-colors duration-[var(--motion-feedback)]",
                          "hover:bg-[var(--hf-accent-quiet)] focus-visible:outline-2",
                          "focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]",
                        )}
                      >
                        {blocked ? labels.resolveBlocker : labels.openTask}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/**
 * Why it matters. Falls back to the task's status when the workspace has no
 * dependency data, rather than claiming nothing depends on it.
 */
function consequence(item: AttentionItem, labels: OperationsLabels) {
  if (item.dependentCount === null) return statusLabel(item.status, labels);

  const blocked = item.signal.kind === "revision" && item.signal.revision === "blocked";

  if (blocked) {
    return item.dependentCount === 0
      ? labels.blocksNothing
      : plural(item.dependentCount, labels.blocksOne, labels.blocksOther);
  }

  return item.dependentCount === 0
    ? labels.waitsNothing
    : plural(item.dependentCount, labels.waitsOne, labels.waitsOther);
}

export function Avatar({ member, className }: { member: Member; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "t-mono-sm grid size-5 shrink-0 place-items-center rounded-full",
        "bg-[var(--hf-ground-3)] text-[0.625rem] text-[var(--hf-ink-muted)]",
        className,
      )}
    >
      {member.avatarInitials}
    </span>
  );
}
