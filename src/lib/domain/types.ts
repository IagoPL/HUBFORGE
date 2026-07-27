import { z } from "zod";

export const taskStatusSchema = z.enum([
  "backlog",
  "ready",
  "in_progress",
  "review",
  "done",
]);

export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const memberRoleSchema = z.enum([
  "organization_owner",
  "organization_admin",
  "project_manager",
  "project_lead",
  "member",
  "guest",
]);

export type AccessRole = z.infer<typeof memberRoleSchema>;

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const projectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  status: z.enum(["active", "paused", "archived"]),
});

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  accessRole: memberRoleSchema,
  functionalRole: z.string(),
  avatarInitials: z.string().min(1).max(3),
  presence: z.enum(["online", "away", "offline"]),
});

export const taskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: taskStatusSchema,
  assigneeIds: z.array(z.string()),
  priority: z.enum(["low", "medium", "high"]),
});

export const availabilityEntrySchema = z.object({
  id: z.string(),
  memberId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  kind: z.enum(["available", "busy", "unavailable"]),
  note: z.string(),
});

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
});

export type Organization = z.infer<typeof organizationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Task = z.infer<typeof taskSchema>;
export type AvailabilityEntry = z.infer<typeof availabilityEntrySchema>;
export type Notification = z.infer<typeof notificationSchema>;

export type WorkspaceSnapshot = {
  organization: Organization;
  project: Project;
  members: Member[];
  tasks: Task[];
  availability: AvailabilityEntry[];
  notifications: Notification[];
};
