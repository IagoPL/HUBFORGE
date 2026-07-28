import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGitHubWebhookSignature } from "@/features/github/config";
import { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";

describe("github helpers", () => {
  it("normalizes and validates repository names", () => {
    expect(normalizeRepoFullName("https://github.com/IagoPL/HUBFORGE.git")).toBe(
      "IagoPL/HUBFORGE",
    );
    expect(isValidRepoFullName("IagoPL/HUBFORGE")).toBe(true);
    expect(isValidRepoFullName("bad")).toBe(false);
  });

  it("verifies webhook signatures", () => {
    const secret = "test-secret";
    const rawBody = '{"action":"opened"}';
    const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(
      verifyGitHubWebhookSignature({
        rawBody,
        signatureHeader: `sha256=${digest}`,
        secret,
      }),
    ).toBe(true);
    expect(
      verifyGitHubWebhookSignature({
        rawBody,
        signatureHeader: "sha256=deadbeef",
        secret,
      }),
    ).toBe(false);
  });
});
