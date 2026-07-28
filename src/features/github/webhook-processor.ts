import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SyncedIssue = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  origin: "github" | "hubforge";
};

type IssuePayload = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url?: string;
};

export async function processGitHubWebhook(input: {
  deliveryId: string;
  event: string;
  action: string | null;
  payload: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Service role is not configured." };
  }

  const digest = createHash("sha256").update(JSON.stringify(input.payload)).digest("hex");

  const { error: insertDeliveryError } = await admin
    .from("github_webhook_deliveries")
    .insert({
      delivery_id: input.deliveryId,
      event: input.event,
      action: input.action,
      installation_id:
        typeof (input.payload.installation as { id?: number } | undefined)?.id ===
        "number"
          ? (input.payload.installation as { id: number }).id
          : null,
      repository_full_name:
        typeof (input.payload.repository as { full_name?: string } | undefined)
          ?.full_name === "string"
          ? (input.payload.repository as { full_name: string }).full_name
          : null,
      payload_digest: digest,
    });

  if (insertDeliveryError) {
    if (insertDeliveryError.code === "23505") {
      return { ok: true as const, duplicate: true };
    }
    return { ok: false as const, error: insertDeliveryError.message };
  }

  if (input.event === "issues" && input.payload.issue && input.payload.repository) {
    await upsertIssueFromWebhook(admin, input.payload);
  }

  return { ok: true as const, duplicate: false };
}

async function upsertIssueFromWebhook(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const repository = payload.repository as { full_name?: string };
  const issue = payload.issue as IssuePayload;
  if (!repository.full_name || !issue?.id) return;

  const { data: linked } = await admin
    .from("project_repositories")
    .select("id, project_id, organization_id")
    .eq("full_name", repository.full_name)
    .maybeSingle();

  if (!linked) return;

  const state = issue.state === "closed" ? "closed" : "open";

  const { data: synced } = await admin
    .from("github_synced_issues")
    .upsert(
      {
        project_id: linked.project_id,
        organization_id: linked.organization_id,
        repository_id: linked.id,
        github_issue_id: issue.id,
        number: issue.number,
        title: issue.title,
        state,
        html_url: issue.html_url ?? "",
        origin: "github",
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "repository_id,github_issue_id" },
    )
    .select("id, task_id")
    .single();

  if (!synced) return;

  if (synced.task_id) {
    await admin
      .from("tasks")
      .update({
        title: issue.title,
        status: state === "closed" ? "done" : "backlog",
        updated_at: new Date().toISOString(),
      })
      .eq("id", synced.task_id);
    return;
  }

  const { data: task } = await admin
    .from("tasks")
    .insert({
      project_id: linked.project_id,
      title: `[GH #${issue.number}] ${issue.title}`,
      description: `Synced from GitHub issue #${issue.number}`,
      status: state === "closed" ? "done" : "backlog",
      priority: "medium",
    })
    .select("id")
    .single();

  if (task?.id) {
    await admin
      .from("github_synced_issues")
      .update({ task_id: task.id })
      .eq("id", synced.id);
  }
}
