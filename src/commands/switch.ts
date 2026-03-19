import { execFile } from "node:child_process";
import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { BranchMemoryError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

function gitCheckout(branch: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("git", ["checkout", branch], { cwd }, (err, _stdout, stderr) => {
      if (err) {
        reject(new Error(stderr.trim() || err.message));
      } else {
        resolve();
      }
    });
  });
}

export async function switchCommand(targetBranch: string): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    // Save current memory first
    let currentBranch: string | undefined;
    try {
      currentBranch = await getCurrentBranch();
    } catch {
      // Might be detached, that's okay
    }

    if (
      currentBranch &&
      currentBranch !== targetBranch &&
      config.autoSaveOnSwitch
    ) {
      try {
        if (await manager.hasActiveMemory()) {
          await manager.save(currentBranch, `Auto-saved before switching to ${targetBranch}`);
          console.log(`Saved memory for '${currentBranch}'`);
        }
      } catch (err) {
        logger.warn(`Failed to save current memory: ${err}`);
      }
    }

    // Switch git branch
    console.log(`Switching to branch '${targetBranch}'...`);
    try {
      await gitCheckout(targetBranch, repoRoot);
    } catch (err) {
      console.error(`Failed to switch branch: ${err instanceof Error ? err.message : err}`);
      console.error("");
      console.error("Try: git branch -a    (see available branches)");
      console.error("Or:  git status       (check for uncommitted changes)");
      process.exit(1);
    }

    console.log(`Switched to branch '${targetBranch}'`);

    // Load target branch memory
    try {
      const result = await manager.load(targetBranch);
      if (result.fallback) {
        console.log(`Loaded fallback memory from '${result.fallbackBranch}'`);
      } else {
        console.log(`Loaded memory for '${targetBranch}'`);
      }
    } catch {
      console.log(`No existing memory for '${targetBranch}'`);
    }
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
