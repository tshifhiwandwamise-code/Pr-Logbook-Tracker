-- 0002_v1_schema.sql
-- Phase 6 / Phase-1 — Full V1 production schema for Pr Logbook Tracker.
-- Builds on 0001_handshake_bootstrap.sql which created the minimum 6-table set.
-- This migration EXTENDS those tables and adds the remaining 19 entities,
-- bringing total to the 25 tables enumerated in architecture/data_model.md §10.
--
-- Conventions:
--   • Every domain table: workspace_id (FK), created_at, updated_at (auto-touched).
--   • Soft-delete: deleted_at + deleted_by where required.
--   • RLS: enabled on every table; policies use auth.has_workspace_role() helper.
--   • Audit: log_audit_event() trigger attached to every mutable domain table.
--   • Seeds: 11 ECSA outcomes (R-02-PE), 9 SACPCMP-OFFICIAL_9 KAs, 14
--     SACPCMP-OPERATIONAL_14 areas, and the crosswalk rows per D13.

set search_path = public, extensions;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 1. Enums (new — bootstrap already created workspace_role, registration_  ║
-- ║    track_type, invite_status)                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
do $$ begin
  if not exists (select 1 from pg_type where typname='registration_category') then
    create type registration_category as enum ('PrEng','PrTechEng','PrCM','PrPM');
  end if;
  if not exists (select 1 from pg_type where typname='monthly_log_status') then
    create type monthly_log_status as enum ('draft','submitted','reviewed','final');
  end if;
  if not exists (select 1 from pg_type where typname='responsibility_level') then
    create type responsibility_level as enum ('A','B','C','D','E');
  end if;
  if not exists (select 1 from pg_type where typname='evidence_file_type') then
    create type evidence_file_type as enum ('PDF','DOCX','XLSX','CSV','TXT','PNG','JPG','JPEG','EMAIL','URL');
  end if;
  if not exists (select 1 from pg_type where typname='competency_framework') then
    create type competency_framework as enum ('ECSA_R02_PE','SACPCMP_OFFICIAL_9','SACPCMP_OPERATIONAL_14');
  end if;
  if not exists (select 1 from pg_type where typname='sacpcmp_framework_choice') then
    create type sacpcmp_framework_choice as enum ('SACPCMP_OFFICIAL_9','SACPCMP_OPERATIONAL_14');
  end if;
  if not exists (select 1 from pg_type where typname='report_status') then
    create type report_status as enum ('draft','final','revised');
  end if;
  if not exists (select 1 from pg_type where typname='report_export_type') then
    create type report_export_type as enum ('PDF','DOCX','ZIP','DASHBOARD_PDF','ANNUAL_SUMMARY_PDF','ANNUAL_SUMMARY_DOCX');
  end if;
  if not exists (select 1 from pg_type where typname='ipd_activity_type') then
    create type ipd_activity_type as enum ('course','workshop','self_study','mentorship','conference','reading','other');
  end if;
  if not exists (select 1 from pg_type where typname='registration_track_status') then
    create type registration_track_status as enum ('active','paused','submitted','registered');
  end if;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 2. updated_at trigger function (reused across tables)                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 3. Extend bootstrap tables                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 3.1 workspaces — add description, default track is renamed, quota, primary SACPCMP framework
alter table public.workspaces add column if not exists description text;
alter table public.workspaces add column if not exists storage_quota_bytes bigint not null default 5368709120;
alter table public.workspaces add column if not exists storage_used_bytes  bigint not null default 0;
alter table public.workspaces add column if not exists primary_sacpcmp_framework sacpcmp_framework_choice not null default 'SACPCMP_OFFICIAL_9';

drop trigger if exists trg_workspaces_updated on public.workspaces;
create trigger trg_workspaces_updated before update on public.workspaces
  for each row execute procedure public.touch_updated_at();

-- 3.2 workspace_members — pass through (already has updated_at)
drop trigger if exists trg_workspace_members_updated on public.workspace_members;
create trigger trg_workspace_members_updated before update on public.workspace_members
  for each row execute procedure public.touch_updated_at();

