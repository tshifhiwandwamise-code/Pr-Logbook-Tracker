import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function LogsPage() {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;
  const { data: logs } = await supabase
    .from("monthly_logs")
    .select("id, month, year, status, projects(project_name), registration_tracks(track_type, target_category)")
    .eq("workspace_id", ws.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Monthly logs</h1>
        <Link href="/logs/new"><Button size="sm">+ New monthly log</Button></Link>
      </div>

      {logs && logs.length > 0 ? (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-secondary">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 font-medium">Project</th>
                <th className="pb-2 font-medium">Track</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l: any) => (
                <tr key={l.id} className="text-text-primary">
                  <td className="py-3">{monthName(l.month)} {l.year}</td>
                  <td className="py-3">{l.projects?.project_name ?? "—"}</td>
                  <td className="py-3">
                    <Badge tone="info">
                      {l.registration_tracks?.track_type ?? "—"}{" "}
                      {l.registration_tracks?.target_category ? `· ${l.registration_tracks.target_category}` : ""}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge tone={l.status === "final" ? "success" : "warning"}>{l.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/logs/${l.id}`} className="text-xs text-accent-blue hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-text-secondary">No monthly logs yet.</p>
          <div className="mt-3"><Link href="/logs/new"><Button size="sm">Create your first monthly log</Button></Link></div>
        </Card>
      )}
    </div>
  );
}

function monthName(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleString("en-ZA", { month: "long" });
}
