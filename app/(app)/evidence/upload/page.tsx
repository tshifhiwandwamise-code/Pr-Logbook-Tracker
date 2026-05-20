"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type UploadKind = "file" | "url";

export default function UploadEvidencePage() {
  const router = useRouter();
  const [kind, setKind] = useState<UploadKind>("file");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagsCsv, setTagsCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tags = tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Get workspace
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .limit(1)
        .single();
      if (!membership) throw new Error("No workspace");
      const workspace_id = membership.workspace_id;

      if (kind === "url") {
        if (!externalUrl) throw new Error("URL required");
        const { error: insertErr } = await supabase.from("evidence_files").insert({
          workspace_id,
          uploaded_by: user.id,
          file_name: externalUrl,
          description: description || null,
          tags,
          file_type: "URL",
          external_url: externalUrl,
        });
        if (insertErr) throw insertErr;
      } else {
        if (!file) throw new Error("Select a file");
        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
        const fileType = inferFileType(ext);
        const ts = Date.now();
        const safeName = file.name.replace(/[^\w.-]/g, "_");
        const path = `${workspace_id}/evidence/${ts}_${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("evidence")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (uploadErr) throw uploadErr;

        const checksum = await sha256(file);
        const { error: insertErr } = await supabase.from("evidence_files").insert({
          workspace_id,
          uploaded_by: user.id,
          file_name: file.name,
          description: description || null,
          tags,
          file_type: fileType,
          file_size_bytes: file.size,
          storage_path: path,
          checksum_sha256: checksum,
        });
        if (insertErr) throw insertErr;
      }

      router.push("/evidence");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Upload evidence</h1>
      <p className="mb-6 text-sm text-text-secondary">
        PDFs, photos, certificates, screenshots, programmes, contract instructions, RFIs…
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kind">Type</Label>
            <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as UploadKind)}>
              <option value="file">Upload a file</option>
              <option value="url">External URL (SharePoint, BIM360, etc.)</option>
            </Select>
          </div>

          {kind === "file" ? (
            <div>
              <Label htmlFor="file">File</Label>
              <input
                id="file"
                type="file"
                accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.eml"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-text-primary file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-text-primary file:hover:bg-surface"
              />
              <p className="mt-1 text-xs text-text-secondary">Max 10 MB per file.</p>
            </div>
          ) : (
            <div>
              <Label htmlFor="external_url">External URL</Label>
              <Input
                id="external_url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://…"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsCsv}
              onChange={(e) => setTagsCsv(e.target.value)}
              placeholder="payment, certificate, march"
            />
          </div>

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </Button>
            <a href="/evidence"><Button type="button" variant="secondary">Cancel</Button></a>
          </div>
        </form>
      </Card>
    </div>
  );
}

function inferFileType(ext: string): string {
  const map: Record<string, string> = {
    pdf: "PDF", docx: "DOCX", xlsx: "XLSX", csv: "CSV", txt: "TXT",
    png: "PNG", jpg: "JPG", jpeg: "JPEG", eml: "EMAIL",
  };
  return map[ext] ?? "TXT";
}

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