-- 3.3 invite_links — add max_uses default (already present), no schema change

-- 3.4 shared_report_links — add password_hash + last_viewed_at
alter table public.shared_report_links add column if not exists password_hash text;
alter table public.shared_report_links add column if not exists last_viewed_at timestamptz;

-- 3.5 evidence_files — add type, version chain, soft-delete, external_url
alter table public.evidence_files add column if not exists file_type evidence_file_type;
alter table public.evidence_files add column if not exists external_url text;
alter table public.evidence_files add column if not exists upload_date timestamptz not null default now();
alter table public.evidence_files add column if not exists version int not null default 1;
alter table public.evidence_files add column if not exists supersedes_id uuid references public.evidence_files(id) on delete set null;
alter table public.evidence_files add column if not exists deleted_at timestamptz;
alter table public.evidence_files add column if not exists deleted_by uuid;
alter table public.evidence_files add column if not exists monthly_log_id uuid;        -- FK added after monthly_logs created
alter table public.evidence_files add column if not exists project_id      uuid;        -- FK added after projects created
alter table public.evidence_files add column if not exists registration_track_id uuid;  -- FK added after registration_tracks created

drop trigger if exists trg_evidence_files_updated on public.evidence_files;
create trigger trg_evidence_files_updated before update on public.evidence_files
  for each row execute procedure public.touch_updated_at();

-- 3.6 monthly_reports — keep existing columns; add pdf/docx paths
alter table public.monthly_reports add column if not exists monthly_log_id uuid;       -- FK added after monthly_logs created
alter table public.monthly_reports add column if not exists pdf_export_path text;
alter table public.monthly_reports add column if not exists docx_export_path text;

drop trigger if exists trg_monthly_reports_updated on public.monthly_reports;
create trigger trg_monthly_reports_updated before update on public.monthly_reports
  for each row execute procedure public.touch_updated_at();

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 4. New tables                                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 4.1 user_accounts — mirrors auth.users
create table if not exists public.user_accounts (
  id uuid primary key,                                  -- equals auth.users.id
  email text not null unique,
  full_name text,
  avatar_url text,
  phone text,
  profession text,
  country text,                                          -- ISO-3166-1 alpha-2
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_user_accounts_updated on public.user_accounts;
create trigger trg_user_accounts_updated before update on public.user_accounts
  for each row execute procedure public.touch_updated_at();

-- 4.2 user_profiles
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  candidate_name text,
  target_registration_body registration_track_type,
  target_registration_category registration_category,
  "current_role" text,  -- quoted: reserved keyword
  employer text,
  years_experience int,
  mentor_id uuid,                                         -- FK added after mentors created
  supervisor_id uuid,                                     -- FK added after supervisors created
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, target_registration_category)
);
drop trigger if exists trg_user_profiles_updated on public.user_profiles;
create trigger trg_user_profiles_updated before update on public.user_profiles
  for each row execute procedure public.touch_updated_at();

-- 4.3 supervisors
create table if not exists public.supervisors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  position text,
  company text,
  email text,
  professional_registration text,
  registration_number text,
  qualification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_supervisors_updated on public.supervisors;
create trigger trg_supervisors_updated before update on public.supervisors
  for each row execute procedure public.touch_updated_at();

-- 4.4 mentors (same shape)
create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  position text,
  company text,
  email text,
  professional_registration text,
  registration_number text,
  qualification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_mentors_updated on public.mentors;
create trigger trg_mentors_updated before update on public.mentors
  for each row execute procedure public.touch_updated_at();

-- Now backfill FKs on user_profiles
alter table public.user_profiles
  add constraint user_profiles_mentor_fk    foreign key (mentor_id)    references public.mentors(id)     on delete set null,
  add constraint user_profiles_supervisor_fk foreign key (supervisor_id) references public.supervisors(id) on delete set null;

-- 4.5 registration_tracks
create table if not exists public.registration_tracks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  track_type registration_track_type not null,
  target_category registration_category not null,
  status registration_track_status not null default 'active',
  started_on date,
  target_submission_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_registration_tracks_updated on public.registration_tracks;
