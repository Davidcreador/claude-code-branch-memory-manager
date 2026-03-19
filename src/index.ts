/**
 * Claude Code Branch Memory Manager
 *
 * Manages branch-specific CLAUDE.md files so Claude Code
 * always has the right context for your current git branch.
 */

export { MemoryManager } from "./core/memory-manager.js";
export type { MemoryInfo, SaveResult, LoadResult } from "./core/memory-manager.js";
export { loadConfig } from "./core/config.js";
export type { Config } from "./core/config.js";
export {
  getCurrentBranch,
  getRepoRoot,
  isGitRepo,
  sanitizeBranchName,
  listBranches,
  validateBranchInput,
} from "./core/branch.js";
export {
  BranchMemoryError,
  NotGitRepoError,
  DetachedHeadError,
  MemoryNotFoundError,
  MemoryFileError,
  ConfigError,
} from "./utils/errors.js";
