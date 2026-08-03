import { describe, expect, it } from "vitest";
import {
  createDefaultWorkspaceState,
  createOrganization,
  createProject,
  getProjectsForOrganization,
  slugify,
} from "@/features/organizations/workspace-state";

describe("workspace-state", () => {
  it("slugifies organization names", () => {
    expect(slugify("Northlight Studio")).toBe("northlight-studio");
  });

  it("starts empty and creates organizations and projects under the active org", () => {
    let state = createDefaultWorkspaceState();
    expect(state.organizations).toHaveLength(0);

    state = createOrganization(state, { name: "Coyote Labs" });
    expect(state.organizations).toHaveLength(1);
    expect(state.activeOrganizationId).toBe(state.organizations.at(-1)?.id);

    state = createProject(state, {
      name: "Launch Pad",
      description: "First project",
      organizationId: state.activeOrganizationId,
    });

    const projects = getProjectsForOrganization(state, state.activeOrganizationId);
    expect(projects.some((project) => project.name === "Launch Pad")).toBe(true);
    expect(state.activeProjectId).toBe(projects.find((p) => p.name === "Launch Pad")?.id);
  });
});
