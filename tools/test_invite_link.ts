/**
 * Handshake 9 — Invite-link lifecycle.
 * Asserts:
 *   • Owner generates a hashed invite token.
 *   • Second user accepts via accept_invite_link RPC → joins workspace.
 *   • Second accept fails (single-use).
 *   • Expired token rejected.
 */
import { serviceClient, anonClient, env } from "./_config.js";
import { assert, assertRejected, runHandshake } from "./_assert.js";
import { createHash, randomBytes } from "node:crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

await runHandshake("test_invite_link", async () => {
  const svc = serviceClient();

  // Users
  for (const u of [
    { email: env.HANDSHAKE_USER_A_EMAIL, password: env.HANDSHAKE_USER_A_PASSWORD },
    { email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD },
  ]) {
    await svc.auth.admin.createUser({ ...u, email_confirm: true }).catch(() => undefined);
  }
  const { data: users } = await svc.auth.admin.listUsers();
  const userA = users.users.find(u => u.email === env.HANDSHAKE_USER_A_EMAIL)!;

  // Workspace owned by A
  const { data: ws } = await svc.from("workspaces")
    .insert({ owner_user_id: userA.id, workspace_name: "handshake-invite-ws" })
    .select().single();
  await svc.from("workspace_members").insert({ workspace_id: ws.id, user_id: userA.id, role: "owner" });

  // Owner creates invite (raw token returned ONCE; we store only the hash)
  const rawToken = randomBytes(32).toString("base64url");
  const hash = sha256(rawToken);
  await svc.from("invite_links").insert({
    workspace_id: ws.id, invited_by: userA.id, invite_token_hash: hash,
    role: "editor", max_uses: 1, expires_at: new Date(Date.now() + 86400_000).toISOString(),
  });

  // User B accepts
  const clientB = anonClient();
  await clientB.auth.signInWithPassword({
    email: env.HANDSHAKE_USER_B_EMAIL, password: env.HANDSHAKE_USER_B_PASSWORD,
  });
  const { data: wsId, error: acceptErr } = await clientB.rpc("accept_invite_link", { p_raw_token: rawToken });
  assert(!acceptErr, `accept failed: ${acceptErr?.message}`);
  assert(wsId === ws.id, "accept returned wrong workspace_id");

  // Second accept must fail (single-use, status flipped to 'used')
  await assertRejected(
    clientB.rpc("accept_invite_link", { p_raw_token: rawToken }).then(({ error }) => {
      if (error) throw error;
    }),
    "second accept should be rejected",
  );

  // Expired-token rejection
  const rawExpired = randomBytes(32).toString("base64url");
  await svc.from("invite_links").insert({
    workspace_id: ws.id, invited_by: userA.id, invite_token_hash: sha256(rawExpired),
    role: "editor", max_uses: 1, expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  await assertRejected(
    clientB.rpc("accept_invite_link", { p_raw_token: rawExpired }).then(({ error }) => {
      if (error) throw error;
    }),
    "expired token should be rejected",
  );

  // Cleanup
  await svc.from("workspaces").delete().eq("id", ws.id);
});
