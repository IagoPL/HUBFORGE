"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  linkRepositoryAction,
  listLinkedRepositoryAction,
  listSyncedIssuesAction,
  unlinkRepositoryAction,
  type LinkedRepository,
  type SyncedIssueSummary,
} from "@/features/github/actions";
import { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";
import { useWorkspace } from "@/features/organizations/workspace-provider";

const DEMO_REPO_KEY = "hubforge.demo.github.repo.v1";
const DEMO_ISSUES_KEY = "hubforge.demo.github.issues.v1";

type DemoRepo = LinkedRepository & { projectId: string };

function loadDemoRepo(projectId: string): LinkedRepository | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_REPO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoRepo[];
    return parsed.find((item) => item.projectId === projectId) ?? null;
  } catch {
    return null;
  }
}

function saveDemoRepo(repo: DemoRepo | null, projectId: string) {
  const raw = window.localStorage.getItem(DEMO_REPO_KEY);
  const current = raw ? (JSON.parse(raw) as DemoRepo[]) : [];
  const next = current.filter((item) => item.projectId !== projectId);
  if (repo) next.push(repo);
  window.localStorage.setItem(DEMO_REPO_KEY, JSON.stringify(next));
}

function loadDemoIssues(projectId: string): SyncedIssueSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_ISSUES_KEY);
    if (!raw) return defaultDemoIssues(projectId);
    const parsed = JSON.parse(raw) as Array<SyncedIssueSummary & { projectId: string }>;
    const filtered = parsed.filter((item) => item.projectId === projectId);
    return filtered.length > 0 ? filtered : defaultDemoIssues(projectId);
  } catch {
    return defaultDemoIssues(projectId);
  }
}

function defaultDemoIssues(projectId: string): SyncedIssueSummary[] {
  return [
    {
      id: `gh_${projectId}_1`,
      number: 12,
      title: "Wire GitHub App webhooks",
      state: "open",
      htmlUrl: "https://github.com/example/hubforge/issues/12",
      origin: "github",
    },
    {
      id: `gh_${projectId}_2`,
      number: 9,
      title: "Map issues into HubForge tasks",
      state: "closed",
      htmlUrl: "https://github.com/example/hubforge/issues/9",
      origin: "github",
    },
  ];
}

function saveDemoIssues(projectId: string, issues: SyncedIssueSummary[]) {
  const raw = window.localStorage.getItem(DEMO_ISSUES_KEY);
  const current = raw
    ? (JSON.parse(raw) as Array<SyncedIssueSummary & { projectId: string }>)
    : [];
  const next = [
    ...current.filter((item) => item.projectId !== projectId),
    ...issues.map((issue) => ({ ...issue, projectId })),
  ];
  window.localStorage.setItem(DEMO_ISSUES_KEY, JSON.stringify(next));
}

