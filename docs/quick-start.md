# ⚡ Quick Start Guide

Get up and running with Claude Code Branch Memory Manager in under 2 minutes.

## 📋 Before You Begin

**Check you have** (30 seconds):
```bash
# Check git is installed (should show version 2.0+)
git --version

# Check you're in a git repository (should show current branch)
git branch --show-current

# Check bash version (should show 3.2+ or 4.0+)
bash --version
```

**If any check fails**: See [Installation Requirements](installation.md#prerequisites)

---

## 🚀 Step 1: Install (30 seconds)

**Run the installer**:
```bash
curl -fsSL https://install.claude-memory.dev | bash
```

**You should see**:
```
[15:30:22] ▶  Validating system requirements
[15:30:22] ✓  Operating system supported: macos
[15:30:22] ✓  Bash version supported: 4.4.20
[15:30:23] ✓  Git version: 2.37.1
[15:30:23] ✓  System validation passed
[15:30:24] ✓  Installation completed successfully!

🎉 Ready to use! Git hooks are active in this repository.
```

**If installation fails**: See [Troubleshooting Installation](troubleshooting.md#installation-issues)

---

## ✅ Step 2: Verify (15 seconds)

**Test the installation**:
```bash
branch-memory --version
```

**You should see**:
```
branch-memory version 2.0.0
Professional branch-specific memory management for Claude Code
```

**Check system status**:
```bash
branch-memory status
```

**You should see**:
```
Branch Memory Status
====================

Repository: my-awesome-project
Current branch: main
Memory directory: .claude/memories

Git Hooks Status:
==================
  post-checkout: ✓ installed
  pre-commit   : ✓ installed
```

---

## 🎯 Step 3: First Usage (30 seconds)

**Create your first memory**:
```bash
# Create or edit your CLAUDE.md file
echo "# Working on main branch - fixing authentication bug" > CLAUDE.md

# Save it to branch memory
branch-memory save "Initial setup and current bug fix"
```

**You should see**:
```
✓ Memory saved for branch 'main'
  Description: Initial setup and current bug fix
```

**Create a new branch to test switching**:
```bash
git checkout -b feature/test-branch
```

**You should see**:
```
# Normal git output, but memory management happens automatically
```

**Check your new context**:
```bash
cat CLAUDE.md
```

**You should see**:
```
# Claude Code Memory - Branch: feature/test-branch

This branch memory was automatically created by Claude Code Branch Memory Manager.

## Current Work
- Switched to branch: feature/test-branch
- Created: 2025-08-19 15:30:45

## Notes
Add your branch-specific context and work notes here.
```

---

## 🎉 Step 4: See The Magic (15 seconds)

**Switch back to main**:
```bash
git checkout main
```

**Check your context is restored**:
```bash
cat CLAUDE.md
```

**You should see**:
```
# Working on main branch - fixing authentication bug
```

**🎊 Success!** Your context was automatically restored!

---

## 🚀 You're Ready!

**What just happened?**
- ✅ Claude Memory Manager is now automatically managing your `CLAUDE.md` files
- ✅ Every time you `git checkout`, your context switches automatically  
- ✅ Your work is preserved per branch without any manual effort
- ✅ Claude Code will always have the right context for your current branch

**What to do next?**

### For Immediate Use:
```bash
# Just use git normally - memory management is automatic
git checkout feature/my-feature
git checkout main
git checkout -b hotfix/urgent-fix

# Or use manual commands when needed
branch-memory save "Completed user login API"
branch-memory list
```

### For Power Users:
- **[Configuration Guide](configuration.md)**: Customize behavior
- **[Advanced Usage](user-guide.md#advanced-workflows)**: Power user workflows
- **[CLI Reference](api-reference.md)**: All available commands

### For Teams:
- **[Team Setup](examples/team-setup.md)**: Deploy across your team
- **[CI/CD Integration](examples/integrations.md)**: Automated environments

---

## 🆘 Need Help?

**Something not working?**
```bash
# Run health check
branch-memory health

# Get detailed diagnostics
branch-memory diagnose

# Enable debug mode
branch-memory debug
```

**Common issues**:
- **`command not found`** → Restart your terminal or run `source ~/.zshrc`
- **Memory not switching** → Run `branch-memory hooks verify`
- **Permission errors** → Check [Troubleshooting Guide](troubleshooting.md)

**Still stuck?**
- 📖 [Troubleshooting Guide](troubleshooting.md)
- 🐛 [Report a Bug](https://github.com/your-username/claude-code-branch-memory/issues)
- 💬 [Ask Questions](https://github.com/your-username/claude-code-branch-memory/discussions)

---

## 🎓 Next Steps

Now that you're set up, explore these workflows:

### **Basic Development Flow**
1. [Feature Branch Development](user-guide.md#feature-branch-workflow)
2. [Hotfix Workflow](user-guide.md#hotfix-workflow)
3. [Release Management](user-guide.md#release-workflow)

### **Advanced Features**
1. [Manual Memory Management](user-guide.md#manual-memory-management)
2. [Configuration Customization](configuration.md)
3. [Team Collaboration](examples/team-setup.md)

### **Integration**
1. [IDE Integration](examples/integrations.md#ide-integration)
2. [CI/CD Setup](examples/integrations.md#cicd-integration)
3. [Custom Workflows](examples/advanced-workflow.md)

---

**🎉 Welcome to effortless branch memory management! Your context switching days are over.**