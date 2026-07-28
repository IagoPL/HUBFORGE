-- GitHub App installations, linked repositories, synced issues, webhook idempotency.

create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  installation_id bigint not null unique,
  account_login text not null,
  account_type text not null default 'Organization'
    check (account_type in ('Organization', 'User')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index github_installations_org_id_idx
  on public.github_installations (organization_id);

create table public.project_repositories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  installation_id bigint references public.github_installations (installation_id) on delete set null,
  github_repo_id bigint,
  full_name text not null,
  default_branch text not null default 'main',
  html_url text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_repositories_full_name_format
    check (full_name ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  constraint project_repositories_project_unique unique (project_id),
  constraint project_repositories_full_name_unique unique (full_name)
);

create index project_repositories_org_id_idx
  on public.project_repositories (organization_id);

create table public.github_synced_issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  repository_id uuid not null references public.project_repositories (id) on delete cascade,
  github_issue_id bigint not null,
  number integer not null,
  title text not null,
  state text not null check (state in ('open', 'closed')),
  html_url text not null default '',
  origin text not null default 'github' check (origin in ('github', 'hubforge')),
  task_id uuid references public.tasks (id) on delete set null,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_synced_issues_repo_issue_unique unique (repository_id, github_issue_id)
);

create index github_synced_issues_project_id_idx
  on public.github_synced_issues (project_id);

create table public.github_webhook_deliveries (
  delivery_id text primary key,
  event text not null,
  action text,
  installation_id bigint,
  repository_full_name text,
  processed_at timestamptz not null default now(),
  payload_digest text not null default ''
);

alter table public.github_installations enable row level security;
alter table public.project_repositories enable row level security;
alter table public.github_synced_issues enable row level security;
alter table public.github_webhook_deliveries enable row level security;

create policy "Members can view github installations"
  on public.github_installations
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can manage github installations"
  on public.github_installations
  for all
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  )
  with check (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Members can view linked repositories"
  on public.project_repositories
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Managers and above can link repositories"
  on public.project_repositories
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and public.has_org_role(
      organization_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead'
      ]::public.access_role[]
    )
  );

create policy "Managers and above can update repositories"
  on public.project_repositories
  for update
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead'
      ]::public.access_role[]
    )
  )
  with check (
    public.has_org_role(
      organization_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead'
      ]::public.access_role[]
    )
  );

create policy "Owners and admins can unlink repositories"
  on public.project_repositories
  for delete
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Members can view synced issues"
  on public.github_synced_issues
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Non-guest members can upsert synced issues"
  on public.github_synced_issues
  for all
  to authenticated
  using (
    public.has_org_role(
      organization_id,
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
    public.has_org_role(
      organization_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead',
        'member'
      ]::public.access_role[]
    )
  );

-- Webhook deliveries are written with the service role; no authenticated policies.
