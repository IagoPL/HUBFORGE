"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";

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
  if (typeof window === "undefined") return;
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
      if (typeof window !== "undefined") {
        store.channels.push(general);
        saveDemoStore(store);
      }
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
      <div className="px-4 py-5 sm:px-6">
        <p className="lead">{labels.emptyProject}</p>
      </div>
    );
  }

  const currentChannelName =
    visibleChannels.find((item) => item.id === currentChannelId)?.name ?? "general";

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <div className="grid gap-1">
        <p className="lead">{labels.subtitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-faint)]">
          {mode === "demo" ? labels.demoHint : labels.liveHint}
        </p>
      </div>

      {error ? (
        <p role="alert" className="t-body-sm text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[13rem_1fr]">
        <nav aria-label={labels.channels} className="panel p-2">
          <p className="t-label px-2 py-1 text-[var(--hf-ink-faint)]">
            {labels.channels}
          </p>
          <ul className="grid gap-0.5">
            {visibleChannels.map((channel) => {
              const active = channel.id === currentChannelId;

              return (
                <li key={channel.id}>
                  <button
                    type="button"
                    onClick={() => selectChannel(channel.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "t-mono relative flex min-h-9 w-full items-center rounded-[var(--radius-sm)]",
                      "px-2 text-left transition-colors duration-[var(--motion-feedback)]",
                      active
                        ? "bg-[var(--hf-accent-quiet)] text-[var(--hf-accent-hover)]"
                        : "text-[var(--hf-ink-muted)] hover:bg-[var(--hf-ground-3)] hover:text-[var(--hf-ink)]",
                    )}
                  >
                    #{channel.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section
          aria-label={currentChannelName}
          className="panel flex min-h-[28rem] flex-col"
        >
          <div className="flex items-baseline gap-3 border-b border-[var(--hf-rule)] px-4 py-2.5">
            <p className="t-mono font-medium text-[var(--hf-ink)]">
              #{currentChannelName}
            </p>
            <p className="t-body-sm text-[var(--hf-ink-faint)]">{labels.messages}</p>
          </div>

          <div className="flex-1 overflow-y-auto bg-[var(--hf-ground-1)] px-4 py-3">
            {visibleMessages.length === 0 ? (
              <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyMessages}</p>
            ) : (
              <ol className="grid gap-3">
                {visibleMessages.map((message) => (
                  <li key={message.id}>
                    {/* Attribution as a drawn margin, so the message body stays
                        the widest thing on the line. */}
                    <article className="border-l border-[var(--hf-rule)] pl-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="t-mono-sm font-medium text-[var(--hf-ink)]">
                          {message.authorId.slice(0, 8)}
                        </span>
                        <time
                          dateTime={message.createdAt}
                          className="t-mono-sm text-[var(--hf-ink-faint)]"
                          data-tabular
                        >
                          {new Date(message.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="t-body whitespace-pre-wrap text-[var(--hf-ink)]">
                        {message.body}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-[var(--hf-rule)] p-2"
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
              className="input flex-1"
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
