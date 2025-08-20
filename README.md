# Claude Code Branch Memory Manager

**Professional branch-specific memory management for Claude Code**

Version 2.0.0 | Documentation | [Installation](#installation) | [Usage](#usage) | [Configuration](#configuration)

## Overview

The Claude Code Branch Memory Manager is a professional-grade automation system that provides branch-specific context management for Claude Code users. It automatically switches `CLAUDE.md` files when you change git branches, ensuring Claude always has the right context for your current work.

## ✨ Features

### 🔄 **Automatic Memory Switching**
- Seamlessly switches `CLAUDE.md` files when changing branches
- Preserves work context across branch switches
- Creates clean memory files for new branches

### 💾 **Intelligent Context Preservation**
- Auto-saves current work before switching branches
- Adds commit context with staged files and messages
- Creates timestamped backups for safety

### ⚙️ **Professional Configuration**
- YAML-based configuration with validation
- Environment variable support
- Per-repository overrides
- Comprehensive settings for all behaviors

### 🛠️ **Enterprise-Grade Reliability**
- Structured error handling with recovery suggestions
- Comprehensive logging with rotation
- Safe operations with automatic rollback
- Health checks and diagnostics

### 📊 **Monitoring & Debugging**
- Performance metrics and timing
- Structured event logging
- Debug mode with verbose output
- Comprehensive diagnostic reports

## 🚀 Installation

### Quick Install
```bash
setup-claude-memory
```

### Manual Install
```bash
# 1. Clone or download the system
# 2. Run the installer
~/bin/setup-claude-memory

# 3. Verify installation
branch-memory health
```

## 📖 Quick Start

### Basic Usage
```bash
# Save current work
branch-memory save "Implemented user authentication"

# Switch branches with automatic memory management
branch-memory switch feature/database-migration

# List all branch memories
branch-memory list

# Check system status
branch-memory status
```

### Automatic Operation
Once installed, the system works automatically:

```bash
# This automatically saves current memory and loads target memory
git checkout main

# This adds commit context to your memory file
git commit -m "Fix authentication bug"
```

## 📋 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `save [description]` | Save current memory | `branch-memory save "Added new feature"` |
| `load <branch>` | Load specific branch memory | `branch-memory load main` |
| `switch <branch>` | Switch branch + memory | `branch-memory switch feature/auth` |
| `list [format]` | List all memories | `branch-memory list json` |
| `status [format]` | Show current status | `branch-memory status` |
| `config <cmd>` | Manage configuration | `branch-memory config show` |
| `hooks <cmd>` | Manage git hooks | `branch-memory hooks install` |
| `backup` | Create manual backup | `branch-memory backup` |
| `clean <target>` | Clean old files | `branch-memory clean memories` |
| `health` | Run health check | `branch-memory health` |
| `diagnose` | Create diagnostic report | `branch-memory diagnose` |
| `debug` | Enable debug mode | `branch-memory debug` |

## ⚙️ Configuration

### Configuration Files
- **Global**: `~/.claude-memory/config/config.yml`
- **User**: `~/.claude-memory/config/user.yml`  
- **Local**: `.claude-memory.yml` (per repository)

### Key Settings
```yaml
# Memory management
memory_dir: ".claude/memories"
memory_file_name: "CLAUDE.md"
max_backup_files: 5

# Automation
auto_save_on_checkout: true
auto_save_on_commit: true
create_new_branch_memory: true
fallback_to_main: true

# System
debug_enabled: false
log_level: "INFO"
enable_hooks: true
safe_mode: false
```

### Environment Variables
All settings can be overridden with environment variables:
```bash
export CLAUDE_MEMORY_DEBUG_ENABLED=true
export CLAUDE_MEMORY_LOG_LEVEL=DEBUG
```

## 🔧 Advanced Usage

### Manual Memory Management
```bash
# Save with description
branch-memory save "Completed API integration tests"

# Load from specific branch
branch-memory load feature/user-dashboard

# Create backup before risky operation
branch-memory backup
```

### Configuration Management
```bash
# Show current configuration
branch-memory config show

# Set configuration value
branch-memory config set auto_save_on_checkout false

# Edit configuration file
branch-memory config edit user
```

### Hook Management
```bash
# Check hook status
branch-memory hooks status

# Install hooks in current repository
branch-memory hooks install

# Test hook functionality
branch-memory hooks test
```

### System Maintenance
```bash
# Clean up old files
branch-memory clean all

# Check system health
branch-memory health

# Generate diagnostic report
branch-memory diagnose
```

## 🐛 Troubleshooting

### Common Issues

**1. "Not in a git repository"**
```bash
# Navigate to a git repository first
cd /path/to/your/project
branch-memory status
```

**2. "Hooks not installed"**
```bash
# Install hooks in current repository
branch-memory hooks install
```

**3. "Memory file not found"**
```bash
# Create initial memory for current branch
branch-memory save "Initial branch setup"
```

**4. "Permission denied"**
```bash
# Check file permissions
branch-memory diagnose
# Fix permissions as suggested
```

### Debug Mode
Enable verbose logging for troubleshooting:
```bash
branch-memory debug
# Now all operations will show detailed information
```

### Getting Help
```bash
# Run system health check
branch-memory health

# Generate detailed diagnostic report
branch-memory diagnose

# Check specific component
branch-memory hooks verify
```

## 📁 File Structure

```
~/.claude-memory/
├── lib/                 # Core libraries
│   ├── logger.sh       # Logging framework
│   ├── config.sh       # Configuration management
│   ├── git-utils.sh    # Git operations
│   ├── core.sh         # Memory management
│   ├── errors.sh       # Error handling
│   └── hooks.sh        # Hook management
├── hooks/              # Git hook templates
│   ├── post-checkout   # Automatic memory switching
│   └── pre-commit      # Context saving
├── bin/                # Executable scripts
│   └── branch-memory   # Main utility
├── config/             # Configuration files
│   ├── config.yml      # Global configuration
│   └── user.yml        # User configuration
├── docs/               # Documentation
├── tests/              # Test suite
├── logs/               # Log files
└── tmp/                # Temporary files
```

## 🔒 Security & Privacy

- All data stays local to your machine
- No network connections or external services
- Memory files are stored in your project directories
- Sensitive information handling follows git ignore patterns
- Backup files are automatically cleaned up

## 🚀 Performance

- Optimized for large repositories
- Lazy loading of libraries
- Minimal git operations
- Configurable timeouts
- Performance monitoring available

## 📊 Monitoring

The system provides comprehensive monitoring:

- **Performance Metrics**: Operation timing and statistics
- **Event Logging**: Structured events for analysis
- **Health Checks**: System status validation
- **Diagnostic Reports**: Detailed troubleshooting information

## 🔧 Integration

### With IDEs
The system works seamlessly with any IDE or editor that uses git. Memory files are automatically managed when you switch branches through:
- Command line git operations
- IDE git integrations
- Git GUI tools

### With CI/CD
The system safely handles CI/CD environments:
- Detects non-interactive environments
- Gracefully degrades when hooks can't run
- Maintains compatibility with automated workflows

## 📝 License

This is a personal automation tool. Feel free to modify and adapt for your needs.

## 🤝 Contributing

Since this is designed as a personal tool, contributions should focus on:
- Bug fixes and reliability improvements
- Cross-platform compatibility
- Performance optimizations
- Documentation improvements

---

**Made with ❤️ for the Claude Code community**