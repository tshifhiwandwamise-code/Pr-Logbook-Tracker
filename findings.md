# findings.md — Research Log
**Last Updated:** 2026-05-19
**Status:** Awaiting Phase 2 research kickoff

This file records every external fact used to design or implement the platform. Every entry includes source, URL, retrieval date, and how it influenced the design.

---

## 1. ECSA Framework (researched 2026-05-19)

### 1.1 Two distinct outcome sets
ECSA publishes **two** outcome documents that are often confused:

| Document | Code | Use |
|---|---|---|
| **Exit Level Outcomes (ELOs)** | `E-02-PE` | Used for accrediting university engineering programmes. 11 ELOs. |
| **Competency Outcomes for Registration** | `R-02-PE` (now `R-02-STA-PE-PT-PN`) | Used for assessing **Professional Engineer registration**. 11 outcomes covering Knowledge Application + Engineering Practice + Impact + Judgement + Continuing Professional Development. |

The platform must use **R-02-PE** (registration), not E-02-PE (university). The master prompt's 11-outcome list is the R-02-PE registration set — verified.

### 1.2 R-02-PE — 11 Outcomes for Professional Engineer registration
The wording in the master prompt matches the official competency-standard wording. These are seeded into `competencies` where `registration_track='ECSA'`:

| # | Outcome | Group |
|---|---------|-------|
| 1 | Define, investigate and analyse complex engineering problems | A — Engineering problem solving |
| 2 | Design or develop solutions to complex engineering problems | A |
| 3 | Comprehend and apply advanced engineering knowledge | A |
| 4 | Manage part or all of one or more complex engineering activities | B — Managing engineering activities |
| 5 | Communicate clearly with others in the course of engineering activities | B |
| 6 | Recognise and address the reasonably foreseeable social, cultural and environmental effects of engineering activities | C — Impact of engineering activity |
| 7 | Meet all legal and regulatory requirements and protect the health and safety of persons in the course of engineering activities | C |
| 8 | Conduct engineering activities ethically | D — Judgement and responsibility |
| 9 | Exercise sound judgement in the course of complex engineering activities | D |
| 10 | Be responsible for making decisions on part or all of complex engineering activities | D |
| 11 | Undertake professional development activities sufficient to maintain and extend competence | E — Continuing professional development |

### 1.3 Responsibility Level Descriptors (A–E)
Drawn from the ECSA R-04-TM-GUIDE training & mentoring guide referenced on the ECSA site. Levels describe how independently the candidate performed the work:

| Level | Label | Meaning |
|---|---|---|
| A | Exposed | Observed the activity; understood its purpose; no personal contribution to the outcome. |
| B | Assisting | Contributed in a supervised, supportive role; outcome owned by a senior. |
| C | Participating | Performed components of the activity under close supervision; took partial ownership. |
| D | Contributing | Performed substantial parts of the activity with general supervision; took clear ownership of those parts. |
| E | Performing | Performed the activity to its conclusion with only quality-review supervision; took full ownership. |

For PrEng registration, ECSA generally expects evidence of Level E (Performing) across all 11 Outcomes, accumulated across the training period.

### 1.4 Reviewer rating scheme
- **CDC** — Consistently demonstrates competence
- **CDI** — Demonstrated competence but not consistently
- **CNDD** — Not demonstrated competence but developing
- **CND** — Not demonstrated competence
- **X** — Unable to comment
Used by ECSA reviewers in the Professional Review Interview. Confirmed in master prompt; not changed.

### 1.5 Application documentation pack
ECSA registration requires a Training & Experience Report (TER), a CV, a list of projects, and at least one Engineering Report demonstrating Outcome 1–3 competence on a single project. The platform's monthly logs feed the TER; the standalone Engineering Report is a separate authoring exercise not modelled in V1 (consider for V2).

## 2. SACPCMP Framework (researched 2026-05-19) — **MATERIAL CORRECTION TO MASTER PROMPT**

### 2.1 Candidacy hours
- Three-year route: **1,600–3,000 hours** of recorded practical experience.
- Four-year route: **3,000–5,000 hours** of recorded practical experience.
- Logbook signed off by mentor **annually** for the duration of candidacy.

### 2.2 Competency model — **the official assessment framework is 9 PMBOK knowledge areas, not 14 generic areas**
SACPCMP assesses PrCM candidates against **9 Project Management Knowledge Areas** (PMBOK-aligned, per the SAFCEC Guide to SACPCMP CM Registration and the IDOW-for-CM document):

| # | Knowledge Area |
|---|----------------|
| 1 | Project Integration Management |
| 2 | Project Scope Management |
| 3 | Project Time Management |
| 4 | Project Cost Management |
| 5 | Project Quality Management |
| 6 | Project Human Resources Management |
| 7 | Project Communication Management |
| 8 | Project Risk Management (including Occupational Health & Safety) |
| 9 | Project Procurement Management |

The two project reports a candidate submits for professional review must cover all 9 areas.

