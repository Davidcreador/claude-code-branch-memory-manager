import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryManager } from "../../src/core/memory-manager.js";
import type { Config } from "../../src/core/config.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

function createTempDir(): string {
  const dir = join(tmpdir(), `branch-memory-test-${randomBytes(6).toString("hex")}`);
  return dir;
}

function defaultConfig(): Config {
  return {
    memoryDir: ".claude/memories",
    memoryFileName: "CLAUDE.md",
    autoSaveOnSwitch: true,
    fallbackToDefault: true,
    fallbackBranches: ["main", "master", "develop"],
  };
}

describe("MemoryManager", () => {
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

  describe("save", () => {
    it("saves CLAUDE.md to branch-specific file", async () => {
      // Create a CLAUDE.md
      const content = "# My project notes\n\nSome context here.";
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), content);

      const result = await manager.save("feature/test", "Test save");

      expect(result.branch).toBe("feature/test");
      expect(result.backedUp).toBe(false);

      // Verify the saved file exists and contains the content
      const saved = await fs.readFile(result.filePath, "utf-8");
      expect(saved).toContain("# My project notes");
      expect(saved).toContain("Some context here.");
      expect(saved).toContain("<!-- branch-memory: feature/test -->");
      expect(saved).toContain("<!-- description: Test save -->");
    });

    it("backs up existing memory when saving over it", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Version 1");
      await manager.save("main", "First save");

      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Version 2");
      const result = await manager.save("main", "Second save");

      expect(result.backedUp).toBe(true);

      // Verify backup was created
      const backupDir = join(repoRoot, ".claude/memories/.backups");
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });

    it("throws when CLAUDE.md doesn't exist", async () => {
      await expect(manager.save("main")).rejects.toThrow(/No CLAUDE\.md/);
    });

    it("throws when CLAUDE.md is empty", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "");
      await expect(manager.save("main")).rejects.toThrow(/empty/);
    });
  });

  describe("load", () => {
    it("loads branch-specific memory into CLAUDE.md", async () => {
      // Set up: save a memory first
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Feature work");
      await manager.save("feature/api", "API work");

      // Now clear and load
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Old content");
      const result = await manager.load("feature/api");

      expect(result.branch).toBe("feature/api");
      expect(result.fallback).toBe(false);

      // Verify CLAUDE.md was updated (metadata stripped)
      const loaded = await fs.readFile(join(repoRoot, "CLAUDE.md"), "utf-8");
      expect(loaded).toContain("# Feature work");
      expect(loaded).not.toContain("<!-- branch-memory:");
    });

    it("falls back to main branch when no memory exists", async () => {
      // Save memory for main
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Main branch context");
      await manager.save("main", "Main branch");

      // Try to load nonexistent branch
      const result = await manager.load("feature/nonexistent");
      expect(result.fallback).toBe(true);
      expect(result.fallbackBranch).toBe("main");
    });

    it("throws when no memory exists and no fallback available", async () => {
      await expect(manager.load("nonexistent")).rejects.toThrow(
        /No memory found/,
      );
    });
  });

  describe("list", () => {
    it("returns empty array when no memories exist", async () => {
      const memories = await manager.list();
      expect(memories).toEqual([]);
    });

    it("lists all stored memories", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("main", "Main");
      await manager.save("develop", "Develop");

      const memories = await manager.list();
      expect(memories.length).toBe(2);
      expect(memories.map((m) => m.branch)).toContain("main");
      expect(memories.map((m) => m.branch)).toContain("develop");
    });

    it("marks current branch", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("main", "Main");
      await manager.save("develop", "Develop");

      const memories = await manager.list("main");
      const mainMem = memories.find((m) => m.branch === "main");
      const devMem = memories.find((m) => m.branch === "develop");
      expect(mainMem?.isCurrent).toBe(true);
      expect(devMem?.isCurrent).toBe(false);
    });
  });

  describe("copy", () => {
    it("copies memory from one branch to another", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Original");
      await manager.save("main", "Source");

      await manager.copy("main", "feature/copy");

      expect(await manager.exists("feature/copy")).toBe(true);
    });

    it("throws when source doesn't exist", async () => {
      await expect(manager.copy("nonexistent", "target")).rejects.toThrow(
        /No memory found/,
      );
    });
  });

  describe("delete", () => {
    it("deletes a branch memory and creates backup", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("feature/delete-me", "Will be deleted");

      expect(await manager.exists("feature/delete-me")).toBe(true);
      const deleted = await manager.delete("feature/delete-me");
      expect(deleted).toBe(true);
      expect(await manager.exists("feature/delete-me")).toBe(false);

      // Verify backup was created
      const backups = await manager.listBackups("feature/delete-me");
      expect(backups.length).toBeGreaterThan(0);
    });

    it("returns false when memory doesn't exist", async () => {
      const deleted = await manager.delete("nonexistent");
      expect(deleted).toBe(false);
    });
  });

  describe("clean", () => {
    it("removes memories for branches that no longer exist", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("main", "Main");
      await manager.save("feature/old", "Old feature");
      await manager.save("feature/current", "Current");

      // Only main and feature/current still exist
      const cleaned = await manager.clean(["main", "feature/current"]);

      expect(cleaned).toContain("feature_old");
      expect(await manager.exists("main")).toBe(true);
      expect(await manager.exists("feature/current")).toBe(true);
      expect(await manager.exists("feature/old")).toBe(false);
    });

    it("returns empty when all branches exist", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("main", "Main");

      const cleaned = await manager.clean(["main"]);
      expect(cleaned).toEqual([]);
    });
  });

  describe("exists / hasActiveMemory", () => {
    it("exists returns false for non-existent branch", async () => {
      expect(await manager.exists("nope")).toBe(false);
    });

    it("exists returns true after saving", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      await manager.save("main");
      expect(await manager.exists("main")).toBe(true);
    });

    it("hasActiveMemory returns false when no CLAUDE.md", async () => {
      expect(await manager.hasActiveMemory()).toBe(false);
    });

    it("hasActiveMemory returns true when CLAUDE.md has content", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "# Content");
      expect(await manager.hasActiveMemory()).toBe(true);
    });

    it("hasActiveMemory returns false when CLAUDE.md is empty", async () => {
      await fs.writeFile(join(repoRoot, "CLAUDE.md"), "   \n  ");
      expect(await manager.hasActiveMemory()).toBe(false);
    });
  });
});
