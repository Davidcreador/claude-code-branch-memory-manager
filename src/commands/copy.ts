import { getRepoRoot, validateBranchInput } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { BranchMemoryError } from "../utils/errors.js";

export async function copyCommand(
  sourceBranch: string,
  targetBranch: string,
): Promise<void> {
  try {
    // Validate inputs
    const srcErr = validateBranchInput(sourceBranch);
    if (srcErr) {
      console.error(`Invalid source branch: ${srcErr}`);
      process.exit(1);
    }

    const tgtErr = validateBranchInput(targetBranch);
    if (tgtErr) {
      console.error(`Invalid target branch: ${tgtErr}`);
      process.exit(1);
    }

    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    await manager.copy(sourceBranch, targetBranch);
    console.log(`Copied memory from '${sourceBranch}' to '${targetBranch}'`);
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
