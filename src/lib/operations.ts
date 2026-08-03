import type { Member, Task, TaskStatus } from "@/lib/domain/types";

export type RevisionKind = "new" | "changed" | "blocked";

export type OperationsTask = Task & {
  dependsOn: string[];
  blocks: string[];
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

export type AttentionSignal =
  | { kind: "revision"; revision: RevisionKind; at: string }
  | { kind: "priority"; priority: Task["priority"] };

export type AttentionItem = {
  id: string;
  headline: string;
  status: TaskStatus;
  dependentCount: number | null;
  actorId: string | null;
  taskId: string | null;
  signal: AttentionSignal;
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
    completed: changed.filter((task) => task.status === "done").length,
    blocked: changed.filter((task) => task.revision?.kind === "blocked").length,
    needsReview: changed.filter((task) => task.status === "review").length,
  };
}

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
      return priorityWeight[a.signal.priority] - priorityWeight[b.signal.priority];
    })
    .slice(0, 6);
}

export function memberById(members: Member[], id: string | null): Member | null {
  if (!id) return null;
  return members.find((member) => member.id === id) ?? null;
}

export const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "ready",
  "in_progress",
  "review",
  "done",
];
