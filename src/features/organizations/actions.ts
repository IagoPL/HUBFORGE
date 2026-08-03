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
import { getPackagingLimits } from "@/lib/packaging/limits";

export type WorkspaceActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

async function requireLiveClient() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, error: "Sign in to manage organizations." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Supabase is not configured." };
  }

  return { ok: true as const, user, supabase };
}

export async function createOrganizationAction(
  nameInput: string,
): Promise<WorkspaceActionResult<Organization>> {
  const gate = await requireLiveClient();
  if (!gate.ok) return { ok: false, error: gate.error };

  const name = nameInput.trim();
  if (!name) return { ok: false, error: "Organization name is required." };

  const limits = getPackagingLimits();
  const { count: ownedOrgs, error: countError } = await gate.supabase
    .from("organization_members")
    .select("organization_id", { count: "exact", head: true })
    .eq("user_id", gate.user.id)
    .eq("access_role", "organization_owner");

  if (countError) return { ok: false, error: countError.message };
  if ((ownedOrgs ?? 0) >= limits.organizationsPerUser) {
    return {
      ok: false,
      error: `Organization limit reached (${limits.organizationsPerUser}).`,
    };
  }

  const baseSlug = slugify(name) || `org-${Date.now()}`;
  const { data: existing } = await gate.supabase.from("organizations").select("slug");
  const slug = uniqueSlug(
    baseSlug,
    (existing ?? []).map((row: { slug: string }) => row.slug),
  );

  const { data, error } = await gate.supabase
    .from("organizations")
    .insert({
      name,
      slug,
      created_by: gate.user.id,
    })
    .select("id, name, slug")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create organization." };
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
  if (!name) return { ok: false, error: "Project name is required." };
  if (!organizationId) return { ok: false, error: "Pick an organization first." };

  const limits = getPackagingLimits();
  const { count: projectCount, error: projectCountError } = await gate.supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (projectCountError) return { ok: false, error: projectCountError.message };
  if ((projectCount ?? 0) >= limits.projectsPerOrganization) {
    return {
      ok: false,
      error: `Project limit reached (${limits.projectsPerOrganization}).`,
    };
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
    return { ok: false, error: error?.message ?? "Could not create project." };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: mapProjectRow(data as ProjectRow) };
}
