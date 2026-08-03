import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  const links = [
    { href: "/app/organizations", label: t.settings.organizations },
    { href: "/app/projects", label: t.settings.projects },
    { href: "/app/calendar", label: t.settings.capacity },
    { href: "/app/github", label: t.nav.github },
  ];

  return (
    <div className="grid max-w-2xl gap-4 px-4 py-5 sm:px-6">
      <div className="grid gap-2">
        <h2 className="t-display text-[var(--hf-ink)]">{t.settings.title}</h2>
        <p className="t-body text-[var(--hf-ink-muted)]">{t.settings.subtitle}</p>
      </div>
      <ul className="grid gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full justify-start",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
