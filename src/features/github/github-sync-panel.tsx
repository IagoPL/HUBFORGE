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
    install: string;
    repoFormat: string;
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
      setError(labels.repoFormat);
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
      <div className="px-4 py-5 sm:px-6">
        <p className="lead">{labels.emptyProject}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 px-4 py-5 sm:px-6">
      <div className="grid gap-1">
        <p className="lead">{labels.subtitle}</p>
        <p className="t-body-sm text-[var(--hf-ink-faint)]">
          {mode === "demo" ? labels.demoHint : labels.setupHint}
        </p>
      </div>

      {error ? (
        <p role="alert" className="t-body-sm text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}

      {installUrl && mode === "live" ? (
        <p className="t-body">
          <a
            href={installUrl}
            className="font-medium text-[var(--hf-accent)] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            {labels.install}
          </a>
          {!appConfigured ? (
            <span className="text-[var(--hf-ink-faint)]"> — {labels.setupHint}</span>
          ) : null}
        </p>
      ) : null}

      {linked ? (
        <section className="panel flex flex-wrap items-center gap-3 p-4">
          <a
            href={linked.htmlUrl}
            className="t-mono font-medium text-[var(--hf-accent)] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            {linked.fullName}
          </a>
          <Badge tone="brand">linked</Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={unlinkRepo}
            className="ml-auto"
          >
            {labels.unlink}
          </Button>
        </section>
      ) : (
        <form
          className="panel grid max-w-xl gap-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            linkRepo();
          }}
        >
          <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyRepo}</p>
          <label className="grid gap-1.5">
            <span className="t-body-sm font-medium text-[var(--hf-ink)]">
              {labels.repo}
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="owner/repo"
              className="input font-[family-name:var(--font-mono)]"
              required
              disabled={pending}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="t-body-sm font-medium text-[var(--hf-ink)]">
              {labels.installationId}
            </span>
            <input
              value={installationId}
              onChange={(event) => setInstallationId(event.target.value)}
              placeholder="optional"
              className="input font-[family-name:var(--font-mono)]"
              disabled={pending}
            />
          </label>
          <Button type="submit" disabled={pending} className="justify-self-start">
            {labels.link}
          </Button>
        </form>
      )}

      <section aria-labelledby="synced-heading" className="grid gap-2">
        <h2 id="synced-heading" className="t-display-sm text-[var(--hf-ink)]">
          {labels.syncedIssues}
        </h2>
        {synced.length === 0 ? (
          <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyRepo}</p>
        ) : (
          <ul className="grid gap-2">
            {synced.map((issue) => (
              <li
                key={issue.id}
                className="panel flex flex-wrap items-center gap-x-3 gap-y-1 p-3"
              >
                <span
                  className="t-mono-sm shrink-0 text-[var(--hf-ink-faint)]"
                  data-tabular
                >
                  #{issue.number}
                </span>
                <a
                  href={issue.htmlUrl}
                  className="t-body min-w-0 flex-1 font-medium text-[var(--hf-ink)] underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {issue.title}
                </a>
                <Badge tone={issue.state === "open" ? "success" : "neutral"}>
                  {issue.state}
                </Badge>
                <Badge>{issue.origin}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
