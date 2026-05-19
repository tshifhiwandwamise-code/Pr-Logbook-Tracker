# development_phases.md — V1 Build Plan (PROPOSAL)
**Status:** DRAFT — awaiting approval.
**Estimated total:** 10–12 working sessions to V1 demo, plus 2 sessions hardening before production.

Each phase has a single **exit gate**: a measurable, demoable outcome. No phase begins until the previous gate is met.

---

## Phase 0 — Repo & infrastructure scaffolding
**Exit:** `pnpm dev` boots a Next.js 14 app shell with Tailwind, Supabase client, and CI lint.
- Bootstrap Next.js 14 + TypeScript + Tailwind + ESLint + Prettier + Husky.
- Add `@supabase/supabase-js`, `@supabase/ssr`.
- Create Supabase project in `af-south-1`. Wire env vars locally + Vercel preview.
- Add Vitest + Playwright shells.
- CI: GitHub Actions for `lint`, `type-check`, `test`, `build`.

## Phase 1 — Database migration v1
**Exit:** all 22 tables exist with RLS enabled in Supabase dev project; seed data inserted.
- Write SQL migrations (one file per concern) under `/database/migrations/`.
- Enable RLS on every table.
- Implement `auth.has_workspace_role()` + audit trigger.
- Seed: 11 ECSA outcomes, 14 SACPCMP competencies.
- Migration tool: Supabase CLI (`supabase db push`).

## Phase 2 — Handshake tests (Link Phase per master prompt §5)
**Exit:** every `/tools/test_*.ts` script passes against the dev Supabase.
- `test_supabase_connection.ts` — anon + service-role round-trip.
- `test_auth_flow.ts` — signup, verify, login, refresh.
- `test_storage_upload.ts` — small file upload, signed URL retrieval.
- `test_file_metadata.ts` — checksum + size capture, immutability assertion.
- `test_pdf_generation.ts` — render a one-page sample PDF and assert byte length & hash.
- `test_docx_generation.ts` — same for DOCX.
- `test_evidence_indexing.ts` — insert evidence + tsvector search returns it.
- `test_rls_permissions.ts` — user A cannot read user B's workspace.
- `test_invite_link.ts` — create, accept, re-accept (must fail), expire (must fail).
- `test_shared_report_link.ts` — create, view (login required), revoke (must fail after).

## Phase 3 — Auth + Workspaces + Members
**Exit:** owner can invite a second account; second account joins as editor; viewer cannot edit.
- `/login`, `/invite/[token]` pages.
- Workspace bootstrap onboarding (4 steps).
- Member management UI at `/app/members`.
- Server actions: `createInviteLink`, `acceptInviteLink`, `removeMember`, `changeRole`.
- E2E test in Playwright covering Journey A.

## Phase 4 — Design system + app shell
**Exit:** all primitive components in Storybook (or docs page) with light + dark snapshots; sidebar + topbar live.
- Tailwind tokens for both themes (see claude.md §17.7).
- Primitives: Button, Input, Textarea, Select, Combobox, Tabs, Tooltip, Dialog, Drawer, Badge, Toast, ProgressBar, Skeleton, Table, EmptyState.
- `TopBar`, `SidebarNav`, `WorkspaceSwitcher`, `TrackSwitcher`.
- Theme toggle with `prefers-color-scheme` default + localStorage override.
- Axe-core unit tests on every primitive.

## Phase 5 — Monthly logs (ECSA)
**Exit:** owner can create, edit, save, and view an ECSA monthly log; log persists across reload.
- `MonthlyLogForm` (4 tabs) for ECSA.
- `EvidenceUploader` inline.
- `CompetencyMapper` for 11 outcomes.
- `ReflectionEditor`.
- `ECSAProblemSolvingForm` (sub-route).
- Validation: only one log per user/track/month/year.
- Save-as-draft autosave every 10 s.

## Phase 6 — Monthly logs (SACPCMP)
**Exit:** owner can create, edit, save, and view a SACPCMP monthly log with the 14-competency mapper.
- SACPCMP variant of `MonthlyLogForm`.
- SACPCMP `CompetencyMapper` (14 areas).
- Reuse `ReflectionEditor`, `EvidenceUploader`.

