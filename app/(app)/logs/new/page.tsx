import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createMonthlyLogAction } from "../actions";

export default async function NewLogPage() {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;

  const [projectsRes, tracksRes] = await Promise.all([
    supabase.from("projects").select("id, project_name").eq("workspace_id", ws.id).order("project_name"),
    supabase.from("registration_tracks").select("id, track_type, target_category").eq("workspace_id", ws.id).eq("status", "active"),
  ]);

  const projects = projectsRes.data ?? [];
  const tracks = tracksRes.data ?? [];

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <p className="text-sm text-text-secondary">
            You need at least one project before creating a monthly log.
          </p>
          <div className="mt-3">
            <Link href="/projects/new"><Button size="sm">Create a project</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  // If no registration track exists yet, we'll create one on the fly inside the server action.
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1; // 1-based

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-semibold">New monthly log</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Capture what <em>you</em> personally did this month. Use first-person professional verbs:
        <span className="italic"> "I analysed…", "I supervised…", "I decided…"</span>
      </p>

      <Card>
        <form action={createMonthlyLogAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="month">Month *</Label>
              <Select id="month" name="month" defaultValue={String(defaultMonth)} required>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("en-ZA", { month: "long" })}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input id="year" name="year" type="number" min="2024" max="2100" defaultValue={defaultYear} required />
            </div>
            <div>
              <Label htmlFor="track">Registration track *</Label>
              <Select id="track" name="track" defaultValue={ws.default_registration_track} required>
                <option value="ECSA">ECSA — PrEng</option>
                <option value="SACPCMP">SACPCMP — PrCM</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="project_id">Project *</Label>
            <Select id="project_id" name="project_id" required>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="executive_summary">Executive summary (150–250 words)</Label>
            <Textarea id="executive_summary" name="executive_summary" rows={5} maxLength={3000} />
          </div>

          <div>
            <Label htmlFor="key_activities">Key activities</Label>
            <Textarea id="key_activities" name="key_activities" rows={4} />
          </div>

          <div>
            <Label htmlFor="key_responsibilities">Key responsibilities</Label>
            <Textarea id="key_responsibilities" name="key_responsibilities" rows={4} />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Create draft</Button>
            <Link href="/logs"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
