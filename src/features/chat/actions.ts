"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { chatMessageBodySchema } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ChatChannel = {
  id: string;
  organizationId: string;
  projectId: string | null;
  kind: "project" | "direct";
  name: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

async function requireLive() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to use chat." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, user, supabase };
}

export async function listChannelsAction(
  projectId: string,
): Promise<ActionResult<ChatChannel[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("chat_channels")
    .select("id, organization_id, project_id, kind, name")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      kind: row.kind as ChatChannel["kind"],
      name: row.name,
    })),
  };
}

export async function ensureProjectGeneralChannelAction(input: {
  projectId: string;
  organizationId: string;
}): Promise<ActionResult<ChatChannel>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const existing = await gate.supabase
    .from("chat_channels")
    .select("id, organization_id, project_id, kind, name")
    .eq("project_id", input.projectId)
    .eq("name", "general")
    .maybeSingle();

  if (existing.data) {
    await gate.supabase.from("chat_channel_members").upsert({
      channel_id: existing.data.id,
      user_id: gate.user.id,
    });
    return {
      ok: true,
      data: {
        id: existing.data.id,
        organizationId: existing.data.organization_id,
        projectId: existing.data.project_id,
        kind: existing.data.kind as ChatChannel["kind"],
        name: existing.data.name,
      },
    };
  }

  const { data, error } = await gate.supabase
    .from("chat_channels")
    .insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      kind: "project",
      name: "general",
      created_by: gate.user.id,
    })
    .select("id, organization_id, project_id, kind, name")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create channel." };
  }

  await gate.supabase.from("chat_channel_members").upsert({
    channel_id: data.id,
    user_id: gate.user.id,
  });

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      projectId: data.project_id,
      kind: data.kind as ChatChannel["kind"],
      name: data.name,
    },
  };
}

export async function listMessagesAction(
  channelId: string,
): Promise<ActionResult<ChatMessage[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("chat_messages")
    .select("id, channel_id, author_id, body, created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      channelId: row.channel_id,
      authorId: row.author_id,
      body: row.body,
      createdAt: row.created_at,
    })),
  };
}

export async function sendMessageAction(input: {
  channelId: string;
  organizationId: string;
  body: string;
}): Promise<ActionResult<ChatMessage>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const parsed = chatMessageBodySchema.safeParse(input.body);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }
  const body = parsed.data;

  const { data, error } = await gate.supabase
    .from("chat_messages")
    .insert({
      channel_id: input.channelId,
      organization_id: input.organizationId,
      author_id: gate.user.id,
      body,
    })
    .select("id, channel_id, author_id, body, created_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not send message." };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      channelId: data.channel_id,
      authorId: data.author_id,
      body: data.body,
      createdAt: data.created_at,
    },
  };
}

export async function createDirectChannelAction(input: {
  organizationId: string;
  otherUserId: string;
  otherUserName: string;
}): Promise<ActionResult<ChatChannel>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase.rpc("create_direct_chat", {
    org_id: input.organizationId,
    other_user_id: input.otherUserId,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create DM." };
  }

  return {
    ok: true,
    data: {
      id: String(data),
      organizationId: input.organizationId,
      projectId: null,
      kind: "direct",
      name: input.otherUserName,
    },
  };
}
