import { getCurrentBranch, getRepoRoot } from "../core/branch.js";
import { loadConfig } from "../core/config.js";
import { MemoryManager } from "../core/memory-manager.js";
import { atomicWrite, fileExists, readFileSafe } from "../utils/fs.js";
import { BranchMemoryError } from "../utils/errors.js";
import { basename, join } from "node:path";

export async function initCommand(): Promise<void> {
  try {
    const repoRoot = await getRepoRoot();
    const config = await loadConfig(repoRoot);
    const manager = new MemoryManager(repoRoot, config);
    const branch = await getCurrentBranch();
    const repoName = basename(repoRoot);

    console.log(`Initializing branch memory for ${repoName}...`);
    console.log("");

    // Create CLAUDE.md if it doesn't exist
    if (!(await fileExists(manager.memoryFilePath))) {
      const template = [
        `# ${repoName}`,
        "",
        `## Branch: ${branch}`,
        "",
        "## Current Work",
        "",
        "- Getting started",
        "",
        "## Notes",
        "",
        "Add your branch-specific context and development notes here.",
        "This file is managed by branch-memory and will automatically",
        "switch when you change git branches.",
        "",
      ].join("\n");

      await atomicWrite(manager.memoryFilePath, template);
      console.log(`Created ${config.memoryFileName}`);
    } else {
      console.log(`${config.memoryFileName} already exists`);
    }

    // Save initial memory
    if (await manager.exists(branch)) {
      console.log(`Memory already saved for '${branch}'`);
    } else {
      try {
        await manager.save(branch, "Initial setup");
        console.log(`Saved initial memory for branch '${branch}'`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Warning: failed to save initial memory: ${msg}`);
      }
    }

    // Check if .gitignore includes memory directory
    const gitignorePath = join(repoRoot, ".gitignore");
    const gitignore = await readFileSafe(gitignorePath);
    const memoryDirPattern = config.memoryDir;
    if (!gitignore || !gitignore.includes(memoryDirPattern)) {
      console.log("");
      console.log(`Tip: Add '${memoryDirPattern}/' to your .gitignore`);
      console.log("if you don't want to share memories via version control.");
    }

    console.log("");
    console.log("Setup complete! Branch memory is ready.");
    console.log("");
    console.log("If using as a Claude Code plugin, memories will");
    console.log("switch automatically when you change branches.");
    console.log("");
    console.log("Manual commands:");
    console.log("  branch-memory save \"description\"  - Save current memory");
    console.log("  branch-memory load <branch>       - Load a branch's memory");
    console.log("  branch-memory list                - List all memories");
    console.log("  branch-memory status              - Show current status");
  } catch (err) {
    if (err instanceof BranchMemoryError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
