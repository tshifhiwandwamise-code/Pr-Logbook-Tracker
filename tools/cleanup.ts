/**
 * Idempotent cleanup for handshake artefacts.
 * Removes test users, all workspaces owned by them, and storage objects under their workspace paths.
 */
import { serviceClient, env } from "./_config.js";

const svc = serviceClient();

const { data: users } = await svc.auth.admin.listUsers();
const targets = users.users.filter(u =>
  u.email === env.HANDSHAKE_USER_A_EMAIL || u.email === env.HANDSHAKE_USER_B_EMAIL
);

for (const u of targets) {
  console.log(`cleaning up ${u.email}`);

  // delete workspaces owned by user (cascade removes members + evidence + invites + reports)
  const { data: workspaces } = await svc.from("workspaces").select("id").eq("owner_user_id", u.id);
  for (const w of workspaces ?? []) {
    // best-effort storage delete
    for (const bucket of ["evidence", "reports", "avatars"]) {
      const { data: list } = await svc.storage.from(bucket).list(w.id, { limit: 1000 });
      const paths = (list ?? []).map(o => `${w.id}/${o.name}`);
      if (paths.length) await svc.storage.from(bucket).remove(paths);
    }
    await svc.from("workspaces").delete().eq("id", w.id);
  }

  // delete user
  await svc.auth.admin.deleteUser(u.id);
}

console.log("✅ cleanup complete");
