import { OrganizationsPanel } from "@/features/organizations/organizations-panel";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Organizations",
};

export default async function OrganizationsPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <OrganizationsPanel
      labels={{
        title: t.organizations.title,
        subtitle: t.organizations.subtitle,
        create: t.organizations.create,
        name: t.organizations.name,
        current: t.organizations.current,
        liveHint: t.organizations.liveHint,
        limitReached: t.organizations.limitReached,
        delete: t.organizations.delete,
        confirmDelete: t.organizations.confirmDelete,
        confirmDeleteAction: t.organizations.confirmDeleteAction,
        cancel: t.organizations.cancel,
        packaging: t.packaging,
      }}
    />
  );
}
