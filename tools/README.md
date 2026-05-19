# Handshake Tests — Phase 5 (Link Phase)

Per `task_plan.md`, **production code does not start until every handshake passes**. These ten scripts verify that the technical foundations of the PRIP platform work end-to-end against a real Supabase project before any feature is written.

## Prerequisites

1. **Supabase project** in `af-south-1` (Cape Town). Free tier is fine for handshakes.
2. **Node 20+** and **pnpm 9+**.
3. Run the bootstrap migration:
   ```bash
   psql "$SUPABASE_DB_URL" -f ../database/migrations/0001_handshake_bootstrap.sql
   ```
   This creates the minimum schema the handshakes need. The full 23-table migration is built in Phase 1 of the production build (see `development_phases.md`).
4. Create three Supabase Storage buckets via the Supabase dashboard: `evidence` (private), `reports` (private), `avatars` (private).
5. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (used only by handshakes; never shipped to browser)
   - `SUPABASE_DB_URL` (Postgres connection string, for the migration step)

## Install & run

```bash
pnpm install
pnpm test:handshakes        # runs all 10 handshakes in order, stops on first failure
pnpm test:handshake:auth    # runs a single handshake (replace 'auth' with name)
```

## What each script proves

| Script | Asserts |
|---|---|
| `test_supabase_connection.ts` | Anon + service-role clients connect; round-trip `select 1` returns. |
| `test_auth_flow.ts` | Signup → email verify (auto-confirmed in dev) → login → refresh → logout. |
| `test_storage_upload.ts` | Upload a 1 KB file via signed upload URL; retrieve via signed download URL; file bytes match. |
| `test_file_metadata.ts` | Client computes sha256 + size; server stores them; round-trip equality. |
| `test_pdf_generation.ts` | Render a one-page sample PDF; the same input twice yields the same sha256. |
| `test_docx_generation.ts` | Same determinism test for DOCX. |
| `test_evidence_indexing.ts` | Insert evidence rows with tags + description; tsvector search returns the expected rows. |
| `test_rls_permissions.ts` | User A cannot read user B's workspace data (proves RLS works). |
| `test_invite_link.ts` | Owner creates invite → second account accepts → second accept fails (single-use) → expired token rejected. |
| `test_shared_report_link.ts` | Owner creates share link → login-required access works for signed-in users → anonymous access rejected → revoked link rejected. |

## Exit criteria for Phase 5

All ten scripts must exit with status 0. Output is printed to stdout; on success the runner prints:

```
✅ all 10 handshakes passed
```

Only then does Phase 6 (Architect / production build) begin.

## Cleanup

`pnpm test:handshakes:cleanup` deletes the test users, workspaces, files, and invite/share rows created during handshakes. The cleanup script is idempotent and safe to re-run.
