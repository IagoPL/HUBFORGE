import {
  availabilityEntrySchema,
  memberSchema,
  notificationSchema,
  organizationSchema,
  projectSchema,
  taskSchema,
  type WorkspaceSnapshot,
} from "@/lib/domain/types";

/**
 * Demo workspace behind a stable interface so UI can later swap to Supabase
 * without rewriting screens.
 */
export function getDemoWorkspace(): WorkspaceSnapshot {
  const organization = organizationSchema.parse({
    id: "org_demo",
    name: "Northlight Studio",
    slug: "northlight",
  });

  const project = projectSchema.parse({
    id: "proj_aurora",
    organizationId: organization.id,
    name: "Aurora Launch",
    slug: "aurora-launch",
    description: "Ship the collaborative workspace MVP with clear ownership.",
    status: "active",
  });

  const members = [
    memberSchema.parse({
      id: "mem_alex",
      organizationId: organization.id,
      name: "Alex Rivera",
      email: "alex@northlight.example",
      accessRole: "project_lead",
      functionalRole: "Technical Director",
      avatarInitials: "AR",
      presence: "online",
    }),
    memberSchema.parse({
      id: "mem_sam",
      organizationId: organization.id,
      name: "Sam Okonkwo",
      email: "sam@northlight.example",
      accessRole: "member",
      functionalRole: "Product Designer",
      avatarInitials: "SO",
      presence: "away",
    }),
    memberSchema.parse({
      id: "mem_jin",
      organizationId: organization.id,
      name: "Jin Park",
      email: "jin@northlight.example",
      accessRole: "member",
      functionalRole: "Frontend Engineer",
      avatarInitials: "JP",
      presence: "online",
    }),
  ];

  const tasks = [
    taskSchema.parse({
      id: "task_1",
      projectId: project.id,
      title: "Define organization onboarding flow",
      description: "Map create-org → invite → first project.",
      status: "done",
      assigneeIds: ["mem_alex"],
      priority: "high",
    }),
    taskSchema.parse({
      id: "task_2",
      projectId: project.id,
      title: "Build task board columns",
      description: "Backlog through Done with keyboard-accessible cards.",
      status: "in_progress",
      assigneeIds: ["mem_jin"],
      priority: "high",
    }),
    taskSchema.parse({
      id: "task_3",
      projectId: project.id,
      title: "Availability calendar polish",
      description: "Show busy windows and conflict hints.",
      status: "ready",
      assigneeIds: ["mem_sam"],
      priority: "medium",
    }),
    taskSchema.parse({
      id: "task_4",
      projectId: project.id,
      title: "Notification feed empty state",
      description: "Clarify unread vs archived activity.",
      status: "backlog",
      assigneeIds: [],
      priority: "low",
    }),
    taskSchema.parse({
      id: "task_5",
      projectId: project.id,
      title: "Review access role matrix",
      description: "Separate access roles from functional titles.",
      status: "review",
      assigneeIds: ["mem_alex", "mem_sam"],
      priority: "medium",
    }),
  ];

  const availability = [
    availabilityEntrySchema.parse({
      id: "av_1",
      memberId: "mem_sam",
      startsAt: "2026-07-29T09:00:00.000Z",
      endsAt: "2026-07-29T13:00:00.000Z",
      kind: "unavailable",
      note: "Design critique workshop",
    }),
    availabilityEntrySchema.parse({
      id: "av_2",
      memberId: "mem_jin",
      startsAt: "2026-07-30T14:00:00.000Z",
      endsAt: "2026-07-30T18:00:00.000Z",
      kind: "busy",
      note: "Deep work — board interactions",
    }),
    availabilityEntrySchema.parse({
      id: "av_3",
      memberId: "mem_alex",
      startsAt: "2026-07-31T10:00:00.000Z",
      endsAt: "2026-07-31T11:30:00.000Z",
      kind: "available",
      note: "Office hours",
    }),
  ];

  const notifications = [
    notificationSchema.parse({
      id: "ntf_1",
      title: "Task assigned",
      body: "Jin was assigned to Build task board columns.",
      createdAt: "2026-07-28T15:20:00.000Z",
      read: false,
    }),
    notificationSchema.parse({
      id: "ntf_2",
      title: "Availability updated",
      body: "Sam marked Wednesday morning as unavailable.",
      createdAt: "2026-07-28T14:05:00.000Z",
      read: false,
    }),
    notificationSchema.parse({
      id: "ntf_3",
      title: "Role confirmed",
      body: "Alex is Project Lead for Aurora Launch.",
      createdAt: "2026-07-28T11:40:00.000Z",
      read: true,
    }),
  ];

  return {
    organization,
    project,
    members,
    tasks,
    availability,
    notifications,
  };
}
