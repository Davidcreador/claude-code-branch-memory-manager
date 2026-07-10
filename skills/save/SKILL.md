---
name: save
description: "Save the current CLAUDE.md to branch-specific memory. Use when the user wants to save their current branch context, persist settings, store context, or snapshot their branch state."
---

# Save Branch Memory

Save the current CLAUDE.md file to a branch-specific memory file.

Run the following command:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli.js" save "$ARGUMENTS"
```

If no description was provided in the arguments, use a brief description based on recent work context.

If the command fails, check that CLAUDE.md exists in the project root and report the error to the user.

Report the result to the user, confirming the branch name and description that were saved.
