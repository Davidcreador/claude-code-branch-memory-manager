import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { formatBytes, formatDate } from "../utils/format.js";
import { BranchMemoryError } from "../utils/errors.js";

export async function listCommand(): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);

    let currentBranch: string | undefined;
    try {
      currentBranch = await getCurrentBranch();
    } catch {
      // May be in detached head, that's fine for listing
    }

    const memories = await manager.list(currentBranch);

    if (memories.length === 0) {
      console.log("No branch memories found.");
      console.log("");
      console.log("Save your first memory:");
      console.log("  branch-memory save \"Initial setup\"");
      return;
    }

    console.log("Branch memories:");
    console.log("");

    for (const mem of memories) {
      const marker = mem.isCurrent ? " -> " : "    ";
      const tag = mem.isCurrent ? " [current]" : "";
      const size = formatBytes(mem.size);
      const date = formatDate(mem.lastModified);
      console.log(`${marker}${mem.branch} (${size}, ${date})${tag}`);
    }
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
