import { describe, expect, it } from "vitest";
import {
  isPublicSignInError,
  PUBLIC_SIGN_IN_ERROR,
} from "@/features/authentication/sign-in-errors";

describe("isPublicSignInError", () => {
  it("treats known auth failures as a generic sign-in error", () => {
    expect(isPublicSignInError(PUBLIC_SIGN_IN_ERROR)).toBe(true);
    expect(isPublicSignInError("oauth-start")).toBe(true);
    expect(isPublicSignInError("auth-code")).toBe(true);
    expect(isPublicSignInError("supabase-not-configured")).toBe(true);
  });

  it("ignores unrelated query values", () => {
    expect(isPublicSignInError(undefined)).toBe(false);
    expect(isPublicSignInError("next")).toBe(false);
  });
});
