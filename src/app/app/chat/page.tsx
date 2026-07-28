import { ChatPanel } from "@/features/chat/chat-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Chat",
};

export default async function ChatPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <ChatPanel
      labels={{
        title: t.chat.title,
        subtitle: t.chat.subtitle,
        channels: t.chat.channels,
        messages: t.chat.messages,
        placeholder: t.chat.placeholder,
        send: t.chat.send,
        emptyProject: t.chat.emptyProject,
        emptyMessages: t.chat.emptyMessages,
        demoHint: t.chat.demoHint,
        liveHint: t.chat.liveHint,
      }}
    />
  );
}
