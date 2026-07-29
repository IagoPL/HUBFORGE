"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createAvailabilityAction,
  deleteAvailabilityAction,
  listAvailabilityAction,
} from "@/features/availability/actions";
import { listMembersAction } from "@/features/collaboration/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { getDemoWorkspace } from "@/data/demo-workspace";
import type { AvailabilityEntry, Member } from "@/lib/domain/types";

const DEMO_AVAIL_KEY = "hubforge.demo.availability.v1";

function loadDemoAvailability(organizationId: string): AvailabilityEntry[] {
  const seed = getDemoWorkspace().availability;
  if (typeof window === "undefined") {
    return organizationId === "org_demo" ? seed : [];
  }
  try {
    const raw = window.localStorage.getItem(DEMO_AVAIL_KEY);
    if (!raw) return organizationId === "org_demo" ? seed : [];
    const parsed = JSON.parse(raw) as Array<
      AvailabilityEntry & { organizationId?: string }
    >;
    const filtered = parsed.filter(
      (entry) =>
        (entry as { organizationId?: string }).organizationId === organizationId ||
        (!("organizationId" in entry) && organizationId === "org_demo"),
    );
    if (filtered.length > 0) return filtered;
    return organizationId === "org_demo" ? seed : [];
  } catch {
    return organizationId === "org_demo" ? seed : [];
  }
}

function saveDemoAvailability(organizationId: string, entries: AvailabilityEntry[]) {
  const stamped = entries.map((entry) => ({ ...entry, organizationId }));
  window.localStorage.setItem(DEMO_AVAIL_KEY, JSON.stringify(stamped));
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AvailabilityPanel({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    create: string;
    startsAt: string;
    endsAt: string;
    kind: string;
    note: string;
    empty: string;
    remove: string;
  };
}) {
  const { mode, activeOrganization } = useWorkspace();
  const organizationId = activeOrganization?.id ?? "";
  const [demoTick, setDemoTick] = useState(0);
  const [liveEntries, setLiveEntries] = useState<AvailabilityEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const now = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState(toLocalInputValue(now));
  const [endsAt, setEndsAt] = useState(toLocalInputValue(later));
  const [kind, setKind] = useState<AvailabilityEntry["kind"]>("unavailable");
  const noteInputRef = useRef<HTMLInputElement | null>(null);

  const demoEntries = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !organizationId) return [];
    return loadDemoAvailability(organizationId);
  }, [mode, organizationId, demoTick]);

  const entries = mode === "demo" ? demoEntries : liveEntries;

  const demoMembers = useMemo(() => {
    if (mode !== "demo") return [];
    return getDemoWorkspace().members.filter(
      (member) => member.organizationId === (organizationId || "org_demo"),
    );
  }, [mode, organizationId]);

  const visibleMembers = mode === "demo" ? demoMembers : members;
  const memberById = new Map(visibleMembers.map((member) => [member.id, member]));

  useEffect(() => {
    if (mode !== "live" || !organizationId) return;
    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listAvailabilityAction(organizationId),
        listMembersAction(organizationId),
      ]).then(([availabilityResult, membersResult]) => {
        if (cancelled) return;
        if (availabilityResult.ok) setLiveEntries(availabilityResult.data);
        else setError(availabilityResult.error);
        if (membersResult.ok) setMembers(membersResult.data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  function createEntry(submittedNote: string) {
    if (!organizationId) return;
    setError(null);
    const resolvedNote = submittedNote.trim() || "Personal window";

    if (mode === "demo") {
      const entry: AvailabilityEntry = {
        id: `av_${crypto.randomUUID().slice(0, 8)}`,
        memberId: "mem_self",
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        kind,
        note: resolvedNote,
      };
      saveDemoAvailability(organizationId, [...demoEntries, entry]);
      setDemoTick((value) => value + 1);
      if (noteInputRef.current) noteInputRef.current.value = "";
      return;
    }

    startTransition(() => {
      void createAvailabilityAction({
        organizationId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        kind,
        note: resolvedNote,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setLiveEntries((current) =>
          [...current, result.data].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        );
        if (noteInputRef.current) noteInputRef.current.value = "";
      });
    });
  }

  function removeEntry(entryId: string) {
    setError(null);
    if (mode === "demo") {
      saveDemoAvailability(
        organizationId,
        demoEntries.filter((entry) => entry.id !== entryId),
      );
      setDemoTick((value) => value + 1);
      return;
    }

    startTransition(() => {
      void deleteAvailabilityAction(entryId).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setLiveEntries((current) => current.filter((entry) => entry.id !== entryId));
      });
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
      </header>

      {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}

      <form
        className="grid max-w-3xl gap-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          createEntry(String(formData.get("note") ?? ""));
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold md:col-span-2">
          {labels.create}
        </h2>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.startsAt}</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.endsAt}</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{labels.kind}</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as AvailabilityEntry["kind"])}
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending || !organizationId}
          >
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="unavailable">unavailable</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm" htmlFor="availability-note">
          <span className="font-medium">{labels.note}</span>
          <input
            ref={noteInputRef}
            id="availability-note"
            name="note"
            defaultValue=""
            className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
            disabled={pending || !organizationId}
          />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending || !organizationId}>
            {labels.create}
          </Button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--hf-fg-muted)]">{labels.empty}</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const member =
              memberById.get(entry.memberId) ??
              (entry.memberId === "mem_self"
                ? { name: "You", avatarInitials: "YO" }
                : null);
            return (
              <li
                key={entry.id}
                className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-medium">{member?.name ?? "Team member"}</p>
                  <Badge
                    tone={
                      entry.kind === "unavailable"
                        ? "danger"
                        : entry.kind === "busy"
                          ? "warning"
                          : "success"
                    }
                  >
                    {entry.kind}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--hf-fg-muted)]">{entry.note}</p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--hf-fg-muted)]">
                  {new Date(entry.startsAt).toLocaleString()} →{" "}
                  {new Date(entry.endsAt).toLocaleString()}
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => removeEntry(entry.id)}
                  >
                    {labels.remove}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
