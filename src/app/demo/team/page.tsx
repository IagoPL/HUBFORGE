import { Badge } from "@/components/ui/badge";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function DemoTeamPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const workspace = getNorthlightAuroraDemo();

  return (
    <div className="grid gap-4 px-4 py-5 sm:px-6">
      <p className="t-body text-[var(--hf-ink-muted)]">{t.team.subtitle}</p>
      <ul className="grid gap-2">
        {workspace.members.map((member) => (
          <li
            key={member.id}
            className="panel flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="t-body font-medium text-[var(--hf-ink)]">{member.name}</p>
              <p className="t-body-sm text-[var(--hf-ink-muted)]">
                {member.functionalRole}
              </p>
            </div>
            <Badge tone={member.availableThisWeek ? "success" : "warning"}>
              {member.availableThisWeek ? t.demo.available : t.demo.unavailable}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
