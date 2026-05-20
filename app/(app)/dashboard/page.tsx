import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!; // layout already guarantees workspace

  const [projects, logs, evidence, mappings] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
    supabase
      .from("monthly_logs")
      .select("id, month, year, status, project_id, projects(project_name)")
      .eq("workspace_id", ws.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(5),
    supabase.from("evidence_files").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).is("deleted_at", null),
    supabase.from("competency_mappings").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Workspace overview · {ws.default_registration_track} track
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button variant="secondary" size="sm">+ Project</Button>
          </Link>
          <Link href="/logs/new">
            <Button size="sm">+ Monthly log</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Projects" value={projects.count ?? 0} href="/projects" />
        <MetricCard label="Monthly logs" value={logs.data?.length ?? 0} href="/logs" />
        <MetricCard label="Evidence files" value={evidence.count ?? 0} href="/evidence" />
        <MetricCard label="Competency mappings" value={mappings.count ?? 0} href="/competencies" />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Recent monthly logs</h2>
        {logs.data && logs.data.length > 0 ? (
          <ul className="divide-y divide-border">
            {logs.data.map((l: any) => (
              <li key={l.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-text-primary">
                    {l.projects?.project_name ?? "—"} · {monthName(l.month)} {l.year}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={l.status === "final" ? "success" : "warning"}>{l.status}</Badge>
                  <Link href={`/logs/${l.id}`} className="text-xs text-accent-blue hover:underline">
                    Open →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-text-secondary">
            <p>No monthly logs yet.</p>
            <Link href="/logs/new" className="mt-3 inline-block">
              <Button size="sm">Create your first monthly log</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-surface">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="mt-1 text-2xl font-semibold">{value}</CardTitle>
      </Card>
    </Link>
  );
}

function monthName(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleString("en-ZA", { month: "long" });
}
