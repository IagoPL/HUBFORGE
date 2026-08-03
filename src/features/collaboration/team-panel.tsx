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
import { cn } from "@/lib/utils";

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
    <div className="grid gap-5 px-4 py-5 sm:px-6">
      <p className="lead">{labels.subtitle}</p>

      {error ? (
        <p role="alert" className="t-body-sm text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}

      <form
        className="panel grid max-w-3xl gap-3 p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          invite();
        }}
      >
        <h2 className="t-display-sm text-[var(--hf-ink)] md:col-span-2">
          {labels.invite}
        </h2>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">
            {labels.email}
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">
            {labels.accessRole}
          </span>
          <select
            value={accessRole}
            onChange={(event) => setAccessRole(event.target.value as AccessRole)}
            className="input"
            disabled={pending || !organizationId}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {accessLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">
            {labels.functionalRole}
          </span>
          <input
            value={functionalRole}
            onChange={(event) => setFunctionalRole(event.target.value)}
            className="input"
            disabled={pending || !organizationId}
          />
        </label>
        <Button
          type="submit"
          disabled={pending || !organizationId}
          className="justify-self-start md:col-span-2"
        >
          {labels.invite}
        </Button>
      </form>

      {invitations.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="t-display-sm text-[var(--hf-ink)]">{labels.pending}</h2>
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {invitations.map((invitation) => (
              /* Dashed rule: drawn but not yet built. */
              <li key={invitation.id} className="panel border-dashed p-4">
                <p className="t-body font-medium text-[var(--hf-ink)]">
                  {invitation.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{accessLabels[invitation.accessRole]}</Badge>
                  <Badge>{invitation.functionalRole || "Contributor"}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {members.length === 0 ? (
        <p className="t-body text-[var(--hf-ink-muted)]">{labels.empty}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <li key={member.id} className="panel grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "t-mono-sm grid size-9 shrink-0 place-items-center rounded-full",
                    "bg-[var(--hf-accent-quiet)] font-medium text-[var(--hf-accent-hover)]",
                  )}
                  aria-hidden
                >
                  {member.avatarInitials}
                </span>
                <div className="min-w-0">
                  <p className="t-body truncate font-medium text-[var(--hf-ink)]">
                    {member.name}
                  </p>
                  <p className="t-body-sm truncate text-[var(--hf-ink-muted)]">
                    {member.email}
                  </p>
                </div>
              </div>
              <label className="grid gap-1">
                <span className="t-label text-[var(--hf-ink-faint)]">
                  {labels.accessRole}
                </span>
                <select
                  value={member.accessRole}
                  onChange={(event) =>
                    updateDraft(member.id, {
                      accessRole: event.target.value as AccessRole,
                    })
                  }
                  className="input"
                  disabled={pending}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {accessLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="t-label text-[var(--hf-ink-faint)]">
                  {labels.functionalRole}
                </span>
                <input
                  value={member.functionalRole}
                  onChange={(event) =>
                    updateDraft(member.id, { functionalRole: event.target.value })
                  }
                  className="input"
                  disabled={pending}
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => saveMember(member)}
                className="justify-self-start"
              >
                {labels.saveRoles}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
