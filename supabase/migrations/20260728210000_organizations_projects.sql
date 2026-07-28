-- Organizations, membership, and projects with multi-tenant RLS.
-- Requires auth.users. Profiles migration is independent but recommended first for app UX.

create type public.access_role as enum (
  'organization_owner',
  'organization_admin',
  'project_manager',
  'project_lead',
  'member',
  'guest'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_slug_unique unique (slug)
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  access_role public.access_role not null default 'member',
  functional_role text not null default '',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
  on public.organization_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null,
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'archived')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint projects_org_slug_unique unique (organization_id, slug)
);

create index projects_organization_id_idx
  on public.projects (organization_id);

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed public.access_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.access_role = any (allowed)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.access_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.access_role[]) to authenticated;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (
    organization_id,
    user_id,
    access_role,
    functional_role
  )
  values (
    new.id,
    coalesce(new.created_by, auth.uid()),
    'organization_owner',
    'Owner'
  );
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row
  execute function public.handle_new_organization();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

create policy "Members can view their organizations"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "Authenticated users can create organizations"
  on public.organizations
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Owners and admins can update organizations"
  on public.organizations
  for update
  to authenticated
  using (
    public.has_org_role(
      id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  )
  with check (
    public.has_org_role(
      id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Owners can delete organizations"
  on public.organizations
  for delete
  to authenticated
  using (
    public.has_org_role(
      id,
      array['organization_owner']::public.access_role[]
    )
  );

create policy "Members can view organization membership"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can add members"
  on public.organization_members
  for insert
  to authenticated
  with check (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Owners and admins can update members"
  on public.organization_members
  for update
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

create policy "Owners and admins can remove members"
  on public.organization_members
  for delete
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

create policy "Members can view projects in their organizations"
  on public.projects
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Non-guest members can create projects"
  on public.projects
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
        'project_lead',
        'member'
      ]::public.access_role[]
    )
  );

create policy "Managers and above can update projects"
  on public.projects
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

create policy "Owners and admins can delete projects"
  on public.projects
  for delete
  to authenticated
  using (
    public.has_org_role(
      organization_id,
      array['organization_owner', 'organization_admin']::public.access_role[]
    )
  );

revoke all on function public.handle_new_organization() from public;
revoke all on function public.handle_new_organization() from anon, authenticated;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_member(uuid) from anon;
grant execute on function public.is_org_member(uuid) to authenticated;

revoke all on function public.has_org_role(uuid, public.access_role[]) from public;
revoke all on function public.has_org_role(uuid, public.access_role[]) from anon;
grant execute on function public.has_org_role(uuid, public.access_role[]) to authenticated;
