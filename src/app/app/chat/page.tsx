import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { ChatPanel } from "@/features/chat/chat-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Chat",
};

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/chat");

  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <ChatPanel
      currentUserId={user.id}
      labels={{
        title: t.chat.title,
        subtitle: t.chat.subtitle,
        channels: t.chat.channels,
        directMessages: t.chat.directMessages,
        messages: t.chat.messages,
        placeholder: t.chat.placeholder,
        send: t.chat.send,
        emptyOrganization: t.chat.emptyOrganization,
        emptyProject: t.chat.emptyProject,
        emptyMessages: t.chat.emptyMessages,
        liveHint: t.chat.liveHint,
        startDm: t.chat.startDm,
        pickMember: t.chat.pickMember,
        you: t.chat.you,
      }}
    />
  );
}
