/**
 * Optional transactional email via Resend's HTTP API (no SDK).
 * When RESEND_API_KEY is unset, callers still get invite URLs to copy.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  { ok: true; delivered: boolean } | { ok: false; error: string };

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "http://localhost:3000"
  );
}

export function inviteAcceptUrl(token: string) {
  return `${getAppBaseUrl()}/invite?token=${encodeURIComponent(token)}`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "HubForge <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: true, delivered: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text.replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `Email failed (${response.status}): ${body}` };
    }

    return { ok: true, delivered: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}
