# data_model.md — V1 Data Schemas (PROPOSAL — awaiting approval)
**Status:** DRAFT — do not migrate until user signs off.
**Scope:** Only entities required for V1 (ECSA PrEng + SACPCMP PrCM, owner/editor/viewer roles, invite-only).

Conventions:
- All tables use `uuid` primary keys (`gen_random_uuid()`).
- Every domain table carries `workspace_id` (FK → `workspaces.id`, `on delete cascade`) for RLS isolation.
- Timestamps: `created_at timestamptz default now()`, `updated_at timestamptz default now()` with trigger.
- Enums modelled as Postgres `enum` types unless the master prompt suggests data-driven (then a lookup table).
- Soft-delete: tables that need it carry `deleted_at timestamptz null` + `deleted_by uuid null`.
- Audit: every mutation writes to `audit_logs`.

---

## 1. Identity & access

### `user_accounts`
Mirrors `auth.users` 1:1. Created by trigger on signup.
```json
{
  "id": "uuid (FK auth.users.id)",
  "email": "text unique",
  "full_name": "text",
  "avatar_url": "text null",
  "phone": "text null",
  "profession": "text null",
  "country": "text null  /* ISO-3166-1 alpha-2 */",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `workspaces`
```json
{
  "id": "uuid",
  "owner_user_id": "uuid (FK user_accounts.id, on delete restrict)",
  "workspace_name": "text not null",
  "description": "text null",
  "default_registration_track": "enum('ECSA','SACPCMP') not null",
  "storage_quota_bytes": "bigint default 5368709120  /* 5 GB */",
  "storage_used_bytes": "bigint default 0",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `workspace_members`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "role": "enum('owner','editor','viewer') not null",
  "invited_by": "uuid null (FK user_accounts.id)",
  "joined_at": "timestamptz",
  "status": "enum('active','pending','revoked') default 'active'",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_unique": "(workspace_id, user_id)"
}
```

### `invite_links`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "invited_by": "uuid (FK user_accounts.id)",
  "invite_token_hash": "text not null  /* sha256 of raw token; raw token never stored */",
  "role": "enum('owner','editor','viewer') not null",
  "max_uses": "int default 1",
  "uses_count": "int default 0",
  "expires_at": "timestamptz not null  /* default 14 days */",
  "used_at": "timestamptz null",
  "revoked_at": "timestamptz null",
  "status": "enum('active','used','expired','revoked') default 'active'",
  "created_at": "timestamptz"
}
```
**Validation:** raw invite token = 32-byte random, base64url-encoded. Token never logged. Hash compared on accept.

### `shared_report_links`
```json
{
  "id": "uuid",
  "report_id": "uuid (FK monthly_reports.id)",
  "workspace_id": "uuid (FK)",
  "created_by": "uuid (FK user_accounts.id)",
  "token_hash": "text not null",
  "access_type": "enum('login_required','public_link','password_protected') default 'login_required'",
  "password_hash": "text null  /* bcrypt; only if access_type = password_protected */",
  "include_annexures": "boolean default false",
  "expires_at": "timestamptz not null  /* default 30 days, max 180 */",
  "revoked_at": "timestamptz null",
  "view_count": "int default 0",
  "last_viewed_at": "timestamptz null",
  "created_at": "timestamptz"
}
```

---

## 2. Candidate profile & registration

