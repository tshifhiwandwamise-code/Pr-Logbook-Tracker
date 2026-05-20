import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";

export default async function EvidencePage() {
  const supabase = createClient();
  const ws = (await getActiveWorkspace())!;
  const { data: files } = await supabase
    .from("evidence_files")
    .select("id, file_name, description, tags, file_type, file_size_bytes, external_url, created_at")
    .eq("workspace_id", ws.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Evidence</h1>
        <Link href="/evidence/upload"><Button size="sm">+ Upload evidence</Button></Link>
      </div>

      {files && files.length > 0 ? (
        <Card>
          <ul className="divide-y divide-border">
            {files.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-text-primary">{f.file_name}</span>
                    {f.file_type && <Badge tone="neutral">{f.file_type}</Badge>}
                  </div>
                  {f.description && (
                    <p className="mt-1 truncate text-xs text-text-secondary">{f.description}</p>
                  )}
                  {f.tags && f.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f.tags.map((t: string) => (
                        <span key={t} className="rounded-sm bg-background px-1.5 py-0.5 text-[10px] text-text-secondary">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-text-secondary">
                  <div>{formatBytes(f.file_size_bytes)}</div>
                  <div>{new Date(f.created_at).toLocaleDateString("en-ZA")}</div>
                  {f.external_url && (
                    <a href={f.external_url} target="_blank" rel="noreferrer" className="text-accent-blue hover:underline">
                      External link →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-text-secondary">No evidence files yet.</p>
          <div className="mt-3">
            <Link href="/evidence/upload"><Button size="sm">Upload your first file</Button></Link>
          </div>
        </Card>
      )}
    </div>
  );
}
