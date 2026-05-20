# Deploy to Vercel — playbook

Status at time of writing: V1 schema is **live** on Supabase project `wnwkihbrteknhofstbze` (eu-west-1). Storage buckets `evidence`, `reports`, `avatars` are created (private). Next.js scaffold pushed to `main`. Auth (magic-link), middleware, dashboard placeholder, OAuth callback all wired.

Follow the steps below to put the app online.

---

## 1. Get the Supabase service-role key (one-time)

1. Open https://supabase.com/dashboard/project/wnwkihbrteknhofstbze/settings/api
2. Scroll to **Project API keys**
3. Copy the value under **`service_role`** (the one labelled **secret** with a warning icon).

**Important security rules for this key:**

- It bypasses **all** RLS — anyone holding it can read and write every row, every workspace, every user.
- **Never** commit it to git. Never put it in any `NEXT_PUBLIC_*` env var. Never paste it into a chat (including this one).
- It belongs only in **server-side** environment variables on Vercel and your own local `.env.local`.
- If it leaks: rotate immediately at the same Supabase API settings page (click "Generate new key"). Anything signed with the old key is invalidated.

---

## 2. Connect the GitHub repo to Vercel

1. Sign in at https://vercel.com → **Add New… → Project**.
2. Choose **Import Git Repository** and pick `tshifhiwandwamise-code/Pr-Logbook-Tracker`.
3. Vercel auto-detects Next.js. Leave **Framework Preset = Next.js**, **Root Directory = `.`**.

---

## 3. Set environment variables in Vercel

Add the following under **Settings → Environment Variables**. Tick **Production, Preview, Development** for each unless noted.

| Variable                            | Value                                                                                                                                                                                                                                                                                                                                                                                                                       | Scope          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | `https://wnwkihbrteknhofstbze.supabase.co`                                                                                                                                                                                                                                                                                                                                                                                  | all environments |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indud2tpaGJydGVrbmhvZnN0YnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDIzNjYsImV4cCI6MjA5NDc3ODM2Nn0.lByAJLXWH2tKQTLJTtvilPvvndej9BuT0SoB7WkmkxA`                                                                                                                                                                                                          | all environments |
| `SUPABASE_SERVICE_ROLE_KEY`         | **paste from step 1** — Vercel encrypts it on the server. **Do NOT prefix with `NEXT_PUBLIC_`** — that would expose it to the browser.                                                                                                                                                                                                                                                                                       | all environments |
| `NEXT_PUBLIC_APP_URL`               | Production: your Vercel URL (e.g. `https://pr-logbook-tracker.vercel.app`). Preview/Development: leave blank and Vercel auto-populates `VERCEL_URL`.                                                                                                                                                                                                                                                                          | production       |
| `RESEND_API_KEY` (optional, V1.1)   | leave blank for now — wired in Phase 12 (reminders).                                                                                                                                                                                                                                                                                                                                                                         | —              |

---

## 4. First deploy

Click **Deploy**. Vercel will:
- run `npm install` (resolves `package.json`),
- run `next build` (compiles app + middleware + auth callback),
- promote the build to the production URL.

Expected first-build time: ~90 seconds. Watch the **Building** logs for errors.

If the build fails because npm can't resolve a peer, it's almost always something fixable in `package.json` — open an issue or ping me with the build log.

---

## 5. Tell Supabase the redirect URL

After deploy:

1. Open https://supabase.com/dashboard/project/wnwkihbrteknhofstbze/auth/url-configuration
2. **Site URL**: your production Vercel URL (e.g. `https://pr-logbook-tracker.vercel.app`).
3. **Redirect URLs**: add `https://pr-logbook-tracker.vercel.app/auth/callback` and `https://*.vercel.app/auth/callback` (for preview deploys).
4. Save.

Without this, magic-link emails will redirect to `localhost:3000` and break for real users.

---

## 6. Smoke test

1. Open the production URL → landing page loads, theme is dark.
2. Click "Sign in" → email form appears.
3. Enter your real email → check inbox → click magic link.
4. Should land on `/dashboard` showing 6 placeholder cards + your email.
5. Sign out is wired in Phase 6 sub-phase 3 (next session); for now you can sign out manually by clearing cookies.

If any step breaks, the Vercel **Logs** tab shows server-side errors in real time.

---

## 7. Local development

If you want to run locally between sessions:

```bash
git clone https://github.com/tshifhiwandwamise-code/Pr-Logbook-Tracker.git
cd Pr-Logbook-Tracker
cp .env.local.example .env.local
# Fill SUPABASE_SERVICE_ROLE_KEY in .env.local
npm install
npm run dev   # http://localhost:3000
```

`.env.local` is gitignored — safe to put the service-role key there.

---

## Email setup (when you hit "email rate limit exceeded")

Supabase's default built-in SMTP is for development only and caps at **~4 emails per hour**. Two options:

### Option A — Quick: set a password and use password sign-in

The `/login` page has both **Password** and **Magic link** tabs. Password sign-in doesn't send emails. To set a password:

1. Open https://supabase.com/dashboard/project/wnwkihbrteknhofstbze/auth/users
2. Find your user row → click `…` → **Send password recovery** *(also uses SMTP — skip if rate-limited)*
3. OR click **Add user** → enter email + password directly (this bypasses email entirely).
4. OR open the user → **Edit user** → set a password.

Now sign in at `/login` → **Password** tab.

### Option B — Proper: configure custom SMTP via Resend (free, ~10 min)

1. Sign up at https://resend.com — free tier = 100 emails/day, 3000/month.
2. Add and verify a sending domain (or use the test domain for dev).
3. Create an API key (Settings → API Keys).
4. Open https://supabase.com/dashboard/project/wnwkihbrteknhofstbze/settings/auth
5. Scroll to **SMTP Settings** → toggle **Enable Custom SMTP**:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (STARTTLS)
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: an address on your verified domain
   - Sender name: `Pr Logbook Tracker`
6. Save. Magic links work again, with much higher rate limits.

After Option B, you can return to magic-link sign-in if you prefer it.

## What's NOT yet built (continues in follow-up sessions)

All of these have full SOPs in `architecture/` and are unblocked by the live schema:

- **Sub-phase 3** — full auth UI (signup-by-invite, password, OAuth)
- **Sub-phase 4** — design system primitives (Button, Input, Tabs, etc.) + app shell with sidebar
- **Sub-phase 5+6** — monthly-log forms (ECSA + SACPCMP) with tabbed inputs, evidence drag-drop, competency mapper
- **Sub-phase 7** — evidence repository (upload, tag, search, soft-delete)
- **Sub-phase 8** — PDF / DOCX report generators using the templates in `architecture/report_templates.md`
- **Sub-phase 9** — competency tracker (heatmap, dashboard PDF)
- **Sub-phase 10** — reports library + shareable links UI
- **Sub-phase 11** — annual summary + full registration-pack ZIP
- **Sub-phase 12** — email reminders (Resend, 25th-of-month + weekly digest)
- **Sub-phase 13** — workspace settings, member management UI, DSAR data export
- **Sub-phase 14** — production hardening (POPIA notice, accessibility audit, load test)

Each is independent; we can tackle them in any order. The database, RLS, auth, and storage foundation is done — every subsequent feature plugs into it.
