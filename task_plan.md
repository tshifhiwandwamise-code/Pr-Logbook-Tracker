# task_plan.md — Master Build Plan
**Status:** Phase 1 (Blueprint) — Discovery in progress
**Last Updated:** 2026-05-19

This plan implements the B.L.A.S.T framework. Each phase has an explicit gate. No phase begins until the prior gate is approved.

---

## Phase 0 — Initialization  ✅ in progress
- [x] Create `claude.md` scaffold (Project Constitution)
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [ ] Confirm with user the four files are visible / acceptable

## Phase 1 — Blueprint (Discovery) ⏳ awaiting answers
Discovery topics:
1. North Star
2. Registration tracks for V1
3. User types
4. Multi-user access model
5. Source of truth for monthly data
6. Evidence handling rules
7. Required report outputs
8. Cloud storage strategy
9. Design preference

**Gate:** explicit user approval of answers before Phase 2.

## Phase 2 — Research
- ECSA "Road to Registration" — 11 Outcomes, Outcome Groups A–E, Responsibility Levels A–E, TES / TER, IPD.
- SACPCMP — current PrCM / PrPM competency framework (web research, official sources).
- Logged in `findings.md` with source URLs and retrieval dates.

**Gate:** user accepts research summary.

## Phase 3 — Data-First (Schemas)
- Draft full JSON schemas for every entity listed in Sections 3.1–3.3 of the master prompt.
- Draft Supabase Postgres DDL (migrations, not executed yet).
- Draft RLS policies for every table.
- Draft storage bucket layout and policies.

**Gate:** user signs off schemas, RLS, and bucket layout.

## Phase 4 — Architecture (SOPs)
- Create every SOP in `/architecture/` listed in Section 6.
- Each SOP: purpose, inputs, outputs, business logic, validation, security, edge cases, error handling, testing.

**Gate:** user signs off SOPs.

## Phase 5 — Link (Handshake Tests)
- Build `/tools/test_*.ts` scripts (Section 5).
- All handshakes must pass on a dev Supabase project before production code is written.

**Gate:** all handshakes green.

## Phase 6 — Architect (A.N.T Layers)
- Folder structure per Section 6.
- Build deterministic `/tools/*` scripts.

## Phase 7 — Stylize (Design System)
- Tokens, components, page layouts implementing Section 13.
- Component library: button, input, table, card, modal, badge, progress, tabs, sidebar.

## Phase 8 — Build V1 (Section 17 deliverables, 27 items)
1. Public landing
2. Signup / login
3. Account creation
4. Workspace creation
5. Dashboard
6. ECSA module
7. SACPCMP module
8. Track switcher
9. Monthly log forms
10. Evidence upload
11. Annexure register
12. Competency mapping
13. Competency scoring
14. PDF monthly report
15. DOCX monthly report
16. Evidence repository
17. Reports library
18. Invite-by-link
19. Roles / permissions
20. Shared report links
21. Supabase DB
22. Supabase Storage
23. RLS
24. Audit logging
25. Dark-mode SaaS UI
26. Responsive
27. Accessibility (WCAG AA)

## Phase 9 — Trigger (Deployment)
- Vercel project, env vars, prod Supabase, RLS policies live, backup strategy, error logging.

## Phase 10 — Verification
- Multi-account RLS tests
- Byte-stable PDF/DOCX export tests
- Accessibility audit (axe / lighthouse)
- Manual end-to-end walkthrough on ECSA + SACPCMP

---

## Open Decisions (need user input)
- See `findings.md` § "Open Questions" — populated from Discovery answers.

## Risk Register (initial)
- R1 — SACPCMP framework changes between research and ship: mitigate by storing framework as data (`Competency` table), not hard-coded enums.
- R2 — Storage costs scale with evidence volume: mitigate with per-workspace quotas to be defined.
- R3 — Report determinism breaks if template changes mid-cycle: mitigate by versioning report templates.
- R4 — Shared links leak data: mitigate with hashed tokens, expiry, optional password, audit log.
