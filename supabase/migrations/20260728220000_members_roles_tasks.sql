-- Invitations, tasks, and assignees bound to organization membership via RLS.

create type public.task_status as enum (
  'backlog',
  'ready',
  'in_progress',
  'review',
  'done'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high'
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  access_role public.access_role not null default 'member',
  functional_role text not null default '',
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create unique index organization_invitations_pending_email_idx
  on public.organization_invitations (organization_id, lower(email))
  where status = 'pending';

create index organization_invitations_email_idx
  on public.organization_invitations (lower(email));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'medium',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_project_status_idx on public.tasks (project_id, status);

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index task_assignees_user_id_idx on public.task_assignees (user_id);

create or replace function public.project_organization_id(project uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.projects p
  where p.id = project;
$$;

create or replace function public.is_project_member(project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_org_member(public.project_organization_id(project));
$$;

create or replace function public.has_project_org_role(project uuid, allowed public.access_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(public.project_organization_id(project), allowed);
$$;

create or replace function public.task_project_id(task uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.project_id from public.tasks t where t.id = task;
$$;

revoke all on function public.project_organization_id(uuid) from public, anon;
revoke all on function public.is_project_member(uuid) from public, anon;
revoke all on function public.has_project_org_role(uuid, public.access_role[]) from public, anon;
revoke all on function public.task_project_id(uuid) from public, anon;
grant execute on function public.project_organization_id(uuid) to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.has_project_org_role(uuid, public.access_role[]) to authenticated;
grant execute on function public.task_project_id(uuid) to authenticated;

alter table public.organization_invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

create policy "Members can view invitations in their orgs"
  on public.organization_invitations
  for select
  to authenticated
  using (
    public.is_org_member(organization_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Owners and admins can create invitations"
  on public.organization_invitations
  for insert
  to authenticated
  with check (
    auth.uid() = invited_by
    and public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Owners and admins can update invitations"
  on public.organization_invitations
  for update
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Members can view tasks in their projects"
  on public.tasks
  for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "Non-guest members can create tasks"
  on public.tasks
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
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

create policy "Non-guest members can update tasks"
  on public.tasks
  for update
  to authenticated
  using (
    public.has_project_org_role(
      project_id,
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

create policy "Managers and above can delete tasks"
  on public.tasks
  for delete
  to authenticated
  using (
    public.has_project_org_role(
      project_id,
      array[
        'organization_owner',
        'organization_admin',
        'project_manager',
        'project_lead'
      ]::public.access_role[]
    )
  );

create policy "Members can view task assignees"
  on public.task_assignees
  for select
  to authenticated
  using (public.is_project_member(public.task_project_id(task_id)));

create policy "Non-guest members can assign tasks"
  on public.task_assignees
  for insert
  to authenticated
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
  );

create policy "Non-guest members can unassign tasks"
  on public.task_assignees
  for delete
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
  );

create or replace function public.accept_organization_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.organization_invitations%rowtype;
  uid uuid := auth.uid();
  user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.organization_invitations
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(inv.email) <> user_email then
    raise exception 'Invitation email mismatch';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    access_role,
    functional_role
  )
  values (
    inv.organization_id,
    uid,
    inv.access_role,
    inv.functional_role
  )
  on conflict (organization_id, user_id) do update
    set
      access_role = excluded.access_role,
      functional_role = excluded.functional_role;

  update public.organization_invitations
  set status = 'accepted'
  where id = inv.id;

  return inv.organization_id;
end;
$$;

revoke all on function public.accept_organization_invitation(text) from public, anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;

create or replace function public.shares_organization_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and them.user_id = target
  );
$$;

revoke all on function public.shares_organization_with(uuid) from public, anon;
grant execute on function public.shares_organization_with(uuid) to authenticated;

drop policy if exists "Profiles are viewable by the owner" on public.profiles;

create policy "Profiles are viewable by owner or org peers"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.shares_organization_with(id)
  );
