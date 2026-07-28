import type { Organization, Project } from "@/lib/domain/types";
import { organizationSchema, projectSchema } from "@/lib/domain/types";
import type { WorkspaceState } from "@/features/organizations/workspace-state";

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
};

export type ProjectRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string;
  status: "active" | "paused" | "archived";
};

export function mapOrganizationRow(row: OrganizationRow): Organization {
  return organizationSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
  });
}

export function mapProjectRow(row: ProjectRow): Project {
  return projectSchema.parse({
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
  });
}

export function buildWorkspaceState(input: {
  organizations: Organization[];
  projects: Project[];
  preferredOrganizationId?: string | null;
  preferredProjectId?: string | null;
}): WorkspaceState {
  const organizations = input.organizations;
  const projects = input.projects;

  const activeOrganizationId =
    (input.preferredOrganizationId &&
      organizations.some((org) => org.id === input.preferredOrganizationId) &&
      input.preferredOrganizationId) ||
    organizations[0]?.id ||
    "";

  const orgProjects = projects.filter(
    (project) => project.organizationId === activeOrganizationId,
  );

  const activeProjectId =
    (input.preferredProjectId &&
      orgProjects.some((project) => project.id === input.preferredProjectId) &&
      input.preferredProjectId) ||
    orgProjects[0]?.id ||
    projects[0]?.id ||
    "";

  return {
    organizations,
    projects,
    activeOrganizationId,
    activeProjectId,
  };
}

export function emptyWorkspaceState(): WorkspaceState {
  return {
    organizations: [],
    projects: [],
    activeOrganizationId: "",
    activeProjectId: "",
  };
}

export function uniqueSlug(base: string, existing: string[]) {
  const set = new Set(existing);
  if (!set.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`.slice(0, 48);
    if (!set.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`.slice(0, 48);
}
