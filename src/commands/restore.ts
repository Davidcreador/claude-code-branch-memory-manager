import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { BranchMemoryError } from "../utils/errors.js";

export async function restoreCommand(branch?: string): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    const targetBranch = branch ?? (await getCurrentBranch());

    const backupPath = await manager.restore(targetBranch);
    console.log(`Restored memory for '${targetBranch}'`);
    console.log(`  From: ${backupPath}`);
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);

      // If no backups found, list what's available
      if (err.code === "MEMORY_NOT_FOUND") {
        try {
          const repoRoot = await getRepoRoot();
          const config = await loadConfig(repoRoot);
          const manager = new MemoryManager(repoRoot, config);
          const backups = await manager.listBackups();
          if (backups.length > 0) {
            console.error("");
            console.error("Available backups:");
            const seen = new Set<string>();
            for (const b of backups) {
              if (!seen.has(b.branch)) {
                console.error(`  - ${b.branch}`);
                seen.add(b.branch);
              }
            }
          }
        } catch {
          // Ignore errors listing backups
        }
      }

      process.exit(1);
    }
    throw err;
  }
}
