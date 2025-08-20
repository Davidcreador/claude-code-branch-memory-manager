---
name: Bug Report
about: Report a bug to help us improve Claude Memory Manager
title: '[BUG] Brief description of the issue'
labels: bug, needs-triage
assignees: ''
---

## 🐛 Bug Description

**Clear description of what the bug is:**
A clear and concise description of what the bug is.

**Expected behavior:**
A clear and concise description of what you expected to happen.

**Actual behavior:**
A clear and concise description of what actually happened.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Run command '...'
3. Switch to branch '...'
4. See error

**Minimal reproduction case:**
```bash
# Commands that reproduce the issue
git checkout main
branch-memory save "test"
git checkout feature/test
# Error occurs here
```

## 💻 Environment

**System Information:**
- OS: [e.g. macOS 12.5, Ubuntu 20.04]
- Shell: [e.g. bash 4.4.20, zsh 5.8]
- Git Version: [e.g. 2.37.1]
- Tool Version: [run `branch-memory version`]

**Repository Context:**
- Repository type: [e.g. small personal project, large monorepo]
- Number of branches: [approximate]
- Repository age: [e.g. new, established]

## 📊 Diagnostic Information

**Please run and include output:**

```bash
# System status
branch-memory status

# Health check
branch-memory health

# Hook status (if relevant)
branch-memory hooks status
```

**Diagnostic output:**
```
[Paste the output here]
```

## 📝 Logs

**If available, include recent log entries:**

```bash
# Get recent logs
tail -20 ~/.claude-memory/logs/claude-memory-$(date +%Y-%m-%d).log
```

**Log output:**
```
[Paste relevant log entries here]
```

## 📎 Additional Context

**Screenshots:**
If applicable, add screenshots to help explain your problem.

**Related Issues:**
Link any related issues or discussions.

**Workarounds:**
Any workarounds you've discovered.

## ✅ Checklist

- [ ] I've searched existing issues to avoid duplicates
- [ ] I've included all requested system information
- [ ] I've provided a minimal reproduction case
- [ ] I've included diagnostic output
- [ ] I've checked the troubleshooting guide

## 🎯 Priority Assessment

**How is this affecting your workflow?**
- [ ] Blocking - Cannot use the tool at all
- [ ] High - Major feature not working
- [ ] Medium - Minor inconvenience  
- [ ] Low - Cosmetic issue

**How often does this occur?**
- [ ] Always - Every time I try this operation
- [ ] Often - Most times I try this operation
- [ ] Sometimes - Occasionally when I try this operation
- [ ] Rarely - Only happened once or twice

---

**Thank you for helping improve Claude Memory Manager! 🚀**