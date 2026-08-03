"use client";

import { useRouter } from "next/navigation";
import type { AttentionItem } from "@/lib/operations";
import type { Locale } from "@/i18n/config";
import type { Member } from "@/lib/domain/types";
import { Briefing } from "./briefing";
import type { OperationsLabels } from "./labels";

/**
 * Client edge of the briefing: acting on an item is real navigation to the work
 * surface with that task open, so the move is linkable and reversible.
 */
export function BriefingSurface({
  summary,
  attention,
  members,
  now,
  locale,
  labels,
}: {
  summary: string;
  attention: AttentionItem[];
  members: Member[];
  now: string;
  locale: Locale;
  labels: OperationsLabels;
}) {
  const router = useRouter();

  return (
    <Briefing
      summary={summary}
      attention={attention}
      members={members}
      now={now}
      locale={locale}
      labels={labels}
      onOpen={(taskId) => router.push(`/app/tasks?task=${encodeURIComponent(taskId)}`)}
    />
  );
}
