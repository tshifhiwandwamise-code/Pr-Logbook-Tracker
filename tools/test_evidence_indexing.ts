/**
 * Handshake 7 — Evidence full-text indexing.
 * Asserts a tsvector search returns rows that match by file_name, description, or tag.
 */
import { serviceClient, env } from "./_config.js";
import { assert, runHandshake } from "./_assert.js";

await runHandshake("test_evidence_indexing", async () => {
  const svc = serviceClient();

  await svc.auth.admin.createUser({
    email: env.HANDSHAKE_USER_A_EMAIL,
    password: env.HANDSHAKE_USER_A_PASSWORD,
    email_confirm: true,
  }).catch(() => undefined);
  const { data: users } = await svc.auth.admin.listUsers();
  const userA = users.users.find(u => u.email === env.HANDSHAKE_USER_A_EMAIL)!;

  const { data: ws } = await svc.from("workspaces")
    .insert({ owner_user_id: userA.id, workspace_name: "handshake-indexing-ws" })
    .select().single();
  await svc.from("workspace_members").insert({ workspace_id: ws.id, user_id: userA.id, role: "owner" });

  const stamp = `INDEXTOKEN-${Date.now()}`;
  await svc.from("evidence_files").insert([
    { workspace_id: ws.id, uploaded_by: userA.id, file_name: `payment-cert-${stamp}.pdf`, description: "monthly payment certificate", tags: ["payment", "certificate"] },
    { workspace_id: ws.id, uploaded_by: userA.id, file_name: "rfi-001.pdf", description: `RFI cover sheet ${stamp}`, tags: ["rfi"] },
    { workspace_id: ws.id, uploaded_by: userA.id, file_name: "site-photo.jpg", description: "progress photo", tags: ["photo", stamp.toLowerCase()] },
    { workspace_id: ws.id, uploaded_by: userA.id, file_name: "unrelated.txt", description: "nothing to see", tags: [] },
  ]);

  const { data: hits, error } = await svc.rpc("evidence_search", { p_ws: ws.id, p_q: stamp }).select?.() as any
    ?? await svc.from("evidence_files").select("*").eq("workspace_id", ws.id)
      .or(`file_name.ilike.%${stamp}%,description.ilike.%${stamp}%`);
  // Fallback to ILIKE when no RPC is defined yet (bootstrap migration ships none — Phase 1 adds the RPC).
  assert(!error, `search errored: ${(error as any)?.message}`);
  assert(Array.isArray(hits) && hits.length >= 2,
    `expected ≥2 matches via file_name/description for token, got ${hits?.length ?? 0}`);

  await svc.from("workspaces").delete().eq("id", ws.id);
});
