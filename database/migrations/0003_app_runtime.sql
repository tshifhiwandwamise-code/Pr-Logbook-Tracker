-- 0003_app_runtime.sql
-- Phase 6 / sub-phase 3 — runtime helpers and remaining RLS policies needed
-- by the user-facing app (onboarding, member management, storage policies).

set search_path = public, extensions;

-- create_workspace_for_user: atomic workspace + owner-membership creation.
-- SECURITY DEFINER so the workspace_members INSERT bypasses the (otherwise
-- chicken-and-egg) requirement that you must already be a member to insert.
create or replace function public.create_workspace_for_user(
  p_name text,
  p_default_track registration_track_type default 'ECSA'
) returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if length(trim(p_name)) < 2 then raise exception 'workspace name too short'; end if;

  insert into workspaces (owner_user_id, workspace_name, default_registration_track)
  values (auth.uid(), trim(p_name), p_default_track)
  returning id into v_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end;
$$;
grant execute on function public.create_workspace_for_user(text, registration_track_type) to authenticated;

comment on function public.create_workspace_for_user(text, registration_track_type) is
  'Onboarding RPC. SECURITY DEFINER required to atomically insert workspace
   and founding owner-membership.';

-- Workspace owner can update/delete; members can be managed
drop policy if exists ws_update on public.workspaces;
create policy ws_update on public.workspaces for update
  using (has_workspace_role(id, array['owner']::workspace_role[]))
  with check (has_workspace_role(id, array['owner']::workspace_role[]));

drop policy if exists ws_delete on public.workspaces;
create policy ws_delete on public.workspaces for delete
  using (has_workspace_role(id, array['owner']::workspace_role[]));

drop policy if exists wm_owner_write on public.workspace_members;
create policy wm_owner_write on public.workspace_members for insert
  with check (has_workspace_role(workspace_id, array['owner']::workspace_role[]));

drop policy if exists wm_owner_update on public.workspace_members;
create policy wm_owner_update on public.workspace_members for update
  using (has_workspace_role(workspace_id, array['owner']::workspace_role[]))
  with check (has_workspace_role(workspace_id, array['owner']::workspace_role[]));

drop policy if exists wm_owner_delete on public.workspace_members;
create policy wm_owner_delete on public.workspace_members for delete
  using (has_workspace_role(workspace_id, array['owner']::workspace_role[]));

-- Storage object policies — workspace_id is the first path segment.
drop policy if exists "ws_storage_read" on storage.objects;
create policy "ws_storage_read" on storage.objects for select using (
  bucket_id in ('evidence','reports','avatars')
  and has_workspace_role((split_part(name,'/',1))::uuid, array['owner','editor','viewer']::workspace_role[])
);

drop policy if exists "ws_storage_write" on storage.objects;
create policy "ws_storage_write" on storage.objects for insert with check (
  bucket_id in ('evidence','reports','avatars')
  and has_workspace_role((split_part(name,'/',1))::uuid, array['owner','editor']::workspace_role[])
);

drop policy if exists "ws_storage_delete" on storage.objects;
create policy "ws_storage_delete" on storage.objects for delete using (
  bucket_id in ('evidence','reports','avatars')
  and has_workspace_role((split_part(name,'/',1))::uuid, array['owner']::workspace_role[])
);
