# Changelog

All notable changes to Claude Code Branch Memory Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-18

### Changed - Complete Rewrite
- **Architecture**: Rewritten from Bash to TypeScript/Node.js
- **Distribution**: Now a Claude Code plugin with automatic hook integration
- **Integration**: Uses Claude Code's native hooks system (SessionStart + PostToolUse) instead of git hooks
- **Security**: No more `eval`, shell injection, or TOCTOU vulnerabilities
- **File operations**: Atomic writes via write-to-temp-then-rename
- **Testing**: 56 tests with vitest (branch sanitization, memory operations, hook detection, config)

### Added
- Claude Code plugin manifest (`.claude-plugin/plugin.json`)
- Native Claude Code hooks for automatic memory switching (`hooks/hooks.json`)
- Plugin skills: `/branch-memory:save`, `/branch-memory:load`, `/branch-memory:status`, `/branch-memory:list`
- `init` command for first-time setup
- `clean` command to remove memories for deleted branches
- JSON configuration file support (`.branch-memory.json`)
- Metadata headers in saved memory files (HTML comments, stripped on load)
- Automatic backup before every destructive operation

### Removed
- Bash scripts (entire `src/bin/`, `src/lib/`, `src/hooks/`, `src/completions/`)
- Shell installer/uninstaller/updater (`install.sh`, `uninstall.sh`, `update.sh`)
- Git hook files (`post-checkout`, `pre-commit`) — replaced by Claude Code native hooks
- Shell completions (bash/zsh/fish) — replaced by plugin skills
- Bash compatibility layer (`compat.sh`)
- `eval` usage and all associated security vulnerabilities

### Migration from v2.x
- Install the npm package: `npm install --save-dev claude-code-branch-memory-manager`
- Your existing `.claude/memories/` files are compatible and will be loaded as-is
- Remove the old `~/.claude-memory/` installation directory
- Remove old git hooks from `.git/hooks/post-checkout` and `.git/hooks/pre-commit`

## [2.0.0] - 2025-08-19

### Added
- Professional architecture with modular library system
- Cross-platform installer
- Bash 3.2+ compatibility layer
- Shell completions for bash, zsh, and fish

## [1.0.0] - 2025-04-01

### Added
- Initial release
- Branch-specific CLAUDE.md file management
- Git hook integration (post-checkout, pre-commit)
- Manual save/load commands
