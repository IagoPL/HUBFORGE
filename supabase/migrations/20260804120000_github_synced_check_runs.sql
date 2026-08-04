-- Additive: store GitHub check runs for CI failure evidence.
-- Safe to apply forward; does not alter chat or existing synced tables.
-- Rollback: drop table public.github_synced_check_runs;

create table public.github_synced_check_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  repository_id uuid not null references public.project_repositories (id) on delete cascade,
  github_check_run_id bigint not null,
  name text not null default '',
  status text not null check (status in ('queued', 'in_progress', 'completed')),
  conclusion text check (
    conclusion is null
    or conclusion in (
      'success',
      'failure',
      'neutral',
      'cancelled',
      'skipped',
      'timed_out',
      'action_required'
    )
  ),
  html_url text,
  head_sha text,
  pull_request_id uuid references public.github_synced_pull_requests (id) on delete set null,
  completed_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_synced_check_runs_repo_check_unique unique (repository_id, github_check_run_id)
);

create index github_synced_check_runs_project_id_idx
  on public.github_synced_check_runs (project_id, completed_at desc nulls last);

alter table public.github_synced_check_runs enable row level security;

create policy "Members can view synced check runs"
  on public.github_synced_check_runs
  for select
  to authenticated
  using (public.is_project_member(project_id));

-- Writes remain service-role / webhook path only (no insert policy for authenticated).
