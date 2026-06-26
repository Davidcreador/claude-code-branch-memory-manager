/**
 * Core memory management operations.
 *
 * Manages branch-specific CLAUDE.md files:
 * - save: Current CLAUDE.md -> .claude/memories/{branch}.md
 * - load: .claude/memories/{branch}.md -> CLAUDE.md
 * - list: Show all stored branch memories
 * - copy: Duplicate memory from one branch to another
 * - delete: Remove a branch's memory
 * - clean: Remove memories for branches that no longer exist
 * - restore: Restore from a backup
 */

import { join } from "node:path";
import {
  atomicWrite,
  ensureDir,
  fileExists,
  getFileMtime,
  getFileSize,
  listFiles,
  readFileSafe,
  removeFile,
  safeCopy,
} from "../utils/fs.js";
import {
  MemoryFileError,
  MemoryNotFoundError,
} from "../utils/errors.js";
import { sanitizeBranchName } from "./branch.js";
import { logger } from "../utils/logger.js";
import type { Config } from "./config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryInfo {
  branch: string;
  fileName: string;
  filePath: string;
  size: number;
  lastModified: Date | null;
  isCurrent: boolean;
}

export interface SaveResult {
  branch: string;
  filePath: string;
  backedUp: boolean;
}

export interface LoadResult {
  branch: string;
  filePath: string;
  fallback: boolean;
  fallbackBranch?: string;
}

// ---------------------------------------------------------------------------
// Memory Manager
// ---------------------------------------------------------------------------

export class MemoryManager {
  private readonly repoRoot: string;
  private readonly config: Config;

  constructor(repoRoot: string, config: Config) {
    this.repoRoot = repoRoot;
    this.config = config;
  }

  /** Absolute path to the memory storage directory */
  get memoryDir(): string {
    return join(this.repoRoot, this.config.memoryDir);
  }

  /** Absolute path to the active CLAUDE.md file */
  get memoryFilePath(): string {
    return join(this.repoRoot, this.config.memoryFileName);
  }

  /** Absolute path to the backup directory */
  get backupDir(): string {
    return join(this.memoryDir, ".backups");
  }

  /** Get the storage path for a branch's memory file */
  branchMemoryPath(branch: string): string {
    const safeName = sanitizeBranchName(branch);
    return join(this.memoryDir, `${safeName}.md`);
  }

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------

  /**
   * Save the current CLAUDE.md to a branch-specific memory file.
   */
  async save(
    branch: string,
    description?: string,
  ): Promise<SaveResult> {
    const memoryFile = this.memoryFilePath;

    // Check that CLAUDE.md exists and has content
    const content = await readFileSafe(memoryFile);
    if (content === null) {
      throw new MemoryFileError(
        `No ${this.config.memoryFileName} file found at ${memoryFile}`,
      );
    }
    if (content.trim().length === 0) {
      throw new MemoryFileError(
        `${this.config.memoryFileName} is empty`,
      );
    }

    const targetPath = this.branchMemoryPath(branch);
    const backedUp = await fileExists(targetPath);

    // Backup existing memory if it exists
    if (backedUp) {
      await ensureDir(this.backupDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = sanitizeBranchName(branch);
      const backupPath = join(this.backupDir, `${safeName}.${timestamp}.md`);
      await safeCopy(targetPath, backupPath);
      logger.debug(`Backed up existing memory to ${backupPath}`);
    }

    // Build the memory file with metadata header
    const timestamp = new Date().toISOString();
    const header = [
      `<!-- branch-memory: ${branch} -->`,
      `<!-- saved: ${timestamp} -->`,
      `<!-- description: ${description ?? "Manual save"} -->`,
      "",
    ].join("\n");

    await atomicWrite(targetPath, header + content);
    logger.debug(`Saved memory for branch '${branch}' to ${targetPath}`);

    return { branch, filePath: targetPath, backedUp };
  }

  // -------------------------------------------------------------------------
  // load
  // -------------------------------------------------------------------------

  /**
   * Load a branch-specific memory file into CLAUDE.md.
   * Falls back to default branches if configured.
   */
  async load(branch: string): Promise<LoadResult> {
    // Try the exact branch first
    const targetPath = this.branchMemoryPath(branch);
    let content = await readFileSafe(targetPath);

    if (content !== null) {
      await this.backupCurrentMemory(branch, "load");
      await atomicWrite(this.memoryFilePath, stripMetadataHeader(content));
      logger.debug(`Loaded memory for branch '${branch}'`);
      return { branch, filePath: targetPath, fallback: false };
    }

    // Try fallback branches
    if (this.config.fallbackToDefault) {
      for (const fallbackBranch of this.config.fallbackBranches) {
        const fallbackPath = this.branchMemoryPath(fallbackBranch);
        content = await readFileSafe(fallbackPath);
        if (content !== null) {
          await this.backupCurrentMemory(branch, "load-fallback");
          await atomicWrite(this.memoryFilePath, stripMetadataHeader(content));
          logger.info(
            `No memory for '${branch}', loaded fallback from '${fallbackBranch}'`,
          );
          return {
            branch,
            filePath: fallbackPath,
            fallback: true,
            fallbackBranch,
          };
        }
      }
    }

    throw new MemoryNotFoundError(branch);
  }

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------

  /**
   * List all stored branch memories with metadata.
   */
  async list(currentBranch?: string): Promise<MemoryInfo[]> {
    const files = await listFiles(this.memoryDir, ".md");
    const currentSafe = currentBranch
      ? sanitizeBranchName(currentBranch)
      : null;

    const memories: MemoryInfo[] = [];

    for (const fileName of files) {
      const filePath = join(this.memoryDir, fileName);
      const branchName = fileName.replace(/\.md$/, "");

      memories.push({
        branch: branchName,
        fileName,
        filePath,
        size: await getFileSize(filePath),
        lastModified: await getFileMtime(filePath),
        isCurrent: currentSafe === branchName,
      });
    }

    // Sort: current first, then alphabetically
    memories.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return a.branch.localeCompare(b.branch);
    });

