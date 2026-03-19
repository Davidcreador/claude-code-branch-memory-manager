import { describe, it, expect } from "vitest";
import { sanitizeBranchName, validateBranchInput } from "../../src/core/branch.js";

describe("sanitizeBranchName", () => {
  it("passes through simple branch names", () => {
    expect(sanitizeBranchName("main")).toBe("main");
    expect(sanitizeBranchName("develop")).toBe("develop");
    expect(sanitizeBranchName("feature-test")).toBe("feature-test");
  });

  it("replaces slashes with underscores", () => {
    expect(sanitizeBranchName("feature/new-api")).toBe("feature_new-api");
    expect(sanitizeBranchName("fix/bug/123")).toBe("fix_bug_123");
  });

  it("replaces special characters", () => {
    expect(sanitizeBranchName("feature@#$%test")).toBe("feature_test");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeBranchName("a//b//c")).toBe("a_b_c");
    expect(sanitizeBranchName("a___b")).toBe("a_b");
  });

  it("prevents path traversal via ../", () => {
    expect(sanitizeBranchName("../../etc/passwd")).toBe("_etc_passwd");
    expect(sanitizeBranchName("foo/../bar")).toBe("foo_bar");
  });

  it("removes leading slash", () => {
    expect(sanitizeBranchName("/absolute/path")).toBe("absolute_path");
  });

  it("removes leading tilde", () => {
    expect(sanitizeBranchName("~/home/user")).toBe("home_user");
  });

  it("prevents leading dot (hidden files)", () => {
    expect(sanitizeBranchName(".hidden")).toBe("_hidden");
  });

  it("enforces max length", () => {
    const long = "a".repeat(300);
    const result = sanitizeBranchName(long);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it("handles empty string gracefully", () => {
    expect(sanitizeBranchName("")).toBe("unnamed");
  });

  it("handles dots-only input", () => {
    // ".." becomes "_" after path traversal removal and leading dot prevention
    expect(sanitizeBranchName("..")).not.toContain("..");
  });

  it("preserves dots and dashes in normal names", () => {
    expect(sanitizeBranchName("v1.2.3")).toBe("v1.2.3");
    expect(sanitizeBranchName("my-branch")).toBe("my-branch");
    expect(sanitizeBranchName("release-v2.0")).toBe("release-v2.0");
  });

  it("preserves Unicode letters in branch names", () => {
    expect(sanitizeBranchName("feature/日本語")).toBe("feature_日本語");
    expect(sanitizeBranchName("feature/中文")).toBe("feature_中文");
    expect(sanitizeBranchName("功能/测试")).toBe("功能_测试");
  });

  it("produces distinct names for different Unicode branches", () => {
    const a = sanitizeBranchName("feature/日本語");
    const b = sanitizeBranchName("feature/中文");
    expect(a).not.toBe(b);
  });
});

describe("validateBranchInput", () => {
  it("accepts valid branch names", () => {
    expect(validateBranchInput("main")).toBeNull();
    expect(validateBranchInput("feature/test")).toBeNull();
    expect(validateBranchInput("my-branch-123")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateBranchInput("")).not.toBeNull();
    expect(validateBranchInput("  ")).not.toBeNull();
  });

  it("rejects null bytes", () => {
    expect(validateBranchInput("foo\0bar")).not.toBeNull();
  });

  it("rejects path traversal", () => {
    expect(validateBranchInput("../etc/passwd")).not.toBeNull();
    expect(validateBranchInput("foo/../bar")).not.toBeNull();
  });

  it("rejects absolute paths", () => {
    expect(validateBranchInput("/etc/passwd")).not.toBeNull();
  });

  it("rejects home directory paths", () => {
    expect(validateBranchInput("~/something")).not.toBeNull();
  });

  it("rejects overly long names", () => {
    expect(validateBranchInput("a".repeat(256))).not.toBeNull();
  });

  it("accepts names at the max length", () => {
    expect(validateBranchInput("a".repeat(255))).toBeNull();
  });
});
