import { NextResponse } from "next/server";
import {
  getGitHubAppConfig,
  verifyGitHubWebhookSignature,
} from "@/features/github/config";
import { processGitHubWebhook } from "@/features/github/webhook-processor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = getGitHubAppConfig();
  if (!config) {
    return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (
    !verifyGitHubWebhookSignature({
      rawBody,
      signatureHeader: signature,
      secret: config.webhookSecret,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const deliveryId = request.headers.get("x-github-delivery");
  const event = request.headers.get("x-github-event");
  if (!deliveryId || !event) {
    return NextResponse.json({ error: "Missing webhook headers." }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = typeof payload.action === "string" ? payload.action : null;
  const result = await processGitHubWebhook({
    deliveryId,
    event,
    action,
    payload,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
