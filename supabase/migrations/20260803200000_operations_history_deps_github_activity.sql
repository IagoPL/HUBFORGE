-- Task history, dependencies, last-visit windows, and GitHub PR/commit activity.

create table public.task_dependencies (
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  constraint task_dependencies_no_self check (task_id <> depends_on_task_id)
);

create index task_dependencies_depends_on_idx
  on public.task_dependencies (depends_on_task_id);

create type public.task_event_kind as enum (
  'created',
  'status_changed',
  'priority_changed',
  'title_changed',
  'description_changed',
  'assignees_changed',
  'dependency_added',
  'dependency_removed'
);

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  kind public.task_event_kind not null,
  summary text not null default '',
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

create index task_events_project_created_idx
  on public.task_events (project_id, created_at desc);

create index task_events_task_created_idx
  on public.task_events (task_id, created_at desc);

create table public.project_visits (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_visited_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.github_synced_pull_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  repository_id uuid not null references public.project_repositories (id) on delete cascade,
  github_pull_request_id bigint not null,
  number integer not null,
  title text not null,
  state text not null check (state in ('open', 'closed')),
  merged boolean not null default false,
  html_url text not null default '',
  author_login text not null default '',
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_synced_prs_repo_pr_unique unique (repository_id, github_pull_request_id)
);

create index github_synced_prs_project_id_idx
  on public.github_synced_pull_requests (project_id);

create table public.github_synced_commits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  repository_id uuid not null references public.project_repositories (id) on delete cascade,
  sha text not null,
  message text not null default '',
  html_url text not null default '',
  author_login text not null default '',
  committed_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint github_synced_commits_repo_sha_unique unique (repository_id, sha)
);

create index github_synced_commits_project_id_idx
  on public.github_synced_commits (project_id, committed_at desc nulls last);

alter table public.task_dependencies enable row level security;
alter table public.task_events enable row level security;
alter table public.project_visits enable row level security;
alter table public.github_synced_pull_requests enable row level security;
alter table public.github_synced_commits enable row level security;

create policy "Members can view task dependencies"
  on public.task_dependencies
  for select
  to authenticated
  using (public.is_project_member(public.task_project_id(task_id)));

create policy "Non-guest members can manage task dependencies"
  on public.task_dependencies
  for all
  to authenticated
  using (
    public.has_project_org_role(
      public.task_project_id(task_id),
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead',
        'member'
      ]::public.access_role[]
    )
  )
  with check (
    public.has_project_org_role(
      public.task_project_id(task_id),
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead',
        'member'
      ]::public.access_role[]
    )
    and public.task_project_id(task_id) = public.task_project_id(depends_on_task_id)
  );

create policy "Members can view task events"
  on public.task_events
  for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "Members can insert task events in their projects"
  on public.task_events
  for insert
  to authenticated
  with check (
    auth.uid() = actor_id
    and public.has_project_org_role(
      project_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead',
        'member'
      ]::public.access_role[]
    )
  );

create policy "Members can view their project visits"
  on public.project_visits
  for select
  to authenticated
  using (auth.uid() = user_id and public.is_project_member(project_id));

create policy "Members can upsert their project visits"
  on public.project_visits
  for insert
  to authenticated
  with check (auth.uid() = user_id and public.is_project_member(project_id));

create policy "Members can update their project visits"
  on public.project_visits
  for update
  to authenticated
  using (auth.uid() = user_id and public.is_project_member(project_id))
  with check (auth.uid() = user_id and public.is_project_member(project_id));

create policy "Members can view synced pull requests"
  on public.github_synced_pull_requests
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can view synced commits"
  on public.github_synced_commits
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Service role (webhooks) bypasses RLS; no insert policies for authenticated on GH activity.
