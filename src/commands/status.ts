import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { getFileSize } from "../utils/fs.js";
import { formatBytes } from "../utils/format.js";
import { BranchMemoryError } from "../utils/errors.js";
import { basename } from "node:path";

export async function statusCommand(): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    let currentBranch = "unknown";
    try {
      currentBranch = await getCurrentBranch();
    } catch {
      // detached head or not git repo handled below
    }

    const repoName = basename(repoRoot);

    console.log("Branch Memory Status");
    console.log("====================");
    console.log("");
    console.log(`Repository:     ${repoName}`);
    console.log(`Current branch: ${currentBranch}`);
    console.log(`Memory dir:     ${config.memoryDir}`);
    console.log("");

    // Active memory file
    const hasActive = await manager.hasActiveMemory();
    const activeSize = await getFileSize(manager.memoryFilePath);
    if (hasActive) {
      console.log(
        `Active ${config.memoryFileName}: found (${formatBytes(activeSize)})`,
      );
    } else {
      console.log(`Active ${config.memoryFileName}: not found`);
    }

    // Saved memory for current branch
    if (currentBranch !== "unknown") {
      const hasSaved = await manager.exists(currentBranch);
      if (hasSaved) {
        const savedPath = manager.branchMemoryPath(currentBranch);
        const savedSize = await getFileSize(savedPath);
        console.log(
          `Saved memory:   found (${formatBytes(savedSize)})`,
        );
      } else {
        console.log(`Saved memory:   not found`);
      }
    }

    console.log("");

    // Config
    console.log("Configuration:");
    console.log(`  Auto-save on switch: ${config.autoSaveOnSwitch}`);
    console.log(`  Fallback to default: ${config.fallbackToDefault}`);
    console.log(`  Fallback branches:   ${config.fallbackBranches.join(", ")}`);

    // Count total memories
    const memories = await manager.list();
    console.log("");
    console.log(`Total memories stored: ${memories.length}`);
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
