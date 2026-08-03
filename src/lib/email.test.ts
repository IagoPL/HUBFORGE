import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppBaseUrl, inviteAcceptUrl, sendEmail } from "@/lib/email";

describe("email helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds invite accept URLs from the app base URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hubforge.example/");
    expect(getAppBaseUrl()).toBe("https://hubforge.example");
    expect(inviteAcceptUrl("tok_abc")).toBe(
      "https://hubforge.example/invite?token=tok_abc",
    );
  });

  it("soft-succeeds without delivery when Resend is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const result = await sendEmail({
      to: "dev@example.com",
      subject: "Invite",
      text: "Join",
    });
    expect(result).toEqual({ ok: true, delivered: false });
  });
});
