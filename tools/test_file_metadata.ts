/**
 * Handshake 4 — File metadata capture & round-trip.
 * Asserts:
 *   • Client computes sha256 + size of a payload.
 *   • Server stores them on evidence_files row.
 *   • Reading the row back returns identical values.
 */
import { serviceClient, env } from "./_config.js";
import { assert, assertEqual, runHandshake } from "./_assert.js";
import { createHash, randomBytes, randomUUID } from "node:crypto";

await runHandshake("test_file_metadata", async () => {
  const svc = serviceClient();

  // ensure user A exists
  await svc.auth.admin.createUser({
    email: env.HANDSHAKE_USER_A_EMAIL,
    password: env.HANDSHAKE_USER_A_PASSWORD,
    email_confirm: true,
  }).catch(() => undefined);
  const { data: users } = await svc.auth.admin.listUsers();
  const userA = users.users.find(u => u.email === env.HANDSHAKE_USER_A_EMAIL);
  assert(userA, "user A not found");

  // workspace
  const { data: ws, error: wsErr } = await svc
    .from("workspaces")
    .insert({ owner_user_id: userA!.id, workspace_name: "handshake-metadata-ws" })
    .select()
    .single();
  assert(!wsErr, `workspace insert failed: ${wsErr?.message}`);

  await svc.from("workspace_members").insert({
    workspace_id: ws.id, user_id: userA!.id, role: "owner",
  });

  const payload = randomBytes(2048);
  const sha = createHash("sha256").update(payload).digest("hex");

  const { data: row, error: insErr } = await svc.from("evidence_files").insert({
    workspace_id: ws.id,
    uploaded_by: userA!.id,
    file_name: `${randomUUID()}.bin`,
    description: "metadata handshake",
    tags: ["handshake", "metadata"],
    storage_path: `${ws.id}/evidence/dummy/${randomUUID()}.bin`,
    file_size_bytes: payload.length,
    checksum_sha256: sha,
  }).select().single();
  assert(!insErr, `evidence insert failed: ${insErr?.message}`);

  const { data: round } = await svc.from("evidence_files").select("*").eq("id", row.id).single();
  assertEqual(round.file_size_bytes, payload.length, "size round-trip");
  assertEqual(round.checksum_sha256, sha, "sha256 round-trip");

  // cleanup
  await svc.from("workspaces").delete().eq("id", ws.id);
});
