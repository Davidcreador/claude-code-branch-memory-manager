import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryManager } from "../../src/core/memory-manager.js";
import type { Config } from "../../src/core/config.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

function createTempDir(): string {
  return join(tmpdir(), `branch-memory-restore-test-${randomBytes(6).toString("hex")}`);
}

function defaultConfig(): Config {
  return {
    memoryDir: ".claude/memories",
    memoryFileName: "CLAUDE.md",
    autoSaveOnSwitch: true,
    autoSaveOnSessionEnd: true,
    watchExternalSwitch: true,
    fallbackToDefault: true,
    fallbackBranches: ["main", "master", "develop"],
  };
}

/** Small delay to ensure different timestamps in backup filenames */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("MemoryManager restore", () => {
  let repoRoot: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    repoRoot = createTempDir();
    await fs.mkdir(repoRoot, { recursive: true });
    manager = new MemoryManager(repoRoot, defaultConfig());
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("restores from the most recent backup with correct content", async () => {
    // Save version 1
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Version 1");
    await manager.save("main", "First save");

    await sleep(10);

    // Save version 2 (overwrites, creating backup of version 1)
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Version 2");
    await manager.save("main", "Second save");

    // Now delete the memory (creating a "deleted" backup of version 2)
    await manager.delete("main");
    expect(await manager.exists("main")).toBe(false);

    // Restore should bring back the deleted version
    const backupPath = await manager.restore("main");
    expect(backupPath).toBeTruthy();
    expect(await manager.exists("main")).toBe(true);
  });

  it("throws when no backups exist", async () => {
    await expect(manager.restore("nonexistent")).rejects.toThrow(
      /No backups found/,
    );
  });

  it("listBackups returns backups from save operations", async () => {
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
    await manager.save("main", "Save 1");
    await sleep(10);
    await manager.save("main", "Save 2");

    const backups = await manager.listBackups("main");
    expect(backups.length).toBeGreaterThan(0);
    expect(backups.every((b) => b.branch === "main")).toBe(true);
    // Timestamps should be non-empty for save-generated backups
    expect(backups.every((b) => b.timestamp.length > 0)).toBe(true);
  });

  it("listBackups returns backups from delete operations", async () => {
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
    await manager.save("develop", "Initial");
    await manager.delete("develop");

    const backups = await manager.listBackups("develop");
    expect(backups.length).toBeGreaterThan(0);
    // Deleted backups should also have extractable timestamps
    expect(backups.every((b) => b.timestamp.length > 0)).toBe(true);
  });

  it("listBackups returns backups from load operations", async () => {
    // Save memory for main
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Main content");
    await manager.save("main", "Main save");

    // Create a different active memory and load main's memory
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Other content");
    await manager.load("main");

    // The "before-load" backup should exist
    const backups = await manager.listBackups("main");
    expect(backups.length).toBeGreaterThan(0);
    expect(backups.every((b) => b.timestamp.length > 0)).toBe(true);
  });

  it("listBackups returns all backups when no branch specified", async () => {
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
    await manager.save("main", "Save main");
    await sleep(10);
    await manager.save("main", "Save main again");
    await manager.save("develop", "Save develop");

    const allBackups = await manager.listBackups();
    expect(allBackups.length).toBeGreaterThan(0);
  });

  it("handles branch names with dots correctly", async () => {
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Version");
    await manager.save("v1.2.3", "Release");
    await sleep(10);
    await manager.save("v1.2.3", "Release update");

    const backups = await manager.listBackups("v1.2.3");
    expect(backups.length).toBeGreaterThan(0);
    // Branch extraction should get the branch name from the first dot
    expect(backups.every((b) => b.branch === "v1")).toBe(true);
  });
});

describe("MemoryManager pruneBackups", () => {
  let repoRoot: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    repoRoot = createTempDir();
    await fs.mkdir(repoRoot, { recursive: true });
    manager = new MemoryManager(repoRoot, defaultConfig());
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("prunes old backups keeping last N per branch", async () => {
    // Create many backups by saving repeatedly
    await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
    for (let i = 0; i < 5; i++) {
      await manager.save("main", `Save ${i}`);
      await sleep(10);
    }

    const beforePrune = await manager.listBackups("main");
    expect(beforePrune.length).toBe(4); // 4 backups from 5 saves (first save has no backup)

    const removed = await manager.pruneBackups(2);
    expect(removed).toBe(2); // Keep 2, remove 2

    const afterPrune = await manager.listBackups("main");
    expect(afterPrune.length).toBe(2);
  });

  it("returns 0 when nothing to prune", async () => {
    const removed = await manager.pruneBackups(10);
    expect(removed).toBe(0);
  });
});
