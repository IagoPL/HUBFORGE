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
import { cn } from "@/lib/utils";

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
    isNew: string;
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
    <section aria-labelledby="notifications-heading" className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="notifications-heading" className="t-display-sm text-[var(--hf-ink)]">
          {labels.title}
        </h2>
        <Badge tone={unread > 0 ? "brand" : "neutral"} data-tabular>
          {labels.unread}: {unread}
        </Badge>
      </div>
      {error ? (
        <p role="alert" className="t-body-sm mb-3 text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}
      {notifications.length === 0 ? (
        <p className="t-body text-[var(--hf-ink-muted)]">{labels.empty}</p>
      ) : (
        <ul className="grid gap-2">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-[var(--radius-md)] border border-[var(--hf-rule-faint)] p-3",
                item.read ? "bg-[var(--hf-ground-1)]" : "bg-[var(--hf-ground-3)]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="t-body font-medium text-[var(--hf-ink)]">{item.title}</p>
                {!item.read ? <Badge tone="brand">{labels.isNew}</Badge> : null}
              </div>
              <p className="t-body-sm mt-0.5 text-[var(--hf-ink-muted)]">{item.body}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <time
                  dateTime={item.createdAt}
                  className="t-mono-sm text-[var(--hf-ink-faint)]"
                  data-tabular
                >
                  {new Date(item.createdAt).toLocaleString()}
                </time>
                {!item.read ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => markRead(item.id)}
                  >
                    {labels.markRead}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
