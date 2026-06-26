/**
 * PostToolUse hook handler (matcher: Bash).
 *
 * Called after every Bash command Claude Code executes.
 * Detects git checkout/switch commands and swaps CLAUDE.md.
 */

import {
  getCurrentBranch,
  getPreviousBranch,
  getRepoRoot,
  isGitRepo,
} from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { readFileSafe } from "../utils/fs.js";
import { logger, setLogLevel } from "../utils/logger.js";
import { emitAdditionalContext, parseHookInput } from "./hook-utils.js";

/**
 * Git flags that consume the next argument (so the next token is NOT a branch name).
 */
const FLAGS_WITH_VALUE = new Set([
  "--orphan",
  "--conflict",
]);

/**
 * Boolean flags that don't consume the next argument.
 * --track/-t: next arg is still the branch ref.
 */
const BOOLEAN_FLAGS = new Set([
  "--track", "-t",
  "--no-track",
  "--force", "-f",
  "--merge", "-m",
  "--quiet", "-q",
]);

/**
 * Git flags that mean the result is NOT a named branch switch.
 */
const MODE_FLAGS = new Set([
  "--detach", "-d",
  "--",  // everything after -- is file paths
]);

/**
 * Commands/prefixes that indicate the git command is inside a string,
 * not an actual command being executed.
 */
const FALSE_POSITIVE_PREFIXES = [
  "echo ",
  "echo\"",
  "echo'",
  "printf ",
  "cat <<",
];

/**
 * Check if a shell command is a git branch switch.
 * Returns the target branch name, or null if not a branch switch.
 *
 * Handles:
 * - git checkout <branch>
 * - git checkout -b/-B <branch>
 * - git switch <branch>
 * - git switch -c/-C <branch>
 * - Compound commands: cmd1 && git checkout main
 * - Filtering: --detach, --, echo/printf (false positives)
 */
export function detectBranchSwitch(command: string): string | null {
  // Split on shell operators to get individual command segments
  const segments = command.split(/[;|&]+/).map((s) => s.trim());

  for (const segment of segments) {
    // Skip segments where git appears inside echo/printf/heredoc
    const lowerSegment = segment.toLowerCase();
    if (FALSE_POSITIVE_PREFIXES.some((p) => lowerSegment.startsWith(p))) {
      continue;
    }

    // Match git checkout or git switch at the start of the segment
    // (possibly preceded by env vars like GIT_DIR=... or command prefixes)
    const checkoutMatch = segment.match(
      /\bgit\s+(checkout|switch)\s+(.*?)$/,
    );
    if (!checkoutMatch?.[2]) continue;

    const result = parseGitArgs(checkoutMatch[1]!, checkoutMatch[2].trim());
    if (result) return result;
  }

  return null;
}

/**
 * Parse git checkout/switch arguments to extract the target branch name.
 */
function parseGitArgs(subcommand: string, argsStr: string): string | null {
  const args = argsStr.split(/\s+/);

  let branchName: string | null = null;
  let seenDoubleDash = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    // -- means everything after is file paths, not branches
    if (arg === "--") {
      seenDoubleDash = true;
      break;
    }

    // Flags that consume the next argument as a value
    if (FLAGS_WITH_VALUE.has(arg)) {
      i++; // skip the value
      continue;
    }

    // Mode flags: detached checkout is not a branch switch
    if (MODE_FLAGS.has(arg)) {
      return null;
    }

    // Boolean flags: skip, next arg is still a potential branch
    if (BOOLEAN_FLAGS.has(arg)) {
      continue;
    }

    // -b / -B / -c / -C: next arg is the new branch name
    if (
      (subcommand === "checkout" && (arg === "-b" || arg === "-B")) ||
      (subcommand === "switch" && (arg === "-c" || arg === "-C"))
    ) {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        return nextArg;
      }
      return null;
    }

    // Skip other flags
    if (arg.startsWith("-")) {
      continue;
    }

    // First non-flag argument is the branch name
    if (!branchName) {
      branchName = arg;
    }
  }

  if (seenDoubleDash && !branchName) {
    return null;
  }

  return branchName;
}

export async function handlePostToolUse(): Promise<void> {
  // Hooks should be quiet by default
  setLogLevel("error");

  try {
    const input = await parseHookInput();
    if (!input) return;

    // Only handle Bash tool calls
    const toolName = input["tool_name"] as string | undefined;
    if (toolName !== "Bash") return;

    // Extract the shell command that was run
    const toolInput = input["tool_input"] as Record<string, unknown> | undefined;
    const command = toolInput?.["command"] as string | undefined;
    if (!command) return;

    // Check if this command is a branch switch
    const targetBranch = detectBranchSwitch(command);
    if (!targetBranch) return;

    const cwd = (input["cwd"] as string) ?? process.cwd();
    if (!(await isGitRepo(cwd))) return;

    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    // The checkout already happened (PostToolUse), so the current branch
    // is now the target branch. We need to figure out what branch we were
    // on BEFORE the checkout to save its memory.

    let currentBranch: string;
    try {
      currentBranch = await getCurrentBranch(cwd);
    } catch {
      return;
    }

    // The branch we switched FROM — git stores this as @{-1}
    const previousBranch = await getPreviousBranch(cwd);

    // Save memory for the previous branch
    if (previousBranch && config.autoSaveOnSwitch) {
      try {
        if (await manager.hasActiveMemory()) {
          await manager.save(
            previousBranch,
            `Auto-saved on checkout to ${currentBranch}`,
          );
          logger.debug(`Saved memory for '${previousBranch}'`);
        }
      } catch (err) {
        logger.debug(`Failed to save previous memory: ${err}`);
      }
    }

    // Load memory for the new branch and inject it into the LIVE session.
    //
    // Swapping CLAUDE.md on disk alone is not enough: Claude Code loads
    // CLAUDE.md into context at session start and does NOT re-read it when the
    // file changes mid-session. To actually update the running conversation we
    // emit the branch memory as `additionalContext`, the documented mechanism
    // for surfacing dynamic state after a tool call.
    try {
      await manager.load(currentBranch);
      logger.debug(`Loaded memory for '${currentBranch}'`);

      const active = await readFileSafe(manager.memoryFilePath);
      if (active && active.trim()) {
        emitAdditionalContext(
          "PostToolUse",
          `Git branch is now '${currentBranch}'. The saved CLAUDE.md memory ` +
            `for this branch is now active:\n\n${active.trim()}`,
        );
      }
    } catch {
      logger.debug(`No memory found for '${currentBranch}'`);
    }
  } catch (err) {
    // Hook errors should never block Claude Code
    logger.debug(`PostToolUse hook error: ${err}`);
  }
}
