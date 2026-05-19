# claude.md — Project Constitution
**Project:** Professional Registration Intelligence Platform (PRIP)
**Owner:** David (tshifhiwandwamise@gmail.com)
**Framework:** B.L.A.S.T + A.N.T 3-Layer Architecture
**Status:** Blueprint Phase — awaiting discovery answers
**Last Updated:** 2026-05-19

> This file is **law**. Every code change must conform to the rules below. If business logic must change, update this file (and the relevant /architecture SOP) **before** changing code.

---

## 1. Core System Purpose
A cloud-accessible, multi-user SaaS platform that helps South African construction, project management, and engineering professionals prepare for professional registration with:
- **ECSA** — PrEng, PrTechEng
- **SACPCMP** — PrCM, PrPM

Users complete monthly logbooks, upload evidence, map competencies, and generate professional monthly PDF/DOCX reports suitable for filing into a personal development portfolio.

## 2. Architectural Rules (placeholder — finalised after Discovery)
- Multi-tenant. Every domain table carries `workspace_id`.
- Data-first. Schemas approved before any code.
- Deterministic tools. No AI inference in the critical path of evidence handling, competency scoring, or report generation.
- SOPs in `/architecture/` govern code. Code never leads.
- All evidence is immutable once uploaded. Edits create new versions.

## 3. Security Rules (placeholder)
- Authentication via managed provider (Supabase Auth preferred).
- Row Level Security on every table.
- Signed URLs only — no public storage paths.
- Invite tokens stored hashed.
- Shared report tokens stored hashed, revocable, optionally expiring, optionally password-protected.
- Audit log on every mutation of monthly logs, evidence, reports, memberships, and shared links.
- No password storage in application tables.

## 4. Multi-User Rules (placeholder)
- A user may own multiple workspaces and be a member of others.
- Roles: owner, admin, editor, viewer, mentor, reviewer.
- Permissions resolved via `workspace_members` join, enforced in RLS policies.
- One user's data is never visible to another user except through explicit workspace membership or an explicit `SharedReportLink`.

## 5. Workspace Model (placeholder)
- `Workspace` owns `Projects`, `MonthlyLogs`, `EvidenceFiles`, `Competencies`, `RegistrationTracks`, `MonthlyReports`, `Mentors`, `Supervisors`, and audit entries.
- A workspace can hold ECSA and SACPCMP tracks simultaneously; the user switches active track in the UI.

## 6. Data Schemas
See Section 3.1–3.3 of the master prompt. Detailed JSON schemas will be drafted in `/architecture/data_model.md` once Discovery answers are received. **No table is created until this is approved.**

## 7. ECSA Framework Rules
- 11 Outcomes mapped to Outcome Groups A–E.
- Responsibility Levels A (Exposed) → E (Performing).
- Self-rating uses CDC / CDI / CNDD / CND / X.
- High ratings (CDC, CDI) require linked `EvidenceFile` or `EvidenceAnnexure` rows.
- Reports use first-person professional language; the system flags weak passive constructions.

## 8. SACPCMP Framework Rules
- Competency areas: construction mgmt, project mgmt, contract admin, financial, commercial, programme, procurement, quality, HSE, risk, stakeholder, leadership, ethics, professional development.
- Internal readiness ratings: Strong / Moderate / Limited / None / N/A.
- Strong rating requires linked evidence.

## 9. Evidence Handling Rules
- Supported types: PDF, DOCX, XLSX, PNG, JPG, JPEG, CSV, TXT.
- Original file is stored once and **never modified**.
- Metadata (tags, annexure ref, linked competencies, linked log) is mutable.
- Soft-delete only; hard-delete requires explicit owner action and audit entry.
- Annexures are derived references; one evidence file can produce multiple annexures across reports.

## 10. Report Generation Rules
- Reports are reproducible from `MonthlyLog` + linked `EvidenceAnnexure` rows at generation time.
- Every report is versioned (`draft`, `final`, `revised`); a final report cannot be edited — only revised.
- Exports are stored in Supabase Storage with signed URL access.
- Reports are A4, print-ready, black-and-white friendly.

## 11. File Storage Rules
- Buckets: `evidence/` (private), `reports/` (private, signed URLs), `avatars/` (public-readable only with signed URL pattern).
- Storage paths: `{workspace_id}/{entity_type}/{entity_id}/{filename}`.
- Storage policies mirror RLS — membership check on every read.

## 12. UI / UX Design Rules
- Dark mode first, Linear/Vercel aesthetic.
- 8px spacing system, 12–16px card radius.
- Maximum 5 font sizes per view, 2 font families.
- WCAG AA contrast. No colour-only meaning — pair with icon + text.
- `prefers-reduced-motion` respected. Animations ≤ 300ms typical.
- Minimum tap target 44×44px.

## 13. Accessibility Rules
- All form inputs labelled (no placeholder-only labels).
- Validation inline, not only on submit.
- Keyboard navigable; no keyboard traps.
- Alt text on every image.
- Skip-to-content link on every page.

