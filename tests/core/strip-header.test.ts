import { describe, it, expect } from "vitest";
import { stripMetadataHeader } from "../../src/core/memory-manager.js";

describe("stripMetadataHeader", () => {
  it("strips our specific metadata comments", () => {
    const content = [
      "<!-- branch-memory: main -->",
      "<!-- saved: 2026-01-01T00:00:00.000Z -->",
      "<!-- description: Test save -->",
      "",
      "# My project",
      "Some content",
    ].join("\n");

    const result = stripMetadataHeader(content);
    expect(result).toBe("# My project\nSome content");
  });

  it("preserves user HTML comments that are NOT our markers", () => {
    const content = [
      "<!-- This is a user comment -->",
      "<!-- Another user comment -->",
      "",
      "# My project",
    ].join("\n");

    const result = stripMetadataHeader(content);
    expect(result).toBe(content);
  });

  it("strips our markers but preserves following user comments", () => {
    const content = [
      "<!-- branch-memory: feature/test -->",
      "<!-- saved: 2026-01-01T00:00:00.000Z -->",
      "<!-- description: Manual save -->",
      "",
      "<!-- This is a user comment -->",
      "# My project",
    ].join("\n");

    const result = stripMetadataHeader(content);
    expect(result).toBe("<!-- This is a user comment -->\n# My project");
  });

  it("returns content unchanged when no metadata header exists", () => {
    const content = "# My project\nSome content";
    expect(stripMetadataHeader(content)).toBe(content);
  });

  it("handles empty content", () => {
    expect(stripMetadataHeader("")).toBe("");
  });

  it("handles partial metadata (only some markers)", () => {
    const content = [
      "<!-- branch-memory: main -->",
      "",
      "# Content after partial header",
    ].join("\n");

    const result = stripMetadataHeader(content);
    expect(result).toBe("# Content after partial header");
  });

  it("does not strip markers that appear in the middle of content", () => {
    const content = [
      "# My project",
      "<!-- branch-memory: main -->",
      "Some content",
    ].join("\n");

    expect(stripMetadataHeader(content)).toBe(content);
  });
});