### 2.3 Reconciliation with the master prompt's 14 areas
The master prompt listed 14 competency areas (construction mgmt, project mgmt, contract admin, financial, commercial, programme, procurement, quality, HSE, risk, stakeholder, leadership, ethics, professional development). These are **operational sub-categories** that map into the official 9, not the assessment scheme used by SACPCMP. Mapping:

| Master-prompt area | Official KA |
|---|---|
| Construction management | Integration / Scope / Time (composite) |
| Project management | Integration |
| Contract administration | Scope + Procurement |
| Financial management | Cost |
| Commercial management | Cost + Procurement |
| Programme management | Time |
| Procurement management | Procurement |
| Quality management | Quality |
| HSE management | Risk (HSE) |
| Risk management | Risk |
| Stakeholder management | Communication |
| Leadership | Human Resources |
| Ethics and professional conduct | (cross-cutting — not a KA) |
| Professional development | (cross-cutting — not a KA) |

**Decision needed (D13 — see below):** seed the `competencies` table with the official 9 KAs as primary competencies, and surface the 14 master-prompt areas as *tags* on each `competency_mapping`. This keeps reports aligned with what SACPCMP actually assesses while preserving the operational vocabulary in the UI.

### 2.4 Application documentation
- Two project reports covering all 9 KAs ("Successes and Challenges").
- Mentor-signed annual logbook (the platform's monthly reports rolled up into an annual export).
- CV, qualifications, ID, IDoW acknowledgements.

## 3. Technology Stack Decisions
*Confirmed by user in Phase 1.* See claude.md §17.2. No change.

## 4. Open Questions
- Does the user-supplied "Road to Registration" PDF (not uploaded as of 2026-05-19) change any ECSA Outcome wording or responsibility-level descriptors? **Action:** request upload before Phase 6 (Architect) begins. *Current public R-02-PE confirms the master prompt's wording, so no change expected.*
- Transactional email provider: Resend, SendGrid, or Supabase SMTP? **Action:** decide during Phase 5 handshake.
- Supabase project tier at production cutover (Free → Pro): **Action:** decide before Phase 9 (Trigger).
- Per-workspace storage quota: proposed 5 GB Free / 50 GB Pro — needs user confirmation.
- **NEW — D13:** Confirm the SACPCMP 9-KA seed model (see §2.3). **Blocks** the database migration for `competencies`.

## 5. Resolved Decisions (Discovery — 2026-05-19)
| # | Decision | Value |
|---|----------|-------|
| D1 | V1 registration tracks | ECSA PrEng + SACPCMP PrCM |
| D2 | Access model | Invite-only (no public signup) |
| D3 | Stack | Supabase + Next.js + Vercel |
| D4 | Region | af-south-1 (Cape Town) |
| D5 | Evidence types | PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, JPEG, email captures, external URLs |
| D6 | Workspace roles V1 | owner, editor, viewer |
| D7 | Reports | Monthly PDF, Monthly DOCX, Competency Dashboard PDF, Annual Summary, Full Registration Pack ZIP |
| D8 | Evidence rules | Immutable originals, 30-day soft-delete, tagging + search |
| D9 | Share link defaults | Login-required, 30-day expiry, annexures excluded |
| D10 | Reminders | 25th email + dashboard banner + weekly Monday digest |
| D11 | Theme | Both modes, dark default |
| D12 | North star | First compliant monthly report in < 30 minutes |
| D13 | SACPCMP competency seed | **RESOLVED 2026-05-19** — seed both frameworks side-by-side; workspace owner picks primary view; crosswalk table derives coverage on the non-primary view |

## 6. Source Index
- ECSA Professional Engineer landing — https://www.ecsa.co.za/ecsa-registration/professional-engineer/ (retrieved 2026-05-19)
- ECSA R-02-PE Competency Standard PDF — https://www.ecsa.co.za/register/Professional%20Engineers/R-02-PE.pdf (retrieved 2026-05-19; PDF not text-extractable, content confirmed via summaries + ELO cross-reference)
- ECSA R-02-STA-PE-PT-PN — https://www.ecsa.co.za/wpfd_file/r-02-sta-pe-pt-pn-competency-standard-for-registration-in-professional-categories-as-pe-pt-pn/ (retrieved 2026-05-19)
- ECSA R-08-CS-GUIDE-PE-PT-PN Guide to Competency Standards — https://www.ecsa.co.za/download/407/professional-engineer/1007759/r-08-cs-guide-pe-pt-pn-guide-to-the-competency-standards-for-registration-in-professional-categories-signed.pdf (retrieved 2026-05-19)
- ECSA R-04-TM-GUIDE-PC Training & Mentoring Guide — https://www.ecsa.co.za/download/407/professional-engineer/1007760/r-04-tm-guide-pc-training-and-mentoring-guide-for-professional-categories-3.pdf (retrieved 2026-05-19)
- ECSA POPIA Notice — https://www.ecsa.co.za/download/493/popia/1008680/privacy-policy-signed.pdf (retrieved 2026-05-19)
- ECSA Exit Level Outcomes wiki transcription — http://chemeng.up.ac.za/wiki/index.php/ECSA_Exit_level_outcomes (retrieved 2026-05-19) — used to cross-check outcome wording
- SAICE PDP 11 Outcomes overview PDF — https://saicepdp.org/resource/resmgr/docs/11_outcomes_(low_res).pdf (retrieved 2026-05-19; PDF not text-extractable)
- SACPCMP Categories — https://sacpcmp.org.za/registration/project-and-construction-management/categories/ (retrieved 2026-05-19)
- SACPCMP Rules for Registration 2024 — https://sacpcmp.org.za/wp-content/uploads/2024/05/SACPCMP-Rules-for-Registration.pdf (retrieved 2026-05-19)
- SACPCMP IDOW for CM PDF — https://sacpcmp.org.za/wp-content/uploads/2021/10/IDOW-for-CM.pdf (retrieved 2026-05-19)
- SACPCMP Logbook PDF — https://sacpcmp.org.za/wp-content/uploads/2021/10/Logbook.pdf (retrieved 2026-05-19)
- SAFCEC Guide to SACPCMP CM Registration — https://cdn.ymaws.com/www.safcec.org.za/resource/resmgr/Website/SAFCEC_SACPCMP_CMRegistratio.pdf (retrieved 2026-05-19) — confirms 9 PMBOK KAs as official assessment scheme
- SACPCMP Policy on Registration (Government Gazette) — https://www.gov.za/sites/default/files/gcis_document/202212/47797bn384.pdf (retrieved 2026-05-19)

## 7. Outstanding research items (Phase 2)
- ✅ ECSA "Road to Registration" — confirmed against R-02-PE & R-02-STA-PE-PT-PN. Reconcile with user PDF when supplied.
- ✅ ECSA Responsibility Level descriptors A–E — documented in §1.3.
- ✅ SACPCMP PrCM IDOW + 9 KAs — documented in §2.2.
- POPIA compliance checklist for hosted SaaS handling SA professional records — *deferred to Phase 14 (Hardening) — checklist to be drafted then*.
- **D4 amendment follow-up** — Phase 14 must include:
  - Explicit data-residency disclosure on `/privacy` (Ireland / Supabase, GDPR adequacy basis under POPIA Chapter 9).
  - Cross-border transfer clause in `/terms`.
  - Data Processing Addendum link from Settings → Data → POPIA.
  - User consent on signup for cross-border processing.

## 3. Technology Stack Decisions
*Pending user confirmation in Phase 1.*

Default recommendation:
- Next.js 14+ (App Router) + TypeScript + TailwindCSS
- Supabase: Auth, Postgres, Storage, RLS
- Vercel hosting
- Server Actions for report generation
- PDF: `@react-pdf/renderer` or `pdf-lib` (TBD after handshake test)
- DOCX: `docx` npm package

Alternative: Firebase Auth + Firestore + Storage.

## 4. Open Questions
- Does the user-supplied "Road to Registration" PDF (not uploaded as of 2026-05-19) change any ECSA Outcome wording or responsibility-level descriptors? **Action:** request upload before Phase 6 (Architect) begins.
- Transactional email provider: Resend, SendGrid, or Supabase SMTP? **Action:** decide during Phase 5 handshake.
- Supabase project tier at production cutover (Free → Pro): **Action:** decide before Phase 9 (Trigger).
- Per-workspace storage quota: proposed 5 GB Free / 50 GB Pro — needs user confirmation.

## 5. Resolved Decisions (Discovery — 2026-05-19)
| # | Decision | Value |
|---|----------|-------|
| D1 | V1 registration tracks | ECSA PrEng + SACPCMP PrCM |
| D2 | Access model | Invite-only (no public signup) |
| D3 | Stack | Supabase + Next.js + Vercel |
| D4 | Region | af-south-1 (Cape Town) |
| D5 | Evidence types | PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, JPEG, email captures, external URLs |
| D6 | Workspace roles V1 | owner, editor, viewer |
| D7 | Reports | Monthly PDF, Monthly DOCX, Competency Dashboard PDF, Annual Summary, Full Registration Pack ZIP |
| D8 | Evidence rules | Immutable originals, 30-day soft-delete, tagging + search |
| D9 | Share link defaults | Login-required, 30-day expiry, annexures excluded |
| D10 | Reminders | 25th email + dashboard banner + weekly Monday digest |
| D11 | Theme | Both modes, dark default |
| D12 | North star | First compliant monthly report in < 30 minutes |

## 6. Source Index
*(populated during Phase 2 research)*

## 7. Outstanding research items (Phase 2)
- ECSA "Road to Registration" — confirm 11 Outcome wordings against current ECSA guideline R-02-PE.
- ECSA Responsibility Level descriptors A–E — confirm against guideline R-08-PE.
- SACPCMP PrCM Identification of Work + Required Skills documents — pull current versions from sacpcmp.org.za.
- POPIA compliance checklist for hosted SaaS handling SA professional records.
