# Troubleshooting Guide

Comprehensive troubleshooting guide for Claude Code Branch Memory Manager.

## Quick Diagnostics

### First Steps
```bash
# Run comprehensive health check
branch-memory health

# Generate detailed diagnostic report
branch-memory diagnose

# Check system status
branch-memory status

# Enable debug mode for verbose output
branch-memory debug
```

## Common Issues

### 1. Command Not Found: `branch-memory`

**Symptoms**:
```
bash: branch-memory: command not found
```

**Diagnosis**:
```bash
# Check if script exists
ls -la ~/bin/branch-memory

# Check PATH
echo $PATH | grep -o "$HOME/bin"
```

**Solutions**:
```bash
# Add ~/bin to PATH temporarily
export PATH="$HOME/bin:$PATH"

# Add to shell configuration permanently
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc  # or ~/.bashrc

# Verify fix
branch-memory version
```

### 2. Git Hooks Not Working

**Symptoms**:
- Memory doesn't switch when changing branches
- No automatic commit context saving

**Diagnosis**:
```bash
# Check hook status
branch-memory hooks status

# Verify hooks are installed and executable
ls -la .git/hooks/post-checkout .git/hooks/pre-commit

# Test hook functionality
branch-memory hooks test
```

**Solutions**:
```bash
# Install hooks in current repository
branch-memory hooks install

# Force reinstall if hooks exist but aren't working
branch-memory hooks install --force

# Verify installation
branch-memory hooks verify
```

### 3. Memory File Not Found

**Symptoms**:
```
Error [300]: No memory found for branch 'feature/my-branch'
```

**Diagnosis**:
```bash
# List available memories
branch-memory list

# Check memory directory
ls -la .claude/memories/
```

**Solutions**:
```bash
# Create memory for current branch
branch-memory save "Initial branch setup"

# Load from existing branch
branch-memory load main

# Check configuration for fallback settings
branch-memory config get fallback_to_main
```

### 4. Permission Denied Errors

**Symptoms**:
```
Error [2]: Permission denied
```

**Diagnosis**:
```bash
# Check directory permissions
ls -la ~/.claude-memory/

# Check current repository permissions
ls -la .claude/
```

**Solutions**:
```bash
# Fix system directory permissions
chmod -R 755 ~/.claude-memory/
chmod 700 ~/.claude-memory/config/

# Fix repository memory directory
chmod -R 755 .claude/

# Recreate with correct permissions
branch-memory diagnose
```

### 5. Git Repository Issues

**Symptoms**:
```
Error [200]: Not in a git repository
Error [201]: Git repository appears corrupted
```

**Diagnosis**:
```bash
# Check if in git repository
git status

# Check repository integrity
git fsck

# Check git configuration
git config --list
```

**Solutions**:
```bash
# Navigate to git repository
cd /path/to/your/repo

# Initialize git repository if needed
git init

# Fix corrupted repository
git fsck --full
git gc --aggressive
```

### 6. Configuration Issues

**Symptoms**:
```
Error [101]: Invalid configuration value
Error [102]: Configuration validation failed
```

**Diagnosis**:
```bash
# Show current configuration
branch-memory config show

# Check for syntax errors
branch-memory config validate
```

**Solutions**:
```bash
# Reset to default configuration
branch-memory config create user

# Edit configuration file
branch-memory config edit user

# Check specific setting
branch-memory config get problematic_setting
```

### 7. Hook Execution Timeouts

**Symptoms**:
- Slow git operations
- Hook timeout messages in logs

**Diagnosis**:
```bash
# Check current timeout setting
branch-memory config get hook_timeout

# Check recent log entries
tail -50 ~/.claude-memory/logs/claude-memory-$(date +%Y-%m-%d).log
```

**Solutions**:
```bash
# Increase timeout
branch-memory config set hook_timeout 60

# Disable performance logging if enabled
branch-memory config set enable_performance_logging false

# Enable safe mode for rollback capability
branch-memory config set safe_mode true
```

