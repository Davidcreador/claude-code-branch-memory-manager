import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../../src/core/config.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

function createTempDir(): string {
  return join(tmpdir(), `branch-memory-config-test-${randomBytes(6).toString("hex")}`);
}

describe("loadConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    // Clear relevant env vars
    delete process.env["BRANCH_MEMORY_DIR"];
    delete process.env["BRANCH_MEMORY_FILE"];
    delete process.env["BRANCH_MEMORY_AUTO_SAVE"];
    delete process.env["BRANCH_MEMORY_FALLBACK"];
    delete process.env["BRANCH_MEMORY_FALLBACK_BRANCHES"];
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env["BRANCH_MEMORY_DIR"];
    delete process.env["BRANCH_MEMORY_FILE"];
    delete process.env["BRANCH_MEMORY_AUTO_SAVE"];
    delete process.env["BRANCH_MEMORY_FALLBACK"];
    delete process.env["BRANCH_MEMORY_FALLBACK_BRANCHES"];
  });

  it("returns defaults when no config file exists", async () => {
    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe(".claude/memories");
    expect(config.memoryFileName).toBe("CLAUDE.md");
    expect(config.autoSaveOnSwitch).toBe(true);
    expect(config.fallbackToDefault).toBe(true);
    expect(config.fallbackBranches).toEqual(["main", "master", "develop"]);
  });

  it("loads config from .branch-memory.json", async () => {
    const configData = {
      memoryDir: "custom/memories",
      autoSaveOnSwitch: false,
    };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe("custom/memories");
    expect(config.autoSaveOnSwitch).toBe(false);
    // Defaults still apply for unspecified values
    expect(config.memoryFileName).toBe("CLAUDE.md");
  });

  it("environment variables override file config", async () => {
    const configData = { memoryDir: "from-file" };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    process.env["BRANCH_MEMORY_DIR"] = "from-env";

    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe("from-env");
  });

  it("parses fallback branches from comma-separated env var", async () => {
    process.env["BRANCH_MEMORY_FALLBACK_BRANCHES"] = "main, production, staging";

    const config = await loadConfig(tempDir);
    expect(config.fallbackBranches).toEqual(["main", "production", "staging"]);
  });

  it("handles invalid JSON in config file gracefully", async () => {
    await fs.writeFile(join(tempDir, ".branch-memory.json"), "not json!");

    // Should not throw — falls back to defaults
    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe(".claude/memories");
  });

  it("works without a repo root", async () => {
    const config = await loadConfig();
    expect(config.memoryDir).toBe(".claude/memories");
  });

  // Security: prototype pollution prevention
  it("ignores unknown keys from config file (prototype pollution prevention)", async () => {
    const configData = {
      memoryDir: "safe/path",
      __proto__: { polluted: true },
      constructor: "evil",
      unknownKey: "should-be-ignored",
    };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe("safe/path");
    expect((config as unknown as Record<string, unknown>)["unknownKey"]).toBeUndefined();
    expect((config as unknown as Record<string, unknown>)["constructor"]).not.toBe("evil");
  });

  // Path traversal validation
  it("rejects memoryDir with path traversal", async () => {
    const configData = { memoryDir: "../../etc/evil" };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    await expect(loadConfig(tempDir)).rejects.toThrow(/path traversal/i);
  });

  it("rejects memoryDir with absolute path", async () => {
    process.env["BRANCH_MEMORY_DIR"] = "/tmp/evil";

    await expect(loadConfig(tempDir)).rejects.toThrow(/relative path/i);
  });

  it("rejects memoryFileName with path traversal", async () => {
    const configData = { memoryFileName: "../../.ssh/authorized_keys" };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    await expect(loadConfig(tempDir)).rejects.toThrow(/path traversal/i);
  });

  // Runtime type validation
  it("resets memoryDir to default if not a string", async () => {
    const configData = { memoryDir: 42 };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    const config = await loadConfig(tempDir);
    expect(config.memoryDir).toBe(".claude/memories");
  });

  it("resets fallbackBranches to default if not an array", async () => {
    const configData = { fallbackBranches: "main,develop" };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    const config = await loadConfig(tempDir);
    expect(Array.isArray(config.fallbackBranches)).toBe(true);
    expect(config.fallbackBranches).toEqual(["main", "master", "develop"]);
  });

  it("coerces autoSaveOnSwitch to boolean", async () => {
    const configData = { autoSaveOnSwitch: "yes" };
    await fs.writeFile(
      join(tempDir, ".branch-memory.json"),
      JSON.stringify(configData),
    );

    const config = await loadConfig(tempDir);
    expect(typeof config.autoSaveOnSwitch).toBe("boolean");
  });
});
