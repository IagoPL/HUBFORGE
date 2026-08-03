import { redirect } from "next/navigation";

export const metadata = {
  title: "Chat",
};

/**
 * Soft-retire: chat stays in the codebase and schema, but is not an MVP surface.
 * See docs/architecture/decisions/0006-chat-out-of-mvp.md
 */
export default function ChatPage() {
  redirect("/app?notice=chat-retired");
}