create trigger trg_registration_tracks_updated before update on public.registration_tracks
  for each row execute procedure public.touch_updated_at();

-- 4.6 projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_name text not null,
  client text,
  employer text,
  location text,
  contract_type text,
  project_value_zar numeric(15,2),
  start_date date,
  end_date date,
  user_role text,
  reporting_line text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute procedure public.touch_updated_at();

-- 4.7 monthly_logs
create table if not exists public.monthly_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  registration_track_id uuid not null references public.registration_tracks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2024 and 2100),
  status monthly_log_status not null default 'draft',
  executive_summary text,
  key_activities text,
  key_responsibilities text,
  problems_encountered text,
  decisions_made text,
  outcomes_achieved text,
  lessons_learned text,
  next_month_actions text,
  responsibility_level responsibility_level,  -- ECSA only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, registration_track_id, year, month)
);
drop trigger if exists trg_monthly_logs_updated on public.monthly_logs;
create trigger trg_monthly_logs_updated before update on public.monthly_logs
  for each row execute procedure public.touch_updated_at();

-- Backfill evidence_files FKs now that the referenced tables exist
alter table public.evidence_files
  add constraint evidence_files_monthly_log_fk        foreign key (monthly_log_id)        references public.monthly_logs(id)        on delete set null,
  add constraint evidence_files_project_fk            foreign key (project_id)            references public.projects(id)            on delete set null,
  add constraint evidence_files_registration_track_fk foreign key (registration_track_id) references public.registration_tracks(id) on delete set null;

alter table public.monthly_reports
  add constraint monthly_reports_monthly_log_fk foreign key (monthly_log_id) references public.monthly_logs(id) on delete cascade;

-- 4.8 reflections
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  monthly_log_id uuid not null unique references public.monthly_logs(id) on delete cascade,
  what_i_learned text,
  what_i_did_well text,
  what_i_need_to_improve text,
  next_experience_needed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_reflections_updated on public.reflections;
create trigger trg_reflections_updated before update on public.reflections
  for each row execute procedure public.touch_updated_at();

-- 4.9 professional_development_activities
create table if not exists public.professional_development_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  monthly_log_id uuid not null references public.monthly_logs(id) on delete cascade,
  title text not null,
  provider text,
  activity_type ipd_activity_type not null,
  date_completed date not null,
  hours numeric(5,2) not null check (hours > 0),
  description text,
  evidence_file_id uuid references public.evidence_files(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_ipd_updated on public.professional_development_activities;
create trigger trg_ipd_updated before update on public.professional_development_activities
  for each row execute procedure public.touch_updated_at();

-- 4.10 evidence_annexures
create table if not exists public.evidence_annexures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  evidence_file_id uuid not null references public.evidence_files(id) on delete cascade,
  monthly_report_id uuid references public.monthly_reports(id) on delete set null,
  annexure_ref text not null,
  annexure_title text not null,
  linked_competency_id uuid,                      -- FK added after competencies created
  description text,
  include_in_shared_report boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (monthly_report_id, annexure_ref)
);
drop trigger if exists trg_evidence_annexures_updated on public.evidence_annexures;
create trigger trg_evidence_annexures_updated before update on public.evidence_annexures
  for each row execute procedure public.touch_updated_at();

-- 4.11 competencies (per D13: framework enum)
create table if not exists public.competencies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,                                 -- null = system default
  registration_track registration_track_type not null,
  framework competency_framework not null,
  code text not null,
  title text not null,
  description text,
  category text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (framework, code)
);
drop trigger if exists trg_competencies_updated on public.competencies;
create trigger trg_competencies_updated before update on public.competencies
  for each row execute procedure public.touch_updated_at();

-- Backfill evidence_annexures FK
alter table public.evidence_annexures
  add constraint evidence_annexures_competency_fk foreign key (linked_competency_id) references public.competencies(id) on delete set null;

