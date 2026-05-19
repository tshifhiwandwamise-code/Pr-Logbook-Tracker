# auth_and_security.md — Auth, RLS, Storage Policies (PROPOSAL)
**Status:** DRAFT — awaiting approval.

---

## 1. Authentication
- **Provider:** Supabase Auth.
- **Methods enabled V1:** Email + password, magic link.
- **Methods deferred:** OAuth (Google, GitHub), SSO/SAML.
- **Email verification:** required before any workspace action.
- **MFA:** optional TOTP; mandatory for workspace `owner` role at V1.1.
- **Session:** Supabase default (1 hour access token + refresh token). Refresh tokens revoked on password change.

## 2. Authorization model

### Roles (V1)
| Role | Read | Write logs | Upload evidence | Generate reports | Invite users | Delete workspace |
|---|---|---|---|---|---|---|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ |
| viewer | ✓ | ✕ | ✕ | ✕ (view only) | ✕ | ✕ |

A user's effective role per workspace is read from `workspace_members.role`.

### Permission helper (Postgres function)
```sql
create or replace function auth.has_workspace_role(
  ws uuid,
  required_roles text[]
) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and status = 'active'
      and role = any(required_roles)
  );
$$;
```

## 3. Row Level Security (RLS) — policies per table

RLS is enabled on every table. No table is accessible without an explicit policy.

### Generic patterns
**Read pattern** (every member sees):
```sql
create policy "ws_read" on <table> for select
using ( auth.has_workspace_role(workspace_id, array['owner','editor','viewer']) );
```

**Write pattern** (owner + editor only):
```sql
create policy "ws_write" on <table> for insert
with check ( auth.has_workspace_role(workspace_id, array['owner','editor']) );

create policy "ws_update" on <table> for update
using ( auth.has_workspace_role(workspace_id, array['owner','editor']) )
with check ( auth.has_workspace_role(workspace_id, array['owner','editor']) );

create policy "ws_delete" on <table> for delete
using ( auth.has_workspace_role(workspace_id, array['owner']) );
```

### Table-specific exceptions
| Table | Notable rules |
|---|---|
| `user_accounts` | A user can only see their own row. No cross-user reads. |
| `workspaces` | Read if member. Update if owner. Delete if owner. |
| `workspace_members` | Read if member of same workspace. Insert/update only by owner. A user can delete their *own* member row (leave workspace). |
| `invite_links` | Read/insert/update/delete owner-only. Public "accept" path runs through a `security definer` RPC (`accept_invite_link(token)`) that never exposes raw rows. |
| `shared_report_links` | Read/insert/delete owner+editor. Public read of *reports* via shared link goes through a `security definer` RPC (`resolve_shared_report(token)`) that returns only the snapshot needed for display. |
| `evidence_files` | Delete is owner-only **and** logical (sets `deleted_at`). Hard-delete via RPC `purge_evidence(id, reason)` — owner-only, writes audit. |
| `monthly_reports` | Update of `report_status='final'` blocked — must revise. |
| `audit_logs` | Insert via trigger only. Select for owner+editor. No update/delete. |

## 4. Invite-link flow

1. Owner calls server action `createInviteLink(workspaceId, role, max_uses, expires_in)`.
2. Server generates 32-byte random token → base64url.
3. Server stores `sha256(token)` in `invite_links.invite_token_hash`.
4. Server returns the raw token *once* to the owner UI as a URL: `https://app.tld/invite/<raw_token>`.
5. Recipient opens link → frontend posts raw token to `acceptInviteLink(token)` RPC.
6. RPC hashes input, finds matching row, checks `status`, `expires_at`, `uses_count < max_uses`.
7. If valid, RPC inserts `workspace_members` row (user must be signed in or create account first).
8. RPC increments `uses_count`, sets `used_at` if single-use, writes `audit_logs` entry.

**Security:** raw tokens never logged. Tokens are URL-safe but treated as bearer secrets.

## 5. Shared-report-link flow

1. Owner/editor calls `createSharedReportLink(reportId, options)`.
2. Server generates token, stores `token_hash`.
3. Returns URL: `https://app.tld/r/<raw_token>`.
4. Recipient opens → frontend posts token to `resolveSharedReport(token, password?)` RPC.
5. RPC validates token hash, `expires_at > now()`, not revoked, password (if set) matches bcrypt.
6. For `login_required`: rejects if `auth.uid()` is null.
7. Returns a server-rendered report snapshot (HTML/JSON), respecting `include_annexures`.
8. Writes `audit_logs` row with `ip_address` + `user_agent`, increments `view_count`.

