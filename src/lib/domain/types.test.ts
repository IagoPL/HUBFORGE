import { describe, expect, it } from "vitest";
import { getDemoWorkspace } from "@/data/demo-workspace";
import { taskStatusSchema } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

describe("demo workspace", () => {
  it("returns a coherent org → project → tasks graph", () => {
    const workspace = getDemoWorkspace();

    expect(workspace.project.organizationId).toBe(workspace.organization.id);
    expect(workspace.tasks.every((task) => task.projectId === workspace.project.id)).toBe(
      true,
    );
    expect(workspace.members.length).toBeGreaterThan(0);
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
