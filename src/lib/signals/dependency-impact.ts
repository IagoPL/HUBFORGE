import type { EvidenceBundle } from "@/lib/signals/types";

export type DependencyImpactRow = {
  id: string;
  blockedId: string;
  blockerId: string;
  blockedTitle: string;
  blockerTitle: string;
  affectedCount: number;
  assigneeLabel: string;
  status: string;
  blockedForDays: number;
  evidence: string;
};

/** Explicit dependency edges with impact counts — pure projection from evidence. */
export function dependencyImpactFromBundle(
  bundle: EvidenceBundle,
): DependencyImpactRow[] {
  const byId = new Map(bundle.tasks.map((task) => [task.id, task]));
  const memberName = new Map(bundle.members.map((member) => [member.id, member.name]));
  const blockedBy = new Map<string, string[]>();
  for (const edge of bundle.dependencies) {
    const list = blockedBy.get(edge.dependsOnTaskId) ?? [];
    list.push(edge.taskId);
    blockedBy.set(edge.dependsOnTaskId, list);
  }

  const now = Date.parse(bundle.config.now);
  const rows: DependencyImpactRow[] = [];

  for (const edge of bundle.dependencies) {
    const blocked = byId.get(edge.taskId);
    const blocker = byId.get(edge.dependsOnTaskId);
    if (!blocked || !blocker) continue;
    if (blocked.status === "done") continue;

    const affected = (blockedBy.get(blocker.id) ?? []).filter((id) => {
      const child = byId.get(id);
      return child && child.status !== "done";
    }).length;

    const updated = blocker.updatedAt ? Date.parse(blocker.updatedAt) : now;
    const blockedForDays = Math.max(0, Math.floor((now - updated) / 86400000));

    rows.push({
      id: `dep_${edge.taskId}_${edge.dependsOnTaskId}`,
      blockedId: blocked.id,
      blockerId: blocker.id,
      blockedTitle: blocked.title,
      blockerTitle: blocker.title,
      affectedCount: affected,
      assigneeLabel: blocker.assigneeIds[0]
        ? (memberName.get(blocker.assigneeIds[0]) ?? blocker.assigneeIds[0])
        : "—",
      status: blocker.status,
      blockedForDays,
      evidence: "Explicit task_dependencies edge.",
    });
  }

  return rows;
}