export function GitHubSyncPanel({
  labels,
  appConfigured,
  installUrl,
}: {
  labels: {
    title: string;
    subtitle: string;
    link: string;
    unlink: string;
    repo: string;
    installationId: string;
    emptyProject: string;
    emptyRepo: string;
    syncedIssues: string;
    setupHint: string;
    demoHint: string;
  };
  appConfigured: boolean;
  installUrl: string | null;
}) {
  const { mode, activeOrganization, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [demoTick, setDemoTick] = useState(0);
  const [repo, setRepo] = useState<LinkedRepository | null>(null);
  const [issues, setIssues] = useState<SyncedIssueSummary[]>([]);
  const [fullName, setFullName] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const demoRepo = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !projectId) return null;
    return loadDemoRepo(projectId);
  }, [mode, projectId, demoTick]);

  const demoIssues = useMemo(() => {
    void demoTick;
    if (mode !== "demo" || !projectId) return [];
    return loadDemoIssues(projectId);
  }, [mode, projectId, demoTick]);

  const linked = mode === "demo" ? demoRepo : repo;
  const synced = mode === "demo" ? demoIssues : issues;

  useEffect(() => {
    if (mode !== "live" || !projectId) return;
    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listLinkedRepositoryAction(projectId),
        listSyncedIssuesAction(projectId),
      ]).then(([repoResult, issuesResult]) => {
        if (cancelled) return;
        if (repoResult.ok) setRepo(repoResult.data);
        else setError(repoResult.error);
        if (issuesResult.ok) setIssues(issuesResult.data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [mode, projectId]);

  function linkRepo() {
    if (!projectId || !organizationId) return;
    setError(null);
    const normalized = normalizeRepoFullName(fullName);
    if (!isValidRepoFullName(normalized)) {
      setError("Use owner/repo format.");
      return;
    }

    if (mode === "demo") {
      const next: DemoRepo = {
        id: `repo_${crypto.randomUUID().slice(0, 8)}`,
        projectId,
        organizationId,
        fullName: normalized,
        htmlUrl: `https://github.com/${normalized}`,
        installationId: installationId ? Number(installationId) : null,
      };
      saveDemoRepo(next, projectId);
      saveDemoIssues(projectId, defaultDemoIssues(projectId));
      setDemoTick((value) => value + 1);
      setFullName("");
      return;
    }

    startTransition(() => {
      void linkRepositoryAction({
        projectId,
        organizationId,
        fullName: normalized,
        installationId,
      }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRepo(result.data);
        setFullName("");
      });
    });
  }

  function unlinkRepo() {
    if (!projectId) return;
    setError(null);
    if (mode === "demo") {
      saveDemoRepo(null, projectId);
      setDemoTick((value) => value + 1);
      return;
    }
    startTransition(() => {
      void unlinkRepositoryAction(projectId).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRepo(null);
        setIssues([]);
      });
    });
  }

  if (!projectId) {
    return (
      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-[var(--hf-fg-muted)]">{labels.emptyProject}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-[var(--hf-fg-muted)]">{labels.subtitle}</p>
        <p className="text-xs text-[var(--hf-fg-muted)]">
          {mode === "demo" ? labels.demoHint : labels.setupHint}
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--hf-danger)]">{error}</p> : null}

      {installUrl && mode === "live" ? (
        <p className="text-sm">
          <a
            href={installUrl}
            className="font-medium text-[var(--hf-brand)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Install GitHub App
          </a>
          {!appConfigured ? " (configure env vars first)" : null}
        </p>
      ) : null}

      {linked ? (
        <section className="space-y-4 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={linked.htmlUrl}
              className="font-medium text-[var(--hf-brand)] underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {linked.fullName}
            </a>
            <Badge tone="brand">linked</Badge>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={unlinkRepo}
          >
            {labels.unlink}
          </Button>
        </section>
      ) : (
        <form
          className="grid max-w-xl gap-3 rounded-2xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            linkRepo();
          }}
        >
          <p className="text-sm text-[var(--hf-fg-muted)]">{labels.emptyRepo}</p>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">{labels.repo}</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="owner/repo"
              className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
              required
              disabled={pending}
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">{labels.installationId}</span>
            <input
              value={installationId}
              onChange={(event) => setInstallationId(event.target.value)}
              placeholder="optional"
              className="h-11 w-full rounded-md border border-[var(--hf-border)] bg-[var(--hf-bg)] px-3"
              disabled={pending}
            />
          </label>
          <Button type="submit" disabled={pending}>
            {labels.link}
          </Button>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {labels.syncedIssues}
        </h2>
        {synced.length === 0 ? (
          <p className="text-sm text-[var(--hf-fg-muted)]">{labels.emptyRepo}</p>
        ) : (
          <ul className="space-y-2">
            {synced.map((issue) => (
              <li
                key={issue.id}
                className="rounded-xl border border-[var(--hf-border)] bg-[var(--hf-surface)] p-4"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <a
                    href={issue.htmlUrl}
                    className="font-medium underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{issue.number} {issue.title}
                  </a>
                  <Badge tone={issue.state === "open" ? "success" : "neutral"}>
                    {issue.state}
                  </Badge>
                  <Badge>{issue.origin}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
