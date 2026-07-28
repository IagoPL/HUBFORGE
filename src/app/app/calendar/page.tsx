import { AvailabilityPanel } from "@/features/availability/availability-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Calendar",
};

export default async function CalendarPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <AvailabilityPanel
      labels={{
        title: t.calendar.title,
        subtitle: t.calendar.subtitle,
        create: t.calendar.create,
        startsAt: t.calendar.startsAt,
        endsAt: t.calendar.endsAt,
        kind: t.calendar.kind,
        note: t.calendar.note,
        empty: t.calendar.empty,
        remove: t.calendar.remove,
      }}
    />
  );
}
