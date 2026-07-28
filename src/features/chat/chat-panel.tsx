"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureProjectGeneralChannelAction,
  listChannelsAction,
  listMessagesAction,
  sendMessageAction,
  type ChatChannel,
  type ChatMessage,
} from "@/features/chat/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserClientLabel } from "@/features/chat/demo-identity";

const DEMO_CHAT_KEY = "hubforge.demo.chat.v1";

type DemoStore = {
  channels: Array<ChatChannel & { projectId: string }>;
  messages: Array<ChatMessage & { projectId: string }>;
};

function loadDemoStore(): DemoStore {
  if (typeof window === "undefined") {
    return { channels: [], messages: [] };
  }
  try {
    const raw = window.localStorage.getItem(DEMO_CHAT_KEY);
    if (!raw) return { channels: [], messages: [] };
    return JSON.parse(raw) as DemoStore;
  } catch {
    return { channels: [], messages: [] };
  }
}

function saveDemoStore(store: DemoStore) {
  window.localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(store));
}

export function ChatPanel({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    channels: string;
    messages: string;
    placeholder: string;
    send: string;
    emptyProject: string;
    emptyMessages: string;
    demoHint: string;
    liveHint: string;
  };
}) {
  const { mode, activeOrganization, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [demoTick, setDemoTick] = useState(0);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const demoData = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !projectId || !organizationId) {
      return { channels: [] as ChatChannel[], messages: [] as ChatMessage[] };
    }
    const store = loadDemoStore();
    let projectChannels = store.channels.filter((item) => item.projectId === projectId);
    if (projectChannels.length === 0) {
      const general: ChatChannel & { projectId: string } = {
        id: `ch_${projectId}_general`,
        organizationId,
        projectId,
        kind: "project",
        name: "general",
      };
      store.channels.push(general);
      saveDemoStore(store);
      projectChannels = [general];
    }
    return {
      channels: projectChannels,
      messages: store.messages.filter(
        (item) =>
          item.projectId === projectId &&
          item.channelId === (activeChannelId || projectChannels[0]?.id),
      ),
    };
  }, [mode, projectId, organizationId, demoTick, activeChannelId]);

  const visibleChannels = mode === "demo" ? demoData.channels : channels;
  const visibleMessages = mode === "demo" ? demoData.messages : messages;
  const currentChannelId = activeChannelId || visibleChannels[0]?.id || "";

  useEffect(() => {
    if (mode !== "live" || !projectId || !organizationId) return;
    let cancelled = false;

    startTransition(() => {
      void ensureProjectGeneralChannelAction({ projectId, organizationId }).then(
        async (ensured) => {
          if (cancelled) return;
          if (!ensured.ok) {
            setError(ensured.error);
            return;
          }
          const listed = await listChannelsAction(projectId);
          if (cancelled) return;
          if (!listed.ok) {
            setError(listed.error);
            return;
          }
          setChannels(listed.data);
          const channelId = listed.data[0]?.id ?? ensured.data.id;
          setActiveChannelId(channelId);
          const messageResult = await listMessagesAction(channelId);
          if (cancelled) return;
          if (messageResult.ok) setMessages(messageResult.data);
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [mode, projectId, organizationId]);

  useEffect(() => {
    if (mode !== "live" || !currentChannelId) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel(`chat:${currentChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${currentChannelId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            channel_id: string;
            author_id: string;
            body: string;
            created_at: string;
          };
          setMessages((current) => {
            if (current.some((item) => item.id === row.id)) return current;
            return [
              ...current,
              {
                id: row.id,
                channelId: row.channel_id,
                authorId: row.author_id,
                body: row.body,
                createdAt: row.created_at,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [mode, currentChannelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  function selectChannel(channelId: string) {
    setActiveChannelId(channelId);
    setError(null);
    if (mode === "live") {
      startTransition(() => {
        void listMessagesAction(channelId).then((result) => {
          if (result.ok) setMessages(result.data);
          else setError(result.error);
        });
      });
    } else {
      setDemoTick((value) => value + 1);
    }
  }

  function send() {
    if (!currentChannelId || !organizationId || !projectId) return;
    const body = draft.trim();
    if (!body) return;
    setError(null);

    if (mode === "demo") {
      const store = loadDemoStore();
      const message: ChatMessage & { projectId: string } = {
        id: `msg_${crypto.randomUUID().slice(0, 8)}`,
        channelId: currentChannelId,
        authorId: getCurrentUserClientLabel(),
        body,
        createdAt: new Date().toISOString(),
        projectId,
      };
      store.messages.push(message);
      saveDemoStore(store);
      setDraft("");
      setDemoTick((value) => value + 1);
      return;
    }

    startTransition(() => {
      void sendMessageAction({
        channelId: currentChannelId,
        organizationId,
        body,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessages((current) =>
          current.some((item) => item.id === result.data.id)
            ? current
            : [...current, result.data],
        );
        setDraft("");
      });
    });
  }

  if (!projectId) {
    return (
      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.emptyProject}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
        <p className="text-xs text-[var(--hf-fg-muted)]">
          {mode === "demo" ? labels.demoHint : labels.liveHint}
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <aside className="rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--hf-fg-muted)]">
            {labels.channels}
          </p>
          <ul className="space-y-1">
            {visibleChannels.map((channel) => (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => selectChannel(channel.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    channel.id === currentChannelId
                      ? "bg-[var(--hf-brand-soft)] text-[var(--hf-brand-strong)]"
                      : "hover:bg-[var(--hf-surface-2)]"
                  }`}
                >
                  #{channel.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)]">
          <div className="border-b border-[var(--hf-border)] px-4 py-3">
            <p className="font-medium">
              #
              {visibleChannels.find((item) => item.id === currentChannelId)?.name ??
                "general"}
            </p>
            <p className="text-xs text-[var(--hf-fg-muted)]">{labels.messages}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {visibleMessages.length === 0 ? (
              <p className="text-sm text-[var(--hf-fg-muted)]">{labels.emptyMessages}</p>
            ) : (
              visibleMessages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-xl bg-[var(--hf-surface-2)] px-3 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge>{message.authorId.slice(0, 8)}</Badge>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--hf-fg-muted)]">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                </article>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="flex gap-2 border-t border-[var(--hf-border)] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <label className="sr-only" htmlFor="chat-draft">
              {labels.placeholder}
            </label>
            <input
              id="chat-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={labels.placeholder}
              className="h-11 flex-1 rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
              disabled={pending || !currentChannelId}
            />
            <Button type="submit" disabled={pending || !draft.trim()}>
              {labels.send}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
