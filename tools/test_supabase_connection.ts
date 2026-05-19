/**
 * Handshake 1 — Supabase connection.
 * Asserts:
 *   • The anon client can reach the project (auth.getSession returns).
 *   • The service-role client can run a trivial query.
 */
import { anonClient, serviceClient } from "./_config.js";
import { assert, runHandshake } from "./_assert.js";

await runHandshake("test_supabase_connection", async () => {
  const anon = anonClient();
  const { error: anonErr } = await anon.auth.getSession();
  assert(!anonErr, `anon getSession errored: ${anonErr?.message}`);

  const svc = serviceClient();
  const { data, error } = await svc.from("workspaces").select("id").limit(1);
  assert(!error, `service-role query errored: ${error?.message}`);
  assert(Array.isArray(data), "service-role query did not return an array");
});
