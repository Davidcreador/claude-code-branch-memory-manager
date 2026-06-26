# Claude Code Branch Memory Manager

Automatic branch-specific `CLAUDE.md` memory management for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). When you switch git branches, your Claude Code context switches with you.

## The Problem

When working across multiple git branches, your `CLAUDE.md` file contains context specific to one branch. Switching branches means Claude Code loses that context, or worse, has the wrong context for your current work.

## The Solution

Branch Memory Manager saves and loads branch-specific `CLAUDE.md` files automatically. Each branch gets its own memory, stored in `.claude/memories/`.

**As a Claude Code plugin** — memories switch automatically when you run `git checkout` or `git switch` inside Claude Code. No manual intervention needed.

**As a CLI** — manually save, load, and manage branch memories from your terminal.

## Quick Start

### Install as a Claude Code Plugin (Recommended)

Install from the plugin marketplace inside Claude Code:

```
/plugin marketplace add Davidcreador/claude-code-branch-memory-manager
/plugin install branch-memory@davidcreador
```

Or install the npm package and load it with `--plugin-dir`:

```bash
# Install the npm package in your project
npm install --save-dev claude-code-branch-memory-manager

# Or install globally
npm install -g claude-code-branch-memory-manager
```

Then load as a plugin:

```bash
claude --plugin-dir ./node_modules/claude-code-branch-memory-manager
```

Once installed, branch memory switching happens automatically:

1. You run `git checkout feature/auth` inside Claude Code
2. The plugin saves your current `CLAUDE.md` to `.claude/memories/main.md`
3. It loads `.claude/memories/feature_auth.md` into `CLAUDE.md`
4. Claude Code now has the right context for your `feature/auth` work

### Use as a Standalone CLI

```bash
# Initialize in your repo
branch-memory init

# Save current context
branch-memory save "Implemented user auth"

# Switch branches (saves + loads automatically)
branch-memory switch feature/api

# List all saved memories
branch-memory list

# Check status
branch-memory status
```

## Commands

| Command | Description |
|---------|-------------|
| `branch-memory save [description]` | Save current `CLAUDE.md` to branch memory |
| `branch-memory load <branch>` | Load memory from a specific branch |
| `branch-memory list` | List all stored branch memories |
| `branch-memory status` | Show current branch and memory status |
| `branch-memory switch <branch>` | Git switch + memory swap in one command |
| `branch-memory copy <src> <dst>` | Copy memory between branches |
| `branch-memory clean` | Remove memories for deleted branches |
| `branch-memory restore [branch]` | Restore from backup |
| `branch-memory init` | Set up branch memory in current repo |
| `branch-memory version` | Show version |

## How It Works

### Storage

Branch memories are stored in `.claude/memories/` within your repository:

```
your-repo/
├── CLAUDE.md                          # Active memory (read by Claude Code)
├── .claude/
│   └── memories/
│       ├── main.md                    # Memory for main branch
│       ├── feature_auth.md            # Memory for feature/auth
│       ├── feature_api.md             # Memory for feature/api
│       └── .backups/                  # Automatic backups
│           └── main.2025-03-18T...md
```

### Plugin Integration

When installed as a Claude Code plugin, four hooks handle automatic switching. Each one injects the active branch memory into the **live** session via Claude Code's `additionalContext` mechanism (writing the file on disk alone does not update an already-loaded context):

- **`SessionStart`** — Loads the correct branch memory when Claude Code starts
- **`PostToolUse` (Bash)** — Detects `git checkout` / `git switch` commands and swaps memories
- **`UserPromptSubmit`** — Detects branch switches made *outside* Claude Code (e.g. another terminal) and swaps memories. Cheap no-op when the branch hasn't changed, so it does not bloat every prompt
- **`SessionEnd`** — Saves the active `CLAUDE.md` back to the current branch when the session ends

### Fallback Behavior

When switching to a branch with no saved memory, the tool looks for a fallback in this order: `main` → `master` → `develop`. This is configurable.

## Configuration

Create a `.branch-memory.json` in your repo root:

```json
{
  "memoryDir": ".claude/memories",
  "memoryFileName": "CLAUDE.md",
  "autoSaveOnSwitch": true,
  "autoSaveOnSessionEnd": true,
  "watchExternalSwitch": true,
  "fallbackToDefault": true,
  "fallbackBranches": ["main", "master", "develop"]
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BRANCH_MEMORY_DIR` | Memory storage directory |
| `BRANCH_MEMORY_FILE` | Memory file name |
| `BRANCH_MEMORY_AUTO_SAVE` | Enable/disable auto-save on switch (`true`/`false`) |
| `BRANCH_MEMORY_AUTO_SAVE_ON_END` | Enable/disable auto-save on session end (`true`/`false`) |
| `BRANCH_MEMORY_WATCH_EXTERNAL` | Enable/disable detection of external branch switches (`true`/`false`) |
| `BRANCH_MEMORY_FALLBACK` | Enable/disable fallback (`true`/`false`) |
| `BRANCH_MEMORY_FALLBACK_BRANCHES` | Comma-separated fallback branches |

## Plugin Skills

When installed as a Claude Code plugin, these skills are available as namespaced slash commands:

- `/branch-memory:save` — Save current context
- `/branch-memory:load` — Load a branch's context
- `/branch-memory:status` — Show memory status
- `/branch-memory:list` — List all memories

These are [Agent Skills](https://docs.anthropic.com/en/docs/claude-code/skills): you can invoke them directly with the slash command, and Claude may also use them automatically when their description matches what you're doing.

## Tips

- **Add `.claude/memories/` to `.gitignore`** if you don't want to share memories across the team
- **Commit `.claude/memories/`** if you want shared branch context
- **Run `branch-memory clean`** periodically to remove memories for deleted branches
- Branch names are sanitized for filenames: `feature/auth` becomes `feature_auth.md`

## Requirements

- Node.js 18+
- Git 2.0+

## License

MIT

## Author

[David Pastor](https://github.com/Davidcreador)