-- 4.12 competency_mappings
create table if not exists public.competency_mappings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  monthly_log_id uuid not null references public.monthly_logs(id) on delete cascade,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  evidence_file_id uuid references public.evidence_files(id) on delete set null,
  evidence_annexure_id uuid references public.evidence_annexures(id) on delete set null,
  user_statement text,
  self_rating text,                                 -- ECSA: CDC/CDI/CNDD/CND/X; SACPCMP: Strong/Moderate/Limited/None/NA
  reviewer_rating text,
  gap_action text,
  responsibility_level responsibility_level,        -- ECSA only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_competency_mappings_updated on public.competency_mappings;
create trigger trg_competency_mappings_updated before update on public.competency_mappings
  for each row execute procedure public.touch_updated_at();

-- Constraint: high ratings require evidence
create or replace function public.check_competency_evidence()
returns trigger
language plpgsql
as $$
begin
  if new.self_rating in ('CDC','CDI','Strong','Moderate')
     and new.evidence_file_id is null
     and new.evidence_annexure_id is null then
    raise exception 'high competency rating (%) requires linked evidence', new.self_rating;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_competency_evidence_check on public.competency_mappings;
create trigger trg_competency_evidence_check
  before insert or update of self_rating on public.competency_mappings
  for each row execute procedure public.check_competency_evidence();

-- 4.13 competency_scores
create table if not exists public.competency_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  registration_track_id uuid not null references public.registration_tracks(id) on delete cascade,
  competency_id uuid not null references public.competencies(id) on delete cascade,
  score numeric(4,2) not null check (score between 0 and 1),
  rating_label text,
  evidence_count int not null default 0,
  confidence_reason text,
  calculated_at timestamptz not null default now(),
  unique (workspace_id, registration_track_id, competency_id)
);

-- 4.14 competency_crosswalks (D13)
create table if not exists public.competency_crosswalks (
  id uuid primary key default gen_random_uuid(),
  from_competency_id uuid not null references public.competencies(id) on delete cascade,
  to_competency_id   uuid not null references public.competencies(id) on delete cascade,
  weight numeric(3,2) not null default 1.00 check (weight > 0 and weight <= 1),
  created_at timestamptz not null default now(),
  unique (from_competency_id, to_competency_id)
);

-- 4.15 ecsa_problem_solving_entries
create table if not exists public.ecsa_problem_solving_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  monthly_log_id uuid not null references public.monthly_logs(id) on delete cascade,
  problem_statement text not null,
  analysis_method text,
  options_considered text,
  constraints text,
  solution_selected text,
  implementation_steps text,
  evaluation_result text,
  linked_outcomes uuid[] not null default '{}',
  evidence_file_id uuid references public.evidence_files(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_ecsa_problems_updated on public.ecsa_problem_solving_entries;
create trigger trg_ecsa_problems_updated before update on public.ecsa_problem_solving_entries
  for each row execute procedure public.touch_updated_at();

-- 4.16 ecsa_training_experience_periods
create table if not exists public.ecsa_training_experience_periods (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  period_number int not null,
  start_date date not null,
  end_date date not null,
  employer text,
  position text,
  dominant_type_of_work text,
  responsibility_level responsibility_level,
  supervisor_id uuid references public.supervisors(id) on delete set null,
  mentor_id     uuid references public.mentors(id)     on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
drop trigger if exists trg_ecsa_periods_updated on public.ecsa_training_experience_periods;
create trigger trg_ecsa_periods_updated before update on public.ecsa_training_experience_periods
  for each row execute procedure public.touch_updated_at();

-- 4.17 report_exports
create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  monthly_report_id uuid references public.monthly_reports(id) on delete cascade,
  export_type report_export_type not null,
  file_path text not null,
  file_size_bytes bigint,
  checksum_sha256 text,
  generated_by uuid not null,
  generated_at timestamptz not null default now(),
  version int not null default 1
);

-- 4.18 audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  timestamp timestamptz not null default now()
);
create index if not exists audit_logs_ws_time_idx on public.audit_logs (workspace_id, timestamp desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 5. RLS — enable on every new table, apply standard policies               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_accounts','user_profiles','supervisors','mentors',
    'registration_tracks','projects','monthly_logs','reflections',
    'professional_development_activities','evidence_annexures',
    'competencies','competency_mappings','competency_scores','competency_crosswalks',
    'ecsa_problem_solving_entries','ecsa_training_experience_periods',
    'report_exports','audit_logs'
  ])
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- user_accounts: a user can only see their own row
drop policy if exists ua_self_read on public.user_accounts;
create policy ua_self_read on public.user_accounts for select using (id = auth.uid());
drop policy if exists ua_self_update on public.user_accounts;
create policy ua_self_update on public.user_accounts for update using (id = auth.uid()) with check (id = auth.uid());

