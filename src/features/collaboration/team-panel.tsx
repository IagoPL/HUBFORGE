"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  inviteMemberAction,
  listInvitationsAction,
  listMembersAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRolesAction,
} from "@/features/collaboration/actions";
import type { Invitation } from "@/features/collaboration/mapping";
import { useWorkspace } from "@/features/organizations/workspace-provider";
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
    copyLink: string;
    inviteSent: string;
    inviteLinkHint: string;
    emailNotDelivered: string;
    removeMember: string;
    revokeInvite: string;
  };
}) {
  const { activeOrganization } = useWorkspace();
  const organizationId = activeOrganization?.id ?? "";
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [accessRole, setAccessRole] = useState<AccessRole>("member");
  const [functionalRole, setFunctionalRole] = useState("");

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listMembersAction(organizationId),
        listInvitationsAction(organizationId),
      ]).then(([membersResult, invitesResult]) => {
        if (cancelled) return;
        if (membersResult.ok) {
          setMembers(membersResult.data);
        } else setError(membersResult.error);
        if (invitesResult.ok) setInvitations(invitesResult.data);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const roleOptions = memberRoleSchema.options;

  function invite() {
    if (!organizationId || !email.trim()) return;
    setError(null);
    setInviteUrl(null);
    setInviteNotice(null);

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
          setMembers((current) => [...current, result.data.member!]);
        } else {
          setInvitations((current) => [result.data.invitation, ...current]);
          setInviteUrl(result.data.inviteUrl);
          setInviteNotice(
            result.data.emailDelivered ? labels.inviteSent : labels.emailNotDelivered,
          );
        }
        setEmail("");
        setFunctionalRole("");
      });
    });
  }

  function updateDraft(memberId: string, patch: Partial<Member>) {
    setMembers((current) =>
      current.map((item) => (item.id === memberId ? { ...item, ...patch } : item)),
    );
  }

  function saveMember(member: Member) {
    setError(null);

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
        setMembers((current) =>
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
        {inviteNotice ? (
          <p className="t-body-sm text-[var(--hf-ink-muted)] md:col-span-2">
            {inviteNotice}
          </p>
        ) : null}
        {inviteUrl ? (
          <div className="grid gap-2 md:col-span-2">
            <p className="t-body-sm text-[var(--hf-ink-muted)]">
              {labels.inviteLinkHint}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="t-mono-sm break-all rounded bg-[var(--hf-ground-3)] px-2 py-1">
                {inviteUrl}
              </code>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                {labels.copyLink}
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      {invitations.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="t-display-sm text-[var(--hf-ink)]">{labels.pending}</h2>
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="panel grid gap-3 border-dashed p-4">
                <div>
                  <p className="t-body font-medium text-[var(--hf-ink)]">
                    {invitation.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="brand">{accessLabels[invitation.accessRole]}</Badge>
                    <Badge>{invitation.functionalRole || "Contributor"}</Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  className="justify-self-start"
                  onClick={() => {
                    setError(null);
                    startTransition(() => {
                      void revokeInvitationAction({
                        organizationId,
                        invitationId: invitation.id,
                      }).then((result) => {
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setInvitations((current) =>
                          current.filter((item) => item.id !== invitation.id),
                        );
                      });
                    });
                  }}
                >
                  {labels.revokeInvite}
                </Button>
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => saveMember(member)}
                >
                  {labels.saveRoles}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(() => {
                      void removeMemberAction({
                        organizationId,
                        userId: member.id,
                      }).then((result) => {
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setMembers((current) =>
                          current.filter((item) => item.id !== member.id),
                        );
                      });
                    });
                  }}
                >
                  {labels.removeMember}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
