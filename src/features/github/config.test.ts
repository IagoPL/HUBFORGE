import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isGitHubAppConfigured,
  verifyGitHubWebhookSignature,
} from "@/features/github/config";
import { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";

describe("github helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("reports when the GitHub App env is incomplete", () => {
    vi.stubEnv("GITHUB_APP_ID", "1");
    vi.stubEnv("GITHUB_APP_CLIENT_ID", "");
    expect(isGitHubAppConfigured()).toBe(false);
  });
});
