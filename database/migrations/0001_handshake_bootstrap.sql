-- 0001_handshake_bootstrap.sql
-- Minimum schema required for the Phase 5 handshake test pack.
-- The full 23-table migration is Phase 1 of the production build (see development_phases.md).
-- Safe to re-run: every object uses IF NOT EXISTS / OR REPLACE where Postgres permits.

set search_path = public, extensions;
create extension if not exists pgcrypto;

-- ─── enums ───────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type workspace_role as enum ('owner','editor','viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'registration_track_type') then
    create type registration_track_type as enum ('ECSA','SACPCMP');
  end if;
  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type invite_status as enum ('active','used','expired','revoked');
  end if;
end $$;

-- ─── workspaces + members ────────────────────────────────────────────────────
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  workspace_name text not null,
  default_registration_track registration_track_type not null default 'ECSA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role workspace_role not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ─── permission helper ───────────────────────────────────────────────────────
create or replace function has_workspace_role(ws uuid, required_roles workspace_role[])
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and status = 'active'
      and role = any(required_roles)
  );
$$;

-- ─── evidence (subset for handshakes) ────────────────────────────────────────
create table if not exists evidence_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  uploaded_by uuid not null,
  file_name text not null,
  description text,
  tags text[] not null default '{}',
  storage_path text,
  file_size_bytes bigint,
  checksum_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tsvector search index
create index if not exists evidence_files_search_idx
  on evidence_files
  using gin (to_tsvector('english', coalesce(file_name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')));

-- ─── invite links ────────────────────────────────────────────────────────────
create table if not exists invite_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  invited_by uuid not null,
  invite_token_hash text not null unique,
  role workspace_role not null,
  max_uses int not null default 1,
  uses_count int not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  status invite_status not null default 'active',
  created_at timestamptz not null default now()
);

-- ─── monthly reports + shared links (minimal) ────────────────────────────────
create table if not exists monthly_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  registration_track registration_track_type not null,
  report_title text not null,
  report_status text not null default 'draft',
  version int not null default 1,
  generated_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shared_report_links (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references monthly_reports(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by uuid not null,
  token_hash text not null unique,
  access_type text not null default 'login_required',
  include_annexures boolean not null default false,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table evidence_files enable row level security;
alter table invite_links enable row level security;
alter table monthly_reports enable row level security;
alter table shared_report_links enable row level security;

-- workspaces: read if member
drop policy if exists ws_read on workspaces;
create policy ws_read on workspaces for select
  using ( has_workspace_role(id, array['owner','editor','viewer']::workspace_role[]) );

-- workspace_members: read if member of same workspace
drop policy if exists wm_read on workspace_members;
create policy wm_read on workspace_members for select
  using ( has_workspace_role(workspace_id, array['owner','editor','viewer']::workspace_role[]) );

-- evidence_files: read members, write owner+editor
drop policy if exists ef_read on evidence_files;
create policy ef_read on evidence_files for select
  using ( has_workspace_role(workspace_id, array['owner','editor','viewer']::workspace_role[]) );
drop policy if exists ef_write on evidence_files;
create policy ef_write on evidence_files for insert
  with check ( has_workspace_role(workspace_id, array['owner','editor']::workspace_role[]) );

-- invite_links: owner-only
drop policy if exists il_owner on invite_links;
create policy il_owner on invite_links for all
  using ( has_workspace_role(workspace_id, array['owner']::workspace_role[]) )
  with check ( has_workspace_role(workspace_id, array['owner']::workspace_role[]) );

-- monthly_reports: read members, write owner+editor
drop policy if exists mr_read on monthly_reports;
create policy mr_read on monthly_reports for select
  using ( has_workspace_role(workspace_id, array['owner','editor','viewer']::workspace_role[]) );
drop policy if exists mr_write on monthly_reports;
create policy mr_write on monthly_reports for insert
  with check ( has_workspace_role(workspace_id, array['owner','editor']::workspace_role[]) );

-- shared_report_links: owner+editor
drop policy if exists srl_rw on shared_report_links;
create policy srl_rw on shared_report_links for all
  using ( has_workspace_role(workspace_id, array['owner','editor']::workspace_role[]) )
  with check ( has_workspace_role(workspace_id, array['owner','editor']::workspace_role[]) );

-- ─── RPC: accept invite link ─────────────────────────────────────────────────
create or replace function accept_invite_link(p_raw_token text)
returns uuid -- returns workspace_id on success
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_hash text := encode(digest(p_raw_token, 'sha256'), 'hex');
  v_invite invite_links%rowtype;
begin
  select * into v_invite from invite_links where invite_token_hash = v_hash for update;
  if not found then raise exception 'invite not found'; end if;
  if v_invite.status <> 'active' then raise exception 'invite not active'; end if;
  if v_invite.expires_at < now() then
    update invite_links set status='expired' where id = v_invite.id;
    raise exception 'invite expired';
  end if;
  if v_invite.uses_count >= v_invite.max_uses then raise exception 'invite exhausted'; end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update invite_links
    set uses_count = uses_count + 1,
        used_at    = coalesce(used_at, now()),
        status     = case when uses_count + 1 >= max_uses then 'used' else 'active' end
    where id = v_invite.id;

  return v_invite.workspace_id;
end;
$$;

-- ─── RPC: resolve shared report link ─────────────────────────────────────────
create or replace function resolve_shared_report(p_raw_token text)
returns table (report_id uuid, report_title text, registration_track registration_track_type, version int)
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_hash text := encode(digest(p_raw_token, 'sha256'), 'hex');
  v_link shared_report_links%rowtype;
begin
  select * into v_link from shared_report_links where token_hash = v_hash;
  if not found then raise exception 'share link not found'; end if;
  if v_link.revoked_at is not null then raise exception 'share link revoked'; end if;
  if v_link.expires_at < now() then raise exception 'share link expired'; end if;
  if v_link.access_type = 'login_required' and auth.uid() is null then
    raise exception 'login required';
  end if;
  update shared_report_links set view_count = view_count + 1 where id = v_link.id;
  return query
    select r.id, r.report_title, r.registration_track, r.version
      from monthly_reports r where r.id = v_link.report_id;
end;
$$;

-- grants for anon + authenticated to call the RPCs
grant execute on function accept_invite_link(text) to authenticated;
grant execute on function resolve_shared_report(text) to anon, authenticated;
