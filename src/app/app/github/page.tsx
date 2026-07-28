import { GitHubSyncPanel } from "@/features/github/github-sync-panel";
import { getGitHubAppConfig, isGitHubAppConfigured } from "@/features/github/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "GitHub",
};

export default async function GitHubPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const config = getGitHubAppConfig();
  const installUrl = config?.slug
    ? `https://github.com/apps/${config.slug}/installations/new`
    : null;

  return (
    <GitHubSyncPanel
      appConfigured={isGitHubAppConfigured()}
      installUrl={installUrl}
      labels={{
        title: t.github.title,
        subtitle: t.github.subtitle,
        link: t.github.link,
        unlink: t.github.unlink,
        repo: t.github.repo,
        installationId: t.github.installationId,
        emptyProject: t.github.emptyProject,
        emptyRepo: t.github.emptyRepo,
        syncedIssues: t.github.syncedIssues,
        setupHint: t.github.setupHint,
        demoHint: t.github.demoHint,
      }}
    />
  );
}
