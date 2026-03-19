import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { atomicWrite, safeCopy, isSymlink } from "../../src/utils/fs.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

function createTempDir(): string {
  return join(tmpdir(), `branch-memory-fs-test-${randomBytes(6).toString("hex")}`);
}

describe("fs security", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("atomicWrite", () => {
    it("writes content atomically", async () => {
      const filePath = join(tempDir, "test.md");
      await atomicWrite(filePath, "# Hello");
      const content = await fs.readFile(filePath, "utf-8");
      expect(content).toBe("# Hello");
    });

    it("rejects if target is a symlink", async () => {
      const realFile = join(tempDir, "real.md");
      const symlinkFile = join(tempDir, "symlink.md");
      await fs.writeFile(realFile, "real content");
      await fs.symlink(realFile, symlinkFile);

      await expect(atomicWrite(symlinkFile, "malicious")).rejects.toThrow(
        /symlink/i,
      );

      // Real file should not be modified
      const content = await fs.readFile(realFile, "utf-8");
      expect(content).toBe("real content");
    });

    it("creates parent directories", async () => {
      const filePath = join(tempDir, "a", "b", "c", "test.md");
      await atomicWrite(filePath, "nested");
      const content = await fs.readFile(filePath, "utf-8");
      expect(content).toBe("nested");
    });
  });

  describe("safeCopy", () => {
    it("copies files normally", async () => {
      const src = join(tempDir, "source.md");
      const dst = join(tempDir, "dest.md");
      await fs.writeFile(src, "content");

      await safeCopy(src, dst);

      const result = await fs.readFile(dst, "utf-8");
      expect(result).toBe("content");
    });

    it("rejects symlink source", async () => {
      const realFile = join(tempDir, "real.md");
      const symlinkSrc = join(tempDir, "symlink-src.md");
      const dst = join(tempDir, "dest.md");

      await fs.writeFile(realFile, "real content");
      await fs.symlink(realFile, symlinkSrc);

      await expect(safeCopy(symlinkSrc, dst)).rejects.toThrow(/symlink/i);
    });

    it("rejects symlink destination", async () => {
      const src = join(tempDir, "source.md");
      const realDst = join(tempDir, "real-dst.md");
      const symlinkDst = join(tempDir, "symlink-dst.md");

      await fs.writeFile(src, "content");
      await fs.writeFile(realDst, "original");
      await fs.symlink(realDst, symlinkDst);

      await expect(safeCopy(src, symlinkDst)).rejects.toThrow(/symlink/i);

      // Real destination should not be modified
      const content = await fs.readFile(realDst, "utf-8");
      expect(content).toBe("original");
    });
  });

  describe("isSymlink", () => {
    it("returns false for regular files", async () => {
      const filePath = join(tempDir, "regular.md");
      await fs.writeFile(filePath, "content");
      expect(await isSymlink(filePath)).toBe(false);
    });

    it("returns true for symlinks", async () => {
      const realFile = join(tempDir, "real.md");
      const symlinkFile = join(tempDir, "link.md");
      await fs.writeFile(realFile, "content");
      await fs.symlink(realFile, symlinkFile);
      expect(await isSymlink(symlinkFile)).toBe(true);
    });

    it("returns false for non-existent paths", async () => {
      expect(await isSymlink(join(tempDir, "nope.md"))).toBe(false);
    });
  });
});
