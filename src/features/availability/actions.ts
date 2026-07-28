"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  availabilityEntrySchema,
  notificationSchema,
  type AvailabilityEntry,
  type Notification,
} from "@/lib/domain/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireLive() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to manage availability." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, user, supabase };
}

function mapAvailability(row: {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  kind: AvailabilityEntry["kind"];
  note: string;
}): AvailabilityEntry {
  return availabilityEntrySchema.parse({
    id: row.id,
    memberId: row.user_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    kind: row.kind,
    note: row.note,
  });
}

function mapNotification(row: {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}): Notification {
  return notificationSchema.parse({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: row.read,
  });
}

export async function listAvailabilityAction(
  organizationId: string,
): Promise<ActionResult<AvailabilityEntry[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("availability_entries")
    .select("id, user_id, starts_at, ends_at, kind, note")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((row) =>
      mapAvailability({
        ...row,
        kind: row.kind as AvailabilityEntry["kind"],
      }),
    ),
  };
}

export async function createAvailabilityAction(input: {
  organizationId: string;
  startsAt: string;
  endsAt: string;
  kind: AvailabilityEntry["kind"];
  note: string;
}): Promise<ActionResult<AvailabilityEntry>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  if (!input.startsAt || !input.endsAt) {
    return { ok: false, error: "Start and end times are required." };
  }
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    return { ok: false, error: "End time must be after start time." };
  }

  const { data, error } = await gate.supabase
    .from("availability_entries")
    .insert({
      organization_id: input.organizationId,
      user_id: gate.user.id,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      kind: input.kind,
      note: input.note.trim(),
    })
    .select("id, user_id, starts_at, ends_at, kind, note")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save availability." };
  }

  revalidatePath("/app", "layout");
  return {
    ok: true,
    data: mapAvailability({
      ...data,
      kind: data.kind as AvailabilityEntry["kind"],
    }),
  };
}

export async function deleteAvailabilityAction(
  entryId: string,
): Promise<ActionResult<{ id: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from("availability_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", gate.user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { id: entryId } };
}

export async function listNotificationsAction(): Promise<ActionResult<Notification[]>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { data, error } = await gate.supabase
    .from("notifications")
    .select("id, title, body, created_at, read")
    .eq("user_id", gate.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(mapNotification) };
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult<{ id: string }>> {
  const gate = await requireLive();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", gate.user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, data: { id: notificationId } };
}

export async function createNotificationForUsers(input: {
  organizationId: string;
  userIds: string[];
  title: string;
  body: string;
}): Promise<void> {
  const gate = await requireLive();
  if (!gate.ok) return;
  const recipients = input.userIds.filter((id) => id && id !== gate.user.id);
  if (recipients.length === 0) return;

  await gate.supabase.from("notifications").insert(
    recipients.map((userId) => ({
      organization_id: input.organizationId,
      user_id: userId,
      title: input.title,
      body: input.body,
    })),
  );
}
