import { describe, it, expect } from "vitest";
import { detectBranchSwitch } from "../../src/hooks/post-tool-use.js";

describe("detectBranchSwitch", () => {
  // -----------------------------------------------------------------------
  // Basic checkout patterns
  // -----------------------------------------------------------------------
  it("detects git checkout <branch>", () => {
    expect(detectBranchSwitch("git checkout main")).toBe("main");
    expect(detectBranchSwitch("git checkout feature/api")).toBe("feature/api");
    expect(detectBranchSwitch("git checkout develop")).toBe("develop");
  });

  it("detects git checkout -b <branch>", () => {
    expect(detectBranchSwitch("git checkout -b feature/new")).toBe("feature/new");
    expect(detectBranchSwitch("git checkout -B feature/force")).toBe("feature/force");
  });

  it("detects git switch <branch>", () => {
    expect(detectBranchSwitch("git switch main")).toBe("main");
    expect(detectBranchSwitch("git switch feature/test")).toBe("feature/test");
  });

  it("detects git switch -c <branch>", () => {
    expect(detectBranchSwitch("git switch -c feature/new")).toBe("feature/new");
    expect(detectBranchSwitch("git switch -C feature/force")).toBe("feature/force");
  });

  // -----------------------------------------------------------------------
  // Non-checkout commands
  // -----------------------------------------------------------------------
  it("returns null for non-checkout commands", () => {
    expect(detectBranchSwitch("git status")).toBeNull();
    expect(detectBranchSwitch("git commit -m 'test'")).toBeNull();
    expect(detectBranchSwitch("git push origin main")).toBeNull();
    expect(detectBranchSwitch("npm test")).toBeNull();
    expect(detectBranchSwitch("ls -la")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // File checkout (not branch switch)
  // -----------------------------------------------------------------------
  it("returns null for git checkout -- <file>", () => {
    expect(detectBranchSwitch("git checkout -- file.txt")).toBeNull();
    expect(detectBranchSwitch("git checkout -- src/index.ts")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Detached HEAD
  // -----------------------------------------------------------------------
  it("returns null for git checkout --detach", () => {
    expect(detectBranchSwitch("git checkout --detach v1.0")).toBeNull();
  });

  it("returns null for git switch --detach / -d", () => {
    expect(detectBranchSwitch("git switch --detach v1.0")).toBeNull();
    expect(detectBranchSwitch("git switch -d v1.0")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Tracking checkouts (--track / -t are boolean flags)
  // -----------------------------------------------------------------------
  it("detects branch from git checkout --track origin/branch", () => {
    expect(detectBranchSwitch("git checkout --track origin/main")).toBe("origin/main");
    expect(detectBranchSwitch("git checkout -t origin/feature")).toBe("origin/feature");
  });

  // -----------------------------------------------------------------------
  // Compound commands
  // -----------------------------------------------------------------------
  it("handles compound commands", () => {
    expect(detectBranchSwitch("git checkout main && npm install")).toBe("main");
    expect(detectBranchSwitch("cd project && git checkout develop")).toBe("develop");
  });

  it("handles commands with leading whitespace", () => {
    expect(detectBranchSwitch("  git checkout main")).toBe("main");
  });

  // -----------------------------------------------------------------------
  // Flag-only args
  // -----------------------------------------------------------------------
  it("returns null for git checkout with only flags", () => {
    expect(detectBranchSwitch("git checkout -f")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Redirections
  // -----------------------------------------------------------------------
  it("handles commands with redirections", () => {
    expect(detectBranchSwitch("git checkout main > /dev/null")).toBe("main");
  });

  // -----------------------------------------------------------------------
  // FALSE POSITIVE PROTECTION
  // -----------------------------------------------------------------------
  it("returns null for echo containing git checkout", () => {
    expect(detectBranchSwitch('echo "git checkout main"')).toBeNull();
    expect(detectBranchSwitch("echo git checkout main")).toBeNull();
    expect(detectBranchSwitch("echo 'git checkout main'")).toBeNull();
  });

  it("returns null for printf containing git checkout", () => {
    expect(detectBranchSwitch('printf "git checkout main"')).toBeNull();
  });

  it("returns null for heredoc containing git checkout", () => {
    expect(detectBranchSwitch("cat <<EOF git checkout main")).toBeNull();
  });

  it("detects checkout after echo in compound command", () => {
    // echo first, then actual checkout — should detect the checkout
    expect(
      detectBranchSwitch('echo "switching" && git checkout main'),
    ).toBe("main");
  });
});
