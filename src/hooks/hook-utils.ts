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

/**
 * Claude Code caps hook output strings (including additionalContext) at 10,000
 * characters. Beyond that, Claude Code spills the text to a file and passes a
 * preview instead. Stay comfortably under the limit so the full memory is
 * delivered inline.
 */
const MAX_ADDITIONAL_CONTEXT = 9000;

/**
 * Emit a Claude Code hook result on stdout.
 *
 * Claude Code reads stdout as JSON (on exit 0) for SessionStart, PostToolUse,
 * and other events. The `additionalContext` string is wrapped in a system
 * reminder and injected into the live conversation at the point the hook fired.
 * This is the documented mechanism for surfacing dynamic state (such as the
 * active branch's memory) into the running session — writing the file on disk
 * alone does NOT update an already-loaded context.
 *
 * Write the text as factual statements, not imperative instructions, to avoid
 * tripping Claude's prompt-injection defenses.
 */
export function emitAdditionalContext(
  hookEventName: string,
  additionalContext: string,
): void {
  if (!additionalContext.trim()) return;

  let text = additionalContext;
  if (text.length > MAX_ADDITIONAL_CONTEXT) {
    text = text.slice(0, MAX_ADDITIONAL_CONTEXT) + "\n\n[branch memory truncated]";
  }

  const payload = {
    hookSpecificOutput: {
      hookEventName,
      additionalContext: text,
    },
  };

  process.stdout.write(JSON.stringify(payload));
}