-- competencies: system defaults (workspace_id null) readable by everyone; workspace-scoped readable by members
drop policy if exists comp_read on public.competencies;
create policy comp_read on public.competencies for select using (
  workspace_id is null
  or has_workspace_role(workspace_id, array['owner','editor','viewer']::workspace_role[])
);
drop policy if exists comp_write on public.competencies;
create policy comp_write on public.competencies for insert with check (
  workspace_id is not null
  and has_workspace_role(workspace_id, array['owner','editor']::workspace_role[])
);

-- competency_crosswalks: same as competencies (system rows readable, no user writes in V1)
drop policy if exists cwk_read on public.competency_crosswalks;
create policy cwk_read on public.competency_crosswalks for select using (true);

-- audit_logs: read by owner+editor (viewer doesn't see audit); insert only via trigger (no policy = blocked for direct insert)
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select using (
  has_workspace_role(workspace_id, array['owner','editor']::workspace_role[])
);
-- Allow service role inserts. The audit trigger runs SECURITY DEFINER so it doesn't go through RLS.

-- Generic pattern for the rest: read all members; write owner+editor; delete owner
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles','supervisors','mentors',
    'registration_tracks','projects','monthly_logs','reflections',
    'professional_development_activities','evidence_annexures',
    'competency_mappings','competency_scores',
    'ecsa_problem_solving_entries','ecsa_training_experience_periods',
    'report_exports'
  ])
  loop
    execute format('drop policy if exists ws_read on public.%I;', t);
    execute format('create policy ws_read on public.%I for select using ( has_workspace_role(workspace_id, array[''owner'',''editor'',''viewer'']::workspace_role[]) );', t);
    execute format('drop policy if exists ws_write on public.%I;', t);
    execute format('create policy ws_write on public.%I for insert with check ( has_workspace_role(workspace_id, array[''owner'',''editor'']::workspace_role[]) );', t);
    execute format('drop policy if exists ws_update on public.%I;', t);
    execute format('create policy ws_update on public.%I for update using ( has_workspace_role(workspace_id, array[''owner'',''editor'']::workspace_role[]) ) with check ( has_workspace_role(workspace_id, array[''owner'',''editor'']::workspace_role[]) );', t);
    execute format('drop policy if exists ws_delete on public.%I;', t);
    execute format('create policy ws_delete on public.%I for delete using ( has_workspace_role(workspace_id, array[''owner'']::workspace_role[]) );', t);
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 6. Audit trigger                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function public.log_audit_event()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_ws uuid;
  v_action text;