## 6. Storage policies (Supabase Storage)

### Buckets
| Bucket | Public? | Purpose |
|---|---|---|
| `evidence` | private | Original uploaded evidence files |
| `reports` | private | Generated PDF/DOCX/ZIP reports |
| `avatars` | private (signed) | User avatar images |

### Path convention
`{workspace_id}/{entity_type}/{entity_id}/{filename}`
e.g. `b1c2.../evidence/abcdef.../site_photo_001.jpg`

### Policies (apply to all three buckets)
```sql
-- Read: workspace members only
create policy "ws_read_storage" on storage.objects for select
using (
  bucket_id in ('evidence','reports','avatars')
  and auth.has_workspace_role(
    split_part(name, '/', 1)::uuid,
    array['owner','editor','viewer']
  )
);

-- Write: owner + editor
create policy "ws_write_storage" on storage.objects for insert
with check (
  bucket_id in ('evidence','reports','avatars')
  and auth.has_workspace_role(
    split_part(name, '/', 1)::uuid,
    array['owner','editor']
  )
);

-- Delete (logical only via app; storage-level delete is owner-only escape hatch)
create policy "ws_delete_storage" on storage.objects for delete
using (
  bucket_id in ('evidence','reports','avatars')
  and auth.has_workspace_role(
    split_part(name, '/', 1)::uuid,
    array['owner']
  )
);
```

All file access in the app uses **signed URLs** (1-hour TTL). No public bucket URLs are exposed in HTML.

## 7. Per-workspace storage quota
- Default: 5 GB. Enforced in app code on upload (`workspaces.storage_used_bytes + new_size <= storage_quota_bytes`).
- A scheduled function reconciles `storage_used_bytes` nightly.
- Soft-deleted files count against quota until purged.

## 8. POPIA / data residency
- All Supabase resources in **af-south-1 (Cape Town)**.
- DSAR (Data Subject Access Request) supported via `exportWorkspaceData(workspace_id)` RPC — returns a JSON dump of all rows the user has access to + signed URLs to their files.
- Right-to-erasure: hard-delete of a `user_accounts` row triggers cascade across `workspace_members` (other workspaces) and full purge of personal evidence (with 30-day grace before storage purge).

## 9. Secrets management
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` held in Vercel env vars + Supabase function env.
- `SUPABASE_SERVICE_ROLE_KEY` used only by server actions and edge functions, never sent to the browser.

## 10. Audit triggers
A single trigger function `log_audit_event()` attaches to every mutable table via `AFTER INSERT/UPDATE/DELETE` triggers, recording `action`, `entity_type`, `entity_id`, `auth.uid()`, and a redacted `metadata` jsonb diff.

## 11. Working with Supabase advisors (added 2026-05-19 after Self-Annealing event #4)

Supabase ships a database linter exposed via `mcp__…__get_advisors`. We run it after every DDL migration. **Not every warning is a real issue** — the linter cannot distinguish between an internal SECURITY DEFINER helper and a public-facing RPC.

Known acceptable warnings for this codebase:

| Lint code | Function | Why acceptable |
|---|---|---|
| `anon_security_definer_function_executable` / `authenticated_…` | `accept_invite_link` | Intentional public RPC. SECURITY DEFINER is required so the function can read `auth.uid()` and mutate `workspace_members` across the trust boundary. Token is hashed input; raw tokens never enter the database. |
| `anon_security_definer_function_executable` / `authenticated_…` | `resolve_shared_report` | Intentional public RPC. SECURITY DEFINER is required so the function can enforce `login_required + expiry + revocation` checks before returning report data. |
| `anon_security_definer_function_executable` / `authenticated_…` | `has_workspace_role` | RLS helper. SECURITY DEFINER allows the body to bypass the recursive RLS check on `workspace_members`. EXECUTE must be granted to anon/authenticated because RLS evaluation runs in the caller's role context. A malicious caller learns nothing they could not already query through RLS. |

Required action when these warnings appear: confirm the function matches one of the rows above; if yes, add or verify the `COMMENT ON FUNCTION` that documents the design intent. Do not revoke EXECUTE without testing RLS — see Self-Annealing event #4 in progress.md for the cautionary tale.

Lints that MUST always be fixed:
- `function_search_path_mutable` — pin via `SET search_path = public, extensions` in every function definition.
- Any `ERROR`-level lint.
- Any new `SECURITY DEFINER` warning on a function not listed in the table above (review intent before granting EXECUTE).

---

**Approval required:** roles, RLS patterns, invite flow, share flow, storage paths, POPIA approach, advisor policy.
