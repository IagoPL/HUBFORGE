-- Profiles foundation for HubForge authentication.
-- Apply with Supabase CLI / dashboard after creating the project.
-- Access roles for organizations come in a later migration.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  github_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by the owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by the owner"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles are updatable by the owner"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, github_username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name'
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      github_username = excluded.github_username,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
