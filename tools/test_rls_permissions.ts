/**
 * Handshake 8 — Row Level Security cross-account isolation.
 * Asserts:
 *   • User A creates a workspace + uploads an evidence row.
 *   • User B (in a different workspace) cannot read User A's evidence.
 *   • User A *can* read it.
 */
import { serviceClient, anonClient, env } from "./_config.js";
import { assert, runHandshake } from "./_assert.js";

await runHandshake("test_rls_permissions", async () => {
  const svc = serviceClient();

  // Ensure both users exist
  for (const u of [
    { email: env.HANDSHAKE_USER_A_EMAIL, password: env.HANDSHAKE_USER_A_PASSWORD },
    { email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD },
  ]) {
    await svc.auth.admin.createUser({ ...u, email_confirm: true }).catch(() => undefined);
  }
  const { data: users } = await svc.auth.admin.listUsers();
  const userA = users.users.find(u => u.email === env.HANDSHAKE_USER_A_EMAIL)!;
  const userB = users.users.find(u => u.email === env.HANDSHAKE_USER_B_EMAIL)!;

  // Create workspace + membership for A
  const { data: wsA } = await svc.from("workspaces")
    .insert({ owner_user_id: userA.id, workspace_name: "handshake-rls-ws-A" })
    .select().single();
  await svc.from("workspace_members").insert({ workspace_id: wsA.id, user_id: userA.id, role: "owner" });
  const { data: ev } = await svc.from("evidence_files")
    .insert({ workspace_id: wsA.id, uploaded_by: userA.id, file_name: "secret.pdf", description: "RLS test" })
    .select().single();

  // User B signs in via anon client → should see ZERO rows
  const clientB = anonClient();
  const { error: sbErr } = await clientB.auth.signInWithPassword({
    email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD,
  });
  assert(!sbErr, `user B sign-in failed: ${sbErr?.message}`);
  const { data: bRows, error: bErr } = await clientB.from("evidence_files").select("*").eq("id", ev.id);
  assert(!bErr, `user B select errored unexpectedly: ${bErr?.message}`);
  assert(bRows && bRows.length === 0, `RLS LEAK: user B saw ${bRows?.length ?? 0} rows of user A's workspace`);

  // User A should see exactly 1 row
  const clientA = anonClient();
  await clientA.auth.signInWithPassword({
    email: env.HANDSHAKE_USER_A_EMAIL, password: env.HANDSHAKE_USER_A_PASSWORD,
  });
  const { data: aRows } = await clientA.from("evidence_files").select("*").eq("id", ev.id);
  assert(aRows && aRows.length === 1, `user A should see their own row; saw ${aRows?.length ?? 0}`);

  // Cleanup
  await svc.from("workspaces").delete().eq("id", wsA.id);
});
