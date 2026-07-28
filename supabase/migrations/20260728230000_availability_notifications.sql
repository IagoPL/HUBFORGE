-- Availability windows and internal notifications.

create type public.availability_kind as enum (
  'available',
  'busy',
  'unavailable'
);

create table public.availability_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  kind public.availability_kind not null default 'unavailable',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_entries_range_check check (ends_at > starts_at)
);

create index availability_entries_org_starts_idx
  on public.availability_entries (organization_id, starts_at);

create index availability_entries_user_id_idx
  on public.availability_entries (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_org_id_idx
  on public.notifications (organization_id);

alter table public.availability_entries enable row level security;
alter table public.notifications enable row level security;

create policy "Members can view org availability"
  on public.availability_entries
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create their own availability"
  on public.availability_entries
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_org_member(organization_id)
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

create policy "Members can update their own availability"
  on public.availability_entries
  for update
  to authenticated
  using (auth.uid() = user_id and public.is_org_member(organization_id))
  with check (auth.uid() = user_id and public.is_org_member(organization_id));

create policy "Members can delete their own availability"
  on public.availability_entries
  for delete
  to authenticated
  using (auth.uid() = user_id and public.is_org_member(organization_id));

create policy "Users can view their notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Org members can create notifications for peers"
  on public.notifications
  for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.shares_organization_with(user_id)
  );

create policy "Users can update their notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their notifications"
  on public.notifications
  for delete
  to authenticated
  using (auth.uid() = user_id);
