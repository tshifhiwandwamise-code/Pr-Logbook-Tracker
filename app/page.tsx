export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-8 px-6 py-24">
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-xs text-text-secondary">
        <span className="inline-block h-2 w-2 rounded-full bg-accent-green" />
        Phase 6 in progress · Next.js scaffold live
      </div>

      <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight">
        Your professional registration logbook,
        <br />
        built for ECSA and SACPCMP candidates.
      </h1>

      <p className="text-lg text-text-secondary">
        Pr Logbook Tracker turns the monthly slog of evidence collection, competency mapping, and
        report writing into a guided workflow. Built for South African engineers and construction
        managers preparing for{" "}
        <span className="text-text-primary">PrEng</span> or{" "}
        <span className="text-text-primary">PrCM</span> registration.
      </p>

      <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row">
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="font-mono text-xs text-accent-blue">SQL</span>
          23-table schema with RLS
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="font-mono text-xs text-accent-green">PDF</span>
          Monthly report generator
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="font-mono text-xs text-accent-amber">POPIA</span>
          Audit + residency
        </span>
      </div>

      <footer className="mt-12 text-xs text-text-secondary">
        Currently invite-only.{" "}
        <a className="underline hover:text-text-primary" href="/login">
          Already have an invite? Sign in →
        </a>
      </footer>
    </div>
  );
}
