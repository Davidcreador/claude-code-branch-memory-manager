/**
 * Shared utilities for Claude Code hook handlers.
 *
 * Claude Code hooks receive JSON on stdin and return JSON on stdout.
 */

const STDIN_TIMEOUT_MS = 5000;

/**
 * Read all data from stdin as a string.
 * Times out after 5 seconds to prevent hanging on manual invocation.
 */
export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // If stdin is already ended with no data, resolve immediately
    if (process.stdin.readableEnded) {
      resolve("");
      return;
    }

    const chunks: Buffer[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        process.stdin.removeAllListeners("data");
        process.stdin.removeAllListeners("end");
        process.stdin.removeAllListeners("error");
        resolve(Buffer.concat(chunks).toString("utf-8"));
      }
    }, STDIN_TIMEOUT_MS);

    process.stdin.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(Buffer.concat(chunks).toString("utf-8"));
      }
    });

    process.stdin.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    // Ensure stdin is flowing
    process.stdin.resume();
  });
}

/**
 * Parse Claude Code hook input from stdin.
 * Returns the parsed JSON object, or null if parsing fails.
 */
export async function parseHookInput(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readStdin();
    if (!raw.trim()) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
