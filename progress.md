# progress.md — Session Memory
**Last Updated:** 2026-05-19

A chronological log of what has been done, what is in progress, and any blockers.

---

## 2026-05-19 — Session 1
**Phase:** 0 → 1 (Initialization → Blueprint)

### Done
- Created `claude.md` (Project Constitution, scaffold).
- Created `task_plan.md` (10-phase build plan with explicit gates).
- Created `findings.md` (research log, awaiting Phase 2 content).
- Created `progress.md` (this file).

### In progress
- Asking Discovery questions (Phase 1 / Blueprint).

### Blocked / awaiting user
- Discovery answers: North Star, Tracks, User Types, Multi-User Access, Source of Truth, Evidence Handling, Report Outputs, Cloud Storage, Design Preference.
- User to confirm whether the "Road to Registration" PDF will be uploaded (mentioned in master prompt as a reference).

### Next
1. ✅ Discovery answers received (3 rounds, all 13 decisions locked).
2. ✅ `claude.md` § 17 updated.
3. ✅ `findings.md` with Resolved Decisions + research log.
4. ✅ Architecture proposal pack: data_model, auth_and_security, storage_buckets, ui_sitemap, report_templates, development_phases.
5. ✅ Phase 1 proposal pack approved.
6. ✅ Phase 2 research complete — ECSA R-02-PE confirmed; SACPCMP 9-KA official assessment framework documented.
7. ✅ D13 resolved — both SACPCMP frameworks seeded side-by-side with cross-walk.
8. ✅ Phase 5 handshake test pack delivered: 10 test scripts + runner + cleanup + bootstrap SQL migration + package.json + tsconfig + .env.example + README.

### Phase 5 hand-off (user action required)
The handshake pack cannot be executed by me — it requires a live Supabase project. To run it:
1. Create a Supabase project in **af-south-1 (Cape Town)**.
2. Run `database/migrations/0001_handshake_bootstrap.sql` against it.
3. Create three private Storage buckets: `evidence`, `reports`, `avatars`.
4. Copy `tools/.env.example` → `tools/.env` and fill the keys.
5. `cd tools && pnpm install && pnpm test:handshakes`.
6. Confirm `✅ all 10 handshakes passed` — that is the Phase 5 exit gate.

### Gate
Phase 6 (production Architect + V1 build, Phases 0–15 of development_phases.md) does NOT start until the user reports the handshakes passing.

### Decisions logged
See `findings.md` § 5 (Resolved Decisions D1–D13) and `claude.md` § 17.

---

## 2026-05-19 — Session 2

