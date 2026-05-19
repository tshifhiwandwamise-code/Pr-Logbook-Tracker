# storage_buckets.md — Supabase Storage Plan (PROPOSAL)
**Status:** DRAFT — awaiting approval.

---

## Buckets (V1)

| Bucket | Visibility | Lifecycle | Purpose |
|---|---|---|---|
| `evidence` | private | retained; soft-deletes purged after 30 days via scheduled function | Original uploaded evidence (PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, JPEG, EML, HTML). External-URL evidence is metadata-only, no bucket object. |
| `reports` | private | retained indefinitely; old versions kept | Generated monthly PDF/DOCX, dashboard PDF, annual summary, registration-pack ZIPs. |
| `avatars` | private (signed) | retained; replaced on upload | User profile pictures. |

## Path convention
```
{bucket}/{workspace_id}/{entity_type}/{entity_id}/{filename}
```
Examples:
- `evidence/b1c2.../evidence_files/abcdef.../site_photo_001.jpg`
- `reports/b1c2.../monthly_reports/9988.../v1.pdf`
- `avatars/b1c2.../user_accounts/77ee.../avatar.png`

Rationale: the first path segment after the bucket is always `workspace_id`, so storage RLS policies can extract it via `split_part(name, '/', 1)::uuid` and reuse the same `auth.has_workspace_role()` helper as the database.

## Upload flow
1. Client posts file metadata to server action `prepareEvidenceUpload(file_name, size, type, workspace_id)`.
2. Server checks role (`owner|editor`) + quota.
3. Server creates a signed upload URL (Supabase Storage `createSignedUploadUrl`).
4. Client uploads directly to Storage with the signed URL.
5. Client calls `finalizeEvidenceUpload(file_path, checksum)` — server inserts `evidence_files` row.
6. Server triggers `recalculate_storage_used(workspace_id)`.

## Download flow
- Every read produces a fresh 1-hour signed URL via `createSignedUrl`.
- No public bucket URLs are ever exposed.
- Audit log entry on every signed-URL request.

## Quota
- 5 GB per workspace default; surfaced on `/app/settings/workspace` as a progress bar.
- Upload server action rejects with friendly error when adding a file would exceed quota.
- Soft-deleted files count against quota until purged.

## Backup
- Supabase Storage is replicated within region by default.
- Nightly job: write `manifest.csv` per workspace to `reports/{ws}/_backups/manifest_YYYY-MM-DD.csv` listing every active object with checksum — supports recovery audits.

**Approval required:** bucket list, path convention, upload/download flow, quota policy.
