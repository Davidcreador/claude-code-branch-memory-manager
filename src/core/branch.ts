/**
 * Git branch detection and name sanitization.
 */

import { execFile } from "node:child_process";
import { BranchMemoryError, NotGitRepoError, DetachedHeadError } from "../utils/errors.js";

/**
 * Execute a git command and return stdout.
 * Throws if the command fails.
 */
function git(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr.trim() || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Check if the current directory (or given path) is inside a git repository.
 */
export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    await git(["rev-parse", "--git-dir"], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the root directory of the git repository.
 * Throws NotGitRepoError if not in a git repo.
 */
export async function getRepoRoot(cwd?: string): Promise<string> {
  try {
    return await git(["rev-parse", "--show-toplevel"], cwd);
  } catch {
    throw new NotGitRepoError(cwd);
  }
}

/**
 * Get the current branch name.
 * Throws NotGitRepoError if not in a git repo.
 * Throws DetachedHeadError if in detached HEAD state.
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  if (!(await isGitRepo(cwd))) {
    throw new NotGitRepoError(cwd);
  }

  let branch: string;
  try {
    branch = await git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  } catch {
    // git rev-parse fails when there are no commits yet
    throw new BranchMemoryError(
      "No commits in this repository yet. Create an initial commit first.",
      "NO_COMMITS",
    );
  }

  if (branch === "HEAD") {
    throw new DetachedHeadError();
  }

  return branch;
}

/**
 * Get the previous branch (the one checked out before the current one).
 * Returns null if there's no previous branch info.
 */
export async function getPreviousBranch(cwd?: string): Promise<string | null> {
  try {
    const prev = await git(["rev-parse", "--abbrev-ref", "@{-1}"], cwd);
    return prev === "HEAD" ? null : prev;
  } catch {
    return null;
  }
}

/**
 * List all local branches.
 */
export async function listBranches(cwd?: string): Promise<string[]> {
  try {
    const output = await git(
      ["for-each-ref", "--format=%(refname:short)", "refs/heads/"],
      cwd,
    );
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Sanitize a branch name for use as a filename.
 *
 * - Prevents path traversal (../, ~, leading /)
 * - Replaces non-alphanumeric chars (except . _ -) with _
 * - Collapses consecutive underscores
 * - Prevents leading dots (hidden files)
 * - Enforces max length of 200 characters
 */
export function sanitizeBranchName(branchName: string): string {
  let safe = branchName;

  // Remove path traversal sequences
  safe = safe.replace(/\.\.\//g, "_");
  safe = safe.replace(/\.\.\\/g, "_");

  // Remove leading / or ~
  safe = safe.replace(/^[/~]+/, "");

  // Replace any non-safe characters with underscore.
  // Allow Unicode letters (\p{L}) to support international branch names.
  safe = safe.replace(/[^a-zA-Z0-9._\p{L}-]/gu, "_");

  // Collapse consecutive underscores
  safe = safe.replace(/_+/g, "_");

  // Prevent leading dot (hidden file)
  safe = safe.replace(/^\./, "_");

  // Trim trailing underscores and dots
  safe = safe.replace(/[_.]+$/, "");

  // Enforce max length
  if (safe.length > 200) {
    safe = safe.substring(0, 200);
  }

  // Fallback if somehow empty
  if (!safe) {
    safe = "unnamed";
  }

  return safe;
}

/**
 * Validate that a branch name is safe to use.
 * Returns an error message if invalid, null if valid.
 */
export function validateBranchInput(input: string): string | null {
  if (!input || input.trim().length === 0) {
    return "Branch name cannot be empty";
  }

  if (input.length > 255) {
    return "Branch name too long (max 255 characters)";
  }

  if (input.includes("\0")) {
    return "Branch name contains null bytes";
  }

  if (input.startsWith("/") || input.startsWith("~")) {
    return "Branch name cannot start with / or ~";
  }

  if (input.includes("..")) {
    return "Branch name cannot contain path traversal (..)";
  }

  return null;
}
