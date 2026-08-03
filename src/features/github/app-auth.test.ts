import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGitHubAppJwt,
  createInstallationAccessToken,
} from "@/features/github/app-auth";

function ephemeralPrivateKey() {
  return generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
}

describe("createGitHubAppJwt", () => {
  it("produces a verifiable RS256 JWT with app issuer", () => {
    const { privateKey, publicKey } = ephemeralPrivateKey();
    const now = 1_700_000_000;
    const jwt = createGitHubAppJwt({ appId: "12345", privateKey }, now);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

    expect(JSON.parse(Buffer.from(headerB64, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(payloadB64, "base64url").toString())).toMatchObject({
      iss: "12345",
      iat: now - 60,
      exp: now + 9 * 60,
    });

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    expect(verifier.verify(publicKey, Buffer.from(signatureB64, "base64url"))).toBe(true);
  });
});

describe("createInstallationAccessToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails clearly when the GitHub App is not configured", async () => {
    vi.stubEnv("GITHUB_APP_ID", "");
    const result = await createInstallationAccessToken(99);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not configured/i);
  });

  it("fails clearly when installation id is invalid", async () => {
    const { privateKey } = ephemeralPrivateKey();
    vi.stubEnv("GITHUB_APP_ID", "1");
    vi.stubEnv("GITHUB_APP_CLIENT_ID", "cid");
    vi.stubEnv("GITHUB_APP_CLIENT_SECRET", "secret");
    vi.stubEnv("GITHUB_APP_PRIVATE_KEY", privateKey);
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", "whsec");

    const result = await createInstallationAccessToken(Number.NaN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/installation id/i);
  });

  it("returns the installation token from GitHub", async () => {
    const { privateKey } = ephemeralPrivateKey();
    vi.stubEnv("GITHUB_APP_ID", "1");
    vi.stubEnv("GITHUB_APP_CLIENT_ID", "cid");
    vi.stubEnv("GITHUB_APP_CLIENT_SECRET", "secret");
    vi.stubEnv("GITHUB_APP_PRIVATE_KEY", privateKey);
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", "whsec");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: "ghs_test_token" }),
      }),
    );

    const result = await createInstallationAccessToken(42);
    expect(result).toEqual({ ok: true, token: "ghs_test_token" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/app/installations/42/access_tokens",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
