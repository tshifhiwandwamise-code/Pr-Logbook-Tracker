import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CompetenciesPage({
  searchParams,
}: {
  searchParams: { framework?: string };
}) {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;
  const framework = searchParams.framework ?? (ws.default_registration_track === "ECSA"
    ? "ECSA_R02_PE"
    : "SACPCMP_OFFICIAL_9");

  const { data: competencies } = await supabase
    .from("competencies")
    .select("id, code, title, description, category, framework")
    .eq("framework", framework)
    .order("sort_order");

  const { data: mappings } = await supabase
    .from("competency_mappings")
    .select("competency_id, self_rating, monthly_log_id")
    .eq("workspace_id", ws.id);

  const mapByComp: Record<string, { mappings: number; ratings: string[] }> = {};
  for (const m of mappings ?? []) {
    const key = m.competency_id as string;
    const entry = mapByComp[key] ?? { mappings: 0, ratings: [] as string[] };
    entry.mappings += 1;
    if (m.self_rating) entry.ratings.push(m.self_rating);
    mapByComp[key] = entry;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Competency tracker</h1>
          <p className="text-sm text-text-secondary">Framework: {prettyFramework(framework)}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <a
            href="?framework=ECSA_R02_PE"
            className={chipClass(framework === "ECSA_R02_PE")}
          >ECSA · R-02-PE</a>
          <a
            href="?framework=SACPCMP_OFFICIAL_9"
            className={chipClass(framework === "SACPCMP_OFFICIAL_9")}
          >SACPCMP · 9 KAs</a>
          <a
            href="?framework=SACPCMP_OPERATIONAL_14"
            className={chipClass(framework === "SACPCMP_OPERATIONAL_14")}
          >SACPCMP · 14 ops</a>
        </div>
      </div>

      <div className="grid gap-3">
        {competencies?.map((c) => {
          const stat = mapByComp[c.id];
          const tone = stat ? "success" : "neutral";
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-blue">{c.code}</span>
                    <span className="font-medium text-text-primary">{c.title}</span>
                  </div>
                  {c.category && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">{c.category}</p>
                  )}
                  {c.description && (
                    <p className="mt-2 text-sm text-text-secondary">{c.description}</p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-text-secondary">
                  <Badge tone={tone}>{stat?.mappings ?? 0} mappings</Badge>
                  {stat?.ratings && stat.ratings.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-end gap-1">
                      {stat.ratings.slice(0, 5).map((r, i) => (
                        <span key={i} className="rounded-sm bg-background px-1 text-[10px]">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-text-secondary">
        Competency mapping UI lands in the next sub-phase. For now, this view shows the seeded
        framework and any mappings created via the API/SQL.
      </p>
    </div>
  );
}

function prettyFramework(f: string): string {
  switch (f) {
    case "ECSA_R02_PE": return "ECSA R-02-PE (11 outcomes)";
    case "SACPCMP_OFFICIAL_9": return "SACPCMP — 9 PMBOK Knowledge Areas (assessment view)";
    case "SACPCMP_OPERATIONAL_14": return "SACPCMP — 14 operational areas";
    default: return f;
  }
}

function chipClass(active: boolean): string {
  return `rounded-md border px-3 py-1.5 transition-colors ${
    active
      ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
      : "border-border bg-card text-text-secondary hover:text-text-primary"
  }`;
}
