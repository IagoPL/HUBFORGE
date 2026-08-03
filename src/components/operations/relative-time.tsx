import type { Locale } from "@/i18n/config";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/**
 * Machine data, so it renders in mono. Measured against the snapshot clock
 * rather than `Date.now()` to keep server and client markup identical.
 */
export function RelativeTime({
  at,
  now,
  locale,
  justNowLabel,
  className,
}: {
  at: string;
  now: string;
  locale: Locale;
  justNowLabel: string;
  className?: string;
}) {
  const delta = Date.parse(at) - Date.parse(now);
  const unit = UNITS.find(([, ms]) => Math.abs(delta) >= ms);

  const label = unit
    ? new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
        Math.round(delta / unit[1]),
        unit[0],
      )
    : justNowLabel;

  return (
    <time
      dateTime={at}
      title={new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(Date.parse(at))}
      className={className}
    >
      {label}
    </time>
  );
}