### `user_profiles`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)  /* a user may have profiles in multiple workspaces */",
  "user_id": "uuid (FK)",
  "candidate_name": "text",
  "target_registration_body": "enum('ECSA','SACPCMP')",
  "target_registration_category": "enum('PrEng','PrTechEng','PrCM','PrPM')",
  "current_role": "text null",
  "employer": "text null",
  "years_experience": "int null",
  "mentor_id": "uuid null (FK mentors.id)",
  "supervisor_id": "uuid null (FK supervisors.id)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_unique": "(workspace_id, user_id, target_registration_category)"
}
```

### `registration_tracks`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "track_type": "enum('ECSA','SACPCMP')",
  "target_category": "enum('PrEng','PrTechEng','PrCM','PrPM')",
  "status": "enum('active','paused','submitted','registered') default 'active'",
  "started_on": "date",
  "target_submission_date": "date null",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `supervisors`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "name": "text",
  "position": "text null",
  "company": "text null",
  "email": "text null",
  "professional_registration": "text null  /* e.g. PrEng */",
  "registration_number": "text null",
  "qualification": "text null",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `mentors`
Same shape as `supervisors`.

---

## 3. Projects & monthly logs

### `projects`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "project_name": "text not null",
  "client": "text null",
  "employer": "text null",
  "location": "text null",
  "contract_type": "text null  /* e.g. JBCC PBA, FIDIC Red Book, NEC4 ECC */",
  "project_value_zar": "numeric(15,2) null",
  "start_date": "date null",
  "end_date": "date null",
  "user_role": "text null",
  "reporting_line": "text null",
  "description": "text null",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `monthly_logs`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "registration_track_id": "uuid (FK)",
  "project_id": "uuid (FK)",
  "month": "int not null  /* 1-12 */",
  "year": "int not null  /* 2024-2100 */",
  "status": "enum('draft','submitted','reviewed','final') default 'draft'",
  "executive_summary": "text null",
  "key_activities": "text null",
  "key_responsibilities": "text null",
  "problems_encountered": "text null",
  "decisions_made": "text null",
  "outcomes_achieved": "text null",
  "lessons_learned": "text null",
  "next_month_actions": "text null",
  "responsibility_level": "enum('A','B','C','D','E') null  /* ECSA only */",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_unique": "(workspace_id, user_id, registration_track_id, year, month)"
}
```
**Validation:** only one log per user per track per month.

### `reflections`
1:1 with `monthly_logs` (optional row).
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_log_id": "uuid (FK unique)",
  "what_i_learned": "text",
  "what_i_did_well": "text",
  "what_i_need_to_improve": "text",
  "next_experience_needed": "text",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `professional_development_activities`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_log_id": "uuid (FK)",
  "title": "text",
  "provider": "text null",
  "activity_type": "enum('course','workshop','self_study','mentorship','conference','reading','other')",
  "date_completed": "date",
  "hours": "numeric(5,2)",
  "description": "text null",
  "evidence_file_id": "uuid null (FK)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

---

## 4. Evidence & annexures

### `evidence_files`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "uploaded_by": "uuid (FK user_accounts.id)",
  "monthly_log_id": "uuid null (FK)",
  "project_id": "uuid null (FK)",
  "registration_track_id": "uuid null (FK)",
  "file_name": "text not null",
  "file_type": "enum('PDF','DOCX','XLSX','CSV','TXT','PNG','JPG','JPEG','EMAIL','URL')",
  "file_size_bytes": "bigint null  /* null when file_type = URL */",
  "storage_path": "text null  /* null when file_type = URL */",
  "external_url": "text null  /* set when file_type = URL */",
  "checksum_sha256": "text null",
  "upload_date": "timestamptz default now()",
  "description": "text null",
  "tags": "text[] default '{}'",
  "version": "int default 1",
  "supersedes_id": "uuid null (FK self)  /* prior version, immutable */",
  "deleted_at": "timestamptz null",
  "deleted_by": "uuid null",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_search_index": "tsvector on (file_name || description || array_to_string(tags,' '))"
}
```
**Rules:** originals immutable. Replace = insert new row with `supersedes_id`; old row stays. Soft-delete via `deleted_at`. Purge after 30 days requires owner action + audit entry.

### `evidence_annexures`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "evidence_file_id": "uuid (FK)",
  "monthly_report_id": "uuid null (FK)  /* null until the report is generated */",
  "annexure_ref": "text  /* e.g. A1, A2, A3 — unique per report */",
  "annexure_title": "text",
  "linked_competency_id": "uuid null (FK)",
  "linked_outcome_id": "uuid null (FK ecsa_outcomes.id)",
  "description": "text null",
  "include_in_shared_report": "boolean default false",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_unique": "(monthly_report_id, annexure_ref)"
}
```

