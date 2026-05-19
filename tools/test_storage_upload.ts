/**
 * Handshake 3 — Storage upload + signed download.
 * Asserts:
 *   • Service-role can upload a small file to the `evidence` bucket.
 *   • A signed URL can be generated and fetched.
 *   • The downloaded bytes match the uploaded bytes.
 */
import { serviceClient } from "./_config.js";
import { assert, runHandshake } from "./_assert.js";
import { randomUUID, randomBytes } from "node:crypto";

await runHandshake("test_storage_upload", async () => {
  const svc = serviceClient();
  const bucket = "evidence";
  const wsId = randomUUID();
  const fileId = randomUUID();
  const path = `${wsId}/handshake/${fileId}.bin`;
  const payload = randomBytes(1024);

  const { error: upErr } = await svc.storage.from(bucket).upload(path, payload, {
    contentType: "application/octet-stream",
    upsert: true,
  });
  assert(!upErr, `upload failed: ${upErr?.message}`);

  const { data: signed, error: signErr } = await svc.storage.from(bucket).createSignedUrl(path, 60);
  assert(!signErr, `signed URL failed: ${signErr?.message}`);
  assert(signed?.signedUrl, "no signed URL returned");

  const res = await fetch(signed!.signedUrl);
  assert(res.ok, `download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  assert(buf.equals(payload), "downloaded bytes do not match uploaded bytes");

  // cleanup
  await svc.storage.from(bucket).remove([path]);
});
