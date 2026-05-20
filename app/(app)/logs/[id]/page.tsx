import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateMonthlyLogAction, finalizeMonthlyLogAction } from "../actions";

export default async function LogDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;

  const { data: log } = await supabase
    .from("monthly_logs")
    .select(`
      id, month, year, status, responsibility_level,
      executive_summary, key_activities, key_responsibilities,
      problems_encountered, decisions_made, outcomes_achieved,
      lessons_learned, next_month_actions,
      project_id, registration_track_id,
      projects(project_name),
      registration_tracks(track_type, target_category)
    `)
    .eq("id", params.id)
    .eq("workspace_id", ws.id)
    .maybeSingle();

  if (!log) notFound();

  const isEcsa = (log.registration_tracks as any)?.track_type === "ECSA";
  const isFinal = log.status === "final";

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {(log.projects as any)?.project_name ?? "—"} · {monthName(log.month)} {log.year}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {(log.registration_tracks as any)?.track_type} ·{" "}
            {(log.registration_tracks as any)?.target_category}
          </p>
        </div>
        <Badge tone={isFinal ? "success" : "warning"}>{log.status}</Badge>
      </div>

      <Card>
        <form action={updateMonthlyLogAction} className="space-y-4">
          <input type="hidden" name="id" value={log.id} />

          <div>
            <Label htmlFor="executive_summary">Executive summary</Label>
            <Textarea
              id="executive_summary"
              name="executive_summary"
              defaultValue={log.executive_summary ?? ""}
              rows={5}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="key_activities">Key activities</Label>
            <Textarea
              id="key_activities"
              name="key_activities"
              defaultValue={log.key_activities ?? ""}
              rows={4}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="key_responsibilities">Key responsibilities</Label>
            <Textarea
              id="key_responsibilities"
              name="key_responsibilities"
              defaultValue={log.key_responsibilities ?? ""}
              rows={4}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="problems_encountered">Problems encountered</Label>
            <Textarea
              id="problems_encountered"
              name="problems_encountered"
              defaultValue={log.problems_encountered ?? ""}
              rows={3}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="decisions_made">Decisions made</Label>
            <Textarea
              id="decisions_made"
              name="decisions_made"
              defaultValue={log.decisions_made ?? ""}
              rows={3}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="outcomes_achieved">Outcomes achieved</Label>
            <Textarea
              id="outcomes_achieved"
              name="outcomes_achieved"
              defaultValue={log.outcomes_achieved ?? ""}
              rows={3}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="lessons_learned">Lessons learned</Label>
            <Textarea
              id="lessons_learned"
              name="lessons_learned"
              defaultValue={log.lessons_learned ?? ""}
              rows={3}
              disabled={isFinal}
            />
          </div>

          <div>
            <Label htmlFor="next_month_actions">Next month's actions</Label>
            <Textarea
              id="next_month_actions"
              name="next_month_actions"
              defaultValue={log.next_month_actions ?? ""}
              rows={3}
              disabled={isFinal}
            />
          </div>

          {isEcsa && (
            <div>
              <Label htmlFor="responsibility_level">ECSA responsibility level this month</Label>
              <Select
                id="responsibility_level"
                name="responsibility_level"
                defaultValue={log.responsibility_level ?? ""}
                disabled={isFinal}
              >
                <option value="">— select —</option>
                <option value="A">A — Exposed</option>
                <option value="B">B — Assisting</option>
                <option value="C">C — Participating</option>
                <option value="D">D — Contributing</option>
                <option value="E">E — Performing</option>
              </Select>
            </div>
          )}

          {!isFinal && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit">Save draft</Button>
              <Button
                type="submit"
                variant="secondary"
                formAction={finalizeMonthlyLogAction}
                name="id"
                value={log.id}
              >
                Mark as final
              </Button>
              <Link href="/logs"><Button type="button" variant="ghost">Back to list</Button></Link>
            </div>
          )}
        </form>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href={`/competencies?log=${log.id}`}>
          <Card className="transition-colors hover:bg-surface">
            <div className="text-sm font-medium text-text-primary">Map competencies</div>
            <div className="mt-1 text-xs text-text-secondary">
              Link this log to {isEcsa ? "ECSA outcomes" : "SACPCMP knowledge areas"}.
            </div>
          </Card>
        </Link>
        <Link href={`/evidence?log=${log.id}`}>
          <Card className="transition-colors hover:bg-surface">
            <div className="text-sm font-medium text-text-primary">Attach evidence</div>
            <div className="mt-1 text-xs text-text-secondary">
              Upload PDFs, photos, certificates linked to this log.
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function monthName(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleString("en-ZA", { month: "long" });
}
