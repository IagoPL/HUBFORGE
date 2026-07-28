-- Project channels, optional DMs, plain-text messages, Realtime-ready RLS.

create type public.chat_channel_kind as enum ('project', 'direct');

create table public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind public.chat_channel_kind not null default 'project',
  name text not null check (char_length(trim(name)) > 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_channels_project_kind_check check (
    (kind = 'project' and project_id is not null)
    or (kind = 'direct' and project_id is null)
  )
);

create unique index chat_channels_project_name_unique
  on public.chat_channels (project_id, lower(name))
  where kind = 'project';

create index chat_channels_org_id_idx on public.chat_channels (organization_id);

create table public.chat_channel_members (
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index chat_channel_members_user_id_idx
  on public.chat_channel_members (user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index chat_messages_channel_created_idx
  on public.chat_messages (channel_id, created_at);

create or replace function public.is_chat_channel_member(channel uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_channel_members m
    where m.channel_id = channel
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.chat_channel_organization_id(channel uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.organization_id from public.chat_channels c where c.id = channel;
$$;

revoke all on function public.is_chat_channel_member(uuid) from public, anon;
revoke all on function public.chat_channel_organization_id(uuid) from public, anon;
grant execute on function public.is_chat_channel_member(uuid) to authenticated;
grant execute on function public.chat_channel_organization_id(uuid) to authenticated;

create or replace function public.handle_new_project_chat_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  channel_id uuid;
  member record;
begin
  insert into public.chat_channels (
    organization_id,
    project_id,
    kind,
    name,
    created_by
  )
  values (
    new.organization_id,
    new.id,
    'project',
    'general',
    new.created_by
  )
  returning id into channel_id;

  for member in
    select user_id
    from public.organization_members
    where organization_id = new.organization_id
  loop
    insert into public.chat_channel_members (channel_id, user_id)
    values (channel_id, member.user_id)
    on conflict do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_project_created_chat_channel on public.projects;
create trigger on_project_created_chat_channel
  after insert on public.projects
  for each row
  execute function public.handle_new_project_chat_channel();

create or replace function public.handle_org_member_join_project_channels()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chat_channel_members (channel_id, user_id)
  select c.id, new.user_id
  from public.chat_channels c
  where c.organization_id = new.organization_id
    and c.kind = 'project'
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_member_join_chat on public.organization_members;
create trigger on_org_member_join_chat
  after insert on public.organization_members
  for each row
  execute function public.handle_org_member_join_project_channels();

revoke all on function public.handle_new_project_chat_channel() from public, anon, authenticated;
revoke all on function public.handle_org_member_join_project_channels() from public, anon, authenticated;

alter table public.chat_channels enable row level security;
alter table public.chat_channel_members enable row level security;
alter table public.chat_messages enable row level security;

create policy "Members can view their chat channels"
  on public.chat_channels
  for select
  to authenticated
  using (public.is_chat_channel_member(id));

create policy "Non-guest members can create project channels"
  on public.chat_channels
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

create policy "Members can view channel membership"
  on public.chat_channel_members
  for select
  to authenticated
  using (public.is_chat_channel_member(channel_id));

create policy "Users can join themselves when invited by policy"
  on public.chat_channel_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_org_member(public.chat_channel_organization_id(channel_id))
  );

create policy "Members can read channel messages"
  on public.chat_messages
  for select
  to authenticated
  using (public.is_chat_channel_member(channel_id));

create policy "Members can send channel messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and public.is_chat_channel_member(channel_id)
    and organization_id = public.chat_channel_organization_id(channel_id)
  );

-- Realtime: expose messages to authenticated clients under RLS.
alter table public.chat_messages replica identity full;
alter publication supabase_realtime add table public.chat_messages;

create or replace function public.create_direct_chat(org_id uuid, other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  channel_name text;
  channel_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id = me then
    raise exception 'Cannot DM yourself';
  end if;
  if not public.is_org_member(org_id) then
    raise exception 'Not an org member';
  end if;
  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = other_user_id
  ) then
    raise exception 'Peer is not an org member';
  end if;

  channel_name := case when me::text < other_user_id::text
    then me::text || ':' || other_user_id::text
    else other_user_id::text || ':' || me::text end;

  select id into channel_id
  from public.chat_channels
  where organization_id = org_id and kind = 'direct' and name = channel_name;

  if channel_id is null then
    insert into public.chat_channels (organization_id, kind, name, created_by)
    values (org_id, 'direct', channel_name, me)
    returning id into channel_id;

    insert into public.chat_channel_members (channel_id, user_id)
    values (channel_id, me), (channel_id, other_user_id);
  end if;

  return channel_id;
end;
$$;

revoke all on function public.create_direct_chat(uuid, uuid) from public, anon;
grant execute on function public.create_direct_chat(uuid, uuid) to authenticated;
