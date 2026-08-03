"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  createDirectChannelAction,
  ensureProjectGeneralChannelAction,
  listChannelsAction,
  listDirectChannelsAction,
  listMessagesAction,
  sendMessageAction,
  type ChatChannel,
  type ChatMessage,
} from "@/features/chat/actions";
import { listMembersAction } from "@/features/collaboration/actions";
import { useWorkspace } from "@/features/organizations/workspace-provider";
import type { Member } from "@/lib/domain/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ChatPanel({
  currentUserId,
  labels,
}: {
  currentUserId: string;
  labels: {
    title: string;
    subtitle: string;
    channels: string;
    directMessages: string;
    messages: string;
    placeholder: string;
    send: string;
    emptyOrganization: string;
    emptyProject: string;
    emptyMessages: string;
    liveHint: string;
    startDm: string;
    pickMember: string;
    you: string;
  };
}) {
  const { activeOrganization, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [projectChannels, setProjectChannels] = useState<ChatChannel[]>([]);
  const [directChannels, setDirectChannels] = useState<ChatChannel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [dmUserId, setDmUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channels = [...projectChannels, ...directChannels];
  const currentChannelId = activeChannelId || channels[0]?.id || "";
  const currentChannel = channels.find((item) => item.id === currentChannelId);
  const peers = members.filter((member) => member.id !== currentUserId);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    startTransition(() => {
      void Promise.all([
        listDirectChannelsAction(organizationId),
        listMembersAction(organizationId),
        projectId
          ? ensureProjectGeneralChannelAction({ projectId, organizationId }).then(
              async (ensured) => {
                if (!ensured.ok) return ensured;
                return listChannelsAction(projectId);
              },
            )
          : Promise.resolve({
              ok: true as const,
              data: [] as ChatChannel[],
            }),
      ]).then(([directResult, membersResult, projectResult]) => {
        if (cancelled) return;
        if (!directResult.ok) {
          setError(directResult.error);
          return;
        }
        if (!membersResult.ok) {
          setError(membersResult.error);
          return;
        }
        if (!projectResult.ok) {
          setError(projectResult.error);
          return;
        }

        setDirectChannels(directResult.data);
        setMembers(membersResult.data);
        setProjectChannels(projectResult.data);

        const nextChannels = [...projectResult.data, ...directResult.data];
        const channelId = nextChannels[0]?.id ?? "";
        setActiveChannelId(channelId);
        if (!channelId) {
          setMessages([]);
          return;
        }
        void listMessagesAction(channelId).then((messageResult) => {
          if (cancelled) return;
          if (messageResult.ok) setMessages(messageResult.data);
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, organizationId]);

  useEffect(() => {
    if (!currentChannelId) return;
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
  }, [currentChannelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function selectChannel(channelId: string) {
    setActiveChannelId(channelId);
    setError(null);
    startTransition(() => {
      void listMessagesAction(channelId).then((result) => {
        if (result.ok) setMessages(result.data);
        else setError(result.error);
      });
    });
  }

  function startDm() {
    if (!organizationId || !dmUserId) return;
    const peer = peers.find((member) => member.id === dmUserId);
    if (!peer) return;
    setError(null);

    startTransition(() => {
      void createDirectChannelAction({
        organizationId,
        otherUserId: peer.id,
        otherUserName: peer.name,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setDirectChannels((current) => {
          if (current.some((item) => item.id === result.data.id)) return current;
          return [result.data, ...current];
        });
        setDmUserId("");
        selectChannel(result.data.id);
      });
    });
  }

  function send() {
    if (!currentChannelId || !organizationId) return;
    const body = draft.trim();
    if (!body) return;
    setError(null);

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

  function authorLabel(authorId: string) {
    if (authorId === currentUserId) return labels.you;
    const member = members.find((item) => item.id === authorId);
    return member?.name || authorId.slice(0, 8);
  }

  function channelLabel(channel: ChatChannel) {
    return channel.kind === "direct" ? channel.name : `#${channel.name}`;
  }

  if (!organizationId) {
    return (
      <div className="px-4 py-5 sm:px-6">
        <p className="lead">{labels.emptyOrganization}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <div className="grid gap-1">
        <p className="lead">{labels.subtitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-faint)]">{labels.liveHint}</p>
      </div>

      {error ? (
        <p role="alert" className="t-body-sm text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[14rem_1fr]">
        <div className="grid gap-3 content-start">
          <nav aria-label={labels.channels} className="panel p-2">
            <p className="t-label px-2 py-1 text-[var(--hf-ink-faint)]">
              {labels.channels}
            </p>
            {projectChannels.length === 0 ? (
              <p className="t-body-sm px-2 py-1 text-[var(--hf-ink-muted)]">
                {labels.emptyProject}
              </p>
            ) : (
              <ul className="grid gap-0.5">
                {projectChannels.map((channel) => {
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
                        {channelLabel(channel)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>

          <nav aria-label={labels.directMessages} className="panel p-2">
            <p className="t-label px-2 py-1 text-[var(--hf-ink-faint)]">
              {labels.directMessages}
            </p>
            <ul className="grid gap-0.5">
              {directChannels.map((channel) => {
                const active = channel.id === currentChannelId;
                return (
                  <li key={channel.id}>
                    <button
                      type="button"
                      onClick={() => selectChannel(channel.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "t-body relative flex min-h-9 w-full items-center rounded-[var(--radius-sm)]",
                        "px-2 text-left transition-colors duration-[var(--motion-feedback)]",
                        active
                          ? "bg-[var(--hf-accent-quiet)] text-[var(--hf-accent-hover)]"
                          : "text-[var(--hf-ink-muted)] hover:bg-[var(--hf-ground-3)] hover:text-[var(--hf-ink)]",
                      )}
                    >
                      {channelLabel(channel)}
                    </button>
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-2 grid gap-2 border-t border-[var(--hf-rule-faint)] px-1 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                startDm();
              }}
            >
              <label className="grid gap-1">
                <span className="sr-only">{labels.pickMember}</span>
                <select
                  value={dmUserId}
                  onChange={(event) => setDmUserId(event.target.value)}
                  className="input"
                  disabled={pending || peers.length === 0}
                >
                  <option value="">{labels.pickMember}</option>
                  {peers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                size="sm"
                disabled={pending || !dmUserId}
                className="justify-self-start"
              >
                {labels.startDm}
              </Button>
            </form>
          </nav>
        </div>

        <section
          aria-label={currentChannel ? channelLabel(currentChannel) : labels.messages}
          className="panel flex min-h-[28rem] flex-col"
        >
          <div className="flex items-baseline gap-3 border-b border-[var(--hf-rule)] px-4 py-2.5">
            <p className="t-mono font-medium text-[var(--hf-ink)]">
              {currentChannel ? channelLabel(currentChannel) : "—"}
            </p>
            <p className="t-body-sm text-[var(--hf-ink-faint)]">{labels.messages}</p>
          </div>

          <div className="flex-1 overflow-y-auto bg-[var(--hf-ground-1)] px-4 py-3">
            {!currentChannelId ? (
              <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyMessages}</p>
            ) : messages.length === 0 ? (
              <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyMessages}</p>
            ) : (
              <ol className="grid gap-3">
                {messages.map((message) => (
                  <li key={message.id}>
                    <article className="border-l border-[var(--hf-rule)] pl-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="t-mono-sm font-medium text-[var(--hf-ink)]">
                          {authorLabel(message.authorId)}
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
