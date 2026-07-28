import { createHmac, timingSafeEqual } from "node:crypto";

export type GitHubAppConfig = {
  appId: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
  webhookSecret: string;
  slug?: string;
};

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.trim()?.replace(/\\n/g, "\n");
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();

  if (!appId || !clientId || !clientSecret || !privateKey || !webhookSecret) {
    return null;
  }

  return {
    appId,
    clientId,
    clientSecret,
    privateKey,
    webhookSecret,
    slug: process.env.GITHUB_APP_SLUG?.trim() || undefined,
  };
}

export function isGitHubAppConfigured() {
  return getGitHubAppConfig() !== null;
}

export function verifyGitHubWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}) {
  if (!input.signatureHeader?.startsWith("sha256=")) return false;
  const received = input.signatureHeader.slice("sha256=".length);
  const digest = createHmac("sha256", input.secret).update(input.rawBody).digest("hex");

  try {
    const a = Buffer.from(received, "hex");
    const b = Buffer.from(digest, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";
