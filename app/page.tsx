import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* subtle background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-accent-blue/10 via-transparent to-transparent"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-accent-blue to-accent-green" />
          Pr Logbook Tracker
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/tshifhiwandwamise-code/Pr-Logbook-Tracker"
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            GitHub
          </a>
          <Link
            href="/login"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-text-primary transition-colors hover:bg-surface"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-12 sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-text-secondary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
          For ECSA PrEng &amp; SACPCMP PrCM candidates
        </div>

        <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Your professional registration logbook,
          <br />
          <span className="bg-gradient-to-r from-accent-blue via-accent-green to-accent-amber bg-clip-text text-transparent">
            built for engineers and construction managers.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-text-secondary">
          Capture monthly experience, attach evidence, map competencies, and generate professional
          monthly reports. Designed around what ECSA and SACPCMP actually assess.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-tap items-center justify-center rounded-md bg-accent-blue px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
          <a
            href="https://github.com/tshifhiwandwamise-code/Pr-Logbook-Tracker/blob/main/DEPLOY.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-tap items-center justify-center rounded-md border border-border bg-card px-6 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
          >
            How it's built
          </a>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          <Feature
            kicker="ECSA"
            title="11 outcomes, mapped"
            body="Every R-02-PE outcome with the right wording, ready to map evidence and responsibility levels (A–E) against."
          />
          <Feature
            kicker="SACPCMP"
            title="9 PMBOK knowledge areas"
            body="The exact framework SACPCMP uses to assess PrCM. The 14 operational areas are tagged in too, so nothing's lost."
          />
          <Feature
            kicker="POPIA"
            title="Audited &amp; isolated"
            body="Row-level security on every table, full audit log, immutable evidence, signed-URL downloads."
          />
        </div>

        <div className="mt-20 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-amber" />
            What's live today
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Build your first month in 10 minutes</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
            {[
              "Sign in with a magic-link email — no password to remember.",
              "Create your private workspace + first project.",
              "Capture this month's activities, problems, decisions, outcomes.",
              "Upload evidence (PDFs, photos, certificates, external links).",
              "Map competencies to ECSA outcomes or SACPCMP KAs.",
              "PDF/DOCX exports + sharing arrive in the next release.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-mono">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-border px-6 py-6 text-xs text-text-secondary">
        Built in South Africa · POPIA-aware · MIT licensed
      </footer>
    </div>
  );
}

function Feature({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-accent-blue">
        {kicker}
      </div>
      <h3 className="mt-2 text-base font-semibold text-text-primary">{title}</h3>
      <p
        className="mt-2 text-sm text-text-secondary"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
