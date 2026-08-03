"use client";

import { AnimatePresence } from "motion/react";
import { Undo2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Inspector, type InspectorSaveInput } from "@/components/operations/inspector";
import {
  plural,
  statusLabel,
  type OperationsLabels,
  type WorkLabels,
} from "@/components/operations/labels";
import { WorkBoard } from "@/components/operations/work-board";
import { WorkList, type ListState } from "@/components/operations/work-list";
import type { OperationsTask } from "@/lib/operations";
import {
  createTaskAction,
  listMembersAction,
  listOperationsTasksAction,
  setTaskAssigneesAction,
  setTaskDependenciesAction,
  updateTaskAction,
  updateTaskStatusAction,
} from "@/features/collaboration/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import type { Locale } from "@/i18n/config";
import type { Member, Task, TaskStatus } from "@/lib/domain/types";
import { cn, fill } from "@/lib/utils";

type ViewMode = "list" | "board";

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
    listView: string;
    boardView: string;
    saveTask: string;
  };
}) {
  const { activeProject, activeOrganization } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const searchParams = useSearchParams();

  const [reloadKey, setReloadKey] = useState(0);
  const [live, setLive] = useState<{
    projectId: string;
    tasks: OperationsTask[];
    members: Member[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [towedIds, setTowedIds] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ tasks: OperationsTask[]; message: string } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const loaded = !projectId || live?.projectId === projectId;
  const tasks = useMemo(() => live?.tasks ?? [], [live]);
  const members = useMemo(() => live?.members ?? [], [live]);
  const now = new Date().toISOString();

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    void Promise.all([
      listOperationsTasksAction(projectId),
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
  }, [projectId, organizationId, reloadKey]);

  const selectedId = searchParams.get("task");
  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const setParam = useCallback((key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.pushState(null, "", url);
  }, []);

  const select = useCallback((taskId: string) => setParam("task", taskId), [setParam]);

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

  function persist(
    next: OperationsTask[],
    changed: { id: string; status: TaskStatus }[],
  ) {
    setLive((current) => (current ? { ...current, tasks: next } : current));
    startTransition(() => {
      void Promise.all(
        changed.map((task) =>
          updateTaskStatusAction({ taskId: task.id, status: task.status }),
        ),
      ).then((results) => {
        const failed = results.find((result) => !result.ok);
        if (failed && !failed.ok) setError(failed.error);
      });
    });
  }

  function applyMove(taskId: string, status: TaskStatus, carryIds: string[]) {
    const moved = tasks.find((task) => task.id === taskId);
    if (!moved) return;

    const movedIds = [taskId, ...carryIds];
    const next = tasks.map((task) =>
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

    setUndo({ tasks, message });
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

  async function saveTask(input: InspectorSaveInput): Promise<string | null> {
    if (!selectedId) return "No task selected.";

    const update = await updateTaskAction({
      taskId: selectedId,
      title: input.title,
      description: input.description,
      priority: input.priority,
    });
    if (!update.ok) return update.error;

    const assignees = await setTaskAssigneesAction({
      taskId: selectedId,
      assigneeIds: input.assigneeIds,
    });
    if (!assignees.ok) return assignees.error;

    const deps = await setTaskDependenciesAction({
      taskId: selectedId,
      dependsOnTaskIds: input.dependsOnTaskIds,
    });
    if (!deps.ok) return deps.error;

    setReloadKey((value) => value + 1);
    setAnnouncement(formLabels.saveTask);
    return null;
  }

  function createTask() {
    if (!projectId || !title.trim()) return;
    setError(null);
    const assigneeIds = assigneeId ? [assigneeId] : [];

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
        setLive((current) =>
          current
            ? {
                ...current,
                tasks: [
                  ...current.tasks,
                  {
                    ...result.data,
                    dependsOn: [],
                    blocks: [],
                    updatedAt: null,
                    revision: null,
                  },
                ],
              }
            : current,
        );
        setTitle("");
        setDescription("");
        setAssigneeId("");
      });
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
                  onChange={(event) =>
                    setPriority(event.target.value as Task["priority"])
                  }
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

          <div
            role="group"
            aria-label={formLabels.listView}
            className="flex gap-1 border-b border-[var(--hf-rule)] pb-2"
          >
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "t-body-sm rounded-[var(--radius-md)] px-3 py-1.5",
                view === "list"
                  ? "bg-[var(--hf-ground-3)] text-[var(--hf-ink)]"
                  : "text-[var(--hf-ink-muted)] hover:text-[var(--hf-ink)]",
              )}
            >
              {formLabels.listView}
            </button>
            <button
              type="button"
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
              className={cn(
                "t-body-sm rounded-[var(--radius-md)] px-3 py-1.5",
                view === "board"
                  ? "bg-[var(--hf-ground-3)] text-[var(--hf-ink)]"
                  : "text-[var(--hf-ink-muted)] hover:text-[var(--hf-ink)]",
              )}
            >
              {formLabels.boardView}
            </button>
          </div>
        </div>

        {view === "list" ? (
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
        ) : (
          <WorkBoard
            tasks={tasks}
            members={members}
            now={now}
            locale={locale}
            labels={labels}
            statusLabels={operationsLabels}
            selectedId={selectedId}
            state={listState}
            pending={pending}
            onSelect={select}
            onApplyMove={applyMove}
            onRetry={() => {
              setError(null);
              setReloadKey((value) => value + 1);
            }}
          />
        )}
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
            saveLabel={formLabels.saveTask}
            unassignedLabel={formLabels.unassigned}
            editable
            onClose={close}
            onSelect={select}
            onSave={saveTask}
          />
        ) : null}
      </AnimatePresence>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
