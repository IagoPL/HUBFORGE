"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listNotificationsAction,
  markNotificationReadAction,
} from "@/features/availability/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { getDemoWorkspace } from "@/data/demo-workspace";
import type { Notification } from "@/lib/domain/types";

const DEMO_NOTIF_KEY = "hubforge.demo.notifications.v1";

function loadDemoNotifications(): Notification[] {
  if (typeof window === "undefined") return getDemoWorkspace().notifications;
  try {
    const raw = window.localStorage.getItem(DEMO_NOTIF_KEY);
    if (!raw) return getDemoWorkspace().notifications;
    return JSON.parse(raw) as Notification[];
  } catch {
    return getDemoWorkspace().notifications;
  }
}

function saveDemoNotifications(notifications: Notification[]) {
  window.localStorage.setItem(DEMO_NOTIF_KEY, JSON.stringify(notifications));
}

export function NotificationsPanel({
  labels,
}: {
  labels: {
    title: string;
    markRead: string;
    empty: string;
    unread: string;
  };
}) {
  const { mode } = useWorkspace();
  const [demoTick, setDemoTick] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const demoNotifications = useMemo(() => {
    void demoTick;
    if (mode !== "demo") return [];
    return loadDemoNotifications();
  }, [mode, demoTick]);

  const notifications = mode === "demo" ? demoNotifications : liveNotifications;
  const unread = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    startTransition(() => {
      void listNotificationsAction().then((result) => {
        if (cancelled) return;
        if (result.ok) setLiveNotifications(result.data);
        else setError(result.error);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  function markRead(notificationId: string) {
    setError(null);
    if (mode === "demo") {
      const next = demoNotifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      );
      saveDemoNotifications(next);
      setDemoTick((value) => value + 1);
      return;
    }

    startTransition(() => {
      void markNotificationReadAction(notificationId).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setLiveNotifications((current) =>
          current.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item,
          ),
        );
      });
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {labels.title}
        </h2>
        <Badge tone={unread > 0 ? "brand" : "neutral"}>
          {labels.unread}: {unread}
        </Badge>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--hf-danger)]">{error}</p> : null}
      {notifications.length === 0 ? (
        <p className="text-sm text-[var(--hf-fg-muted)]">{labels.empty}</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((item) => (
            <li key={item.id} className="rounded-xl bg-[var(--hf-surface-2)] p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {!item.read ? <Badge tone="brand">New</Badge> : null}
              </div>
              <p className="text-sm text-[var(--hf-fg-muted)]">{item.body}</p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--hf-fg-muted)]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
              {!item.read ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => markRead(item.id)}
                  >
                    {labels.markRead}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
