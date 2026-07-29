"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import {
  mapOrganizationRow,
  mapProjectRow,
  uniqueSlug,
  type OrganizationRow,
  type ProjectRow,
} from "@/features/organizations/workspace-mapping";
import { slugify } from "@/features/organizations/workspace-state";
import type { Organization, Project } from "@/lib/domain/types";
import { mapProviderError, translatedError } from "@/lib/errors/user-facing";

export type WorkspaceActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

async function requireLiveClient() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, error: await translatedError("authRequired") };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: await translatedError("notConfigured") };
  }

  return { ok: true as const, user, supabase };
}

export async function createOrganizationAction(
  nameInput: string,
): Promise<WorkspaceActionResult<Organization>> {
  const gate = await requireLiveClient();
  if (!gate.ok) return { ok: false, error: gate.error };

  const name = nameInput.trim();
  if (!name) return { ok: false, error: await translatedError("nameRequired") };

  const baseSlug = slugify(name) || `org-${Date.now()}`;
  const { data: existing } = await gate.supabase.from("organizations").select("slug");
  const slug = uniqueSlug(
    baseSlug,
    (existing ?? []).map((row: { slug: string }) => row.slug),
  );

  const { data, error } = await gate.supabase.rpc("create_organization", {
    org_name: name,
    org_slug: slug,
  });

  if (error || !data) {
    const key = mapProviderError(error?.message);
    return {
      ok: false,
      error: await translatedError(key === "generic" ? "createFailed" : key),
    };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: mapOrganizationRow(data as OrganizationRow) };
}

export async function createProjectAction(input: {
  name: string;
  description: string;
  organizationId: string;
}): Promise<WorkspaceActionResult<Project>> {
  const gate = await requireLiveClient();
  if (!gate.ok) return { ok: false, error: gate.error };

  const name = input.name.trim();
  const organizationId = input.organizationId.trim();
  if (!name) return { ok: false, error: await translatedError("nameRequired") };
  if (!organizationId) {
    return { ok: false, error: await translatedError("pickOrganization") };
  }

  const baseSlug = slugify(name) || `project-${Date.now()}`;
  const { data: existing } = await gate.supabase
    .from("projects")
    .select("slug")
    .eq("organization_id", organizationId);
  const slug = uniqueSlug(
    baseSlug,
    (existing ?? []).map((row: { slug: string }) => row.slug),
  );

  const { data, error } = await gate.supabase
    .from("projects")
    .insert({
      name,
      slug,
      description: input.description.trim(),
      organization_id: organizationId,
      created_by: gate.user.id,
      status: "active",
    })
    .select("id, organization_id, name, slug, description, status")
    .single();

  if (error || !data) {
    const key = mapProviderError(error?.message);
    return {
      ok: false,
      error: await translatedError(key === "generic" ? "projectCreateFailed" : key),
    };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: mapProjectRow(data as ProjectRow) };
}
