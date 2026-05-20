import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard placeholder. Full implementation lands in Phase 6 / sub-phase 4
 * (design system) → sub-phase 5 (monthly logs). For now this proves the
 * server-side auth wiring works end-to-end.
 */
export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>
        <span className="rounded-md border border-border bg-card px-3 py-1 text-xs text-text-secondary">
          Phase 6 build · forms arrive in sub-phase 5
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title="Monthly logs"
          subtitle="ECSA & SACPCMP"
          status="Sub-phase 5 + 6"
        />
        <PlaceholderCard
          title="Evidence repository"
          subtitle="Upload, tag, search"
          status="Sub-phase 7"
        />
        <PlaceholderCard
          title="Reports"
          subtitle="Monthly PDF / DOCX"
          status="Sub-phase 8"
        />
        <PlaceholderCard
          title="Competency tracker"
          subtitle="11 ECSA + 9 SACPCMP-KAs"
          status="Sub-phase 9"
        />
        <PlaceholderCard
          title="Share & invite"
          subtitle="Login-required links"
          status="Sub-phase 10"
        />
        <PlaceholderCard
          title="Settings"
          subtitle="Workspace · members · data"
          status="Sub-phase 13"
        />
      </div>

      <details className="mt-12 rounded-md border border-border bg-card p-4 text-sm text-text-secondary">
        <summary className="cursor-pointer font-medium text-text-primary">
          What's actually live right now
        </summary>
        <ul className="mt-3 space-y-1 list-disc pl-5">
          <li>Auth (sign in via magic link)</li>
          <li>24-table production schema with RLS</li>
          <li>11 ECSA + 9 + 14 SACPCMP competencies + crosswalks (seeded)</li>
          <li>Invite-link + share-report RPCs</li>
          <li>Audit triggers on every mutable table</li>
          <li>Storage buckets: evidence / reports / avatars (private)</li>
        </ul>
      </details>
    </div>
  );
}

function PlaceholderCard({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-sm font-medium text-text-primary">{title}</div>
      <div className="mt-1 text-xs text-text-secondary">{subtitle}</div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-sm bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-amber" />
        {status}
      </div>
    </div>
  );
}
