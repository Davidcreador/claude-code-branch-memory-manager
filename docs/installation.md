# Installation Guide

Complete installation guide for Claude Code Branch Memory Manager.

## Prerequisites

### System Requirements
- **Operating System**: macOS 10.12+ or Linux (Ubuntu 18.04+, CentOS 7+)
- **Bash**: Version 4.0 or higher
- **Git**: Version 2.0 or higher
- **Disk Space**: Minimum 50MB free space
- **Permissions**: Write access to home directory

### Verification
Check your system meets the requirements:
```bash
# Check bash version (should be 4.0+)
bash --version

# Check git version (should be 2.0+)
git --version

# Check available disk space
df -h ~
```

## Installation Methods

### Method 1: Quick Installation (Recommended)

If you already have the basic version installed:
```bash
setup-claude-memory
```

### Method 2: Manual Installation

1. **Create directory structure**:
```bash
mkdir -p ~/.claude-memory/{lib,hooks,bin,config,docs,tests,logs,tmp}
```

2. **Install libraries and scripts**:
```bash
# Copy all files to the appropriate directories
# (This assumes you have the files available)
```

3. **Set up git configuration**:
```bash
git config --global init.templatedir ~/.git-templates
```

4. **Install hooks in current repository**:
```bash
branch-memory hooks install
```

## Installation Process

The installer performs the following steps:

### 1. System Validation
- ✅ Checks for required dependencies
- ✅ Validates file system permissions
- ✅ Verifies available disk space
- ✅ Tests git functionality

### 2. Component Installation
- 📦 Creates directory structure
- 📦 Installs core libraries
- 📦 Sets up git hook templates
- 📦 Configures global git settings

### 3. Repository Setup
- 🔧 Installs hooks in current repository
- 🔧 Creates default configuration
- 🔧 Initializes memory system

### 4. Verification
- ✅ Tests all components
- ✅ Validates configuration
- ✅ Verifies hook installation
- ✅ Runs health check

## Post-Installation Setup

### 1. Configuration
Create your personal configuration:
```bash
# Create user configuration
branch-memory config create user

# Edit configuration (optional)
branch-memory config edit user
```

### 2. Initialize Current Repository
If you're in a git repository:
```bash
# Install hooks
branch-memory hooks install

# Create initial memory
branch-memory save "Initial branch setup"

# Verify everything works
branch-memory status
```

### 3. Path Configuration
Ensure `~/bin` is in your PATH:

**For Zsh users:**
```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**For Bash users:**
```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**For Fish users:**
```bash
fish_add_path ~/bin
```

## Installation Verification

### Quick Check
```bash
# Test the command is available
branch-memory version

# Run health check
branch-memory health

# Check hook status (if in a git repository)
branch-memory hooks status
```

### Comprehensive Test
```bash
# Run full diagnostic
branch-memory diagnose

# Test hook functionality
branch-memory hooks test

# Test basic operations
branch-memory save "Test save"
branch-memory list
```

## Existing Repository Setup

For repositories you already have:

### Automatic Setup
```bash
cd /path/to/existing/repo
git init  # This will install hooks automatically
```

### Manual Setup
```bash
cd /path/to/existing/repo
branch-memory hooks install
```

## Configuration Options

### Global Configuration
Affects all repositories:
```bash
branch-memory config edit user
```

### Repository-Specific Configuration
Create `.claude-memory.yml` in your repository:
```yaml
# Override global settings for this repository
auto_save_on_commit: false
debug_enabled: true
```

## Uninstallation

### Remove from Current Repository
```bash
branch-memory hooks uninstall
```

### Complete Removal
```bash
# Remove git template configuration
git config --global --unset init.templatedir

# Remove the system (backup your memories first!)
branch-memory backup
rm -rf ~/.claude-memory

# Remove from PATH (edit your shell configuration file)
# Remove the line: export PATH="$HOME/bin:$PATH"
```

## Troubleshooting Installation

### Common Issues

**1. Permission Denied**
```bash
# Check home directory permissions
ls -la ~ | grep claude-memory

# Fix permissions
chmod -R 755 ~/.claude-memory
```

**2. Git Configuration Issues**
```bash
# Check git configuration
git config --global --list | grep template

# Reset git template configuration
git config --global init.templatedir ~/.git-templates
```

**3. Hook Installation Failed**
```bash
# Check repository status
branch-memory diagnose

# Force reinstall hooks
branch-memory hooks install --force
```

**4. Command Not Found**
```bash
# Check if ~/bin is in PATH
echo $PATH | grep -o "$HOME/bin"

# Add to PATH temporarily
export PATH="$HOME/bin:$PATH"

# Test command
branch-memory version
```

### Getting Help

**Enable Debug Mode**:
```bash
branch-memory debug
# Now all operations show detailed information
```

**Create Diagnostic Report**:
```bash
branch-memory diagnose
# Creates detailed report for troubleshooting
```

**Check System Health**:
```bash
branch-memory health
# Validates all system components
```

## Advanced Installation

### Custom Installation Directory
```bash
# Set custom installation directory
export CLAUDE_MEMORY_HOME="/custom/path/.claude-memory"
setup-claude-memory
```

### Development Installation
For testing or development:
```bash
# Enable debug mode during installation
export CLAUDE_MEMORY_DEBUG_ENABLED=true
setup-claude-memory
```

### CI/CD Environment Setup
For automated environments:
```bash
# Disable interactive prompts
export CLAUDE_MEMORY_BATCH_MODE=true
setup-claude-memory --non-interactive
```

## Migration Guide

### From Basic Version (1.x)
The installer automatically migrates from the basic version:

1. **Backs up existing configuration**
2. **Preserves existing memory files**
3. **Updates hooks to new version**
4. **Maintains existing workflows**

### Manual Migration
If automatic migration fails:
```bash
# Backup existing memories
cp -r .claude/memories .claude/memories.backup

# Install new version
setup-claude-memory

# Verify memories are preserved
branch-memory list
```

## Security Considerations

### File Permissions
The installer sets secure permissions:
- Configuration files: `600` (owner read/write only)
- Executable scripts: `755` (owner full, others read/execute)
- Memory files: `644` (owner read/write, others read)

### Sensitive Data
- Memory files follow git ignore patterns
- No sensitive data is logged
- All operations are local (no network access)

### Access Control
- Only the owner can modify configuration
- Hook execution is limited by git's security model
- All operations respect existing file permissions

## Performance Optimization

### Large Repository Setup
For repositories with many branches:
```yaml
# In .claude-memory.yml
compress_old_memories: true
memory_retention_days: 60
enable_performance_logging: true
```

### High-Frequency Switching
For workflows with frequent branch switches:
```yaml
# Optimize for speed
auto_save_on_commit: false
backup_before_switch: false
enable_performance_logging: false
```

---

**Next Steps**: See [Usage Guide](usage.md) for detailed usage instructions.