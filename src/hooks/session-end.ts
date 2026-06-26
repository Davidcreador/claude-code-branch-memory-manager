/**
 * SessionEnd hook handler.
 *
 * Called when a Claude Code session ends (exit, /clear, logout, resume switch).
 * Saves the active CLAUDE.md back to the current branch's memory so end-of-
 * session context is preserved without an explicit `save`.
 *
 * SessionEnd has no decision control and a tight default timeout, so keep this
 * fast and never throw.
 */

import { getCurrentBranch, getRepoRoot, isGitRepo } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { logger, setLogLevel } from "../utils/logger.js";
import { parseHookInput } from "./hook-utils.js";

export async function handleSessionEnd(): Promise<void> {
  // Hooks should be quiet by default
  setLogLevel("error");

  try {
    const input = await parseHookInput();
    const cwd = (input?.["cwd"] as string) ?? process.cwd();

    // Only run in git repos
    if (!(await isGitRepo(cwd))) return;

    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    if (!config.autoSaveOnSessionEnd) return;

    const manager = new MemoryManager(repoRoot, config);

    let branch: string;
    try {
      branch = await getCurrentBranch(cwd);
    } catch {
      // Detached HEAD or no commits — nothing to save
      return;
    }

    // Only save if there is active content to preserve
    if (await manager.hasActiveMemory()) {
      await manager.save(branch, "Auto-saved on session end");
      logger.debug(`Saved memory for '${branch}' on session end`);
    }
  } catch (err) {
    // Hook errors should never block Claude Code
    logger.debug(`SessionEnd hook error: ${err}`);
  }
}
