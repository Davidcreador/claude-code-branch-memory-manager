/**
 * Safe file system operations.
 * - Atomic writes (write to temp, then rename) with symlink protection
 * - Symlink detection
 * - Safe copy with optional backup
 */

import { promises as fs } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Check if a path is a symlink.
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(filePath);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists (follows symlinks).
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists and is NOT a symlink.
 * Use this for security-critical paths where symlink following is dangerous.
 */
export async function fileExistsStrict(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(filePath);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists.
 */
export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes. Returns 0 if file doesn't exist.
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * Get file modification time. Returns null if file doesn't exist.
 */
export async function getFileMtime(filePath: string): Promise<Date | null> {
  try {
    const stat = await fs.stat(filePath);
    return stat.mtime;
  } catch {
    return null;
  }
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 * Rejects symlinks for security.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  if (await isSymlink(dirPath)) {
    throw new Error(`Security: directory path is a symlink: ${dirPath}`);
  }
  await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
}

/**
 * Atomically write content to a file.
 * Writes to a temp file in the same directory, then renames.
 * This prevents partial writes / corruption.
 * Rejects if the target path is a symlink (prevents symlink attacks).
 */
export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<void> {
  // Security: reject symlink targets to prevent redirected writes
  if (await isSymlink(filePath)) {
    throw new Error(`Security: target path is a symlink: ${filePath}`);
  }

  const dir = dirname(filePath);
  await ensureDir(dir);

  const tempSuffix = randomBytes(6).toString("hex");
  const tempPath = join(dir, `.tmp-${tempSuffix}`);

  try {
    await fs.writeFile(tempPath, content, { encoding: "utf-8", mode: 0o600 });
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/**
 * Read a file's contents. Returns null if file doesn't exist.
 */
export async function readFileSafe(
  filePath: string,
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Copy a file with an optional backup of the destination.
 * Rejects symlinks at both source and destination for security.
 */
export async function safeCopy(
  source: string,
  destination: string,
  options?: { backup?: boolean; backupDir?: string },
): Promise<void> {
  // Security: reject symlink sources
  if (await isSymlink(source)) {
    throw new Error(`Security: source is a symlink: ${source}`);
  }

  // Security: reject symlink destinations
  if (await isSymlink(destination)) {
    throw new Error(`Security: destination is a symlink: ${destination}`);
  }

  // Backup existing destination if requested
  if (options?.backup && (await fileExists(destination))) {
    const backupDir = options.backupDir ?? dirname(destination);
    await ensureDir(backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = join(
      backupDir,
      `${basename(destination)}.backup-${timestamp}`,
    );
    await fs.copyFile(destination, backupPath);
  }

  await ensureDir(dirname(destination));
  await fs.copyFile(source, destination);
}

/**
 * Remove a file if it exists.
 */
export async function removeFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a directory matching an optional extension filter.
 */
export async function listFiles(
  dirPath: string,
  extension?: string,
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => {
        if (!e.isFile()) return false;
        if (extension && !e.name.endsWith(extension)) return false;
        return true;
      })
      .map((e) => e.name);
  } catch {
    return [];
  }
}
