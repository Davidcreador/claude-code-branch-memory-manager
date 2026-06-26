/**
 * Configuration management.
 *
 * Resolution order (highest priority first):
 * 1. Environment variables (BRANCH_MEMORY_*)
 * 2. Local config (.branch-memory.json in repo root)
 * 3. Defaults
 */

import { readFileSafe } from "../utils/fs.js";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { ConfigError } from "../utils/errors.js";

export interface Config {
  /** Directory where branch memories are stored, relative to repo root */
  memoryDir: string;
  /** Name of the memory file Claude Code reads */
  memoryFileName: string;
  /** Automatically save memory when switching branches */
  autoSaveOnSwitch: boolean;
  /** Fallback to main/master/develop if no branch memory exists */
  fallbackToDefault: boolean;
  /** Default branches to try as fallback, in order */
  fallbackBranches: string[];
  /** Automatically save the active memory when a Claude Code session ends */
  autoSaveOnSessionEnd: boolean;
  /** On each prompt, detect branch switches made outside Claude Code (e.g. another terminal) */
  watchExternalSwitch: boolean;
}

const DEFAULT_CONFIG: Config = {
  memoryDir: ".claude/memories",
  memoryFileName: "CLAUDE.md",
  autoSaveOnSwitch: true,
  fallbackToDefault: true,
  fallbackBranches: ["main", "master", "develop"],
  autoSaveOnSessionEnd: true,
  watchExternalSwitch: true,
};

/** Known config keys — only these are accepted from file config */
const KNOWN_KEYS = new Set<keyof Config>([
  "memoryDir",
  "memoryFileName",
  "autoSaveOnSwitch",
  "fallbackToDefault",
  "fallbackBranches",
  "autoSaveOnSessionEnd",
  "watchExternalSwitch",
]);

/**
 * Validate a path-like config value.
 * Rejects path traversal, absolute paths, and home dir references.
 */
function validatePathValue(value: string, fieldName: string): void {
  if (value.includes("..")) {
    throw new ConfigError(`${fieldName} cannot contain path traversal (..): ${value}`);
  }
  if (value.startsWith("/") || value.startsWith("~")) {
    throw new ConfigError(`${fieldName} must be a relative path: ${value}`);
  }
  if (value.includes("\0")) {
    throw new ConfigError(`${fieldName} contains null bytes`);
  }
}

/**
 * Load configuration, merging environment variables over file config over defaults.
 */
export async function loadConfig(repoRoot?: string): Promise<Config> {
  const config = { ...DEFAULT_CONFIG };

  // Try to load local config file
  if (repoRoot) {
    const configPath = join(repoRoot, ".branch-memory.json");
    const raw = await readFileSafe(configPath);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;

        // Only apply known keys (prevents prototype pollution)
        for (const key of KNOWN_KEYS) {
          if (key in parsed && parsed[key] !== undefined) {
            (config as Record<string, unknown>)[key] = parsed[key];
          }
        }

        logger.debug(`Loaded config from ${configPath}`);
      } catch (err) {
        logger.warn(`Invalid config file at ${configPath}: ${err}`);
      }
    }
  }

  // Environment variable overrides
  const env = process.env;

  if (env["BRANCH_MEMORY_DIR"]) {
    config.memoryDir = env["BRANCH_MEMORY_DIR"];
  }
  if (env["BRANCH_MEMORY_FILE"]) {
    config.memoryFileName = env["BRANCH_MEMORY_FILE"];
  }
  if (env["BRANCH_MEMORY_AUTO_SAVE"] !== undefined) {
    config.autoSaveOnSwitch = env["BRANCH_MEMORY_AUTO_SAVE"] !== "false";
  }
  if (env["BRANCH_MEMORY_FALLBACK"] !== undefined) {
    config.fallbackToDefault = env["BRANCH_MEMORY_FALLBACK"] !== "false";
  }
  if (env["BRANCH_MEMORY_FALLBACK_BRANCHES"]) {
    config.fallbackBranches = env["BRANCH_MEMORY_FALLBACK_BRANCHES"]
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
  }
  if (env["BRANCH_MEMORY_AUTO_SAVE_ON_END"] !== undefined) {
    config.autoSaveOnSessionEnd = env["BRANCH_MEMORY_AUTO_SAVE_ON_END"] !== "false";
  }
  if (env["BRANCH_MEMORY_WATCH_EXTERNAL"] !== undefined) {
    config.watchExternalSwitch = env["BRANCH_MEMORY_WATCH_EXTERNAL"] !== "false";
  }

  // Runtime type validation — reset to defaults if types are wrong
  if (typeof config.memoryDir !== "string") {
    logger.warn(`memoryDir has wrong type (${typeof config.memoryDir}), using default`);
    config.memoryDir = DEFAULT_CONFIG.memoryDir;
  }
  if (typeof config.memoryFileName !== "string") {
    logger.warn(`memoryFileName has wrong type (${typeof config.memoryFileName}), using default`);
    config.memoryFileName = DEFAULT_CONFIG.memoryFileName;
  }
  if (typeof config.autoSaveOnSwitch !== "boolean") {
    config.autoSaveOnSwitch = Boolean(config.autoSaveOnSwitch);
  }
  if (typeof config.fallbackToDefault !== "boolean") {
    config.fallbackToDefault = Boolean(config.fallbackToDefault);
  }
  if (typeof config.autoSaveOnSessionEnd !== "boolean") {
    config.autoSaveOnSessionEnd = Boolean(config.autoSaveOnSessionEnd);
  }
  if (typeof config.watchExternalSwitch !== "boolean") {
    config.watchExternalSwitch = Boolean(config.watchExternalSwitch);
  }
  if (!Array.isArray(config.fallbackBranches)) {
    logger.warn(`fallbackBranches has wrong type (${typeof config.fallbackBranches}), using default`);
    config.fallbackBranches = DEFAULT_CONFIG.fallbackBranches;
  }

  // Validate path-like config values
  validatePathValue(config.memoryDir, "memoryDir");
  validatePathValue(config.memoryFileName, "memoryFileName");

  return config;
}
