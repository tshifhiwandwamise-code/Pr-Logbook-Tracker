/**
 * Handshake 5 — PDF generation determinism.
 * Asserts:
 *   • A one-page PDF renders without error.
 *   • Same input rendered twice produces identical sha256 (proves byte-stable export).
 *
 * Determinism trick: @react-pdf/renderer embeds the current date by default in some
 * builds. We render twice in the same process and compare; if Phase 6 needs cross-run
 * determinism, we'll pin fonts + strip the producer metadata via pdf-lib post-process.
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from "@react-pdf/renderer";
import { createHash } from "node:crypto";
import { assert, assertEqual, runHandshake } from "./_assert.js";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  h1: { fontSize: 18, marginBottom: 12 },
  body: { lineHeight: 1.5 },
});

function Sample({ candidate }: { candidate: string }) {
  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.h1 }, "PRIP Handshake — PDF render"),
          React.createElement(Text, { style: styles.body }, `Candidate: ${candidate}`),
          React.createElement(Text, { style: styles.body }, "If you can read this, @react-pdf/renderer is wired up correctly.")
        )
      )
    )
  );
}

await runHandshake("test_pdf_generation", async () => {
  const a = await renderToBuffer(Sample({ candidate: "Handshake A" }) as any);
  const b = await renderToBuffer(Sample({ candidate: "Handshake A" }) as any);
  assert(a.length > 1000, "PDF buffer suspiciously small");
  const ha = createHash("sha256").update(a).digest("hex");
  const hb = createHash("sha256").update(b).digest("hex");
  assertEqual(ha, hb, "PDF determinism (same input → same sha256)");

  const c = await renderToBuffer(Sample({ candidate: "Handshake B" }) as any);
  const hc = createHash("sha256").update(c).digest("hex");
  assert(hc !== ha, "different input should produce different sha256");
});
