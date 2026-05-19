/**
 * Handshake 10 — Shared report link lifecycle.
 * Asserts:
 *   • Owner creates a login-required share token.
 *   • A signed-in user can resolve it.
 *   • An anonymous (signed-out) user cannot resolve it.
 *   • A revoked link cannot be resolved.
 *   • An expired link cannot be resolved.
 */
import { serviceClient, anonClient, env } from "./_config.js";
import { assert, assertRejected, runHandshake } from "./_assert.js";
import { createHash, randomBytes } from "node:crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

await runHandshake("test_shared_report_link", async () => {
  const svc = serviceClient();

  for (const u of [
    { email: env.HANDSHAKE_USER_A_EMAIL, password: env.HANDSHAKE_USER_A_PASSWORD },
    { email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD },
  ]) {
    await svc.auth.admin.createUser({ ...u, email_confirm: true }).catch(() => undefined);
  }
  const { data: users } = await svc.auth.admin.listUsers();
  const userA = users.users.find(u => u.email === env.HANDSHAKE_USER_A_EMAIL)!;

  const { data: ws } = await svc.from("workspaces")
    .insert({ owner_user_id: userA.id, workspace_name: "handshake-share-ws" })
    .select().single();
  await svc.from("workspace_members").insert({ workspace_id: ws.id, user_id: userA.id, role: "owner" });

  const { data: report } = await svc.from("monthly_reports").insert({
    workspace_id: ws.id, registration_track: "ECSA", report_title: "Handshake report",
    report_status: "final", version: 1, generated_at: new Date().toISOString(), created_by: userA.id,
  }).select().single();

  // Valid login-required link
  const rawToken = randomBytes(32).toString("base64url");
  await svc.from("shared_report_links").insert({
    report_id: report.id, workspace_id: ws.id, created_by: userA.id, token_hash: sha256(rawToken),
    access_type: "login_required", expires_at: new Date(Date.now() + 86400_000).toISOString(),
  });

  // Signed-in user B can resolve
  const clientB = anonClient();
  await clientB.auth.signInWithPassword({
    email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD,
  });
  const { data: resolved, error: resErr } = await clientB.rpc("resolve_shared_report", { p_raw_token: rawToken });
  assert(!resErr, `signed-in resolve failed: ${resErr?.message}`);
  assert(Array.isArray(resolved) && resolved.length === 1, "expected 1 resolved report");
  assert(resolved[0].report_id === report.id, "wrong report returned");

  // Anonymous resolve must fail
  const anon = anonClient();
  await assertRejected(
    anon.rpc("resolve_shared_report", { p_raw_token: rawToken }).then(({ error }) => {
      if (error) throw error;
    }),
    "anonymous resolve of login_required link should fail",
  );

  // Revoked link rejection
  const rawRevoked = randomBytes(32).toString("base64url");
  await svc.from("shared_report_links").insert({
    report_id: report.id, workspace_id: ws.id, created_by: userA.id, token_hash: sha256(rawRevoked),
    access_type: "login_required", expires_at: new Date(Date.now() + 86400_000).toISOString(),
    revoked_at: new Date().toISOString(),
  });
  await assertRejected(
    clientB.rpc("resolve_shared_report", { p_raw_token: rawRevoked }).then(({ error }) => {
      if (error) throw error;
    }),
    "revoked link should be rejected",
  );

  // Expired link rejection
  const rawExpired = randomBytes(32).toString("base64url");
  await svc.from("shared_report_links").insert({
    report_id: report.id, workspace_id: ws.id, created_by: userA.id, token_hash: sha256(rawExpired),
    access_type: "login_required", expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  await assertRejected(
    clientB.rpc("resolve_shared_report", { p_raw_token: rawExpired }).then(({ error }) => {
      if (error) throw error;
    }),
    "expired link should be rejected",
  );

  await svc.from("workspaces").delete().eq("id", ws.id);
});
