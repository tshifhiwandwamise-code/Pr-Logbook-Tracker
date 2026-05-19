/** Tiny assertion + reporting helpers. */

export function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`ASSERTION FAILED [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertRejected(promise: Promise<unknown>, label: string): Promise<void> {
  return promise.then(
    () => {
      throw new Error(`ASSERTION FAILED [${label}]: expected promise to reject but it resolved`);
    },
    () => undefined,
  );
}

/** Wrap a handshake test entrypoint with consistent logging + exit codes. */
export async function runHandshake(name: string, fn: () => Promise<void>): Promise<void> {
  const t0 = Date.now();
  process.stdout.write(`▶ ${name} ... `);
  try {
    await fn();
    const ms = Date.now() - t0;
    process.stdout.write(`✅ (${ms}ms)\n`);
  } catch (err) {
    process.stdout.write("❌\n");
    console.error(err instanceof Error ? err.stack : err);
    process.exitCode = 1;
    throw err;
  }
}
