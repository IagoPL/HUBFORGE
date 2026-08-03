import { describe, expect, it } from "vitest";
import { organizationSchema, projectSchema, taskStatusSchema } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

describe("domain schemas", () => {
  it("accepts valid organization and project shapes", () => {
    const organization = organizationSchema.parse({
      id: "org_1",
      name: "Northlight Studio",
      slug: "northlight",
    });
    const project = projectSchema.parse({
      id: "proj_1",
      organizationId: organization.id,
      name: "Aurora Launch",
      slug: "aurora-launch",
      description: "Ship the collaborative workspace MVP.",
      status: "active",
    });

    expect(project.organizationId).toBe(organization.id);
  });
});

describe("taskStatusSchema", () => {
  it("accepts known statuses only", () => {
    expect(taskStatusSchema.parse("ready")).toBe("ready");
    expect(() => taskStatusSchema.parse("shipping")).toThrow();
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toContain("px-4");
  });
});
