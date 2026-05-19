# report_templates.md — V1 Report Templates (PROPOSAL)
**Status:** DRAFT — awaiting approval.

Two templates live in V1: ECSA (Section 9 of master prompt) and SACPCMP (Section 10). Both render to PDF (`@react-pdf/renderer`) and DOCX (`docx` npm package) from the same JSON payload so a final PDF and DOCX are guaranteed byte-identical-in-meaning.

Both templates share:
- **Page size:** A4, 25 mm margins, page numbers footer-right, document version footer-left.
- **Fonts:** Inter Regular + Semibold; JetBrains Mono for codes / annexure refs.
- **Greyscale-safe:** semantic meaning never conveyed by colour alone (rating bars are labelled).
- **Cover page → Table of contents → Body sections → Annexure register → Annexures (when included)**.

---

## 1. ECSA Monthly Report

### Cover
- Candidate name, Registration track: **ECSA**, Target: PrEng, Month / Year, Project name, Employer, Supervisor, Mentor, Report version, Generated date.

### Section 1 — Monthly Experience Summary
- 150–250 word free text.
- Inline "writing-quality" hint shown in the editor (not in the rendered PDF): flags weak passive wording ("we did…", "I was exposed to…") and suggests first-person verbs.

### Section 2 — Project / Period Information
Table:
| Field | Details |
|---|---|
| Project Name | … |
| Location | … |
| Client | … |
| Employer | … |
| Contract Type | … |
| Project Value (ZAR) | … |
| Role | … |
| Reporting Line | … |
| Supervisor | … |
| Mentor | … |
| Month Covered | … |

### Section 3 — Nature of Training and Experience
Free text. Encouraged: type-of-work focus, not project description.

### Section 4 — Engineering Problem-Solving
One row per `ecsa_problem_solving_entries` linked to the month:
| Problem / Challenge | Analysis Method | Options Considered | Solution Implemented | Evaluation / Outcome | Evidence Ref |

### Section 5 — ECSA Outcome Mapping (11 rows)
| Outcome | Evidence This Month | Responsibility Level | Self-Rating | Evidence Ref | Gap / Action |

Rendered from `competency_mappings` joined to the 11 ECSA outcomes. Outcomes without an entry this month render with "—" placeholders and a "Gap / Action" cell prefilled with "Plan next-month evidence".

### Section 6 — Responsibility Level
Big-text statement of the chosen level (A–E) with the descriptor.

### Section 7 — Documentation and Communication
Free text + optional bullet list.

### Section 8 — Management of Resources
Six-row table: Materials / Machines / Manpower / Methods / Money / Contracts.

### Section 9 — Stakeholder and Discipline Interaction
Free text.

### Section 10 — HSE, Environmental and Legal Considerations
Three subsections.

### Section 11 — IPD / Professional Development
Table from `professional_development_activities`:
| Title | Type | Provider | Date | Hours | Evidence Ref |

### Section 12 — Reflection
From `reflections` row: What I learned / did well / need to improve / next experience needed.

### Section 13 — Evidence Annexure Register
| Annexure Ref | Evidence Title | File Type | Linked Outcome | Description |

### Annexures
Each `evidence_annexure` with `include_in_shared_report=true` (or always, in the owner's full-pack export) is embedded:
- PDF/Image files: embedded directly.
- DOCX/XLSX: rendered as a placeholder page "Annexure A3 — [filename] — see attached file" with the bundled file referenced in the ZIP pack.
- URL evidence: rendered as a citation card.

---

## 2. SACPCMP Monthly Report

### Cover
- Candidate, Track: **SACPCMP**, Target: PrCM, Month/Year, Project, Employer, Client, Role, Supervisor, Report version, Generated date.

### Section 1 — Monthly Executive Summary
150–250 words, construction-management focus.

### Section 2 — Project and Role Overview
Same table layout as ECSA Section 2.

### Section 3 — Construction Activities Managed
| Activity | Scope Managed | Resources Managed | Status | Evidence Ref |

### Section 4 — Programme and Planning Management
Free text.

### Section 5 — Contract Administration
| Item | Description | Contractual Impact | Action Taken | Evidence Ref |

### Section 6 — Commercial and Financial Management
Free text + optional cost-tracking sub-table.

### Section 7 — Procurement and Subcontractor Management
Free text.

### Section 8 — Quality Management
Free text.

### Section 9 — HSE Management
Free text.

### Section 10 — Stakeholder Management
Free text.

### Section 11 — Leadership and Team Management
Free text.

### Section 12 — Problems, Decisions and Outcomes
| Problem | Cause / Context | Options Considered | Decision Made | Outcome | Evidence Ref |

### Section 13 — SACPCMP Competency Mapping
| Competency Area | Evidence This Month | Strength Rating | Evidence Ref | Gap / Next Action |
14 rows (one per SACPCMP V1 competency).

### Section 14 — Monthly Reflection
From `reflections` row.

### Section 15 — Evidence Annexure Register
Same shape as ECSA.

### Annexures
Same handling as ECSA.

---

## 3. Competency Dashboard PDF (cross-month)
- Cover page (candidate, track, range, generated date, version).
- Page 1: Outcome / competency heatmap (months × competencies, cell = rating).
- Page 2: Per-outcome trend (rating across months) — small multiples.
- Page 3: Evidence count per outcome.
- Page 4: Gap analysis — outcomes with no CDC rating in the last 6 months.

## 4. Annual Summary Report
- Cover + executive narrative (auto-drafted from monthly summaries, **owner-editable** before final).
- 12-month timeline of projects and roles.
- Competency dashboard pages (above).
- Aggregated IPD hours.
- Reflection: year-end action plan (owner-written).

## 5. Full Registration Pack (ZIP)
Layout:
```
/00_Cover_Letter.pdf
/01_Annual_Summary.pdf
/02_Competency_Dashboard.pdf
/Monthly_Reports/
  2025-06_ECSA.pdf
  2025-06_ECSA.docx
  …
/Evidence/
  A1_inspection_report.pdf
  A2_payment_certificate.pdf
  …
/manifest.json   /* machine-readable index */
```

---

## 6. Versioning
- Reports stored as `monthly_reports` rows with `version` int.
- A `final` report is locked. Generating a new export creates `version+1` with `report_status='revised'`. Audit trail in `audit_logs`.
- Every export materialised file stored in `reports/{workspace_id}/{report_id}/v{version}.{pdf|docx}`.

## 7. Determinism guarantee
- Same input JSON ⇒ byte-identical PDF and DOCX. Achieved by:
  - Pinning fonts to bundled `.ttf` files.
  - Disabling timestamps inside the documents (only the cover page shows "Generated: YYYY-MM-DD" which is part of the input).
  - Sorting all collections by stable keys before rendering.
  - Pinning library versions in `package.json`.

**Approval required:** template sections, ordering, dashboard layout, ZIP structure, determinism approach.
