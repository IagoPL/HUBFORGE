import type { DemoDependencyEdge, DemoSignal } from "@/features/demo/types";
import type { OperationsTask } from "@/lib/operations";
import { statusLabel, type OperationsLabels } from "@/components/operations/labels";

/**
 * Phase C adapters: map existing task/dependency rows into the Attention and
 * Dependencies visual contracts. Not the Phase D signal engine.
 */
export function attentionSignalsFromTasks(
  tasks: OperationsTask[],
  labels: { unassigned: string; origin: string },
): DemoSignal[] {
  const signals: DemoSignal[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    if (task.blocks.length > 0) {
      signals.push({
        id: `live_block_${task.id}`,
        type: "work_blocked",
        kind: "fact",
        severity: "high",
        title: task.title,
        evidence: `Explicit dependency: ${task.blocks.length} work item(s) wait on this.`,
        whyItMatters: "Downstream work cannot progress until this clears.",
        recommendedAction: "Resolve the blocker or re-scope dependents.",
        occurredAt: task.updatedAt ?? task.revision?.at ?? new Date(0).toISOString(),
        assigneeLabel: task.assigneeIds[0] ? task.assigneeIds[0] : labels.unassigned,
        originLabel: labels.origin,
        originRef: `hubforge://work/${task.id}`,
        subjectWorkId: task.id,
      });
    }

    if (task.status === "review") {
      signals.push({
        id: `live_review_${task.id}`,
        type: "review_waiting",
        kind: "fact",
        severity: "high",
        title: task.title,
        evidence: "Work item is in review.",
        whyItMatters: "Waiting on a human review before it can complete.",
        recommendedAction: "Assign an available reviewer.",
        occurredAt: task.updatedAt ?? new Date(0).toISOString(),
        assigneeLabel: task.assigneeIds[0] ? task.assigneeIds[0] : labels.unassigned,
        originLabel: labels.origin,
        originRef: `hubforge://work/${task.id}`,
        subjectWorkId: task.id,
      });
    }

    if (task.priority === "high" && task.assigneeIds.length === 0) {
      signals.push({
        id: `live_unassigned_${task.id}`,
        type: "unassigned_critical",
        kind: "fact",
        severity: "high",
        title: task.title,
        evidence: "High priority with no assignee.",
        whyItMatters: "Critical work has no owner yet.",
        recommendedAction: "Assign someone with capacity this week.",
        occurredAt: task.updatedAt ?? new Date(0).toISOString(),
        assigneeLabel: labels.unassigned,
        originLabel: labels.origin,
        originRef: `hubforge://work/${task.id}`,
        subjectWorkId: task.id,
      });
    }
  }

  return signals.slice(0, 12);
}

export function dependencyEdgesFromTasks(
  tasks: OperationsTask[],
  opsLabels: OperationsLabels,
  unassigned: string,
): DemoDependencyEdge[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const edges: DemoDependencyEdge[] = [];

  for (const task of tasks) {
    for (const blockerId of task.dependsOn) {
      const blocker = byId.get(blockerId);
      if (!blocker) continue;
      edges.push({
        id: `dep_${task.id}_${blockerId}`,
        blockedId: task.id,
        blockerId,
        blockedTitle: task.title,
        blockerTitle: blocker.title,
        affectedCount: blocker.blocks.length,
        assigneeLabel: blocker.assigneeIds[0] ?? unassigned,
        status: statusLabel(blocker.status, opsLabels),
        blockedForDays: ageDays(task.updatedAt),
        evidence: "Explicit task_dependencies edge.",
      });
    }
  }

  return edges;
}

function ageDays(iso: string | null) {
  if (!iso) return 0;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}