---

## 5. Competency framework (shared)

### `competencies`
Data-driven so SACPCMP can update without code change.
```json
{
  "id": "uuid",
  "workspace_id": "uuid null  /* null = system default, available to all */",
  "registration_track": "enum('ECSA','SACPCMP')",
  "framework": "enum('ECSA_R02_PE','SACPCMP_OFFICIAL_9','SACPCMP_OPERATIONAL_14')",
  "code": "text  /* e.g. 'O1' or 'SACPCMP-KA-01' or 'SACPCMP-OPS-HSE' */",
  "title": "text",
  "description": "text",
  "category": "text  /* outcome group / competency area */",
  "sort_order": "int default 0",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "_unique": "(framework, code)"
}
```
System seeds (per D13 — seed both SACPCMP frameworks side-by-side):
- 11 ECSA Outcomes under `framework='ECSA_R02_PE'`
- 9 official PMBOK Knowledge Areas under `framework='SACPCMP_OFFICIAL_9'`
- 14 operational areas under `framework='SACPCMP_OPERATIONAL_14'`

### `competency_crosswalks` (new — supports D13)
Curated mapping between the two SACPCMP frameworks so a single mapping on one side derives a coverage hint on the other.
```json
{
  "id": "uuid",
  "from_competency_id": "uuid (FK competencies.id)  /* always SACPCMP_OPERATIONAL_14 */",
  "to_competency_id": "uuid (FK competencies.id)    /* always SACPCMP_OFFICIAL_9 */",
  "weight": "numeric(3,2) default 1.00  /* fractional coverage when one ops area spans multiple KAs */",
  "created_at": "timestamptz"
}
```
Seed data hard-coded per the table in `findings.md §2.3`.

### Add to `workspaces`
```json
"primary_sacpcmp_framework": "enum('SACPCMP_OFFICIAL_9','SACPCMP_OPERATIONAL_14') default 'SACPCMP_OFFICIAL_9'"
```
The workspace owner chooses which framework appears as the *primary* SACPCMP view in dashboards, mappers, and report tables. The crosswalk auto-derives coverage on the other view so the user never has to map twice.

### `competency_mappings`
The user's monthly self-assertion that they touched a competency.
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_log_id": "uuid (FK)",
  "competency_id": "uuid (FK competencies.id)",
  "evidence_file_id": "uuid null (FK)",
  "evidence_annexure_id": "uuid null (FK)",
  "user_statement": "text  /* first-person what-I-did */",
  "self_rating": "text  /* ECSA: CDC/CDI/CNDD/CND/X; SACPCMP: Strong/Moderate/Limited/None/NA */",
  "reviewer_rating": "text null",
  "gap_action": "text null",
  "responsibility_level": "enum('A','B','C','D','E') null  /* ECSA only */",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```
**Rule:** if `self_rating ∈ {CDC, CDI, Strong, Moderate}` then `(evidence_file_id IS NOT NULL OR evidence_annexure_id IS NOT NULL)` — enforced by trigger.

### `competency_scores`
Aggregated/derived per track. Recalculated on log change.
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "registration_track_id": "uuid (FK)",
  "competency_id": "uuid (FK)",
  "score": "numeric(4,2)  /* 0.00 - 1.00 normalised */",
  "rating_label": "text  /* current rating */",
  "evidence_count": "int",
  "confidence_reason": "text  /* derivation explanation */",
  "calculated_at": "timestamptz",
  "_unique": "(workspace_id, registration_track_id, competency_id)"
}
```

---

## 6. ECSA-specific

### `ecsa_outcomes` (seed table)
11 rows. Maps to `competencies` where `registration_track='ECSA'`.

