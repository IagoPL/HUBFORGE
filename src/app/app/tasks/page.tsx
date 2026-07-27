import { Badge } from "@/components/ui/badge";
import { getDemoWorkspace } from "@/data/demo-workspace";
import type { TaskStatus } from "@/lib/domain/types";

export const metadata = {
  title: "Tasks",
};

const columns: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "ready", label: "Ready" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const priorityTone = {
  low: "neutral",
  medium: "warning",
  high: "danger",
} as const;

export default function TasksPage() {
  const { tasks, members } = getDemoWorkspace();
  const memberById = new Map(members.map((member) => [member.id, member]));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Tasks
        </h1>
        <p className="text-[var(--hf-fg-muted)]">
          List and Kanban views share the same typed demo tasks.
        </p>
      </header>

      <section aria-label="Kanban board" className="overflow-x-auto pb-2">
        <div className="flex min-w-[64rem] gap-3">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);
            return (
              <div
                key={column.id}
                className="w-64 shrink-0 rounded-2xl bg-[var(--hf-surface-2)] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <span className="text-xs text-[var(--hf-fg-muted)]">
                    {columnTasks.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {columnTasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-3"
                    >
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-[var(--hf-fg-muted)]">
                        {task.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                        {task.assigneeIds.map((id) => {
                          const member = memberById.get(id);
                          return member ? (
                            <span
                              key={id}
                              className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--hf-brand-soft)] text-[10px] font-semibold text-[var(--hf-brand-strong)]"
                              title={member.name}
                            >
                              {member.avatarInitials}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section
        aria-label="Task list"
        className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)]"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--hf-border)] text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignees</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-[var(--hf-border)] last:border-0"
                >
                  <td className="px-4 py-3">{task.title}</td>
                  <td className="px-4 py-3">{task.status.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{task.priority}</td>
                  <td className="px-4 py-3">
                    {task.assigneeIds
                      .map((id) => memberById.get(id)?.name)
                      .filter(Boolean)
                      .join(", ") || "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
