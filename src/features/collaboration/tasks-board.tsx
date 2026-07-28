"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createTaskAction,
  listMembersAction,
  listTasksAction,
  updateTaskStatusAction,
} from "@/features/collaboration/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { getDemoWorkspace } from "@/data/demo-workspace";
import type { Member, Task, TaskStatus } from "@/lib/domain/types";

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

const DEMO_TASKS_KEY = "hubforge.demo.tasks.v1";

function loadDemoTasks(projectId: string): Task[] {
  const seed = getDemoWorkspace().tasks.filter((task) => task.projectId === projectId);
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(DEMO_TASKS_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Task[];
    const filtered = parsed.filter((task) => task.projectId === projectId);
    return filtered.length > 0 ? filtered : seed;
  } catch {
    return seed;
  }
}

function saveDemoTasks(tasks: Task[]) {
  window.localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(tasks));
}

export function TasksBoard({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    create: string;
    taskTitle: string;
    description: string;
    priority: string;
    assignee: string;
    emptyProject: string;
    unassigned: string;
  };
}) {
  const { mode, activeProject, activeOrganization } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [demoTick, setDemoTick] = useState(0);
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState("");

  const demoTasks = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !projectId) return [];
    return loadDemoTasks(projectId);
  }, [mode, projectId, demoTick]);

  const tasks = mode === "demo" ? demoTasks : liveTasks;

  const demoMembers = useMemo(() => {
    if (mode !== "demo") return [];
    return getDemoWorkspace().members.filter(
      (member) => member.organizationId === (organizationId || "org_demo"),
    );
  }, [mode, organizationId]);

  const visibleMembers = mode === "demo" ? demoMembers : members;
  const memberById = new Map(visibleMembers.map((member) => [member.id, member]));

  useEffect(() => {
    if (mode !== "live" || !projectId) return;

    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listTasksAction(projectId),
        organizationId
          ? listMembersAction(organizationId)
          : Promise.resolve({ ok: true as const, data: [] as Member[] }),
      ]).then(([tasksResult, membersResult]) => {
        if (cancelled) return;
        if (tasksResult.ok) setLiveTasks(tasksResult.data);
        else setError(tasksResult.error);
        if (membersResult.ok) setMembers(membersResult.data);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mode, projectId, organizationId]);

  function createTask() {
    if (!projectId || !title.trim()) return;
    setError(null);
    const assigneeIds = assigneeId ? [assigneeId] : [];

    if (mode === "demo") {
      const task: Task = {
        id: `task_${crypto.randomUUID().slice(0, 8)}`,
        projectId,
        title: title.trim(),
        description: description.trim(),
        status: "backlog",
        priority,
        assigneeIds,
      };
      saveDemoTasks([...demoTasks, task]);
      setDemoTick((value) => value + 1);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      return;
    }

    startTransition(() => {
      void createTaskAction({
        projectId,
        title,
        description,
        priority,
        assigneeIds,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setLiveTasks((current) => [...current, result.data]);
        setTitle("");
        setDescription("");
        setAssigneeId("");
      });
    });
  }

  function moveTask(taskId: string, status: TaskStatus) {
    setError(null);

    if (mode === "demo") {
      saveDemoTasks(
        demoTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
      setDemoTick((value) => value + 1);
      return;
    }

    setLiveTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
    startTransition(() => {
      void updateTaskStatusAction({ taskId, status }).then((result) => {
        if (!result.ok) setError(result.error);
      });
    });
  }

  if (!projectId) {
    return (
      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.emptyProject}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
      </header>

      {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}

      <form
        className="grid max-w-3xl gap-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          createTask();
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold md:col-span-2">
          {labels.create}
        </h2>
        <label className="block space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{labels.taskTitle}</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            required
            disabled={pending}
          />
        </label>
        <label className="block space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{labels.description}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-20 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3 py-2"
            disabled={pending}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.priority}</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Task["priority"])}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.assignee}</span>
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending}
          >
            <option value="">{labels.unassigned}</option>
            {visibleMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {labels.create}
          </Button>
        </div>
      </form>

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
                      <label className="mt-3 block text-xs text-[var(--hf-fg-muted)]">
                        Status
                        <select
                          className="mt-1 h-8 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-2"
                          value={task.status}
                          disabled={pending}
                          onChange={(event) =>
                            moveTask(task.id, event.target.value as TaskStatus)
                          }
                        >
                          {columns.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
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
                      .join(", ") || labels.unassigned}
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
