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
- **Awaiting:** new Supabase project ref in eu-west-1.

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
