import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/features/authentication/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows relative app paths", () => {
    expect(safeRedirectPath("/app/tasks")).toBe("/app/tasks");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/app");
    expect(safeRedirectPath("//evil.example")).toBe("/app");
    expect(safeRedirectPath("\\/evil")).toBe("/app");
  });

  it("falls back for empty values", () => {
    expect(safeRedirectPath(null)).toBe("/app");
    expect(safeRedirectPath(undefined, "/login")).toBe("/login");
  });
});