begin
  v_action := tg_op || ':' || tg_table_name;
  if tg_op = 'DELETE' then
    v_ws := old.workspace_id;
  else
    v_ws := new.workspace_id;
  end if;
  if v_ws is null then return coalesce(new, old); end if;
  insert into public.audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (
    v_ws,
    auth.uid(),
    v_action,
    tg_table_name,
    coalesce(new.id, old.id),
    case
      when tg_op = 'DELETE' then jsonb_build_object('deleted', to_jsonb(old))
      when tg_op = 'INSERT' then '{}'::jsonb
      else jsonb_build_object('changed', true)
    end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'workspaces','workspace_members','invite_links','shared_report_links',
    'user_profiles','supervisors','mentors',
    'registration_tracks','projects','monthly_logs','reflections',
    'professional_development_activities','evidence_files','evidence_annexures',
    'competencies','competency_mappings','monthly_reports','report_exports',
    'ecsa_problem_solving_entries','ecsa_training_experience_periods'
  ])
  loop
    execute format('drop trigger if exists trg_audit on public.%I;', t);
    execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute procedure public.log_audit_event();', t);
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 7. Seeds — ECSA 11 outcomes, SACPCMP_OFFICIAL_9, SACPCMP_OPERATIONAL_14   ║
-- ║          + crosswalks per findings.md §2.3                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 7.1 ECSA R-02-PE outcomes
insert into public.competencies (workspace_id, registration_track, framework, code, title, category, sort_order, description) values
(null, 'ECSA',   'ECSA_R02_PE', 'O1',  'Define, investigate and analyse complex engineering problems',                                                          'A — Engineering problem solving',          1, 'Identify, formulate and analyse complex engineering problems creatively and innovatively.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O2',  'Design or develop solutions to complex engineering problems',                                                            'A — Engineering problem solving',          2, 'Perform creative, procedural and non-procedural design and synthesis of components, systems or processes.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O3',  'Comprehend and apply advanced engineering knowledge',                                                                    'A — Engineering problem solving',          3, 'Apply mathematics, natural sciences and engineering fundamentals plus specialist knowledge to solve complex engineering problems.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O4',  'Manage part or all of one or more complex engineering activities',                                                       'B — Managing engineering activities',      4, 'Manage resources, scope, schedule, cost and quality for engineering work.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O5',  'Communicate clearly with others in the course of engineering activities',                                                'B — Managing engineering activities',      5, 'Communicate effectively orally and in writing with technical and lay audiences.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O6',  'Recognise and address the reasonably foreseeable social, cultural and environmental effects of engineering activities',  'C — Impact of engineering activity',       6, 'Demonstrate awareness of sustainability and the impact of engineering work on society and the environment.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O7',  'Meet all legal and regulatory requirements and protect the health and safety of persons',                                'C — Impact of engineering activity',       7, 'Apply codes, standards and legal requirements; protect HSE.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O8',  'Conduct engineering activities ethically',                                                                              'D — Judgement and responsibility',         8, 'Apply the ECSA Code of Conduct and exercise professional ethics.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O9',  'Exercise sound judgement in the course of complex engineering activities',                                              'D — Judgement and responsibility',         9, 'Make defensible engineering judgements based on evidence and within own competence.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O10', 'Be responsible for making decisions on part or all of complex engineering activities',                                  'D — Judgement and responsibility',        10, 'Take personal responsibility for decisions and outcomes.'),
(null, 'ECSA',   'ECSA_R02_PE', 'O11', 'Undertake professional development activities sufficient to maintain and extend competence',                            'E — Continuing professional development', 11, 'Plan and undertake IPD; reflect on learning.')
on conflict (framework, code) do nothing;

-- 7.2 SACPCMP_OFFICIAL_9 (PMBOK-aligned)
insert into public.competencies (workspace_id, registration_track, framework, code, title, category, sort_order, description) values
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-01', 'Project Integration Management',  'PMBOK Knowledge Area', 1,  'Identify, define, combine, unify and coordinate processes and activities within Project Management Process Groups.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-02', 'Project Scope Management',         'PMBOK Knowledge Area', 2,  'Ensure the project includes all work required and only the work required.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-03', 'Project Time Management',          'PMBOK Knowledge Area', 3,  'Manage timely completion of the project.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-04', 'Project Cost Management',          'PMBOK Knowledge Area', 4,  'Plan, estimate, budget, finance, fund, manage and control costs.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-05', 'Project Quality Management',       'PMBOK Knowledge Area', 5,  'Define quality policies, objectives and responsibilities; satisfy project needs.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-06', 'Project Human Resources Management','PMBOK Knowledge Area', 6,  'Organise, manage and lead the project team.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-07', 'Project Communication Management', 'PMBOK Knowledge Area', 7,  'Plan, manage and monitor project communication.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-08', 'Project Risk Management (incl. OHS)','PMBOK Knowledge Area', 8, 'Plan risk management, identify, analyse, plan responses, implement and monitor risk; HSE included.'),
(null, 'SACPCMP', 'SACPCMP_OFFICIAL_9', 'KA-09', 'Project Procurement Management',   'PMBOK Knowledge Area', 9,  'Acquire products, services or results needed from outside the project team.')
on conflict (framework, code) do nothing;

