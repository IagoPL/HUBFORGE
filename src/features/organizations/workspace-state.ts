import { z } from "zod";
import {
  organizationSchema,
  projectSchema,
  type Organization,
  type Project,
} from "@/lib/domain/types";

const workspaceStateSchema = z.object({
  organizations: z.array(organizationSchema),
  projects: z.array(projectSchema),
  activeOrganizationId: z.string(),
  activeProjectId: z.string(),
});

export type WorkspaceState = z.infer<typeof workspaceStateSchema>;

export const WORKSPACE_STORAGE_KEY = "hubforge.workspace.v1";

export function createDefaultWorkspaceState(): WorkspaceState {
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

  return {
    organizations: [organization],
    projects: [project],
    activeOrganizationId: organization.id,
    activeProjectId: project.id,
  };
}

export function parseWorkspaceState(raw: string | null): WorkspaceState {
  if (!raw) return createDefaultWorkspaceState();
  try {
    return workspaceStateSchema.parse(JSON.parse(raw));
  } catch {
    return createDefaultWorkspaceState();
  }
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function createOrganization(
  state: WorkspaceState,
  input: { name: string },
): WorkspaceState {
  const name = input.name.trim();
  const organization: Organization = organizationSchema.parse({
    id: `org_${crypto.randomUUID().slice(0, 8)}`,
    name,
    slug: slugify(name) || `org-${Date.now()}`,
  });

  return {
    ...state,
    organizations: [...state.organizations, organization],
    activeOrganizationId: organization.id,
  };
}

export function createProject(
  state: WorkspaceState,
  input: { name: string; description: string; organizationId: string },
): WorkspaceState {
  const name = input.name.trim();
  const project: Project = projectSchema.parse({
    id: `proj_${crypto.randomUUID().slice(0, 8)}`,
    organizationId: input.organizationId,
    name,
    slug: slugify(name) || `project-${Date.now()}`,
    description: input.description.trim(),
    status: "active",
  });

  return {
    ...state,
    projects: [...state.projects, project],
    activeOrganizationId: input.organizationId,
    activeProjectId: project.id,
  };
}

export function getActiveOrganization(state: WorkspaceState) {
  return (
    state.organizations.find((item) => item.id === state.activeOrganizationId) ??
    state.organizations[0]
  );
}

export function getActiveProject(state: WorkspaceState) {
  return (
    state.projects.find((item) => item.id === state.activeProjectId) ?? state.projects[0]
  );
}

export function getProjectsForOrganization(
  state: WorkspaceState,
  organizationId: string,
) {
  return state.projects.filter((project) => project.organizationId === organizationId);
}
