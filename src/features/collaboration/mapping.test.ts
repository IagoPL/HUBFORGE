import { describe, expect, it } from "vitest";
import {
  initialsFromName,
  mapMemberRow,
  mapTaskRow,
} from "@/features/collaboration/mapping";

describe("collaboration mapping", () => {
  it("builds initials from names", () => {
    expect(initialsFromName("Alex Rivera")).toBe("AR");
    expect(initialsFromName("Sam")).toBe("SA");
  });

  it("maps member and task rows", () => {
    expect(
      mapMemberRow({
        user_id: "u1",
        organization_id: "o1",
        access_role: "member",
        functional_role: "Engineer",
        profiles: { full_name: "Jin Park", email: "jin@example.com" },
      }),
    ).toMatchObject({
      id: "u1",
      organizationId: "o1",
      name: "Jin Park",
      accessRole: "member",
      avatarInitials: "JP",
    });

    expect(
      mapTaskRow(
        {
          id: "t1",
          project_id: "p1",
          title: "Ship board",
          description: "Kanban",
          status: "ready",
          priority: "high",
        },
        ["u1"],
      ),
    ).toMatchObject({
      id: "t1",
      projectId: "p1",
      assigneeIds: ["u1"],
      status: "ready",
    });
  });
});