-- 7.3 SACPCMP_OPERATIONAL_14 (master prompt vocabulary)
insert into public.competencies (workspace_id, registration_track, framework, code, title, category, sort_order, description) values
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-CM',     'Construction management',          'Operational',  1,  'Day-to-day management of physical construction works.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-PM',     'Project management',                'Operational',  2,  'End-to-end project leadership.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-CA',     'Contract administration',           'Operational',  3,  'Instructions, variations, claims, clause administration.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-FIN',    'Financial management',              'Operational',  4,  'Payment certificates, cost tracking, forecasting, retention.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-COMM',   'Commercial management',             'Operational',  5,  'Commercial strategy, bid management, contracts negotiation.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-PROG',   'Programme management',              'Operational',  6,  'Programme baselining, monitoring, recovery.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-PROC',   'Procurement management',            'Operational',  7,  'Subcontractor procurement, material lead times, supplier management.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-QA',     'Quality management',                'Operational',  8,  'ITPs, inspections, NCRs, snagging, compliance.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-HSE',    'HSE management',                    'Operational',  9,  'Health, safety and environmental management on site.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-RISK',   'Risk management',                   'Operational', 10,  'Risk identification, analysis, mitigation, contingency.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-STAKE',  'Stakeholder management',            'Operational', 11,  'Client, engineer, community, design-team coordination.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-LEAD',   'Leadership',                        'Operational', 12,  'Team leadership, delegation, conflict resolution, coaching.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-ETHICS', 'Ethics and professional conduct',  'Operational', 13,  'SACPCMP Code of Conduct adherence.'),
(null, 'SACPCMP', 'SACPCMP_OPERATIONAL_14', 'OPS-CPD',    'Professional development',          'Operational', 14,  'CPD activities, mentorship, learning.')
on conflict (framework, code) do nothing;

-- 7.4 Crosswalks — operational 14 → official 9 (per findings.md §2.3)
do $$
declare
  v_pairs text[][] := array[
    array['OPS-CM',     'KA-01', '0.50'],
    array['OPS-CM',     'KA-02', '0.25'],
    array['OPS-CM',     'KA-03', '0.25'],
    array['OPS-PM',     'KA-01', '1.00'],
    array['OPS-CA',     'KA-02', '0.50'],
    array['OPS-CA',     'KA-09', '0.50'],
    array['OPS-FIN',    'KA-04', '1.00'],
    array['OPS-COMM',   'KA-04', '0.50'],
    array['OPS-COMM',   'KA-09', '0.50'],
    array['OPS-PROG',   'KA-03', '1.00'],
    array['OPS-PROC',   'KA-09', '1.00'],
    array['OPS-QA',     'KA-05', '1.00'],
    array['OPS-HSE',    'KA-08', '1.00'],
    array['OPS-RISK',   'KA-08', '1.00'],
    array['OPS-STAKE',  'KA-07', '1.00'],
    array['OPS-LEAD',   'KA-06', '1.00']
    -- OPS-ETHICS and OPS-CPD are cross-cutting; no KA mapping (assessor handles separately)
  ];
  i int;
  v_from uuid;
  v_to   uuid;
begin
  for i in 1 .. array_length(v_pairs, 1) loop
    select id into v_from from public.competencies where framework='SACPCMP_OPERATIONAL_14' and code = v_pairs[i][1];
    select id into v_to   from public.competencies where framework='SACPCMP_OFFICIAL_9'      and code = v_pairs[i][2];
    if v_from is not null and v_to is not null then
      insert into public.competency_crosswalks (from_competency_id, to_competency_id, weight)
      values (v_from, v_to, v_pairs[i][3]::numeric)
      on conflict (from_competency_id, to_competency_id) do nothing;
    end if;
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 8. user_accounts auto-mirror trigger from auth.users                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  insert into public.user_accounts (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_to_account on auth.users;
create trigger trg_auth_user_to_account
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
