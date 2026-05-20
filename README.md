# Pr Logbook Tracker

Professional Registration Intelligence Platform (PRIP) for South African construction, project management, and engineering professionals pursuing **ECSA PrEng** and **SACPCMP PrCM** registration.

> Multi-user, cloud-accessible. Candidates capture monthly logbooks, upload evidence, map competencies, and generate compliant monthly PDF/DOCX reports for their personal development portfolio.

## Status

| Phase | Status |
|---|---|
| 0 — Initialization | ✅ |
| 1 — Blueprint / Discovery (D1–D13 locked) | ✅ |
| 2 — Research | ✅ (ECSA R-02-PE + SACPCMP 9-KA framework documented) |
| 3 — Data-First (Schemas) | ✅ |
| 4 — Architect (SOPs) | ✅ |
| 5 — Link (Handshake) | ✅ closed (8/10 covered, 2 deferred to Phase 14) |
| **6 — Architect / Production build** | ⏳ **in progress** |
| · sub-phase 0 — Next.js scaffold | ✅ |
| · sub-phase 1 — Full schema applied to `wnwkihbrteknhofstbze` | ✅ |
| · sub-phase 2 — Handshakes | ✅ |
| · sub-phases 3-14 — see DEPLOY.md | ⏳ |

## Deploy to Vercel
See **[DEPLOY.md](./DEPLOY.md)** for the complete playbook (Supabase service-role-key handling, env vars, redirect URLs, smoke test).

## Repo layout

```
.
├── app/                        Next.js 14 App Router
│   ├── layout.tsx              Root (dark default, skip-to-content)
│   ├── page.tsx                Landing
│   ├── login/page.tsx          Magic-link sign-in
│   ├── auth/callback/route.ts  OAuth/magic-link exchange
│   ├── dashboard/page.tsx      Authed placeholder
│   └── globals.css             Design tokens (dark + light)
├── lib/
│   ├── supabase/client.ts      Browser client
│   ├── supabase/server.ts      Server + admin clients
│   ├── supabase/middleware.ts  Auth cookie refresh
│   └── utils/cn.ts             classNames helper
├── middleware.ts               Runs auth refresh on every request
├── architecture/               SOPs (data model, RLS, sitemap, reports, phases, storage)
├── database/migrations/
│   ├── 0001_handshake_bootstrap.sql   Bootstrap (6 tables) — applied
│   └── 0002_v1_schema.sql             Full V1 (24 tables, 13 enums, 34 seeds) — applied
├── tools/                      Phase 5 handshake test pack (10 scripts)
├── claude.md                   Project Constitution (law)
├── task_plan.md                10-phase build plan
├── findings.md                 Research log + resolved decisions
├── progress.md                 Session memory + Self-Annealing log
├── DEPLOY.md                   Vercel deployment playbook
├── vercel.json                 Vercel framework + security headers
└── .github/workflows/ci.yml    Lint + typecheck + build on push
```

## Live environment

- **Supabase project**: `wnwkihbrteknhofstbze` — eu-west-1 (Ireland) — Postgres 17.6
- **Storage buckets** (all private): `evidence`, `reports`, `avatars`
- **Schema**: 24 tables + 13 enums + 20 audit triggers + 34 competency rows + 16 crosswalks
- **RLS**: enabled on every domain table

## Local development

```bash
git clone https://github.com/tshifhiwandwamise-code/Pr-Logbook-Tracker.git
cd Pr-Logbook-Tracker
cp .env.local.example .env.local
# Paste your service-role key into SUPABASE_SERVICE_ROLE_KEY in .env.local
npm install
npm run dev  # http://localhost:3000
```

## Tech stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Supabase: Auth + Postgres + Storage + RLS — region eu-west-1
- Vercel hosting (dub1 region)
- `@react-pdf/renderer` + `docx` (monthly report exports)
- `archiver` (registration pack ZIP)

## License

MIT — see [LICENSE](./LICENSE).

## Author

David — tshifhiwandwamise@gmail.com
