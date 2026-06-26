/**
 * SessionStart hook handler.
 *
 * Called when Claude Code starts or resumes a session.
 * Loads the correct branch-specific CLAUDE.md for the current git branch.
 */

import { getCurrentBranch, getRepoRoot, isGitRepo } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { logger, setLogLevel } from "../utils/logger.js";
import { emitAdditionalContext, parseHookInput } from "./hook-utils.js";

export async function handleSessionStart(): Promise<void> {
  // Hooks should be quiet by default
  setLogLevel("error");

  try {
    const input = await parseHookInput();
    const cwd = (input?.["cwd"] as string) ?? process.cwd();

    // Only run in git repos
    if (!(await isGitRepo(cwd))) return;

    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    let branch: string;
    try {
      branch = await getCurrentBranch(cwd);
    } catch {
      // Detached HEAD or other issue — skip silently
      return;
    }

    // Check if this branch has a saved memory
    if (await manager.exists(branch)) {
      await manager.load(branch);
      logger.debug(`Loaded memory for branch '${branch}'`);

      // The disk swap above puts the branch memory into CLAUDE.md, which Claude
      // Code eagerly loads at session start. Emit a concise factual status note
      // (not the full content) so the active branch is unambiguous without
      // duplicating the eagerly-loaded CLAUDE.md body.
      emitAdditionalContext(
        "SessionStart",
        `Branch memory active: CLAUDE.md is loaded from ` +
          `${config.memoryDir}/ for git branch '${branch}'.`,
      );
    }
    // If no memory exists, don't create one — let the user decide
  } catch (err) {
    // Hook errors should never block Claude Code
    logger.debug(`SessionStart hook error: ${err}`);
  }
}