### Done
- Cloned empty `Pr-Logbook-Tracker` GitHub repo into the workspace.
- Populated repo with all 32 files (memory, architecture/, database/migrations/, tools/, README.md, LICENSE, .gitignore).
- Initial commit `56e7939` on `main`.
- First push attempt failed (HTTP 403) — fine-grained PAT lacked `Contents: Read and write` on this specific repo. User regenerated as classic `repo` token; second push **succeeded**.
- Connected Supabase MCP (`directoryUuid 11ca66fc-1e98-49d5-ab9b-7cb4672a8f10`); loaded 9 of its tools.
- Probed project `cxrztbdnbgshrklovbqj`: ACTIVE_HEALTHY, Postgres 17.6.1, `uuid-ossp` and `pgcrypto` extensions already installed (good — bootstrap migration won't need to install them).

### Self-Annealing event #1 — region mismatch
- **Observed:** project region = `eu-west-1` (Ireland).
- **Expected:** D4 = `af-south-1` (Cape Town).
- **Root cause:** project created without explicit region selection / dropdown defaulted to Ireland.
- **Action:** user agreed to delete + recreate in Cape Town. Migration deferred until new project ref received.
- **Documentation:** this entry. No SOP change required — D4 is unchanged.

### Security note
- Two GitHub PATs were pasted in chat to enable the push. User instructed to rotate both at github.com/settings/tokens.

### Blocked / awaiting user
- ~~New Supabase project ref in `af-south-1`.~~ → see Self-Annealing event #2 below.

### Self-Annealing event #2 — region af-south-1 unavailable
- **Observed:** South Africa (Cape Town) region not available for this Supabase organisation.
- **Root cause:** Supabase has not enabled af-south-1 for the org. No other African regions exist.
- **Action:** D4 amended from `af-south-1` to `eu-west-1` (Ireland). Justification: GDPR sits under POPIA Chapter 9 as adequate cross-border destination.
- **Compensating control:** Phase 14 Hardening checklist updated to require explicit POPIA cross-border disclosure on /privacy, /terms, signup consent, and DPA link.
- **Documentation updates:** claude.md §17.2, findings.md §5 (D4 row + new follow-up bullet), development_phases.md Phase 14 expanded.

### Self-Annealing event #3 — GIN index requires IMMUTABLE wrapper
- **Observed:** `apply_migration` failed with `ERROR 42P17: functions in index expression must be marked IMMUTABLE` on the `evidence_files_search_idx` GIN index.
- **Root cause:** Even with explicit `'english'::regconfig` cast, Supabase Postgres 17 does not classify the composite expression `to_tsvector(coalesce(...) || ' ' || ...)` as immutable in an index context.
- **Action:** Introduced `public.evidence_search_doc(text, text, text[])` — a SQL function declared `IMMUTABLE STRICT PARALLEL SAFE` — and indexed the function call instead. Safe because the underlying primitives (coalesce, ||, array_to_string, to_tsvector with fixed regconfig) ARE semantically immutable.
- **Documentation updates:** `database/migrations/0001_handshake_bootstrap.sql` rewritten with the wrapper pattern + inline comment explaining why.

### Self-Annealing event #4 — over-zealous EXECUTE revoke on RLS helper
- **Observed:** Probe A (RLS isolation) failed: `ERROR 42501: permission denied for function has_workspace_role` when authenticated role attempted SELECT on `evidence_files`.
- **Root cause:** A hardening pass revoked EXECUTE on `has_workspace_role` from anon/authenticated to suppress a Supabase advisor warning (`anon_security_definer_function_executable`). But RLS evaluation runs in the caller's role context — the caller needs EXECUTE on helpers used in policy predicates even when those helpers are SECURITY DEFINER.
- **Root-root cause:** The advisor warning is a false positive for the canonical SECURITY-DEFINER RLS-helper pattern. The advisor doesn't distinguish between "RPCs intended for external callers" and "internal helpers grouped in the public schema for RLS reuse".
- **Action:** Restored `GRANT EXECUTE … TO anon, authenticated` on `has_workspace_role`. Added a `COMMENT` on the function explaining the SECURITY DEFINER design and why the advisor warning is acceptable.
- **Documentation updates:** auth_and_security.md (this SOP needs a "Working with Supabase advisors" subsection — added to TODO before Phase 6). Migration file inline comment.

### Self-Annealing event #5 — enum column needs explicit cast in plpgsql
- **Observed:** Probe B (invite lifecycle) failed: `ERROR 42804: column "status" is of type invite_status but expression is of type text` inside `accept_invite_link`.
- **Root cause:** `status = case when … then 'used' else 'active' end` — the CASE expression is text-typed, and Postgres does not implicitly cast text → enum in a plpgsql UPDATE assignment.
- **Action:** Wrapped the CASE in `(... )::invite_status`. Same fix applied to the `status='expired'` write earlier in the function.
- **Documentation updates:** Migration file inline comment. Future RPCs touching enums must include explicit casts.

### Probe results — Phase 5 SQL portion
- ✅ Probe A — RLS isolation (handshake 8 equivalent)
- ✅ Probe B — Invite link lifecycle (handshake 9 equivalent)
- ✅ Probe C — Shared report link lifecycle (handshake 10 equivalent)
- ✅ Probe D — Evidence GIN index + ILIKE fallback (handshake 7 equivalent)

### Still required to complete Phase 5
- User creates 3 private Storage buckets in dashboard: `evidence`, `reports`, `avatars`.
- User saves env vars to `tools/.env` (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — last one only accessible from dashboard, not via MCP).
- User runs `pnpm test:handshakes` locally to cover handshakes 1 (connection), 2 (auth flow), 3 (storage upload), 4 (file metadata), 5 (PDF determinism), 6 (DOCX determinism).

### Next
1. Receive new project ref.
2. `apply_migration` for `0001_handshake_bootstrap.sql` via Supabase MCP.
3. User creates 3 private Storage buckets in dashboard: `evidence`, `reports`, `avatars`.
4. Run handshake-equivalent SQL probes via Supabase MCP (RLS isolation, invite link, share link).
5. Run `tools/test_pdf_generation.ts` + `tools/test_docx_generation.ts` locally (purely client-side, no Supabase needed) — user runs these.
6. Mark Phase 5 complete, kick off Phase 6.

---

## Errors / lessons (Self-Annealing log)
*(empty)*
