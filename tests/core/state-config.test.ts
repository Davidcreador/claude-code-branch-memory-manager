import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../../src/core/config.js";
import { MemoryManager } from "../../src/core/memory-manager.js";

describe("config: session-end / external-switch defaults", () => {
  it("defaults autoSaveOnSessionEnd and watchExternalSwitch to true", async () => {
    const config = await loadConfig();
    expect(config.autoSaveOnSessionEnd).toBe(true);
    expect(config.watchExternalSwitch).toBe(true);
  });

  it("honors env overrides for the new flags", async () => {
    process.env["BRANCH_MEMORY_AUTO_SAVE_ON_END"] = "false";
    process.env["BRANCH_MEMORY_WATCH_EXTERNAL"] = "false";
    try {
      const config = await loadConfig();
      expect(config.autoSaveOnSessionEnd).toBe(false);
      expect(config.watchExternalSwitch).toBe(false);
    } finally {
      delete process.env["BRANCH_MEMORY_AUTO_SAVE_ON_END"];
      delete process.env["BRANCH_MEMORY_WATCH_EXTERNAL"];
    }
  });
});

describe("MemoryManager active-branch state", () => {
  let tempDir: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), "branch-memory-state-"));
    const config = await loadConfig();
    manager = new MemoryManager(tempDir, config);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns null when no state has been recorded", async () => {
    expect(await manager.getActiveBranchState()).toBeNull();
  });

  it("round-trips the active branch", async () => {
    await manager.setActiveBranchState("feature/api");
    expect(await manager.getActiveBranchState()).toBe("feature/api");
  });

  it("overwrites the previous active branch", async () => {
    await manager.setActiveBranchState("main");
    await manager.setActiveBranchState("develop");
    expect(await manager.getActiveBranchState()).toBe("develop");
  });

  it("does not expose the state file as a branch memory", async () => {
    await manager.setActiveBranchState("main");
    await fs.writeFile(manager.memoryFilePath, "# content\n");
    await manager.save("main");
    const memories = await manager.list();
    expect(memories.map((m) => m.branch)).not.toContain(".active-branch");
  });
});
