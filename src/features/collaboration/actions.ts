"use server";

import { revalidatePath } from "next/cache";
import {
  operationsTasksFromLive,
  type OperationsTask,
  type TaskEventRow,
} from "@/lib/operations";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import {
  mapInvitationRow,
  mapMemberRow,
  mapTaskRow,
} from "@/features/collaboration/mapping";
import type { Invitation } from "@/features/collaboration/mapping";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { inviteAcceptUrl, sendEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fill } from "@/lib/utils";
import {
  memberRoleSchema,
  type AccessRole,
  type Member,
  type Task,
  type TaskStatus,
} from "@/lib/domain/types";
import { getPackagingLimits } from "@/lib/packaging/limits";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

type LiveGate = {
  ok: true;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
};

async function recordTaskEvent(
  supabase: LiveGate["supabase"],
  actorId: string,
  input: {
    taskId: string;
    kind: string;
    summary: string;
    fromValue?: string | null;
    toValue?: string | null;
  },
) {
  const { data: task } = await supabase
    .from("tasks")
    .select("project_id")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!task) return;

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", task.project_id)
    .maybeSingle();

  if (!project) return;

  await supabase.from("task_events").insert({
    task_id: input.taskId,
    project_id: task.project_id,
    organization_id: project.organization_id,
    actor_id: actorId,
    kind: input.kind,
    summary: input.summary,
    from_value: input.fromValue ?? null,
    to_value: input.toValue ?? null,
  });
}

async function requireLive() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to manage the team." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, user, supabase };
}

export async function listMembersAction(
  organizationId: string,
): Promise<ActionResult<Member[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("organization_members")
    .select("user_id, organization_id, access_role, functional_role")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const profileIds = (data ?? []).map((row) => row.user_id);
  const profiles = profileIds.length
    ? await gate.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profiles.error) return { ok: false, error: profiles.error.message };

  const byId = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  return {
    ok: true,
    data: (data ?? []).map((row) =>
      mapMemberRow({
        ...row,
        access_role: row.access_role as AccessRole,
        profiles: byId.get(row.user_id) ?? null,
      }),
    ),
  };
}

export async function listInvitationsAction(
  organizationId: string,
): Promise<ActionResult<Invitation[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("organization_invitations")
    .select("id, organization_id, email, access_role, functional_role, status, token")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) =>
      mapInvitationRow({
        ...row,
        access_role: row.access_role as AccessRole,
        status: row.status as Invitation["status"],
      }),
    ),
  };
}

export async function inviteMemberAction(input: {
  organizationId: string;
  email: string;
  accessRole: AccessRole;
  functionalRole: string;
}): Promise<
  ActionResult<{
    invitation: Invitation;
    member?: Member;
    inviteUrl: string;
    emailDelivered: boolean;
  }>
> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const email = input.email.trim().toLowerCase();
  const accessRole = memberRoleSchema.parse(input.accessRole);
  const functionalRole = input.functionalRole.trim();

  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }

  const limits = getPackagingLimits();
  const [memberCount, inviteCount] = await Promise.all([
    gate.supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId),
    gate.supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .eq("status", "pending"),
  ]);

  if (memberCount.error) return { ok: false, error: memberCount.error.message };
  if (inviteCount.error) return { ok: false, error: inviteCount.error.message };

  const seats = (memberCount.count ?? 0) + (inviteCount.count ?? 0);
  if (seats >= limits.membersPerOrganization) {
    return {
      ok: false,
      error: `Member limit reached (${limits.membersPerOrganization}).`,
    };
  }

  const { data: invitation, error } = await gate.supabase
    .from("organization_invitations")
    .insert({
      organization_id: input.organizationId,
      email,
      access_role: accessRole,
      functional_role: functionalRole,
      invited_by: gate.user.id,
    })
    .select("id, organization_id, email, access_role, functional_role, status, token")
    .single();

  if (error || !invitation) {
    return { ok: false, error: error?.message ?? "Could not create invitation." };
  }

  const inviteUrl = inviteAcceptUrl(invitation.token);
  let emailDelivered = false;

  const { data: profile } = await gate.supabase
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  let member: Member | undefined;
  if (profile?.id) {
    const { error: memberError } = await gate.supabase
      .from("organization_members")
      .upsert({
        organization_id: input.organizationId,
        user_id: profile.id,
        access_role: accessRole,
        functional_role: functionalRole,
      });

    if (!memberError) {
      await gate.supabase
        .from("organization_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      member = mapMemberRow({
        user_id: profile.id,
        organization_id: input.organizationId,
        access_role: accessRole,
        functional_role: functionalRole,
        profiles: profile,
      });
      invitation.status = "accepted";
    }
  } else {
    const locale = await getLocale();
    const t = await getDictionary(locale);
    const { data: org } = await gate.supabase
      .from("organizations")
      .select("name")
      .eq("id", input.organizationId)
      .maybeSingle();
    const orgName = org?.name ?? "HubForge";

    const emailResult = await sendEmail({
      to: email,
      subject: fill(t.invite.emailSubject, { org: orgName }),
      text: fill(t.invite.emailBody, { org: orgName, url: inviteUrl }),
    });

    if (!emailResult.ok) {
      return { ok: false, error: emailResult.error };
    }
    emailDelivered = emailResult.delivered;
  }

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: {
      invitation: mapInvitationRow({
        ...invitation,
        access_role: invitation.access_role as AccessRole,
        status: invitation.status as Invitation["status"],
      }),
      member,
      inviteUrl,
      emailDelivered,
    },
  };
}