### `ecsa_problem_solving_entries`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_log_id": "uuid (FK)",
  "problem_statement": "text",
  "analysis_method": "text",
  "options_considered": "text",
  "constraints": "text",
  "solution_selected": "text",
  "implementation_steps": "text",
  "evaluation_result": "text",
  "linked_outcomes": "uuid[]  /* FK ecsa_outcomes.id */",
  "evidence_file_id": "uuid null (FK)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### `ecsa_training_experience_periods`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "period_number": "int",
  "start_date": "date",
  "end_date": "date",
  "employer": "text",
  "position": "text",
  "dominant_type_of_work": "text",
  "responsibility_level": "enum('A','B','C','D','E')",
  "supervisor_id": "uuid (FK)",
  "mentor_id": "uuid null (FK)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

---

## 7. SACPCMP-specific
SACPCMP V1 uses the shared `competencies` + `competency_mappings` model with 14 seeded competency areas:
- construction_management, project_management, contract_administration, financial_management, commercial_management, programme_management, procurement_management, quality_management, hse_management, risk_management, stakeholder_management, leadership, ethics_professional_conduct, professional_development.

Specialised entry tables (`sacpcmp_contract_admin_entries`, `sacpcmp_hse_entries`, etc.) are **deferred to V2** — V1 captures these via the rich-text fields on `monthly_logs` plus competency mappings. This keeps V1 schema small without losing data.

---

## 8. Reports

### `monthly_reports`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_log_id": "uuid (FK)",
  "registration_track": "enum('ECSA','SACPCMP')",
  "report_title": "text",
  "report_status": "enum('draft','final','revised') default 'draft'",
  "version": "int default 1",
  "pdf_export_path": "text null",
  "docx_export_path": "text null",
  "generated_at": "timestamptz null",
  "created_by": "uuid (FK)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```
**Rule:** `final` reports cannot be edited — only revised (creates new row, `version++`).

### `report_exports`
Every materialised file gets a row.
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "monthly_report_id": "uuid null (FK)",
  "export_type": "enum('PDF','DOCX','ZIP','DASHBOARD_PDF','ANNUAL_SUMMARY_PDF','ANNUAL_SUMMARY_DOCX')",
  "file_path": "text",
  "file_size_bytes": "bigint",
  "checksum_sha256": "text",
  "generated_by": "uuid (FK)",
  "generated_at": "timestamptz",
  "version": "int"
}
```

---

## 9. Audit

### `audit_logs`
```json
{
  "id": "uuid",
  "workspace_id": "uuid (FK)",
  "user_id": "uuid null (FK)  /* null for system actions */",
  "action": "text  /* e.g. 'monthly_log.create', 'evidence.upload', 'share_link.view' */",
  "entity_type": "text",
  "entity_id": "uuid null",
  "ip_address": "inet null",
  "user_agent": "text null",
  "metadata": "jsonb default '{}'",
  "timestamp": "timestamptz default now()"
}
```
**Retention:** 24 months minimum, then archive.

---

## 10. Summary — V1 table count
23 tables (added `competency_crosswalks` per D13):
- 5 identity/access (`user_accounts`, `workspaces`, `workspace_members`, `invite_links`, `shared_report_links`)
- 5 candidate/registration (`user_profiles`, `registration_tracks`, `supervisors`, `mentors`, `projects`)
- 3 monthly work (`monthly_logs`, `reflections`, `professional_development_activities`)
- 2 evidence (`evidence_files`, `evidence_annexures`)
- 4 competency (`competencies`, `competency_mappings`, `competency_scores`, `competency_crosswalks`)
- 2 ECSA-specific (`ecsa_outcomes` seed, `ecsa_problem_solving_entries`, `ecsa_training_experience_periods` → actually 3)
- 2 reports (`monthly_reports`, `report_exports`)
- 1 audit (`audit_logs`)

Plus Postgres enums and one `updated_at` trigger function.

**Approval required before any migration is written.**
