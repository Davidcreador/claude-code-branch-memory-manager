#!/usr/bin/env node

/**
 * Claude Code Branch Memory Manager CLI
 *
 * Manages branch-specific CLAUDE.md files so Claude Code
 * always has the right context for your current git branch.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setLogLevel } from "./utils/logger.js";
import { validateBranchInput } from "./core/branch.js";
import { saveCommand } from "./commands/save.js";
import { loadCommand } from "./commands/load.js";
import { listCommand } from "./commands/list.js";
import { statusCommand } from "./commands/status.js";
import { switchCommand } from "./commands/switch.js";
import { copyCommand } from "./commands/copy.js";
import { cleanCommand } from "./commands/clean.js";
import { restoreCommand } from "./commands/restore.js";
import { initCommand } from "./commands/init.js";

/** Read version from package.json — single source of truth */
function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
    return pkg.version;
  } catch {
    return "3.1.0";
  }
}

const VERSION = getVersion();

function printHelp(): void {
  console.log(`branch-memory v${VERSION}`);
  console.log("Branch-specific CLAUDE.md memory management for Claude Code");
  console.log("");
  console.log("USAGE:");
  console.log("  branch-memory <command> [options]");
  console.log("");
  console.log("COMMANDS:");
  console.log("  save [description]       Save current CLAUDE.md to branch memory");
  console.log("  load <branch>            Load memory from a specific branch");
  console.log("  list                     List all stored branch memories");
  console.log("  status                   Show current branch and memory status");
  console.log("  switch <branch>          Switch git branch and load its memory");
  console.log("  copy <src> <dst>         Copy memory from one branch to another");
  console.log("  clean                    Remove memories for deleted branches");
  console.log("  restore [branch]         Restore memory from backup");
  console.log("  init                     Set up branch memory in current repo");
  console.log("  hook <event>             Handle a Claude Code hook event (internal)");
  console.log("  version                  Show version");
  console.log("  help                     Show this help");
  console.log("");
  console.log("OPTIONS:");
  console.log("  --silent                 Suppress all output");
  console.log("  --debug                  Enable debug logging");
  console.log("  --auto                   Auto mode (for hook integration)");
  console.log("  --dry-run                Show what would be done (clean command)");
  console.log("");
  console.log("EXAMPLES:");
  console.log('  branch-memory save "Implemented auth flow"');
  console.log("  branch-memory load main");
  console.log("  branch-memory switch feature/new-api");
  console.log("  branch-memory clean --dry-run");
  console.log("");
  console.log("PLUGIN:");
  console.log("  Install as a Claude Code plugin for automatic memory switching.");
  console.log("  See: https://github.com/Davidcreador/claude-code-branch-memory-manager");
}

/** Validate a branch name from CLI args. Exits with error if invalid. */
function requireValidBranch(branch: string): void {
  const err = validateBranchInput(branch);
  if (err) {
    console.error(`Invalid branch name: ${err}`);
    process.exit(1);
  }
}

/** Load memory for the current branch. Used by `load --auto` in hook contexts. */
async function loadAutoCommand(): Promise<void> {
  const { getCurrentBranch } = await import("./core/branch.js");
  try {
    const branch = await getCurrentBranch();
    await loadCommand(branch);
  } catch {
    // Silent fail in auto mode — no memory to load is fine
  }
}

/** Dispatch a Claude Code hook event to its handler. */
async function runHookEvent(hookEvent: string | undefined): Promise<void> {
  if (!hookEvent) {
    console.error("Error: hook event name required");
    process.exit(1);
  }
  if (hookEvent === "session-start") {
    const { handleSessionStart } = await import("./hooks/session-start.js");
    await handleSessionStart();
  } else if (hookEvent === "post-tool-use") {
    const { handlePostToolUse } = await import("./hooks/post-tool-use.js");
    await handlePostToolUse();
  } else if (hookEvent === "session-end") {
    const { handleSessionEnd } = await import("./hooks/session-end.js");
    await handleSessionEnd();
  } else if (hookEvent === "user-prompt-submit") {
    const { handleUserPromptSubmit } = await import(
      "./hooks/user-prompt-submit.js"
    );
    await handleUserPromptSubmit();
  } else {
    console.error(`Unknown hook event: ${hookEvent}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle global flags
  if (args.includes("--silent")) {
    setLogLevel("silent");
  } else if (args.includes("--debug")) {
    setLogLevel("debug");
  }

  const dryRun = args.includes("--dry-run");

  // Remove flag args to get positional args
  const positional = args.filter((a) => !a.startsWith("--"));

  const command = positional[0] ?? "help";

  switch (command) {
    case "save":
      await saveCommand(positional[1]);
      break;

    case "load":
      if (!positional[1]) {
        if (args.includes("--auto")) {
          await loadAutoCommand();
        } else {
          console.error("Error: branch name required");
          console.error("Usage: branch-memory load <branch>");
          process.exit(1);
        }
      } else {
        requireValidBranch(positional[1]);
        await loadCommand(positional[1]);
      }
      break;

    case "list":
    case "ls":
      await listCommand();
      break;

    case "status":
      await statusCommand();
      break;

    case "switch":
    case "sw":
      if (!positional[1]) {
        console.error("Error: branch name required");
        console.error("Usage: branch-memory switch <branch>");
        process.exit(1);
      }
      requireValidBranch(positional[1]);
      await switchCommand(positional[1]);
      break;

    case "copy":
    case "cp":
      if (!positional[1] || !positional[2]) {
        console.error("Error: source and target branch required");
        console.error("Usage: branch-memory copy <source> <target>");
        process.exit(1);
      }
      await copyCommand(positional[1], positional[2]);
      break;

    case "clean":
      await cleanCommand(dryRun);
      break;

    case "restore":
      if (positional[1]) {
        requireValidBranch(positional[1]);
      }
      await restoreCommand(positional[1]);
      break;

    case "init":
      await initCommand();
      break;

    case "hook":
      await runHookEvent(positional[1]);
      break;

    case "version":
    case "--version":
    case "-v":
      console.log(`branch-memory v${VERSION}`);
      break;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error("");
      console.error("Run 'branch-memory help' for usage information.");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
