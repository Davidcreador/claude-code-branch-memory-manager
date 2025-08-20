---
title: I was losing my mind switching branches with Claude Code, so I built this
published: false
description: A git hook solution for the most annoying problem in AI-assisted development
tags: git, productivity, bash, ai
cover_image: 
canonical_url: 
---

Look, I'm just gonna say it - using Claude Code is amazing until you switch git branches. Then it's like your AI buddy just got amnesia.

## The Problem (aka my Tuesday afternoon meltdown)

Picture this: You're deep in a feature branch, you've got your CLAUDE.md file dialed in with all the context about your payment integration. Claude knows about your Stripe webhooks, your database schema, that weird edge case with European VAT. Life is good.

Then your PM pings you. Production bug. Critical. Drop everything.

```bash
git stash
git checkout main
git checkout -b hotfix/critical-bug-fix
```

You open Claude Code and... it's still talking about Stripe webhooks. Because your CLAUDE.md is from the other branch. FML.

So you do what we all do:

```bash
git checkout feature/payment-integration -- CLAUDE.md
# wait no, that's not right
git checkout main -- CLAUDE.md
# shit, now I've lost my payment context
# let me just... manually copy... no wait...
```

20 minutes later you're manually managing context files like it's 1999 and you're wondering why we can't have nice things.

## The "Aha" Moment

After the 50th time doing this dance, I had a thought that I'm sure you've had too: **Why isn't this automatic?**

Git hooks exist. Git knows when we switch branches. This should be a solved problem.

So I spent a weekend building what should honestly just be built into every AI coding tool.

## The Solution

```bash
# One line install (yes, actually just one line)
curl -fsSL https://raw.githubusercontent.com/Davidcreador/claude-code-branch-memory-manager/main/install.sh | bash
```

That's it. Now when you switch branches, your CLAUDE.md switches too. Each branch maintains its own context. It just works.

Here's what happens under the hood:

```bash
# When you switch to a branch
git checkout feature/new-feature

# The tool automatically:
# 1. Saves current CLAUDE.md to .claude/memories/old-branch.md
# 2. Loads .claude/memories/new-feature.md (or creates it)
# 3. Updates your CLAUDE.md

# You literally don't do anything. It just happens.
```

## Real-world workflow

Here's my actual workflow now:

```bash
# Monday: Working on auth refactor
git checkout -b refactor/auth-system
echo "# Auth Refactor
- Moving from JWT to sessions
- Need to migrate 50k users
- Remember: CEO really cares about SSO" > CLAUDE.md

# Tuesday: Urgent bug
git checkout -b fix/memory-leak
# CLAUDE.md automatically switches
echo "# Memory Leak Investigation
- Happens after 6 hours
- Only on EC2 instances
- Suspect: that sketchy Redis connection pool" > CLAUDE.md

# Wednesday: Back to auth
git checkout refactor/auth-system
# Boom. Claude remembers everything about auth again.
```

No manual copying. No context loss. No accidentally committing the wrong CLAUDE.md to the wrong branch (yeah, we've all done it).

## The Technical Bits (for the nerds)

It's stupidly simple, which is why I'm kind of mad I didn't build it sooner:

1. **Git post-checkout hook**: Triggers on branch switch
2. **Branch-specific storage**: `.claude/memories/{branch-name}.md`
3. **Automatic sync**: Save before switch, load after switch
4. **Bash 3.2 compatible**: Works on that ancient macOS bash you refuse to upgrade

The whole thing is ~500 lines of bash. No dependencies. No node_modules. No Docker. Just a git hook and some file operations.

```bash
# What's actually in the git hook (simplified)
#!/bin/bash
OLD_BRANCH=$1
NEW_BRANCH=$2

# Save current context
if [[ -f "CLAUDE.md" ]]; then
    mkdir -p .claude/memories
    cp CLAUDE.md ".claude/memories/${OLD_BRANCH}.md"
fi

# Load new context
if [[ -f ".claude/memories/${NEW_BRANCH}.md" ]]; then
    cp ".claude/memories/${NEW_BRANCH}.md" CLAUDE.md
else
    echo "# ${NEW_BRANCH} context" > CLAUDE.md
fi
```

## What I didn't expect

The thing that surprised me most? It made me write better context files.

Before, I'd write these massive CLAUDE.md files trying to cover everything because switching was such a pain. Now each branch has focused context. My feature/payment branch knows about payments. My fix/auth-bug branch knows about auth. Claude gives better suggestions because the context isn't polluted with irrelevant stuff.

Also, code reviews got easier. The CLAUDE.md in each PR now actually describes what that branch does. It's documentation that writes itself.

## The "yeah but what about..." section

**"What if I don't want it to switch?"**
```bash
branch-memory disable  # Turn it off
branch-memory enable   # Turn it back on
```

**"What if I want to share context between branches?"**
```bash
branch-memory copy main feature/new-branch  # Copy context from main
```

**"What if I fuck something up?"**
```bash
branch-memory restore  # Restore from automatic backup
```

**"Does it work with worktrees/submodules/whatever?"**
Yes. If git can track it, this can handle it.

## Try it, seriously

Look, I built this because I needed it. Not for stars on GitHub (though stars are nice 👀), not for my resume, but because switching branches with Claude Code was driving me insane.

If you're using Claude Code (or Cursor, or any AI tool with context files) and you work on multiple branches, just try it:

```bash
# Install (30 seconds)
curl -fsSL https://raw.githubusercontent.com/Davidcreador/claude-code-branch-memory-manager/main/install.sh | bash

# That's it. You're done.
```

If it doesn't save you time in the first day, uninstall it:
```bash
curl -fsSL https://raw.githubusercontent.com/Davidcreador/claude-code-branch-memory-manager/main/uninstall.sh | bash
```

But I'm betting you'll wonder how you lived without it.

## P.S.

If you find bugs, open an issue. If you have ideas, send a PR. If it saved your sanity, maybe star the repo so other devs can find it.

And if someone from Anthropic is reading this - please just build this into Claude Code. Until then, we've got git hooks.

---

**GitHub**: [claude-code-branch-memory-manager](https://github.com/Davidcreador/claude-code-branch-memory-manager)

**Install**: `curl -fsSL https://raw.githubusercontent.com/Davidcreador/claude-code-branch-memory-manager/main/install.sh | bash`

**My rage-driven development philosophy**: If you have to do something stupid more than 3 times, automate it.