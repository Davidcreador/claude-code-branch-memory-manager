/**
 * Custom error types for branch memory operations.
 */

export class BranchMemoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "BranchMemoryError";
  }
}

export class NotGitRepoError extends BranchMemoryError {
  constructor(cwd?: string) {
    super(
      `Not a git repository${cwd ? `: ${cwd}` : ""}`,
      "NOT_GIT_REPO",
    );
    this.name = "NotGitRepoError";
  }
}

export class DetachedHeadError extends BranchMemoryError {
  constructor() {
    super(
      "Cannot manage memory in detached HEAD state. Switch to a named branch first.",
      "DETACHED_HEAD",
    );
    this.name = "DetachedHeadError";
  }
}

export class MemoryNotFoundError extends BranchMemoryError {
  constructor(branch: string) {
    super(
      `No memory found for branch: ${branch}`,
      "MEMORY_NOT_FOUND",
    );
    this.name = "MemoryNotFoundError";
  }
}

export class MemoryFileError extends BranchMemoryError {
  constructor(message: string) {
    super(message, "MEMORY_FILE_ERROR");
    this.name = "MemoryFileError";
  }
}

export class ConfigError extends BranchMemoryError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