export async function updateMemberRolesAction(input: {
  organizationId: string;
  userId: string;
  accessRole: AccessRole;
  functionalRole: string;
}): Promise<ActionResult<Member>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const accessRole = memberRoleSchema.parse(input.accessRole);
  const { data, error } = await gate.supabase
    .from("organization_members")
    .update({
      access_role: accessRole,
      functional_role: input.functionalRole.trim(),
    })
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .select("user_id, organization_id, access_role, functional_role")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update member." };
  }

  const { data: profile } = await gate.supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", input.userId)
    .maybeSingle();

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: mapMemberRow({
      ...data,
      access_role: data.access_role as AccessRole,
      profiles: profile,
    }),
  };
}

export async function removeMemberAction(input: {
  organizationId: string;
  userId: string;
}): Promise<ActionResult<{ userId: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  if (input.userId === gate.user.id) {
    return { ok: false, error: "You cannot remove yourself from the organization." };
  }

  const { error } = await gate.supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { userId: input.userId } };
}

export async function revokeInvitationAction(input: {
  organizationId: string;
  invitationId: string;
}): Promise<ActionResult<{ invitationId: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", input.invitationId)
    .eq("organization_id", input.organizationId)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { invitationId: input.invitationId } };
}

export async function acceptInvitationAction(
  token: string,
): Promise<ActionResult<{ organizationId: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase.rpc("accept_organization_invitation", {
    invite_token: token.trim(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { organizationId: String(data) } };
}

export async function listTasksAction(projectId: string): Promise<ActionResult<Task[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data: tasks, error } = await gate.supabase
    .from("tasks")
    .select("id, project_id, title, description, status, priority, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const ids = (tasks ?? []).map((task) => task.id);
  const assignees = ids.length
    ? await gate.supabase
        .from("task_assignees")
        .select("task_id, user_id")
        .in("task_id", ids)
    : { data: [], error: null };

  if (assignees.error) return { ok: false, error: assignees.error.message };

  const byTask = new Map<string, string[]>();
  for (const row of assignees.data ?? []) {
    const list = byTask.get(row.task_id) ?? [];
    list.push(row.user_id);
    byTask.set(row.task_id, list);
  }

  return {
    ok: true,
    data: (tasks ?? []).map((task) =>
      mapTaskRow(
        {
          ...task,
          status: task.status as TaskStatus,
          priority: task.priority as Task["priority"],
        },
        byTask.get(task.id) ?? [],
      ),
    ),
  };
}

export async function listOperationsTasksAction(
  projectId: string,
  sinceIso?: string,
): Promise<ActionResult<OperationsTask[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data: tasks, error } = await gate.supabase
    .from("tasks")
    .select("id, project_id, title, description, status, priority, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const ids = (tasks ?? []).map((task) => task.id);

  const [assignees, deps, events] = await Promise.all([
    ids.length
      ? gate.supabase.from("task_assignees").select("task_id, user_id").in("task_id", ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? gate.supabase
          .from("task_dependencies")
          .select("task_id, depends_on_task_id")
          .in("task_id", ids)
      : Promise.resolve({ data: [], error: null }),
    sinceIso
      ? gate.supabase
          .from("task_events")
          .select("task_id, kind, summary, from_value, to_value, created_at")
          .eq("project_id", projectId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
      : gate.supabase
          .from("task_events")
          .select("task_id, kind, summary, from_value, to_value, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
  ]);

  if (assignees.error) return { ok: false, error: assignees.error.message };
  if (deps.error) return { ok: false, error: deps.error.message };
  if (events.error) return { ok: false, error: events.error.message };

  const byTask = new Map<string, string[]>();
  for (const row of assignees.data ?? []) {
    const list = byTask.get(row.task_id) ?? [];
    list.push(row.user_id);
    byTask.set(row.task_id, list);
  }

  const latestEvents: Record<string, TaskEventRow> = {};
  for (const row of events.data ?? []) {
    if (!latestEvents[row.task_id]) {
      latestEvents[row.task_id] = row as TaskEventRow;
    }
  }

  const updatedAtById: Record<string, string | null> = {};
  for (const task of tasks ?? []) {
    updatedAtById[task.id] = task.updated_at ?? null;
  }

  const plainTasks = (tasks ?? []).map((task) =>
    mapTaskRow(
      {
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as Task["priority"],
      },
      byTask.get(task.id) ?? [],
    ),
  );

  return {
    ok: true,
    data: operationsTasksFromLive(
      plainTasks,
      deps.data ?? [],
      latestEvents,
      updatedAtById,
    ),
  };
}

export async function createTaskAction(input: {
  projectId: string;
  title: string;
  description: string;
  priority: Task["priority"];
  assigneeIds: string[];
}): Promise<ActionResult<Task>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Task title is required." };

  const { data, error } = await gate.supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title,
      description: input.description.trim(),
      priority: input.priority,
      created_by: gate.user.id,
      status: "backlog",
    })
    .select("id, project_id, title, description, status, priority")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create task." };
  }

  await recordTaskEvent(gate.supabase, gate.user.id, {
    taskId: data.id,
    kind: "created",
    summary: "Task created",
  });

  if (input.assigneeIds.length > 0) {
    const { error: assignError } = await gate.supabase.from("task_assignees").insert(
      input.assigneeIds.map((userId) => ({
        task_id: data.id,
        user_id: userId,
      })),
    );
    if (assignError) return { ok: false, error: assignError.message };

    const { data: project } = await gate.supabase
      .from("projects")
      .select("organization_id")
      .eq("id", input.projectId)
      .maybeSingle();

    if (project?.organization_id) {
      const { createNotificationForUsers } =
        await import("@/features/availability/actions");
      await createNotificationForUsers({
        organizationId: project.organization_id,
        userIds: input.assigneeIds,
        title: "Task assigned",
        body: `You were assigned to “${title}”.`,
      });
    }
  }

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: mapTaskRow(
      {
        ...data,
        status: data.status as TaskStatus,
        priority: data.priority as Task["priority"],
      },
      input.assigneeIds,
    ),
  };
}

