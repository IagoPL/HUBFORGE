import { createSign } from "node:crypto";
import { getGitHubAppConfig, type GitHubAppConfig } from "@/features/github/config";

const GITHUB_API = "https://api.github.com";

function base64Url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

/** GitHub App JWT (RS256), valid for up to 10 minutes. */
export function createGitHubAppJwt(
  config: Pick<GitHubAppConfig, "appId" | "privateKey">,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iat: nowSeconds - 60,
      exp: nowSeconds + 9 * 60,
      iss: config.appId,
    }),
  );
  const data = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(data);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("base64url");
  return `${data}.${signature}`;
}

export async function createInstallationAccessToken(installationId: number) {
  const config = getGitHubAppConfig();
  if (!config) {
    return { ok: false as const, error: "GitHub App is not configured." };
  }
  if (!Number.isFinite(installationId) || installationId <= 0) {
    return { ok: false as const, error: "Installation id is required." };
  }

  const jwt = createGitHubAppJwt(config);
  const response = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "HubForge",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false as const,
      error: `GitHub installation token failed (${response.status}): ${body.slice(0, 200)}`,
    };
  }

  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    return { ok: false as const, error: "GitHub installation token missing in response." };
  }

  return { ok: true as const, token: json.token };
}
