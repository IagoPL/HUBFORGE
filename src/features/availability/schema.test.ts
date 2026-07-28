import { describe, expect, it } from "vitest";
import { availabilityEntrySchema, notificationSchema } from "@/lib/domain/types";

describe("availability and notifications schemas", () => {
  it("parses availability entries", () => {
    expect(
      availabilityEntrySchema.parse({
        id: "av_1",
        memberId: "mem_1",
        startsAt: "2026-07-29T09:00:00.000Z",
        endsAt: "2026-07-29T13:00:00.000Z",
        kind: "unavailable",
        note: "Workshop",
      }),
    ).toMatchObject({ kind: "unavailable", memberId: "mem_1" });
  });

  it("parses notifications", () => {
    expect(
      notificationSchema.parse({
        id: "n1",
        title: "Task assigned",
        body: "You were assigned",
        createdAt: "2026-07-28T15:20:00.000Z",
        read: false,
      }),
    ).toMatchObject({ read: false, title: "Task assigned" });
  });
});
