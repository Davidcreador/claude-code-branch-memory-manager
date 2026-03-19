---
name: save
description: Save the current CLAUDE.md to branch-specific memory. Use when the user wants to save their current branch context.
---

# Save Branch Memory

Save the current CLAUDE.md file to a branch-specific memory file.

Run the following command:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli.js" save "$ARGUMENTS"
```

If no description was provided in the arguments, use a brief description based on recent work context.

Report the result to the user.
