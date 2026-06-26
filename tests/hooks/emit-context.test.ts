import { describe, it, expect, vi, afterEach } from "vitest";
import { emitAdditionalContext } from "../../src/hooks/hook-utils.js";

interface HookPayload {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  };
}

/** Capture everything written to process.stdout during fn(). */
function captureStdout(fn: () => void): string {
  let out = "";
  const spy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: unknown) => {
      out += String(chunk);
      return true;
    });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return out;
}

/** Parse hook stdout, failing the test with a clear message if it is not valid JSON. */
function parseHookPayload(out: string): HookPayload {
  try {
    return JSON.parse(out) as HookPayload;
  } catch (err) {
    throw new Error(
      `hook stdout was not valid JSON: ${JSON.stringify(out)} (${err})`,
    );
  }
}

describe("emitAdditionalContext", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits a valid Claude Code hook payload on stdout", () => {
    const out = captureStdout(() =>
      emitAdditionalContext("PostToolUse", "Git branch is now 'feature/x'."),
    );
    const parsed = parseHookPayload(out);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PostToolUse");
    expect(parsed.hookSpecificOutput.additionalContext).toBe(
      "Git branch is now 'feature/x'.",
    );
  });

  it("uses the provided event name", () => {
    const out = captureStdout(() =>
      emitAdditionalContext("SessionStart", "Branch memory active."),
    );
    expect(parseHookPayload(out).hookSpecificOutput.hookEventName).toBe(
      "SessionStart",
    );
  });

  it("writes nothing for empty or whitespace-only context", () => {
    expect(captureStdout(() => emitAdditionalContext("PostToolUse", ""))).toBe(
      "",
    );
    expect(
      captureStdout(() => emitAdditionalContext("PostToolUse", "   \n  ")),
    ).toBe("");
  });

  it("truncates context beyond the 10k character cap", () => {
    const huge = "x".repeat(20000);
    const out = captureStdout(() => emitAdditionalContext("PostToolUse", huge));
    const ctx = parseHookPayload(out).hookSpecificOutput.additionalContext;
    expect(ctx.length).toBeLessThan(huge.length);
    expect(ctx).toContain("[branch memory truncated]");
  });

  it("produces output parseable as a single JSON object (no stdout pollution)", () => {
    const out = captureStdout(() =>
      emitAdditionalContext("PostToolUse", "line1\nline2"),
    );
    const parsed = parseHookPayload(out);
    expect(parsed.hookSpecificOutput.additionalContext).toBe("line1\nline2");
  });
});