export async function updateTaskAction(input: {
  taskId: string;
  title: string;
  description: string;
  priority: Task["priority"];
}): Promise<ActionResult<Task>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Task title is required." };

  const { data: existing } = await gate.supabase
    .from("tasks")
    .select("id, project_id, title, description, status, priority")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Task not found." };

  const description = input.description.trim();
  const { data, error } = await gate.supabase
    .from("tasks")
    .update({
      title,
      description,
      priority: input.priority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId)
    .select("id, project_id, title, description, status, priority")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update task." };
  }

  if (existing.title !== title) {
    await recordTaskEvent(gate.supabase, gate.user.id, {
      taskId: input.taskId,
      kind: "title_changed",
      summary: "Title updated",
      fromValue: existing.title,
      toValue: title,
    });
  }
  if (existing.description !== description) {
    await recordTaskEvent(gate.supabase, gate.user.id, {
      taskId: input.taskId,
      kind: "description_changed",
      summary: "Description updated",
    });
  }
  if (existing.priority !== input.priority) {
    await recordTaskEvent(gate.supabase, gate.user.id, {
      taskId: input.taskId,
      kind: "priority_changed",
      summary: "Priority updated",
      fromValue: existing.priority,
      toValue: input.priority,
    });
  }

  const { data: assignees } = await gate.supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", input.taskId);

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: mapTaskRow(
      {
        ...data,
        status: data.status as TaskStatus,
        priority: data.priority as Task["priority"],
      },
      (assignees ?? []).map((row) => row.user_id),
    ),
  };
}

export async function updateTaskStatusAction(input: {
  taskId: string;
  status: TaskStatus;
}): Promise<ActionResult<TaskStatus>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data: existing } = await gate.supabase
    .from("tasks")
    .select("status")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Task not found." };

  const { error } = await gate.supabase
    .from("tasks")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.taskId);

  if (error) return { ok: false, error: error.message };

  if (existing.status !== input.status) {
    await recordTaskEvent(gate.supabase, gate.user.id, {
      taskId: input.taskId,
      kind: "status_changed",
      summary: `Status: ${existing.status} → ${input.status}`,
      fromValue: existing.status,
      toValue: input.status,
    });
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: input.status };
}

