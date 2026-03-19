import { getRepoRoot, listBranches } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { sanitizeBranchName } from "../core/branch.js";
import { listFiles } from "../utils/fs.js";
import { BranchMemoryError } from "../utils/errors.js";
import { join } from "node:path";

export async function cleanCommand(dryRun = false): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);
    const branches = await listBranches(repoRoot);

    if (dryRun) {
      // Preview mode: show what would be cleaned
      const existingSet = new Set(branches.map((b) => sanitizeBranchName(b)));
      const files = await listFiles(join(repoRoot, config.memoryDir), ".md");
      const orphaned = files
        .map((f) => f.replace(/\.md$/, ""))
        .filter((name) => !existingSet.has(name));

      if (orphaned.length === 0) {
        console.log("No orphaned memories found. Everything is clean.");
      } else {
        console.log(`Would clean ${orphaned.length} orphaned memories:`);
        for (const branch of orphaned) {
          console.log(`  - ${branch}`);
        }
        console.log("");
        console.log("Run without --dry-run to actually clean.");
      }
      return;
    }

    const cleaned = await manager.clean(branches);

    if (cleaned.length === 0) {
      console.log("No orphaned memories found. Everything is clean.");
    } else {
      console.log(`Cleaned ${cleaned.length} orphaned memories:`);
      for (const branch of cleaned) {
        console.log(`  - ${branch}`);
      }
      console.log("");
      console.log("Backups were created before removal.");
    }
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
