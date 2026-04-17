---
name: list
description: "List all stored branch memories with their sizes and last modified dates. Use when the user asks to show branches, view saved memories, check what branches have stored context, or see memory usage."
---

# List Branch Memories

List all stored branch-specific memory files.

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli.js" list
```

Present the output to the user, highlighting the current branch if applicable.
