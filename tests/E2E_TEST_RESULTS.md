# End-to-End Test Results

**Package:** `claude-code-branch-memory-manager@3.0.0`  
**Tested:** 2026-03-18  
**Method:** Installed globally via `npm install -g claude-code-branch-memory-manager`, tested in a fresh git repository.

## Environment

- Node.js v22.14.0
- macOS (darwin)
- Git 2.x

## Test Procedure

1. Created a fresh git repo at `/tmp/branch-memory-test`
2. Ran all commands as a new user would
3. Verified memory switching across branches round-trips correctly

## Results

| Test | Command | Result |
|------|---------|--------|
| Version | `branch-memory version` | `v3.0.0` |
| Status (empty repo) | `branch-memory status` | Shows correct defaults, "not found" for active/saved memory |
| Init | `branch-memory init` | Creates CLAUDE.md template, saves initial memory, suggests .gitignore |
| Save with description | `branch-memory save "Auth feature notes"` | Saves with description, backs up previous |
| Save without description | `branch-memory save` | Works, uses "Manual save" default |
| List | `branch-memory list` | Shows all memories with sizes, dates, `[current]` marker |
| Switch to main | `branch-memory switch main` | Auto-saves current branch, git checkouts, loads main's memory |
| Switch to feature | `branch-memory switch feature/auth` | Round-trips correctly — auth branch content restored perfectly |
| Copy | `branch-memory copy feature/auth feature/auth-v2` | Copies memory between branches |
| Clean (dry-run) | `branch-memory clean --dry-run` | Shows orphaned memories without deleting |
| Clean | `branch-memory clean` | Removes orphaned memories, creates backups before deletion |
| Restore | `branch-memory restore feature/auth-v2` | Restores from backup created during clean |
| Fallback | `branch-memory load nonexistent` | Falls back to main branch gracefully |
| Path traversal | `branch-memory load "../../../etc/passwd"` | Rejected: "Branch name cannot contain path traversal (..)", exit 1 |
| Help | `branch-memory help` | Full help output with all commands and examples |

## Memory Switching Verification

The core workflow was tested:

1. `branch-memory init` on `main` — created template CLAUDE.md
2. `git checkout -b feature/auth` — created feature branch
3. Edited CLAUDE.md with auth-specific content (JWT, endpoints, middleware notes)
4. `branch-memory save` — saved feature branch memory
5. `branch-memory switch main` — **CLAUDE.md reverted to main's template content**
6. `branch-memory switch feature/auth` — **CLAUDE.md restored to auth-specific content**

Content was verified byte-for-byte after each switch. No data loss, no metadata leakage.

## Storage Structure

After all tests, the storage directory looked like:

```
.claude/memories/
├── feature_auth.md
├── feature_auth-v2.md
├── main.md
└── .backups/
    ├── feature_auth.2026-03-19T03-58-57-237Z.md
    ├── feature_auth.2026-03-19T04-00-07-593Z.md
    ├── feature_auth.before-load-2026-03-19T03-59-08-531Z.md
    ├── feature_auth-v2.cleaned-2026-03-19T03-59-43-207Z.md
    ├── main.2026-03-19T03-59-08-505Z.md
    ├── main.before-load-2026-03-19T03-58-57-271Z.md
    └── nonexistent.before-load-fallback-2026-03-19T03-59-54-141Z.md
```

Backups were created for every destructive operation (save-over, load, clean, delete).

## Conclusion

All 15 test cases passed. The package installs cleanly, all CLI commands work as documented, memory switching is reliable, and security protections (path traversal rejection) are enforced.
