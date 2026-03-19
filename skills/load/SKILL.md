---
name: load
description: Load a branch-specific CLAUDE.md memory file. Use when the user wants to load context from a different branch.
---

# Load Branch Memory

Load a branch-specific memory file into the current CLAUDE.md.

Run the following command:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli.js" load $ARGUMENTS
```

If no branch was specified in the arguments, list available branches first:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli.js" list
```

Then ask the user which branch memory to load.

Report the result to the user.
