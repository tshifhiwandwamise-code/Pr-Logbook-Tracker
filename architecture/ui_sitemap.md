# ui_sitemap.md — V1 Page Map (PROPOSAL)
**Status:** DRAFT — awaiting approval.

The sitemap follows the master prompt's navigation (Section 7) and the locked decisions (invite-only, owner/editor/viewer, ECSA PrEng + SACPCMP PrCM).

---

## 1. Public surface (unauthenticated)

```
/                            Landing page
/login                       Email + password / magic link
/invite/[token]              Accept invite (signs the user in or creates account)
/r/[token]                   Shared report view (login_required by default)
/r/[token]/password          Password gate (only for password_protected shares)
/privacy                     POPIA notice
/terms                       Terms of service
```

Notes:
- **No public `/signup` route in V1** — signup is only reachable via `/invite/[token]`.
- `/r/[token]` redirects to `/login?return_to=/r/[token]` when share is `login_required` and user is not signed in.

## 2. Authenticated app shell

```
/app
  /dashboard                 Workspace overview
  /track/ecsa                ECSA module home
    /log                     Monthly log list (ECSA)
    /log/new                 Create monthly log (ECSA template)
    /log/[id]                Edit / view a specific log
    /log/[id]/competencies   Map competencies for this log
    /log/[id]/reflection     Edit reflection
    /log/[id]/report         Generate / preview monthly report
    /problems                ECSA problem-solving entries register
    /problems/new            Add problem-solving entry
    /periods                 ECSA training & experience periods
    /periods/new
  /track/sacpcmp             SACPCMP module home
    /log                     Monthly log list (SACPCMP)
    /log/new                 Create monthly log (SACPCMP template)
    /log/[id]                Edit / view
    /log/[id]/competencies
    /log/[id]/reflection
    /log/[id]/report
  /evidence                  Evidence repository (cross-track)
    /upload                  Upload (single + bulk)
    /[id]                    Evidence detail (preview + linkage)
    /search                  Search / filter / tag view
  /competencies              Competency tracker (track-aware)
    /ecsa                    ECSA outcome grid (heatmap)
    /sacpcmp                 SACPCMP competency grid
  /reports                   Reports library
    /monthly                 All monthly reports (filter by track)
    /dashboard               Generate competency dashboard PDF
    /annual                  Generate annual summary
    /pack                    Generate full registration pack ZIP
    /[id]                    Report detail (versions, exports, share links)
  /portfolio                 Portfolio readiness view (cross-track scorecard)
  /members                   Workspace members
    /invite                  Create invite link (owner only)
  /settings
    /profile                 Personal account
    /workspace               Workspace name, default track, quota usage
    /notifications           Reminder preferences
    /security                Password, MFA, sessions
    /data                    Export workspace data, delete account
```

## 3. Navigation chrome

- **Top bar:** workspace switcher (left), registration-track switcher (ECSA ⇄ SACPCMP, centre), search, notifications, account menu.
- **Sidebar (collapsible on desktop, drawer on mobile):**
  - Dashboard
  - Track-aware section (changes with track switcher): Logs / Problems (ECSA only) / Competencies / Reports
  - Evidence (shared)
  - Members (owner-only visible)
  - Settings
- **Persistent dashboard banner** when current month has no log (per locked decision D10).

## 4. Critical-path user journeys

### Journey A — First-time owner from invite (target: usable workspace in ≤10 min)
1. `/invite/[token]` → recognise unauthenticated → `/login?return_to=…&new=true` (with "Create account" tab pre-selected).
2. Email verification.
3. Workspace bootstrap wizard at `/app/onboarding`:
   - Step 1: Confirm name + profession.
   - Step 2: Choose default track (ECSA or SACPCMP).
   - Step 3: Add first project (project_name, employer, role, start_date).
   - Step 4: Land on `/app/dashboard` with a "Create your first monthly log" CTA.

### Journey B — Monthly log to compliant report (target: <30 min — the V1 north star)
1. Dashboard banner "Create May 2026 log" → `/app/track/ecsa/log/new`.
2. Tabbed form (4 tabs): **Overview** → **Activities** → **Problems & decisions** → **Reflection**.
3. Inline evidence upload on each tab (drag-and-drop card).
4. "Map competencies" step shows the 11 ECSA Outcomes with the user's evidence chips ready to drag.
5. "Generate report" button → server action → preview at `/app/track/ecsa/log/[id]/report`.
6. "Mark as final" → version locked, PDF + DOCX materialised, link to `/app/reports/[id]`.

### Journey C — Share with mentor
1. Open report at `/app/reports/[id]`.
2. "Share" panel → choose access (login_required / public / password), expiry (default 30 d), annexures on/off.
3. Copy link, send via email or message. Owner sees view count + last-viewed time on the report page.

## 5. Component inventory needed for V1
- `WorkspaceSwitcher`, `TrackSwitcher`, `SidebarNav`, `TopBar`
- `Dashboard*` cards: TrackProgressCard, MonthlyLogStatusCard, CompetencyHeatmap, RecentEvidenceList, ReadinessScoreCard, ReminderBanner
- `MonthlyLogForm` (track-aware), `EvidenceUploader`, `EvidencePreview`, `CompetencyMapper`, `ReflectionEditor`
- `ReportPreview` (renders the same JSX used by the PDF renderer where possible), `ShareLinkPanel`
- Primitive design-system components: Button, Input, Textarea, Select, Combobox, Tabs, Tooltip, Dialog, Drawer, Badge, Toast, ProgressBar, Skeleton, Table, EmptyState

## 6. Mobile considerations
- Sidebar becomes bottom-sheet drawer.
- Monthly log form switches to one-section-per-screen with sticky save/next.
- Evidence upload supports camera capture (PWA-ready, not full PWA in V1).
- 44×44 minimum tap targets enforced via component defaults.

## 7. Accessibility (WCAG AA — per claude.md §13)
- Skip-to-content link in `RootLayout`.
- All inputs have visible labels (no placeholder-only).
- Focus rings preserved (`ring-2 ring-accent-blue`).
- Modal focus trap + restore on close.
- Reduced motion: every Framer/CSS transition wrapped in `@media (prefers-reduced-motion: reduce)`.
- Light + dark themes both pass AA contrast on text, borders, and accent semantics.

---

**Approval required:** route structure, navigation chrome, the three critical journeys, mobile pattern.
