/**
 * Handshake 2 — Auth flow.
 * Asserts:
 *   • Service-role can create a user (idempotent — ignores 'already registered').
 *   • Anon client can sign in with that user's password.
 *   • Refresh token rotation works.
 *   • Sign-out invalidates the session.
 */
import { anonClient, serviceClient, env } from "./_config.js";
import { assert, runHandshake } from "./_assert.js";

await runHandshake("test_auth_flow", async () => {
  const svc = serviceClient();

  // Create user A (idempotent)
  const { error: createErr } = await svc.auth.admin.createUser({
    email: env.HANDSHAKE_USER_A_EMAIL,
    password: env.HANDSHAKE_USER_A_PASSWORD,
    email_confirm: true,
  });
  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    throw new Error(`createUser failed: ${createErr.message}`);
  }

  // Sign in
  const client = anonClient();
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({
    email: env.HANDSHAKE_USER_A_EMAIL,
    password: env.HANDSHAKE_USER_A_PASSWORD,
  });
  assert(!signInErr, `sign-in failed: ${signInErr?.message}`);
  assert(signIn.session?.access_token, "no access token returned");
  const originalAccess = signIn.session!.access_token;

  // Refresh
  const { data: refreshed, error: refreshErr } = await client.auth.refreshSession();
  assert(!refreshErr, `refresh failed: ${refreshErr?.message}`);
  assert(refreshed.session?.access_token, "no refreshed access token");
  assert(refreshed.session!.access_token !== originalAccess, "refresh did not rotate access token");

  // Sign out
  const { error: signOutErr } = await client.auth.signOut();
  assert(!signOutErr, `sign-out failed: ${signOutErr?.message}`);
  const { data: postSignOut } = await client.auth.getSession();
  assert(!postSignOut.session, "session still present after sign-out");
});