    return memories;
  }

  // -------------------------------------------------------------------------
  // copy
  // -------------------------------------------------------------------------

  /**
   * Copy memory from one branch to another.
   */
  async copy(sourceBranch: string, targetBranch: string): Promise<void> {
    const sourcePath = this.branchMemoryPath(sourceBranch);
    const targetPath = this.branchMemoryPath(targetBranch);

    if (!(await fileExists(sourcePath))) {
      throw new MemoryNotFoundError(sourceBranch);
    }

    await ensureDir(this.memoryDir);
    await safeCopy(sourcePath, targetPath, {
      backup: true,
      backupDir: this.backupDir,
    });

    logger.debug(`Copied memory from '${sourceBranch}' to '${targetBranch}'`);
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  /**
   * Delete a branch's memory file.
   */
  async delete(branch: string): Promise<boolean> {
    const targetPath = this.branchMemoryPath(branch);

    // Backup before deletion
    if (await fileExists(targetPath)) {
      await ensureDir(this.backupDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = sanitizeBranchName(branch);
      const backupPath = join(
        this.backupDir,
        `${safeName}.deleted-${timestamp}.md`,
      );
      await safeCopy(targetPath, backupPath);
    }

    const removed = await removeFile(targetPath);
    if (removed) {
      logger.debug(`Deleted memory for branch '${branch}'`);
    }
    return removed;
  }

  // -------------------------------------------------------------------------
  // clean
  // -------------------------------------------------------------------------

  /**
   * Remove memories for branches that no longer exist locally.
   * Returns the list of cleaned branch names.
   */
  async clean(existingBranches: string[]): Promise<string[]> {
    const existingSet = new Set(
      existingBranches.map((b) => sanitizeBranchName(b)),
    );
    const files = await listFiles(this.memoryDir, ".md");
    const cleaned: string[] = [];

    for (const fileName of files) {
      const branchName = fileName.replace(/\.md$/, "");
      if (!existingSet.has(branchName)) {
        const filePath = join(this.memoryDir, fileName);
        // Backup before cleaning
        await ensureDir(this.backupDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = join(
          this.backupDir,
          `${branchName}.cleaned-${timestamp}.md`,
        );
        await safeCopy(filePath, backupPath);
        await removeFile(filePath);
        cleaned.push(branchName);
      }
    }

    return cleaned;
  }

  // -------------------------------------------------------------------------
  // restore
  // -------------------------------------------------------------------------

  /**
   * List available backups for a branch.
   */
  async listBackups(
    branch?: string,
  ): Promise<{ branch: string; fileName: string; filePath: string; timestamp: string }[]> {
    const files = await listFiles(this.backupDir, ".md");
    const safeBranch = branch ? sanitizeBranchName(branch) : null;

    return files
      .filter((f) => (safeBranch ? f.startsWith(safeBranch + ".") : true))
      .map((f) => {
        // Extract timestamp from backup filename.
        // Formats:
        //   {branch}.{timestamp}.md                         (from save)
        //   {branch}.deleted-{timestamp}.md                 (from delete)
        //   {branch}.before-{reason}-{timestamp}.md         (from load)
        //   {branch}.cleaned-{timestamp}.md                 (from clean)
        //   {file}.backup-{timestamp}                       (from safeCopy)
        // Timestamp is always YYYY-MM-DDTHH-MM-SS, preceded by . or -
        const tsMatch = f.match(/[.-](\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        // Branch part is everything up to the first dot after the branch name.
        // Since sanitized branch names cannot end with a dot, the first dot
        // marks the boundary between branch name and backup metadata.
        const firstDot = f.indexOf(".");
        const branchPart = firstDot > 0 ? f.substring(0, firstDot) : f.replace(/\.md$/, "");
        const timestamp = tsMatch?.[1] ?? "";

        return {
          branch: branchPart,
          fileName: f,
          filePath: join(this.backupDir, f),
          timestamp,
        };
      });
  }

  /**
   * Restore a branch's memory from the most recent backup.
   */
  async restore(branch: string): Promise<string> {
    const backups = await this.listBackups(branch);
    if (backups.length === 0) {
      throw new MemoryNotFoundError(`No backups found for branch: ${branch}`);
    }

    // Sort by extracted timestamp descending to get most recent
    backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latest = backups[0]!;

    const targetPath = this.branchMemoryPath(branch);
    await safeCopy(latest.filePath, targetPath);

    logger.debug(`Restored memory for '${branch}' from ${latest.fileName}`);
    return latest.filePath;
  }

  // -------------------------------------------------------------------------
  // exists
  // -------------------------------------------------------------------------

  /** Path to the file tracking the last active branch (for external-switch detection) */
  get activeBranchStatePath(): string {
    return join(this.memoryDir, ".active-branch");
  }

  /** Read the last active branch recorded by the hooks, or null if none. */
  async getActiveBranchState(): Promise<string | null> {
    const content = await readFileSafe(this.activeBranchStatePath);
    if (content === null) return null;
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /** Record the active branch so we can detect out-of-band switches later. */
  async setActiveBranchState(branch: string): Promise<void> {
    await ensureDir(this.memoryDir);
    await atomicWrite(this.activeBranchStatePath, branch.trim() + "\n");
  }

  /**
   * Check if a branch has a saved memory.
   */
  async exists(branch: string): Promise<boolean> {
    return fileExists(this.branchMemoryPath(branch));
  }

  /**
   * Check if the active CLAUDE.md file exists and has content.
   */
  async hasActiveMemory(): Promise<boolean> {
    const content = await readFileSafe(this.memoryFilePath);
    return content !== null && content.trim().length > 0;
  }

  // -------------------------------------------------------------------------
  // prune
  // -------------------------------------------------------------------------

  /**
   * Prune old backups, keeping only the most recent N per branch.
   * Returns the number of backups removed.
   */
  async pruneBackups(keepPerBranch = 10): Promise<number> {
    const allBackups = await this.listBackups();

    // Group by branch
    const byBranch = new Map<string, typeof allBackups>();
    for (const backup of allBackups) {
      const list = byBranch.get(backup.branch) ?? [];
      list.push(backup);
      byBranch.set(backup.branch, list);
    }

    let removed = 0;
    for (const [, backups] of byBranch) {
      // Sort by timestamp descending (most recent first)
      backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // Remove backups beyond the keep limit
      for (let i = keepPerBranch; i < backups.length; i++) {
        const backup = backups[i]!;
        await removeFile(backup.filePath);
        removed++;
      }
    }

    return removed;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Backup the current CLAUDE.md before overwriting it.
   */
  private async backupCurrentMemory(
    branch: string,
    reason: string,
  ): Promise<void> {
    if (await fileExists(this.memoryFilePath)) {
      await ensureDir(this.backupDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = sanitizeBranchName(branch);
      const backupPath = join(
        this.backupDir,
        `${safeName}.before-${reason}-${timestamp}.md`,
      );
      try {
        await safeCopy(this.memoryFilePath, backupPath);
      } catch (err) {
        logger.warn(`Failed to backup current memory: ${err}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Metadata comment prefixes that we insert when saving */
const METADATA_PREFIXES = [
  "<!-- branch-memory:",
  "<!-- saved:",
  "<!-- description:",
];

/**
 * Strip the metadata comment header that we add when saving.
 * Only strips lines matching our specific markers, NOT arbitrary HTML comments.
 * This preserves any user HTML comments in their CLAUDE.md.
 */
export function stripMetadataHeader(content: string): string {
  const lines = content.split("\n");
  let i = 0;

  // Skip only our specific metadata comment lines at the start
  while (
    i < lines.length &&
    METADATA_PREFIXES.some((prefix) => lines[i]!.startsWith(prefix))
  ) {
    i++;
  }

  // Skip a single blank line after our header
  if (i > 0 && i < lines.length && lines[i]!.trim() === "") {
    i++;
  }

  // If we didn't find any of our header lines, return original content
  if (i === 0) {
    return content;
  }

  return lines.slice(i).join("\n");
}
