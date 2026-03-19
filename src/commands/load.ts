import { getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { BranchMemoryError } from "../utils/errors.js";

export async function loadCommand(branch: string): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    const result = await manager.load(branch);
    if (result.fallback) {
      console.log(
        `No memory for '${branch}', loaded fallback from '${result.fallbackBranch}'`,
      );
    } else {
      console.log(`Loaded memory for branch '${branch}'`);
    }
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
