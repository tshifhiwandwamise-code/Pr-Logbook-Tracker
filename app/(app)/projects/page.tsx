import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ProjectsPage() {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;
  const { data: projects } = await supabase
    .from("projects")
    .select("id, project_name, client, employer, start_date, end_date, user_role")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/projects/new"><Button size="sm">+ New project</Button></Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <div className="font-medium text-text-primary">{p.project_name}</div>
              <div className="mt-1 text-xs text-text-secondary">
                {p.client ?? "—"} · {p.user_role ?? "—"}
              </div>
              <div className="mt-2 text-xs text-text-secondary">
                {p.start_date ?? "—"} → {p.end_date ?? "ongoing"}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-text-secondary">No projects yet.</p>
          <div className="mt-3"><Link href="/projects/new"><Button size="sm">Add your first project</Button></Link></div>
        </Card>
      )}
    </div>
  );
}