export async function setTaskAssigneesAction(input: {
  taskId: string;
  assigneeIds: string[];
}): Promise<ActionResult<string[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data: task } = await gate.supabase
    .from("tasks")
    .select("id, title, project_id")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!task) return { ok: false, error: "Task not found." };

  const { data: project } = await gate.supabase
    .from("projects")
    .select("organization_id")
    .eq("id", task.project_id)
    .maybeSingle();

  const { data: previous } = await gate.supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", input.taskId);

  const previousIds = new Set((previous ?? []).map((row) => row.user_id));
  const added = input.assigneeIds.filter((id) => !previousIds.has(id));

  const { error: clearError } = await gate.supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", input.taskId);

  if (clearError) return { ok: false, error: clearError.message };

  if (input.assigneeIds.length > 0) {
    const { error } = await gate.supabase.from("task_assignees").insert(
      input.assigneeIds.map((userId) => ({
        task_id: input.taskId,
        user_id: userId,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await recordTaskEvent(gate.supabase, gate.user.id, {
    taskId: input.taskId,
    kind: "assignees_changed",
    summary: "Assignees updated",
  });

  if (added.length > 0 && project?.organization_id) {
    const { createNotificationForUsers } =
      await import("@/features/availability/actions");
    await createNotificationForUsers({
      organizationId: project.organization_id,
      userIds: added,
      title: "Task assigned",
      body: `You were assigned to “${task.title}”.`,
    });
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: input.assigneeIds };
}

export async function setTaskDependenciesAction(input: {
  taskId: string;
  dependsOnTaskIds: string[];
}): Promise<ActionResult<string[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const uniqueDeps = [
    ...new Set(input.dependsOnTaskIds.filter((id) => id !== input.taskId)),
  ];

  const { data: existing } = await gate.supabase
    .from("task_dependencies")
    .select("depends_on_task_id")
    .eq("task_id", input.taskId);

  const previous = new Set((existing ?? []).map((row) => row.depends_on_task_id));
  const next = new Set(uniqueDeps);

  const { error: clearError } = await gate.supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", input.taskId);

  if (clearError) return { ok: false, error: clearError.message };

  if (uniqueDeps.length > 0) {
    const { error } = await gate.supabase.from("task_dependencies").insert(
      uniqueDeps.map((dependsOnTaskId) => ({
        task_id: input.taskId,
        depends_on_task_id: dependsOnTaskId,
        created_by: gate.user.id,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  for (const id of next) {
    if (!previous.has(id)) {
      await recordTaskEvent(gate.supabase, gate.user.id, {
        taskId: input.taskId,
        kind: "dependency_added",
        summary: "Dependency added",
        toValue: id,
      });
    }
  }
  for (const id of previous) {
    if (!next.has(id)) {
      await recordTaskEvent(gate.supabase, gate.user.id, {
        taskId: input.taskId,
        kind: "dependency_removed",
        summary: "Dependency removed",
        fromValue: id,
      });
    }
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: uniqueDeps };
}

export async function touchProjectVisitAction(
  projectId: string,
): Promise<ActionResult<{ lastVisitedAt: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const lastVisitedAt = new Date().toISOString();
  const { error } = await gate.supabase.from("project_visits").upsert(
    {
      project_id: projectId,
      user_id: gate.user.id,
      last_visited_at: lastVisitedAt,
    },
    { onConflict: "project_id,user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { lastVisitedAt } };
}

export async function getProjectLastVisitAction(
  projectId: string,
): Promise<ActionResult<string | null>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("project_visits")
    .select("last_visited_at")
    .eq("project_id", projectId)
    .eq("user_id", gate.user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data?.last_visited_at ?? null };
}

export async function listTaskEventsSinceAction(
  projectId: string,
  sinceIso: string,
): Promise<
  ActionResult<
    {
      id: string;
      taskId: string;
      kind: string;
      summary: string;
      fromValue: string | null;
      toValue: string | null;
      createdAt: string;
      actorId: string | null;
    }[]
  >
> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("task_events")
    .select("id, task_id, kind, summary, from_value, to_value, created_at, actor_id")
    .eq("project_id", projectId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      taskId: row.task_id,
      kind: row.kind,
      summary: row.summary,
      fromValue: row.from_value,
      toValue: row.to_value,
      createdAt: row.created_at,
      actorId: row.actor_id,
    })),
  };
}
