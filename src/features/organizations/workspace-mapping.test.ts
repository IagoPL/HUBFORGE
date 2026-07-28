import { describe, expect, it } from "vitest";
import {
  buildWorkspaceState,
  mapOrganizationRow,
  mapProjectRow,
  uniqueSlug,
} from "@/features/organizations/workspace-mapping";

describe("workspace mapping", () => {
  it("maps database rows into domain types", () => {
    expect(mapOrganizationRow({ id: "o1", name: "North", slug: "north" })).toEqual({
      id: "o1",
      name: "North",
      slug: "north",
    });

    expect(
      mapProjectRow({
        id: "p1",
        organization_id: "o1",
        name: "Aurora",
        slug: "aurora",
        description: "Launch",
        status: "active",
      }),
    ).toEqual({
      id: "p1",
      organizationId: "o1",
      name: "Aurora",
      slug: "aurora",
      description: "Launch",
      status: "active",
    });
  });

  it("prefers valid active ids when building workspace state", () => {
    const state = buildWorkspaceState({
      organizations: [
        { id: "o1", name: "One", slug: "one" },
        { id: "o2", name: "Two", slug: "two" },
      ],
      projects: [
        {
          id: "p1",
          organizationId: "o1",
          name: "A",
          slug: "a",
          description: "",
          status: "active",
        },
        {
          id: "p2",
          organizationId: "o2",
          name: "B",
          slug: "b",
          description: "",
          status: "active",
        },
      ],
      preferredOrganizationId: "o2",
      preferredProjectId: "p2",
    });

    expect(state.activeOrganizationId).toBe("o2");
    expect(state.activeProjectId).toBe("p2");
  });

  it("creates unique slugs", () => {
    expect(uniqueSlug("north", ["north", "north-2"])).toBe("north-3");
  });
});
