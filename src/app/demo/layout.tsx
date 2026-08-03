import { AppShell } from "@/components/app-shell/app-shell";
import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoProvider } from "@/features/demo/demo-provider";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Demonstration",
  robots: { index: false, follow: false },
};

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <DemoProvider>
      <AppShell
        locale={locale}
        basePath="/demo"
        banner={<DemoBanner banner={t.demo.banner} connectLabel={t.demo.connectRepo} />}
        labels={{
          brand: t.common.brand,
          organization: t.nav.organization,
          language: t.common.language,
          english: t.common.english,
          spanish: t.common.spanish,
          appNav: t.nav.app,
          mobileNav: t.nav.app,
          overview: t.nav.overview,
          attention: t.nav.attention,
          work: t.nav.work,
          dependencies: t.nav.dependencies,
          team: t.nav.team,
          capacity: t.nav.capacity,
          settings: t.nav.settings,
          projects: t.nav.projects,
          organizations: t.nav.organizations,
          github: t.nav.github,
          more: t.nav.more,
          skipToContent: t.nav.skipToContent,
          commandPalette: t.nav.commandPalette,
          commandPlaceholder: t.nav.commandPlaceholder,
          commandNavigate: t.nav.commandNavigate,
          commandPreferences: t.nav.commandPreferences,
          densityComfortable: t.nav.densityComfortable,
          densityCompact: t.nav.densityCompact,
          commandEmpty: t.nav.commandEmpty,
          commandOpenHint: t.nav.commandOpenHint,
        }}
      >
        {children}
      </AppShell>
    </DemoProvider>
  );
}
