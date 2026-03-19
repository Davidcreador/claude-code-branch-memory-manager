import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { BranchMemoryError } from "../utils/errors.js";

export async function saveCommand(description?: string): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const branch = await getCurrentBranch();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    const result = await manager.save(branch, description);
    console.log(`Saved memory for branch '${branch}'`);
    if (description) {
      console.log(`  Description: ${description}`);
    }
    if (result.backedUp) {
      console.log(`  Previous memory backed up`);
    }
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
