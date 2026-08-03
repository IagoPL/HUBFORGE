import { getDemoWorkspace } from "@/data/demo-workspace";
import type { Member, Task, TaskStatus, WorkspaceSnapshot } from "@/lib/domain/types";

/**
 * Operations view of the demo workspace: dependencies and per-task change
 * history layered onto `getDemoWorkspace()`.
 *
 * Kept behind an adapter like the base snapshot so the operations surfaces can
 * swap to Supabase without rewriting screens. Every relation here is declared
 * data — the UI only draws a dependency line where one of these exists.
 */

export type RevisionKind = "new" | "changed" | "blocked";

export type OperationsTask = Task & {
  /** Tasks this one waits on. */
  dependsOn: string[];
  /** Derived inverse of `dependsOn`: tasks that wait on this one. */
  blocks: string[];
  /** Null when the workspace keeps no modification time for tasks. */
  updatedAt: string | null;
  revision: { kind: RevisionKind; at: string; note: string } | null;
};

export type TaskEventRow = {
  kind: string;
  summary: string;
  created_at: string;
  from_value?: string | null;
  to_value?: string | null;
};

/**
 * Why an item is on the attention list.
 *
 * `revision` needs a recorded change; live workspaces have no task history yet,
 * so they raise items on standing `priority` instead of inventing a timestamp.
 */
export type AttentionSignal =
  | { kind: "revision"; revision: RevisionKind; at: string }
  | { kind: "priority"; priority: Task["priority"] };

export type AttentionItem = {
  id: string;
  /** What happened, in the workspace's own words. */
  headline: string;
  status: TaskStatus;
  /** Tasks waiting on this one; null when the workspace has no dependency data. */
  dependentCount: number | null;
  actorId: string | null;
  taskId: string | null;
  signal: AttentionSignal;
};

export type OperationsSnapshot = WorkspaceSnapshot & {
  /** Start of the "since your last visit" window. */
  lastVisitAt: string;
  /** Wall clock the demo data is authored against. */
  nowAt: string;
  tasks: OperationsTask[];
  attention: AttentionItem[];
  /** The briefing sentence is assembled from these — never hand-asserted. */
  changeCounts: { merged: number; blocked: number; needsReview: number };
};

const LAST_VISIT_AT = "2026-07-26T17:00:00.000Z";
const NOW_AT = "2026-07-30T08:30:00.000Z";

/** Declared dependencies: task → the tasks it waits on. */
const DEPENDS_ON: Record<string, string[]> = {
  task_2: ["task_1"],
  task_3: ["task_2"],
  task_4: ["task_2"],
  task_5: ["task_1"],
};

const CHANGES: Record<
  string,
  { updatedAt: string; revision: OperationsTask["revision"] }
> = {
  task_1: {
    updatedAt: "2026-07-27T10:15:00.000Z",
    revision: {
      kind: "changed",
      at: "2026-07-27T10:15:00.000Z",
      note: "Merged and closed",
    },
  },
  task_2: {
    updatedAt: "2026-07-29T16:40:00.000Z",
    revision: {
      kind: "changed",
      at: "2026-07-29T16:40:00.000Z",
      note: "Moved to in progress",
    },
  },
  task_3: {
    updatedAt: "2026-07-29T09:05:00.000Z",
    revision: {
      kind: "blocked",
      at: "2026-07-29T09:05:00.000Z",
      note: "Waiting on board columns",
    },
  },
  task_4: {
    updatedAt: "2026-07-24T11:00:00.000Z",
    revision: null,
  },
  task_5: {
    updatedAt: "2026-07-28T14:20:00.000Z",
    revision: { kind: "new", at: "2026-07-28T14:20:00.000Z", note: "Review requested" },
  },
};

export function revisionFromEvent(
  event: TaskEventRow | null | undefined,
  taskStatus: TaskStatus,
): OperationsTask["revision"] {
  if (!event) return null;
  const at = event.created_at;
  const note = event.summary || event.kind;
  switch (event.kind) {
    case "created":
      return { kind: "new", at, note };
    case "status_changed":
      return { kind: "changed", at, note };
    case "dependency_added":
    case "dependency_removed":
      if (taskStatus !== "done") {
        return { kind: "blocked", at, note };
      }
      return { kind: "changed", at, note };
    default:
      return { kind: "changed", at, note };
  }
}

function buildBlocksMap(dependsOn: Map<string, string[]>) {
  const blocks = new Map<string, string[]>();
  for (const [taskId, deps] of dependsOn) {
    for (const dep of deps) {
      blocks.set(dep, [...(blocks.get(dep) ?? []), taskId]);
    }
  }
  return blocks;
}

/**
 * Layers the operations fields onto a plain task list.
 *
 * `declared` is true only for the demo workspace, which is the one place where
 * dependencies and change history are authored.
 */
export function toOperationsTasks(tasks: Task[], declared: boolean): OperationsTask[] {
  if (!declared) {
    return tasks.map((task) => ({
      ...task,
      dependsOn: [],
      blocks: [],
      updatedAt: null,
      revision: null,
    }));
  }

  const dependsOn = new Map(Object.entries(DEPENDS_ON));
  const blocks = buildBlocksMap(dependsOn);

  return tasks.map((task) => ({
    ...task,
    dependsOn: dependsOn.get(task.id) ?? [],
    blocks: blocks.get(task.id) ?? [],
    updatedAt: CHANGES[task.id]?.updatedAt ?? LAST_VISIT_AT,
    revision: CHANGES[task.id]?.revision ?? null,
  }));
}

