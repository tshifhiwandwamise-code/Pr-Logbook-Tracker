/**
 * Runs all 10 handshake tests in order. Exits non-zero on the first failure.
 */
const tests = [
  "./test_supabase_connection.js",
  "./test_auth_flow.js",
  "./test_storage_upload.js",
  "./test_file_metadata.js",
  "./test_pdf_generation.js",
  "./test_docx_generation.js",
  "./test_evidence_indexing.js",
  "./test_rls_permissions.js",
  "./test_invite_link.js",
  "./test_shared_report_link.js",
];

let passed = 0;
for (const t of tests) {
  try {
    await import(t);
    passed++;
  } catch {
    console.error(`\n⛔ stopped at ${t}\n`);
    process.exit(1);
  }
}
console.log(`\n✅ all ${passed} handshakes passed`);
