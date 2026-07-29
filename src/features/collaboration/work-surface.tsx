"use client";

import { AnimatePresence } from "motion/react";
import { Undo2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Inspector } from "@/components/operations/inspector";
import {
  plural,
  statusLabel,
  type OperationsLabels,
  type WorkLabels,
} from "@/components/operations/labels";
import { WorkList, type ListState } from "@/components/operations/work-list";
import { DEMO_NOW_AT, toOperationsTasks } from "@/data/demo-operations";
import { getDemoWorkspace } from "@/data/demo-workspace";
import {
  createTaskAction,
  listMembersAction,
  listTasksAction,
  updateTaskStatusAction,
} from "@/features/collaboration/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import type { Locale } from "@/i18n/config";
import type { Member, Task, TaskStatus } from "@/lib/domain/types";
import { cn, fill } from "@/lib/utils";

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

/**
 * The work surface: create work, read it at the density you need, and move it
 * with its dependencies in view.
 *
 * Selection lives in the URL so opening a task is real navigation — linkable,
 * and the back button closes the layer.
 */
export function WorkSurface({
  locale,
  labels,
  operationsLabels,
  formLabels,
}: {
  locale: Locale;
  labels: WorkLabels;
  operationsLabels: OperationsLabels;
  formLabels: {
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
  const searchParams = useSearchParams();

  /** Bumped to re-read local demo storage, and to retry a failed live fetch. */
  const [reloadKey, setReloadKey] = useState(0);
  /** Tagged with the project it belongs to, so "loaded" is derived, not tracked. */
  const [live, setLive] = useState<{
    projectId: string;
    tasks: Task[];
    members: Member[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [towedIds, setTowedIds] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ tasks: Task[]; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState("");

  const demoTasks = useMemo(() => {
    void reloadKey;
    if (mode !== "demo" || !projectId) return [];
    return loadDemoTasks(projectId);
  }, [mode, projectId, reloadKey]);

  const demoMembers = useMemo(() => {
    if (mode !== "demo") return [];
    return getDemoWorkspace().members.filter(
      (member) => member.organizationId === (organizationId || "org_demo"),
    );
  }, [mode, organizationId]);

  const loaded = mode === "demo" || !projectId || live?.projectId === projectId;
  const plainTasks = useMemo(
    () => (mode === "demo" ? demoTasks : (live?.tasks ?? [])),
    [mode, demoTasks, live],
  );
  const members = mode === "demo" ? demoMembers : (live?.members ?? []);

  // Dependencies and history are authored for the demo workspace only.
  const tasks = useMemo(
    () => toOperationsTasks(plainTasks, mode === "demo"),
    [plainTasks, mode],
  );
  const now = mode === "demo" ? DEMO_NOW_AT : new Date().toISOString();

  useEffect(() => {
    if (mode !== "live" || !projectId) return;

    let cancelled = false;
    void Promise.all([
      listTasksAction(projectId),
      organizationId
        ? listMembersAction(organizationId)
        : Promise.resolve({ ok: true as const, data: [] as Member[] }),
    ]).then(([tasksResult, membersResult]) => {
      if (cancelled) return;
      if (!tasksResult.ok) {
        setError(tasksResult.error);
        return;
      }
      setLive({
        projectId,
        tasks: tasksResult.data,
        members: membersResult.ok ? membersResult.data : [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mode, projectId, organizationId, reloadKey]);

  const selectedId = searchParams.get("task");
  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  /** Native history so the URL changes without a server round-trip. */
  const setParam = useCallback((key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.pushState(null, "", url);
  }, []);

  const select = useCallback((taskId: string) => setParam("task", taskId), [setParam]);

  /** Closing returns focus to the row the layer came from. */
  const close = useCallback(() => {
    const origin = selectedId;
    setParam("task", null);
    if (origin) document.getElementById(`work-row-${origin}`)?.focus();
  }, [selectedId, setParam]);

  const listState: ListState = error
    ? "error"
    : !loaded
      ? "loading"
      : tasks.length === 0
        ? "empty"
        : "ready";

  function persist(next: Task[], changed: { id: string; status: TaskStatus }[]) {
    if (mode === "demo") {
      saveDemoTasks(next);
      setReloadKey((value) => value + 1);
      return;
    }

    setLive((current) => (current ? { ...current, tasks: next } : current));
    startTransition(() => {
      void Promise.all(
        changed.map((task) => updateTaskStatusAction({ taskId: task.id, status: task.status })),
      ).then((results) => {
        const failed = results.find((result) => !result.ok);
        if (failed && !failed.ok) setError(failed.error);
      });
    });
  }

  function applyMove(taskId: string, status: TaskStatus, carryIds: string[]) {
    const moved = plainTasks.find((task) => task.id === taskId);
    if (!moved) return;

    const movedIds = [taskId, ...carryIds];
    const next = plainTasks.map((task) =>
      movedIds.includes(task.id) ? { ...task, status } : task,
    );

    const carried =
      carryIds.length > 0
        ? ` ${plural(carryIds.length, labels.carriedOne, labels.carriedOther)}`
        : "";
    const message =
      fill(labels.movedTo, {
        title: moved.title,
        status: statusLabel(status, operationsLabels),
      }) + carried;

    setUndo({ tasks: plainTasks, message });
    setAnnouncement(message);
    persist(
      next,
      movedIds.map((id) => ({ id, status })),
    );
  }

  function revert() {
    if (!undo) return;
    persist(
      undo.tasks,
      undo.tasks.map((task) => ({ id: task.id, status: task.status })),
    );
    setAnnouncement(labels.undone);
    setUndo(null);
  }

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
      setReloadKey((value) => value + 1);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      return;
    }

    startTransition(() => {
      void createTaskAction({ projectId, title, description, priority, assigneeIds }).then(
        (result) => {
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setLive((current) =>
            current ? { ...current, tasks: [...current.tasks, result.data] } : current,
          );
          setTitle("");
          setDescription("");
          setAssigneeId("");
        },
      );
    });
  }

  if (!projectId) {
    return (
      <div className="px-4 py-5 sm:px-6">
        <p className="lead">{formLabels.emptyProject}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="grid gap-4 px-4 py-5 sm:px-6">
          <p className="lead">{formLabels.subtitle}</p>

          <details className="panel">
            <summary
              className={cn(
                "t-display-sm cursor-pointer list-none p-4 text-[var(--hf-ink)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--hf-accent)]",
              )}
            >
              {formLabels.create}
            </summary>
            <form
              className="grid gap-3 border-t border-[var(--hf-rule)] p-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                createTask();
              }}
            >
              <label className="grid gap-1.5 md:col-span-2">
                <span className="t-body-sm font-medium text-[var(--hf-ink)]">
                  {formLabels.taskTitle}
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="input"
                  required
                  disabled={pending}
                />
              </label>
              <label className="grid gap-1.5 md:col-span-2">
                <span className="t-body-sm font-medium text-[var(--hf-ink)]">
                  {formLabels.description}
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="input min-h-20"
                  disabled={pending}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="t-body-sm font-medium text-[var(--hf-ink)]">
                  {formLabels.priority}
                </span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as Task["priority"])}
                  className="input"
                  disabled={pending}
                >
                  <option value="low">{labels.priorityLow}</option>
                  <option value="medium">{labels.priorityMedium}</option>
                  <option value="high">{labels.priorityHigh}</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="t-body-sm font-medium text-[var(--hf-ink)]">
                  {formLabels.assignee}
                </span>
                <select
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  className="input"
                  disabled={pending}
                >
                  <option value="">{formLabels.unassigned}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                disabled={pending}
                className="justify-self-start md:col-span-2"
              >
                {formLabels.create}
              </Button>
            </form>
          </details>

          {undo ? (
            <div className="panel flex items-center justify-between gap-3 px-3 py-2">
              <p className="t-body-sm text-[var(--hf-ink)]">{undo.message}</p>
              <Button type="button" variant="ghost" size="sm" onClick={revert}>
                <Undo2 className="size-3.5" aria-hidden />
                {labels.undo}
              </Button>
            </div>
          ) : null}
        </div>

        <WorkList
          tasks={tasks}
          members={members}
          now={now}
          locale={locale}
          labels={labels}
          statusLabels={operationsLabels}
          selectedId={selectedId}
          towedIds={towedIds}
          state={listState}
          pending={pending}
          onSelect={select}
          onPreview={setTowedIds}
          onApplyMove={applyMove}
          onRetry={() => {
            setError(null);
            setReloadKey((value) => value + 1);
          }}
        />
      </div>

      <AnimatePresence>
        {selected ? (
          <Inspector
            key={selected.id}
            task={selected}
            tasks={tasks}
            members={members}
            now={now}
            locale={locale}
            labels={labels}
            statusLabels={operationsLabels}
            onClose={close}
            onSelect={select}
          />
        ) : null}
      </AnimatePresence>

      {/* Every state change is announced, not only drawn. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