## Advanced Troubleshooting

### Debug Mode

Enable comprehensive debugging:
```bash
# Enable debug mode
branch-memory debug

# Or set permanently
branch-memory config set debug_enabled true
branch-memory config set log_level DEBUG

# Enable git hook debugging
export DEBUG_CLAUDE_MEMORY=1
```

### Log Analysis

**View recent logs**:
```bash
# Today's log file
tail -100 ~/.claude-memory/logs/claude-memory-$(date +%Y-%m-%d).log

# Search for errors
grep -i error ~/.claude-memory/logs/claude-memory-*.log

# Search for specific component
grep "\[core\]" ~/.claude-memory/logs/claude-memory-*.log
```

**Log levels and what they show**:
- `DEBUG`: Detailed function calls and variable values
- `INFO`: Normal operations and status updates  
- `WARN`: Non-fatal issues and warnings
- `ERROR`: Errors that prevent operations
- `FATAL`: Critical errors that stop execution

### Configuration Debugging

**Check configuration precedence**:
```bash
# Show all configuration sources
branch-memory config show

# Check specific value source
branch-memory config get memory_dir

# Show environment variable overrides
env | grep CLAUDE_MEMORY
```

**Reset configuration**:
```bash
# Backup current configuration
cp ~/.claude-memory/config/user.yml ~/.claude-memory/config/user.yml.backup

# Create fresh configuration
branch-memory config create user

# Test with fresh config
branch-memory status
```

### Memory File Issues

**Corrupted memory files**:
```bash
# Check file integrity
branch-memory validate-memory feature/my-branch

# Restore from backup
ls -la .claude/backups/
cp .claude/backups/my-branch_20250819_143022_manual.md CLAUDE.md

# Recreate memory file
rm CLAUDE.md
branch-memory save "Recreated after corruption"
```

**Missing memory directory**:
```bash
# Check if directory exists
ls -la .claude/

# Recreate directory structure
mkdir -p .claude/{memories,backups}

# Verify permissions
ls -la .claude/
```

### Git Hook Issues

**Hooks not executing**:
```bash
# Check if hooks are executable
ls -la .git/hooks/post-checkout .git/hooks/pre-commit

# Check hook content
head -10 .git/hooks/post-checkout

# Test hook manually
.git/hooks/post-checkout oldcommit newcommit 1
```

**Hook conflicts**:
```bash
# Check for existing hooks
grep -L "Claude Code Branch Memory Manager" .git/hooks/*

# Backup conflicting hooks
cp .git/hooks/post-checkout .git/hooks/post-checkout.backup

# Reinstall our hooks
branch-memory hooks install --force
```

### Performance Issues

**Slow operations**:
```bash
# Enable performance monitoring
branch-memory config set enable_performance_logging true

# Check recent performance metrics
grep "perf" ~/.claude-memory/logs/claude-memory-*.log

# Run benchmark
~/.claude-memory/tests/test-runner.sh benchmark
```

**Memory usage**:
```bash
# Check memory file sizes
du -sh .claude/memories/

# Clean up old files
branch-memory clean all

# Compress old memories
branch-memory config set compress_old_memories true
```

## Error Code Reference

### System Errors (1-99)
| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| 1 | `SYSTEM_DEPENDENCY_MISSING` | Required command not found | Install missing dependencies |
| 2 | `SYSTEM_PERMISSION_DENIED` | File permission error | Fix file permissions |
| 3 | `SYSTEM_DISK_FULL` | Insufficient disk space | Free disk space |
| 4 | `SYSTEM_TIMEOUT` | Operation timed out | Increase timeout setting |

### Configuration Errors (100-199)
| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| 100 | `CONFIG_FILE_NOT_FOUND` | Configuration file missing | Create default config |
| 101 | `CONFIG_INVALID_VALUE` | Invalid configuration value | Fix configuration syntax |
| 102 | `CONFIG_VALIDATION_FAILED` | Configuration validation error | Review and fix config |

