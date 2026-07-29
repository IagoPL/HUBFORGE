import { describe, expect, it } from "vitest";
import { mapProviderError } from "@/lib/errors/user-facing";

describe("mapProviderError", () => {
  it("maps RLS failures to permissionDenied", () => {
    expect(
      mapProviderError(
        'new row violates row-level security policy for table "organizations"',
      ),
    ).toBe("permissionDenied");
  });

  it("falls back to generic", () => {
    expect(mapProviderError("weird upstream failure")).toBe("generic");
  });
});
