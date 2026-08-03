/**
 * Soft packaging limits while HubForge stays free.
 * Override with env; caps are abuse guards only (no billing).
 */

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export type PackagingLimits = {
  organizationsPerUser: number;
  projectsPerOrganization: number;
  membersPerOrganization: number;
};

export function getPackagingLimits(): PackagingLimits {
  return {
    organizationsPerUser: positiveInt(process.env.HF_LIMIT_ORGS_PER_USER, 3),
    projectsPerOrganization: positiveInt(process.env.HF_LIMIT_PROJECTS_PER_ORG, 10),
    membersPerOrganization: positiveInt(process.env.HF_LIMIT_MEMBERS_PER_ORG, 15),
  };
}

export type PackagingUsage = {
  limits: PackagingLimits;
  organizations: number;
  projects: number;
  members: number;
};

export function atOrganizationLimit(usage: PackagingUsage) {
  return usage.organizations >= usage.limits.organizationsPerUser;
}

export function atProjectLimit(usage: PackagingUsage) {
  return usage.projects >= usage.limits.projectsPerOrganization;
}

export function atMemberLimit(usage: PackagingUsage) {
  return usage.members >= usage.limits.membersPerOrganization;
}