### Git Errors (200-299)
| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| 200 | `GIT_NOT_REPOSITORY` | Not in git repository | Navigate to git repo |
| 201 | `GIT_CORRUPTED_REPOSITORY` | Git repository corrupted | Run git fsck |
| 202 | `GIT_BRANCH_NOT_FOUND` | Branch doesn't exist | Check branch names |
| 203 | `GIT_CHECKOUT_FAILED` | Branch checkout failed | Resolve conflicts |

### Memory Errors (300-399)
| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| 300 | `MEMORY_FILE_NOT_FOUND` | Memory file not found | Create or restore memory |
| 301 | `MEMORY_FILE_CORRUPTED` | Memory file corrupted | Restore from backup |
| 302 | `MEMORY_SAVE_FAILED` | Failed to save memory | Check permissions/space |
| 303 | `MEMORY_LOAD_FAILED` | Failed to load memory | Check file integrity |

## Recovery Procedures

### Complete System Reset
If the system is completely broken:
```bash
# 1. Backup current memories
cp -r .claude/memories .claude/memories.emergency-backup

# 2. Uninstall system
setup-claude-memory-pro uninstall

# 3. Clean reinstall
setup-claude-memory-pro install

# 4. Restore memories
cp -r .claude/memories.emergency-backup/* .claude/memories/

# 5. Verify system
branch-memory health
```

### Rollback to Basic Version
If you need to revert to the basic version:
```bash
# 1. Backup professional installation
cp -r ~/.claude-memory ~/.claude-memory.pro.backup

# 2. Uninstall professional version
setup-claude-memory-pro uninstall

# 3. Install basic version (if backup exists)
# Restore from backup created during migration

# 4. Verify basic version works
branch-memory --help
```

### Emergency Memory Recovery
If all memory files are lost:
```bash
# 1. Check git reflog for recent work
git reflog --all

# 2. Check for backup files
find . -name "*.backup.*" -type f

# 3. Search for memory files in temporary locations
find /tmp -name "*CLAUDE*" -type f 2>/dev/null

# 4. Recreate from git commit messages
git log --oneline --all | head -20
```

## Environment-Specific Issues

### macOS Issues

**1. Permission Issues with System Directories**:
```bash
# Grant full disk access to Terminal in System Preferences
# Or use alternative directory:
export CLAUDE_MEMORY_HOME="/Users/$USER/claude-memory"
```

**2. Git Command Line Tools Not Found**:
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

### Linux Issues

**1. Bash Version Too Old**:
```bash
# Check bash version
bash --version

# Install newer bash (Ubuntu/Debian)
sudo apt update && sudo apt install bash

# Install newer bash (CentOS/RHEL)
sudo yum update bash
```

**2. Git Not Installed**:
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

### Windows/WSL Issues

**1. Line Ending Issues**:
```bash
# Configure git for WSL
git config --global core.autocrlf input
git config --global core.eol lf
```

**2. Path Issues**:
```bash
# Ensure /home/username/bin is in PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
```

## Support and Reporting

### Diagnostic Information
When reporting issues, include:

```bash
# System information
uname -a
bash --version
git --version

# Installation status
branch-memory status json

# Health check results
branch-memory health

# Recent logs
tail -50 ~/.claude-memory/logs/claude-memory-$(date +%Y-%m-%d).log

# Configuration
branch-memory config show
```

### Creating Bug Reports
1. **Run diagnostic**: `branch-memory diagnose`
2. **Include error report**: Attach the generated diagnostic file
3. **Describe steps**: What were you trying to do when the issue occurred?
4. **Include environment**: OS, shell, git version, repository context

### Self-Help Resources
- **Documentation**: `~/.claude-memory/docs/`
- **Configuration Reference**: `~/.claude-memory/config/default.yml`
- **Test Suite**: `~/.claude-memory/tests/test-runner.sh`
- **Health Check**: `branch-memory health`

---

**Still having issues?** Create a diagnostic report with `branch-memory diagnose` and include it when seeking help.