import {
  memberRoleSchema,
  memberSchema,
  taskSchema,
  type AccessRole,
  type Member,
  type Task,
  type TaskStatus,
} from "@/lib/domain/types";

export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  accessRole: AccessRole;
  functionalRole: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  token: string;
};

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function mapMemberRow(row: {
  user_id: string;
  organization_id: string;
  access_role: AccessRole;
  functional_role: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}): Member {
  const name = row.profiles?.full_name?.trim() || row.profiles?.email || "Member";
  const email = row.profiles?.email || `${row.user_id}@users.local`;
  return memberSchema.parse({
    id: row.user_id,
    organizationId: row.organization_id,
    name,
    email,
    accessRole: memberRoleSchema.parse(row.access_role),
    functionalRole: row.functional_role || "",
    avatarInitials: initialsFromName(name).slice(0, 3),
    presence: "offline",
  });
}

export function mapTaskRow(
  row: {
    id: string;
    project_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: "low" | "medium" | "high";
  },
  assigneeIds: string[],
): Task {
  return taskSchema.parse({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeIds,
  });
}

export function mapInvitationRow(row: {
  id: string;
  organization_id: string;
  email: string;
  access_role: AccessRole;
  functional_role: string;
  status: Invitation["status"];
  token: string;
}): Invitation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    accessRole: memberRoleSchema.parse(row.access_role),
    functionalRole: row.functional_role,
    status: row.status,
    token: row.token,
  };
}
