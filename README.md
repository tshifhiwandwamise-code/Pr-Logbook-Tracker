# Pr Logbook Tracker

Professional Registration Intelligence Platform (PRIP) for South African construction, project management, and engineering professionals pursuing **ECSA PrEng** and **SACPCMP PrCM** registration.

> Multi-user, cloud-accessible. Candidates capture monthly logbooks, upload evidence, map competencies, and generate compliant monthly PDF/DOCX reports for their personal development portfolio.

## Status

**Phase 5 — Link (Handshake tests).** Production build (Phase 6) starts once all 10 handshakes pass against a live Supabase project.

| Phase | Status |
|---|---|
| 0 — Initialization | ✅ |
| 1 — Blueprint / Discovery | ✅ (D1–D13 locked) |
| 2 — Research | ✅ (ECSA R-02-PE + SACPCMP 9-KA framework documented) |
| 3 — Data-First (Schemas) | ✅ (23 tables) |
| 4 — Architect (SOPs) | ✅ |
| 5 — Link (Handshake) | ⏳ scripts ready, awaiting green run |
| 6 — Architect (build) | 🔒 gated |
| 7–15 | 🔒 gated |

## Repo layout

```
.
├── claude.md                          # Project Constitution (law)
├── task_plan.md                       # 10-phase build plan
├── findings.md                        # Research log + resolved decisions
├── progress.md                        # Session memory
├── architecture/                      # SOPs (data model, RLS, sitemap, reports, phases, storage)
├── database/migrations/               # SQL migrations (Phase 1 bootstrap so far)
└── tools/                             # Phase 5 handshake test pack
```

## Quick start (handshake tests)

```bash
# 1. Provision Supabase project in af-south-1 (Cape Town)
# 2. Run bootstrap migration:
psql "$SUPABASE_DB_URL" -f database/migrations/0001_handshake_bootstrap.sql

# 3. Create private Storage buckets via Supabase dashboard:
#    evidence, reports, avatars

# 4. Configure env:
cp tools/.env.example tools/.env
# fill SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

# 5. Run handshakes:
cd tools
pnpm install
pnpm test:handshakes
```

Expected: `✅ all 10 handshakes passed`.

## Tech stack (locked)

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Supabase: Auth + Postgres + Storage + RLS — region `af-south-1` (POPIA residency)
- Vercel hosting
- `@react-pdf/renderer` (PDF) + `docx` (DOCX) — both byte-stable
- Resend or Supabase SMTP for transactional email

## License

MIT — see [LICENSE](LICENSE).

## Author

David — tshifhiwandwamise@gmail.com