## Phase 7 — Evidence repository
**Exit:** owner can upload, tag, search, link, soft-delete, and restore evidence.
- `/app/evidence` list with filters (track, project, month, tag, type).
- `/app/evidence/[id]` detail with preview (PDF/image inline, others as download).
- Bulk upload (drag multiple files).
- External URL "upload" form.
- Email-capture form (paste HTML or upload .eml).
- Tag autocomplete from existing tags.
- Soft-delete + 30-day restore; owner-only hard purge with reason.
- Search via Postgres `to_tsvector`.

## Phase 8 — Report generation
**Exit:** owner can generate, preview, finalise, and download a monthly ECSA + SACPCMP report (PDF + DOCX).
- Server actions: `generateMonthlyReport(logId, format)`.
- `@react-pdf/renderer` ECSA + SACPCMP templates.
- `docx` library equivalents.
- Determinism tests: same input ⇒ same hash.
- Final/revised versioning.
- Storage in `reports/` bucket with signed URLs.

## Phase 9 — Competency tracker + dashboard PDF
**Exit:** track-aware heatmap renders; competency dashboard PDF exports.
- `/app/competencies/ecsa` heatmap (months × outcomes).
- `/app/competencies/sacpcmp` heatmap.
- `competency_scores` recalc on log change (Postgres function + trigger).
- Dashboard PDF generator.

## Phase 10 — Reports library + share links
**Exit:** owner can create a share link, invitee can view via login-required link, owner can revoke.
- `/app/reports/[id]` detail with versions table.
- `ShareLinkPanel`: create, copy, revoke, view-count.
- `/r/[token]` public-facing read-only report view.
- `resolveSharedReport` RPC.

## Phase 11 — Annual summary + Full registration pack
**Exit:** ZIP downloads with all monthly reports + dashboard + annual summary + linked annexures.
- Server action: `generateAnnualSummary(year, trackId)`.
- Server action: `generateRegistrationPack(trackId)` — streams ZIP via `archiver`.
- Background job (Supabase Edge Function) for packs >50 MB.

## Phase 12 — Reminders + notifications
**Exit:** test account receives the 25th-of-month email; banner appears when log missing.
- Supabase scheduled function for monthly + weekly notifications.
- Resend (or chosen provider) integration.
- In-app banner on dashboard.
- Per-user opt-out in `/app/settings/notifications`.

## Phase 13 — Audit + Settings + Data export
**Exit:** owner can export full workspace data; audit view shows recent actions.
- `/app/settings/data` — DSAR export RPC.
- Owner-only audit view (last 200 actions).
- Account deletion flow with confirmation + grace period.

## Phase 14 — Production hardening
**Exit:** Lighthouse ≥ 90 (perf + a11y), Playwright suite green, RLS multi-account tests green, SOPs in `/architecture/` all up to date.
- Image optimisation, code splitting audit.
- Error logging (Sentry or Supabase logs).
- Backup verification (point-in-time restore tested).
- **POPIA notice + Terms drafted** — per D4 amendment (2026-05-19), the Privacy Notice MUST explicitly disclose:
  - Data residency = Ireland (Supabase eu-west-1)
  - GDPR adequacy basis under POPIA Chapter 9 for cross-border transfer
  - Personal information collected (name, email, evidence files, professional records)
  - Cross-border transfer clause in Terms of Service
  - Data Processing Addendum link from Settings → Data → POPIA
  - User consent on signup for cross-border processing
- Load test: 50 concurrent users.

## Phase 15 — Production launch
**Exit:** app live at production URL; first real workspace created and used.
- Supabase Pro upgrade.
- Vercel production env.
- DNS, SSL.
- Smoke test runbook.

---

## What is **deferred** to V2 (explicitly out of V1 scope)
- Mentor / Reviewer / Admin roles (only owner/editor/viewer in V1).
- ECSA PrTechEng + SACPCMP PrPM tracks (only PrEng + PrCM in V1).
- OAuth / SSO.
- Mentor comments + threaded feedback.
- File-content full-text indexing (V1 indexes filename/description/tags only).
- Specialised SACPCMP entry tables (V1 uses generic monthly log fields).
- PWA / offline mode.
- Public marketing pages beyond a single landing page.

---

**Approval required:** phase ordering, exit gates, deferred-to-V2 list.
