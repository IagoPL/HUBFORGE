"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import {
  mapInvitationRow,
  mapMemberRow,
  mapTaskRow,
} from "@/features/collaboration/mapping";
import type { Invitation } from "@/features/collaboration/mapping";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  memberRoleSchema,
  type AccessRole,
  type Member,
  type Task,
  type TaskStatus,
} from "@/lib/domain/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

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
}): Promise<ActionResult<{ invitation: Invitation; member?: Member }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const email = input.email.trim().toLowerCase();
  const accessRole = memberRoleSchema.parse(input.accessRole);
  const functionalRole = input.functionalRole.trim();

  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
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
    .select("id, project_id, title, description, status, priority")
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

export async function updateTaskStatusAction(input: {
  taskId: string;
  status: TaskStatus;
}): Promise<ActionResult<TaskStatus>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from("tasks")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.taskId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: input.status };
}

export async function setTaskAssigneesAction(input: {
  taskId: string;
  assigneeIds: string[];
}): Promise<ActionResult<string[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

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

  revalidatePath("/app", "layout");
  return { ok: true, data: input.assigneeIds };
}
