import { describe, expect, it } from "vitest";
import {
  chatChannelKindSchema,
  chatMessageBodySchema,
  chatMessageSchema,
} from "@/lib/domain/types";

describe("chat schemas", () => {
  it("accepts project and direct channel kinds", () => {
    expect(chatChannelKindSchema.parse("project")).toBe("project");
    expect(chatChannelKindSchema.parse("direct")).toBe("direct");
    expect(() => chatChannelKindSchema.parse("thread")).toThrow();
  });

  it("trims and validates message bodies", () => {
    expect(chatMessageBodySchema.parse("  hello team  ")).toBe("hello team");
    expect(() => chatMessageBodySchema.parse("   ")).toThrow();
    expect(() => chatMessageBodySchema.parse("x".repeat(4001))).toThrow();
  });

  it("parses chat messages", () => {
    expect(
      chatMessageSchema.parse({
        id: "msg_1",
        channelId: "ch_1",
        authorId: "user_1",
        body: "Ship the chat MVP",
        createdAt: "2026-07-28T20:00:00.000Z",
      }),
    ).toMatchObject({ body: "Ship the chat MVP", channelId: "ch_1" });
  });
});
