import { Badge } from "@/components/ui/badge";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoWorkPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const workspace = getNorthlightAuroraDemo();
  const members = new Map(workspace.members.map((member) => [member.id, member]));

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <p className="t-body-sm text-[var(--hf-ink-muted)]">{t.tasks.subtitle}</p>
      <ul className="grid gap-2">
        {workspace.work.map((item) => {
          const owner = item.assigneeId ? members.get(item.assigneeId) : null;
          return (
            <li key={item.id} className="panel grid gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="t-display-sm text-[var(--hf-ink)]">{item.title}</h2>
                <Badge tone={item.priority === "high" ? "warning" : "neutral"}>
                  {item.priority}
                </Badge>
                <Badge tone="neutral">{item.status}</Badge>
                {item.completedSinceVisit ? (
                  <Badge tone="success">{t.operations.factCompletedOne}</Badge>
                ) : null}
              </div>
              <p className="t-body-sm text-[var(--hf-ink-muted)]">
                {owner?.name ?? t.tasks.unassigned}
              </p>
              {item.blocks.length > 0 ? (
                <p className="t-mono-sm text-[var(--hf-caution)]">
                  {t.work.blocks}: {item.blocks.length}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
