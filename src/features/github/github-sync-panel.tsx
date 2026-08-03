"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  linkRepositoryAction,
  listLinkedRepositoryAction,
  listSyncedCommitsAction,
  listSyncedIssuesAction,
  listSyncedPullRequestsAction,
  unlinkRepositoryAction,
  type LinkedRepository,
  type SyncedCommitSummary,
  type SyncedIssueSummary,
  type SyncedPullRequestSummary,
} from "@/features/github/actions";
import { isValidRepoFullName, normalizeRepoFullName } from "@/features/github/repo-utils";
import { useWorkspace } from "@/features/organizations/workspace-provider";

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
    syncedPullRequests: string;
    syncedCommits: string;
    recentActivity: string;
    setupHint: string;
    install: string;
    repoFormat: string;
  };
  appConfigured: boolean;
  installUrl: string | null;
}) {
  const { activeOrganization, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [repo, setRepo] = useState<LinkedRepository | null>(null);
  const [issues, setIssues] = useState<SyncedIssueSummary[]>([]);
  const [pullRequests, setPullRequests] = useState<SyncedPullRequestSummary[]>([]);
  const [commits, setCommits] = useState<SyncedCommitSummary[]>([]);
  const [fullName, setFullName] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const installHref =
    installUrl && organizationId
      ? `${installUrl}${installUrl.includes("?") ? "&" : "?"}state=${encodeURIComponent(organizationId)}`
      : installUrl;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    startTransition(() => {
      void Promise.all([
        listLinkedRepositoryAction(projectId),
        listSyncedIssuesAction(projectId),
        listSyncedPullRequestsAction(projectId),
        listSyncedCommitsAction(projectId),
      ]).then(([repoResult, issuesResult, prsResult, commitsResult]) => {
        if (cancelled) return;
        if (repoResult.ok) setRepo(repoResult.data);
        else setError(repoResult.error);
        if (issuesResult.ok) setIssues(issuesResult.data);
        if (prsResult.ok) setPullRequests(prsResult.data);
        if (commitsResult.ok) setCommits(commitsResult.data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function linkRepo() {
    if (!projectId || !organizationId) return;
    setError(null);
    const normalized = normalizeRepoFullName(fullName);
    if (!isValidRepoFullName(normalized)) {
      setError(labels.repoFormat);
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
    startTransition(() => {
      void unlinkRepositoryAction(projectId).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRepo(null);
        setIssues([]);
        setPullRequests([]);
        setCommits([]);
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
        <p className="t-body-sm text-[var(--hf-ink-faint)]">{labels.setupHint}</p>
      </div>

      {error ? (
        <p role="alert" className="t-body-sm text-[var(--hf-error)]">
          {error}
        </p>
      ) : null}

      {installHref ? (
        <p className="t-body">
          <a
            href={installHref}
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

      {repo ? (
        <section className="panel flex flex-wrap items-center gap-3 p-4">
          <a
            href={repo.htmlUrl}
            className="t-mono font-medium text-[var(--hf-accent)] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            {repo.fullName}
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

      <section aria-labelledby="activity-heading" className="grid gap-4">
        <h2 id="activity-heading" className="t-display-sm text-[var(--hf-ink)]">
          {labels.recentActivity}
        </h2>

        <div className="grid gap-2">
          <h3 className="t-label text-[var(--hf-ink-faint)]">{labels.syncedIssues}</h3>
          {issues.length === 0 ? (
            <p className="t-body text-[var(--hf-ink-muted)]">{labels.emptyRepo}</p>
          ) : (
            <ul className="grid gap-2">
              {issues.map((issue) => (
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
        </div>

        <div className="grid gap-2">
          <h3 className="t-label text-[var(--hf-ink-faint)]">
            {labels.syncedPullRequests}
          </h3>
          {pullRequests.length === 0 ? (
            <p className="t-body-sm text-[var(--hf-ink-muted)]">{labels.emptyRepo}</p>
          ) : (
            <ul className="grid gap-2">
              {pullRequests.map((pr) => (
                <li
                  key={pr.id}
                  className="panel flex flex-wrap items-center gap-x-3 gap-y-1 p-3"
                >
                  <span className="t-mono-sm text-[var(--hf-ink-faint)]" data-tabular>
                    #{pr.number}
                  </span>
                  <a
                    href={pr.htmlUrl}
                    className="t-body min-w-0 flex-1 font-medium text-[var(--hf-ink)] underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {pr.title}
                  </a>
                  <Badge tone={pr.merged ? "success" : "neutral"}>
                    {pr.merged ? "merged" : pr.state}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-2">
          <h3 className="t-label text-[var(--hf-ink-faint)]">{labels.syncedCommits}</h3>
          {commits.length === 0 ? (
            <p className="t-body-sm text-[var(--hf-ink-muted)]">{labels.emptyRepo}</p>
          ) : (
            <ul className="grid gap-2">
              {commits.map((commit) => (
                <li
                  key={commit.id}
                  className="panel flex flex-wrap items-center gap-x-3 gap-y-1 p-3"
                >
                  <span className="t-mono-sm text-[var(--hf-ink-faint)]">
                    {commit.sha.slice(0, 7)}
                  </span>
                  <a
                    href={commit.htmlUrl}
                    className="t-body min-w-0 flex-1 truncate text-[var(--hf-ink)] underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {commit.message || commit.sha}
                  </a>
                  <span className="t-mono-sm text-[var(--hf-ink-faint)]">
                    {commit.authorLogin}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
