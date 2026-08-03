import { NextResponse } from "next/server";
import { recordGitHubInstallationAction } from "@/features/github/actions";
import { getCurrentUser } from "@/features/authentication/get-current-user";

/**
 * GitHub App setup URL callback.
 * Configure the App's Setup URL to `/api/github/setup`.
 * Pass `state=<organizationId>` on the install link.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const installationId = Number(url.searchParams.get("installation_id"));
  const organizationId = url.searchParams.get("state")?.trim() ?? "";
  const user = await getCurrentUser();

  if (!user) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", `/api/github/setup?${url.searchParams.toString()}`);
    return NextResponse.redirect(login);
  }

  if (Number.isFinite(installationId) && organizationId) {
    await recordGitHubInstallationAction({
      organizationId,
      installationId,
    });
  }

  return NextResponse.redirect(new URL("/app/github", url.origin));
}
