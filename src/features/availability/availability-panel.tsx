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
          const formData = new FormData(event.currentTarget);
          createEntry(String(formData.get("note") ?? ""));
        }}
      >
        <h2 className="t-display-sm text-[var(--hf-ink)] md:col-span-2">{labels.create}</h2>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">{labels.startsAt}</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="input"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">{labels.endsAt}</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="input"
            required
            disabled={pending || !organizationId}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">{labels.kind}</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as AvailabilityEntry["kind"])}
            className="input"
            disabled={pending || !organizationId}
          >
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="unavailable">unavailable</option>
          </select>
        </label>
        <label className="grid gap-1.5" htmlFor="availability-note">
          <span className="t-body-sm font-medium text-[var(--hf-ink)]">{labels.note}</span>
          <input
            ref={noteInputRef}
            id="availability-note"
            name="note"
            defaultValue=""
            className="input"
            disabled={pending || !organizationId}
          />
        </label>
        <Button
          type="submit"
          disabled={pending || !organizationId}
          className="justify-self-start md:col-span-2"
        >
          {labels.create}
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="t-body text-[var(--hf-ink-muted)]">{labels.empty}</p>
      ) : (
        <ul className="grid gap-2">
          {entries.map((entry) => {
            const member =
              memberById.get(entry.memberId) ??
              (entry.memberId === "mem_self"
                ? { name: "You", avatarInitials: "YO" }
                : null);

            return (
              <li key={entry.id} className="panel flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                <p className="t-body font-medium text-[var(--hf-ink)]">
                  {member?.name ?? "Team member"}
                </p>
                {/* A closed window is a state, not a failure: danger stays for errors. */}
                <Badge
                  tone={
                    entry.kind === "available"
                      ? "success"
                      : entry.kind === "busy"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {entry.kind}
                </Badge>
                <p className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                  <time dateTime={entry.startsAt}>
                    {new Date(entry.startsAt).toLocaleString()}
                  </time>
                  {" → "}
                  <time dateTime={entry.endsAt}>{new Date(entry.endsAt).toLocaleString()}</time>
                </p>
                <p className="t-body-sm min-w-0 flex-1 text-[var(--hf-ink-muted)]">{entry.note}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => removeEntry(entry.id)}
                >
                  {labels.remove}
                  <span className="sr-only"> — {entry.note}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
