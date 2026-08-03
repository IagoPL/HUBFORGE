import { afterEach, describe, expect, it } from "vitest";
import {
  atMemberLimit,
  atOrganizationLimit,
  atProjectLimit,
  getPackagingLimits,
} from "@/lib/packaging/limits";

const keys = [
  "HF_LIMIT_ORGS_PER_USER",
  "HF_LIMIT_PROJECTS_PER_ORG",
  "HF_LIMIT_MEMBERS_PER_ORG",
] as const;

afterEach(() => {
  for (const key of keys) delete process.env[key];
});

describe("getPackagingLimits", () => {
  it("uses free-tier defaults", () => {
    expect(getPackagingLimits()).toEqual({
      organizationsPerUser: 3,
      projectsPerOrganization: 10,
      membersPerOrganization: 15,
    });
  });

  it("reads positive env overrides", () => {
    process.env.HF_LIMIT_ORGS_PER_USER = "5";
    process.env.HF_LIMIT_PROJECTS_PER_ORG = "20";
    process.env.HF_LIMIT_MEMBERS_PER_ORG = "40";
    expect(getPackagingLimits()).toEqual({
      organizationsPerUser: 5,
      projectsPerOrganization: 20,
      membersPerOrganization: 40,
    });
  });

  it("ignores invalid env values", () => {
    process.env.HF_LIMIT_ORGS_PER_USER = "0";
    process.env.HF_LIMIT_PROJECTS_PER_ORG = "nope";
    expect(getPackagingLimits().organizationsPerUser).toBe(3);
    expect(getPackagingLimits().projectsPerOrganization).toBe(10);
  });
});

describe("limit checks", () => {
  const usage = {
    limits: {
      organizationsPerUser: 2,
      projectsPerOrganization: 3,
      membersPerOrganization: 4,
    },
    organizations: 2,
    projects: 1,
    members: 4,
  };

  it("detects org and member caps", () => {
    expect(atOrganizationLimit(usage)).toBe(true);
    expect(atProjectLimit(usage)).toBe(false);
    expect(atMemberLimit(usage)).toBe(true);
  });
});