export function operationsTasksFromLive(
  tasks: Task[],
  dependencyRows: { task_id: string; depends_on_task_id: string }[],
  latestEvents: Record<string, TaskEventRow | undefined>,
  updatedAtById: Record<string, string | null>,
): OperationsTask[] {
  const dependsOn = new Map<string, string[]>();
  for (const row of dependencyRows) {
    const list = dependsOn.get(row.task_id) ?? [];
    list.push(row.depends_on_task_id);
    dependsOn.set(row.task_id, list);
  }
  const blocks = buildBlocksMap(dependsOn);

  return tasks.map((task) => ({
    ...task,
    dependsOn: dependsOn.get(task.id) ?? [],
    blocks: blocks.get(task.id) ?? [],
    updatedAt: updatedAtById[task.id] ?? null,
    revision: revisionFromEvent(latestEvents[task.id], task.status),
  }));
}

/** Wall clock the demo data is authored against. */
export const DEMO_NOW_AT = NOW_AT;

const REVISION_WEIGHT = { blocked: 0, new: 1, changed: 2 } as const;

export function buildAttentionFromTasks(
  tasks: OperationsTask[],
  lastVisitAt: string,
): AttentionItem[] {
  const since = Date.parse(lastVisitAt);

  return tasks
    .filter((task) => task.revision && Date.parse(task.revision.at) > since)
    .filter((task) => task.status !== "done")
    .map(
      (task) =>
        ({
          id: `att_${task.id}`,
          headline: `${task.title} — ${task.revision!.note.toLowerCase()}`,
          status: task.status,
          dependentCount: task.blocks.length,
          actorId: task.assigneeIds[0] ?? null,
          taskId: task.id,
          signal: {
            kind: "revision",
            revision: task.revision!.kind,
            at: task.revision!.at,
          },
        }) satisfies AttentionItem,
    )
    .sort((a, b) => {
      if (a.signal.kind !== "revision" || b.signal.kind !== "revision") return 0;
      return (
        REVISION_WEIGHT[a.signal.revision] - REVISION_WEIGHT[b.signal.revision] ||
        Date.parse(b.signal.at) - Date.parse(a.signal.at)
      );
    });
}

export function changeCountsFromTasks(tasks: OperationsTask[], lastVisitAt: string) {
  const since = Date.parse(lastVisitAt);
  const changed = tasks.filter((task) => Date.parse(task.updatedAt ?? "") > since);

  return {
    merged: changed.filter((task) => task.status === "done").length,
    blocked: changed.filter((task) => task.revision?.kind === "blocked").length,
    needsReview: changed.filter((task) => task.status === "review").length,
  };
}

/**
 * Attention list for live workspaces: revision when recorded, else priority.
 */
export function buildLiveAttention(tasks: OperationsTask[]): AttentionItem[] {
  const priorityWeight = { high: 0, medium: 1, low: 2 } as const;

  return tasks
    .filter((task) => task.status !== "done")
    .filter((task) => task.revision || task.priority !== "low")
    .map((task) => {
      if (task.revision) {
        return {
          id: `att_${task.id}`,
          headline: `${task.title} — ${task.revision.note.toLowerCase()}`,
          status: task.status,
          dependentCount: task.blocks.length,
          actorId: task.assigneeIds[0] ?? null,
          taskId: task.id,
          signal: {
            kind: "revision" as const,
            revision: task.revision.kind,
            at: task.revision.at,
          },
        } satisfies AttentionItem;
      }

      return {
        id: `att_${task.id}`,
        headline: task.title,
        status: task.status,
        dependentCount: task.blocks.length,
        actorId: task.assigneeIds[0] ?? null,
        taskId: task.id,
        signal: { kind: "priority" as const, priority: task.priority },
      } satisfies AttentionItem;
    })
    .sort((a, b) => {
      if (a.signal.kind === "revision" && b.signal.kind === "revision") {
        return (
          REVISION_WEIGHT[a.signal.revision] - REVISION_WEIGHT[b.signal.revision] ||
          Date.parse(b.signal.at) - Date.parse(a.signal.at)
        );
      }
      if (a.signal.kind === "revision") return -1;
      if (b.signal.kind === "revision") return 1;
      return (
        priorityWeight[a.signal.priority] - priorityWeight[b.signal.priority]
      );
    })
    .slice(0, 6);
}

export function getDemoOperations(): OperationsSnapshot {
  const snapshot = getDemoWorkspace();
  const tasks = toOperationsTasks(snapshot.tasks, true);

  return {
    ...snapshot,
    tasks,
    lastVisitAt: LAST_VISIT_AT,
    nowAt: NOW_AT,
    attention: buildAttentionFromTasks(tasks, LAST_VISIT_AT),
    changeCounts: changeCountsFromTasks(tasks, LAST_VISIT_AT),
  };
}

export function memberById(members: Member[], id: string | null): Member | null {
  if (!id) return null;
  return members.find((member) => member.id === id) ?? null;
}

export const STATUS_LABELS: Record<Task["status"], string> = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

export const STATUS_ORDER: Task["status"][] = [
  "backlog",
  "ready",
  "in_progress",
  "review",
  "done",
];
