"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  inviteMemberAction,
  listInvitationsAction,
  listMembersAction,
  updateMemberRolesAction,
} from "@/features/collaboration/actions";
import type { Invitation } from "@/features/collaboration/mapping";
import { initialsFromName } from "@/features/collaboration/mapping";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { getDemoWorkspace } from "@/data/demo-workspace";
import { memberRoleSchema, type AccessRole, type Member } from "@/lib/domain/types";

const accessLabels: Record<AccessRole, string> = {
  organization_owner: "Org Owner",
  organization_admin: "Org Admin",
  project_manager: "Project Manager",
  project_lead: "Project Lead",
  member: "Member",
  guest: "Guest",
};

const DEMO_MEMBERS_KEY = "hubforge.demo.members.v1";

function loadDemoMembers(organizationId: string): Member[] {
  const seed = getDemoWorkspace().members;
  if (typeof window === "undefined") {
    return organizationId === "org_demo" ? seed : [];
  }
  try {
    const raw = window.localStorage.getItem(DEMO_MEMBERS_KEY);
    if (!raw) return organizationId === "org_demo" ? seed : [];
    const parsed = JSON.parse(raw) as Member[];
    const filtered = parsed.filter((member) => member.organizationId === organizationId);
    if (filtered.length > 0) return filtered;
    return organizationId === "org_demo" ? seed : [];
  } catch {
    return organizationId === "org_demo" ? seed : [];
  }
}

function saveDemoMembers(members: Member[]) {
  window.localStorage.setItem(DEMO_MEMBERS_KEY, JSON.stringify(members));
}

export function TeamPanel({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    invite: string;
    email: string;
    accessRole: string;
    functionalRole: string;
    pending: string;
    saveRoles: string;
    empty: string;
  };
}) {
  const { mode, activeOrganization } = useWorkspace();
  const organizationId = activeOrganization?.id ?? "";
  const [demoTick, setDemoTick] = useState(0);
  const [draftMembers, setDraftMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [accessRole, setAccessRole] = useState<AccessRole>("member");
  const [functionalRole, setFunctionalRole] = useState("");

  const demoMembers = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !organizationId) return [];
    return loadDemoMembers(organizationId);
  }, [mode, organizationId, demoTick]);

  const members = mode === "demo" ? demoMembers : draftMembers;

  useEffect(() => {
    if (mode !== "live" || !organizationId) return;

    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listMembersAction(organizationId),
        listInvitationsAction(organizationId),
      ]).then(([membersResult, invitesResult]) => {
        if (cancelled) return;
        if (membersResult.ok) {
          setDraftMembers(membersResult.data);
        } else setError(membersResult.error);
        if (invitesResult.ok) setInvitations(invitesResult.data);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  const roleOptions = useMemo(() => memberRoleSchema.options, []);

  function invite() {
    if (!organizationId || !email.trim()) return;
    setError(null);

    if (mode === "demo") {
      const name = email.split("@")[0] || "Member";
      const member: Member = {
        id: `mem_${crypto.randomUUID().slice(0, 8)}`,
        organizationId,
        name,
        email: email.trim().toLowerCase(),
        accessRole,
        functionalRole: functionalRole.trim() || "Contributor",
        avatarInitials: initialsFromName(name).slice(0, 3),
        presence: "offline",
      };
      saveDemoMembers([...demoMembers, member]);
      setDemoTick((value) => value + 1);
      setEmail("");
      setFunctionalRole("");
      return;
    }

    startTransition(() => {
      void inviteMemberAction({
        organizationId,
        email,
        accessRole,
        functionalRole: functionalRole.trim() || "Contributor",
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.data.member) {
          setDraftMembers((current) => [...current, result.data.member!]);
        } else {
          setInvitations((current) => [result.data.invitation, ...current]);
        }
        setEmail("");
        setFunctionalRole("");
      });
    });
  }

  function updateDraft(memberId: string, patch: Partial<Member>) {
    if (mode === "demo") {
      const next = demoMembers.map((item) =>
        item.id === memberId ? { ...item, ...patch } : item,
      );
      saveDemoMembers(next);
      setDemoTick((value) => value + 1);
      return;
    }
    setDraftMembers((current) =>
      current.map((item) => (item.id === memberId ? { ...item, ...patch } : item)),
    );
  }

  function saveMember(member: Member) {
    setError(null);
    if (mode === "demo") {
      saveDemoMembers(demoMembers.map((item) => (item.id === member.id ? member : item)));
      setDemoTick((value) => value + 1);
      return;
    }

    startTransition(() => {
      void updateMemberRolesAction({
        organizationId,
        userId: member.id,
        accessRole: member.accessRole,
        functionalRole: member.functionalRole,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setDraftMembers((current) =>
          current.map((item) => (item.id === result.data.id ? result.data : item)),
        );
      });
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
      </header>

      {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}

      <form
        className="grid max-w-3xl gap-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          invite();
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold md:col-span-2">
          {labels.invite}
        </h2>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.accessRole}</span>
          <select
            value={accessRole}
            onChange={(event) => setAccessRole(event.target.value as AccessRole)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending || !organizationId}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {accessLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{labels.functionalRole}</span>
          <input
            value={functionalRole}
            onChange={(event) => setFunctionalRole(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending || !organizationId}
          />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending || !organizationId}>
            {labels.invite}
          </Button>
        </div>
      </form>

      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {labels.pending}
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="rounded-2xl border border-dashed border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
              >
                <p className="font-medium">{invitation.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="brand">{accessLabels[invitation.accessRole]}</Badge>
                  <Badge>{invitation.functionalRole || "Contributor"}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {members.length === 0 ? (
        <p className="text-sm text-[var(--hf-fg-muted)]">{labels.empty}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--hf-brand-soft)] text-sm font-semibold text-[var(--hf-brand-strong)]">
                  {member.avatarInitials}
                </span>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-[var(--hf-fg-muted)]">{member.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
                    {labels.accessRole}
                  </span>
                  <select
                    value={member.accessRole}
                    onChange={(event) =>
                      updateDraft(member.id, {
                        accessRole: event.target.value as AccessRole,
                      })
                    }
                    className="h-10 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-2"
                    disabled={pending}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {accessLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
                    {labels.functionalRole}
                  </span>
                  <input
                    value={member.functionalRole}
                    onChange={(event) =>
                      updateDraft(member.id, { functionalRole: event.target.value })
                    }
                    className="h-10 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-2"
                    disabled={pending}
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => saveMember(member)}
                >
                  {labels.saveRoles}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