## 14. Anti-Patterns (forbidden)
- Fabricating professional experience, evidence, or competency scores.
- Auto-assigning strong scores without linked evidence.
- Exposing user data across workspaces.
- Public evidence by default.
- Production code before schemas / SOPs are approved.
- Hover-only mobile interactions, hidden desktop nav, placeholder-only form labels.

## 15. Deployment Assumptions (placeholder)
- Frontend: Next.js on Vercel.
- Backend: Supabase (Auth + Postgres + Storage + RLS).
- Server-side report generation via Next.js Route Handlers / Server Actions.
- Environment variables held in Vercel + Supabase; never committed.

## 16. Testing Requirements
- Each `/tools/*` script must have a deterministic test.
- Handshake tests (`/tools/test_*.ts`) must pass before production code is built.
- RLS policies must be tested with at least two distinct user accounts.
- PDF/DOCX exports must be byte-stable for identical input.

## 17. Locked Decisions (Phase 1 Discovery — 2026-05-19)

### 17.1 V1 Scope
- **Registration tracks:** ECSA PrEng, SACPCMP PrCM.
- **Access model:** Invite-only. No public signup. New accounts only via secure invite link from an existing workspace owner.
- **Workspace roles (V1):** `owner`, `editor`, `viewer`. (Mentor, Reviewer, Admin deferred to V2.)
- **North star:** A new user can produce their first compliant monthly report in under 30 minutes. Every UX decision is judged against this.

### 17.2 Technology Stack
- Next.js 14+ (App Router) + TypeScript + TailwindCSS.
- Supabase: Auth, Postgres, Storage, RLS, Edge Functions (for scheduled reminders).
- Hosting: Vercel.
- Region: **af-south-1 (Cape Town)** for both Supabase Postgres and Storage (latency + POPIA residency).
- PDF: `@react-pdf/renderer` (chosen for deterministic, server-side rendering — confirm in handshake test).
- DOCX: `docx` npm package.
- Zip: `archiver` npm package (for full registration pack export).
- Email: Resend or Supabase SMTP integration (TBD in handshake).

### 17.3 Evidence Rules
- Supported types in V1: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, JPEG, email captures (PDF/HTML/.eml), external URLs.
- Originals are **immutable**. Replace = new version; old version retained for audit.
- **Soft-delete** with 30-day recovery window. Hard-delete requires explicit owner action and writes an `AuditLog` entry with a reason.
- Tagging + full-text search across `file_name`, `description`, `tags` (file *contents* indexing deferred to V2).
- Annexures are **excluded by default** from shared report links.

### 17.4 Report Outputs (V1)
- Monthly PDF report (per track template).
- Monthly DOCX report (per track template).
- Competency dashboard export (PDF).
- Annual summary report (PDF + DOCX).
- Full registration pack (ZIP: all monthly reports + linked annexures + competency dashboard + annual summary).

### 17.5 Shared Report Link Defaults
- **Login required** (receiver must sign in to a free account).
- **30-day expiry** by default; owner may extend up to 180 days or revoke at any time.
- **Annexures excluded** by default; owner may opt-in per share.
- Every access writes an `AuditLog` entry.

### 17.6 Reminders / Notifications (V1)
- Email reminder on the 25th of each month if the current month's log is not yet at `submitted` status.
- In-app banner on dashboard when the current month has no log row.
- Weekly digest (Mondays) of evidence uploaded but not yet linked to a log or competency.
- All notifications respect a per-user opt-out in Settings.

### 17.7 Design Direction
- **Both themes**, dark default. Light mode is a first-class deliverable in V1 (every token has both values, every page tested at WCAG AA in both).
- Aesthetic: Linear / Vercel / Stripe Dashboard. No glassmorphism beyond modals and upload zones.
- 8px spacing, 12–16px card radius, max 5 font sizes / 2 font families per view.
- Animations ≤ 300ms, `prefers-reduced-motion` respected.

### 17.8 SACPCMP competency framework (D13 — 2026-05-19)
- Seed **both** SACPCMP frameworks side-by-side:
  - `SACPCMP_OFFICIAL_9` — the PMBOK-aligned 9 Knowledge Areas SACPCMP uses for assessment.
  - `SACPCMP_OPERATIONAL_14` — the operational sub-categories from the master prompt (HSE, leadership, ethics, etc.).
- Workspace owner picks the primary view in settings (default: `SACPCMP_OFFICIAL_9`).
- A curated `competency_crosswalks` table derives coverage on the non-primary view automatically.
- Reports for SACPCMP submission always render the 9-KA view; operational tags appear as secondary annotation.

### 17.9 Open Items (to revisit before production)
- Confirm whether the user-supplied "Road to Registration" PDF changes any ECSA Outcome wording or responsibility-level descriptors.
- Confirm transactional email provider (Resend vs Supabase SMTP vs other).
- Confirm Supabase project tier (Free → Pro at production cutover).
- Per-workspace storage quota (proposed: 5 GB Free, 50 GB Pro).
