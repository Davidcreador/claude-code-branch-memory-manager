/**
 * UserPromptSubmit hook handler.
 *
 * Runs before every prompt. Detects branch switches that happened OUTSIDE
 * Claude Code (for example a `git checkout` in another terminal) by comparing
 * the current branch against the last branch recorded by the hooks.
 *
 * When the branch is unchanged this is a cheap no-op (no context is injected),
 * so it does not bloat every turn. When the branch changed it saves the
 * previous branch's memory, loads the new one, and injects it into the live
 * session via additionalContext.
 */

import { getCurrentBranch, getRepoRoot, isGitRepo } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { readFileSafe } from "../utils/fs.js";
import { logger, setLogLevel } from "../utils/logger.js";
import { emitAdditionalContext, parseHookInput } from "./hook-utils.js";

export async function handleUserPromptSubmit(): Promise<void> {
  // Hooks should be quiet by default
  setLogLevel("error");

  try {
    const input = await parseHookInput();
    const cwd = (input?.["cwd"] as string) ?? process.cwd();

    // Only run in git repos
    if (!(await isGitRepo(cwd))) return;

    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    if (!config.watchExternalSwitch) return;

    const manager = new MemoryManager(repoRoot, config);

    let branch: string;
    try {
      branch = await getCurrentBranch(cwd);
    } catch {
      return;
    }

    const lastBranch = await manager.getActiveBranchState();

    // First prompt of a session (no state recorded yet): SessionStart already
    // handled the initial load. Just record the branch and stay quiet.
    if (lastBranch === null) {
      await manager.setActiveBranchState(branch);
      return;
    }

    // No change since last prompt — cheap no-op, inject nothing.
    if (lastBranch === branch) return;

    // Branch changed outside a tracked in-session checkout. Save the previous
    // branch's memory first so out-of-band work is not lost.
    if (config.autoSaveOnSwitch) {
      try {
        if (await manager.hasActiveMemory()) {
          await manager.save(
            lastBranch,
            `Auto-saved on external switch to ${branch}`,
          );
        }
      } catch (err) {
        logger.debug(`Failed to save '${lastBranch}': ${err}`);
      }
    }

    // Load the new branch's memory and inject it into the live session.
    try {
      await manager.load(branch);
      const active = await readFileSafe(manager.memoryFilePath);
      if (active && active.trim()) {
        emitAdditionalContext(
          "UserPromptSubmit",
          `Git branch is now '${branch}'. The saved CLAUDE.md memory ` +
            `for this branch is now active:\n\n${active.trim()}`,
        );
      }
    } catch {
      logger.debug(`No memory found for '${branch}'`);
    } finally {
      await manager.setActiveBranchState(branch);
    }
  } catch (err) {
    // Hook errors should never block Claude Code
    logger.debug(`UserPromptSubmit hook error: ${err}`);
  }
}
