-- Allow authenticated users to create an organization + owner membership atomically.
-- Avoids RLS edge cases on INSERT ... RETURNING when membership is added by trigger.

create or replace function public.create_organization(org_name text, org_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  cleaned_name text := trim(org_name);
  cleaned_slug text := trim(org_slug);
  created public.organizations;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if cleaned_name is null or char_length(cleaned_name) = 0 then
    raise exception 'Organization name is required';
  end if;

  if cleaned_slug is null or cleaned_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organization slug';
  end if;

  if exists (select 1 from public.organizations o where o.slug = cleaned_slug) then
    raise exception 'Organization slug already exists';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (cleaned_name, cleaned_slug, me)
  returning * into created;

  return created;
end;
$$;

revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

-- Ensure bootstrap membership trigger bypasses member-insert RLS.
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
  )
  on conflict do nothing;
  return new;
end;
$$;
