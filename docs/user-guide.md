# 📖 User Guide

Comprehensive guide for mastering Claude Code Branch Memory Manager.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Basic Workflows](#basic-workflows)
- [Advanced Workflows](#advanced-workflows)
- [Team Workflows](#team-workflows)
- [Integration Examples](#integration-examples)
- [Command Reference](#command-reference)
- [Configuration Guide](#configuration-guide)
- [Best Practices](#best-practices)

---

## 🧠 Core Concepts

### How It Works

Claude Code Branch Memory Manager automatically manages `CLAUDE.md` files on a per-branch basis:

```
Repository Structure:
├── CLAUDE.md                    # Current branch context (what Claude reads)
└── .claude/
    ├── memories/
    │   ├── main.md             # Main branch memory
    │   ├── feature_auth.md     # feature/auth branch memory
    │   └── hotfix_security.md  # hotfix/security branch memory
    └── backups/                # Automatic backups
        ├── main_20250819_143022_switch.md
        └── ...
```

### Key Principles

1. **Automatic**: Memory switches happen automatically when you change branches
2. **Preserving**: Your current work is always saved before switching
3. **Isolated**: Each branch has its own independent context
4. **Safe**: Automatic backups prevent data loss
5. **Transparent**: Works with any git workflow or tool

### Memory Lifecycle

```mermaid
graph LR
    A[Working on Branch A] --> B[git checkout branch-b]
    B --> C[Auto-save Branch A memory]
    C --> D[Load Branch B memory]
    D --> E[Working on Branch B]
    E --> F[git commit]
    F --> G[Auto-update Branch B memory]
```

---

## 🔄 Basic Workflows

### Daily Development Workflow

**Scenario**: Working on a feature, need to quickly fix a bug, then return to feature work.

```bash
# 1. Working on a feature
git checkout feature/user-dashboard
echo "# User Dashboard Implementation

## Current Progress
- ✅ Created user model
- 🔄 Working on dashboard UI components
- ⏳ Need to add authentication

## Next Steps
- Complete UserDashboard.vue component
- Add user authentication middleware
- Write unit tests
" > CLAUDE.md

# 2. Save current progress
branch-memory save "Dashboard UI components 60% complete"

# 3. Switch to fix urgent bug (memory auto-saves)
git checkout main
git checkout -b hotfix/login-vulnerability

# 4. Claude now has clean context for the hotfix
cat CLAUDE.md  # Shows new branch template

# 5. Work on hotfix
echo "# Security Hotfix - Login Vulnerability

## Issue
- Authentication bypass in login endpoint
- CVE-2025-xxxx reported by security team

## Fix Required
- Add input validation to /api/auth/login
- Implement rate limiting
- Add security tests

## Files to Modify
- src/auth/login.controller.ts
- src/middleware/rate-limiter.ts
- tests/auth/login.test.ts
" > CLAUDE.md

# 6. Complete hotfix and return to feature
git add . && git commit -m "Fix authentication vulnerability"
git checkout main
git merge hotfix/login-vulnerability
git branch -d hotfix/login-vulnerability

# 7. Return to feature work (context automatically restored)
git checkout feature/user-dashboard
cat CLAUDE.md  # Your dashboard context is back!
```

### Feature Development Workflow

**Scenario**: Developing a complex feature across multiple sessions.

```bash
# Day 1: Start feature
git checkout -b feature/payment-integration
branch-memory save "Starting payment integration - need to research Stripe API"

# Day 2: Continue work
git checkout feature/payment-integration
# Context automatically loaded - you remember exactly where you left off
branch-memory save "Stripe API research complete, implementing webhook handlers"

# Day 3: Testing phase  
branch-memory save "Core payment flow implemented, starting test suite"

# Day 4: Code review prep
branch-memory save "All tests passing, ready for code review"
```

### Release Management Workflow

**Scenario**: Managing release branches with specific context.

```bash
# Create release branch
git checkout main
git checkout -b release/v2.1.0
branch-memory save "Release v2.1.0 - final testing and documentation updates needed

## Release Checklist
- [ ] All features merged from develop
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Performance tests passing
- [ ] Security audit complete

## Known Issues
- Minor UI inconsistency in mobile view (non-blocking)
- Documentation needs copyedit review

## Deploy Notes
- Database migration required
- Feature flags to enable: new_dashboard, improved_search
"

# Work on release
# ... testing, bug fixes, documentation

# Final release
branch-memory save "Release v2.1.0 ready for production deployment"
```

---

## 🚀 Advanced Workflows

### Multi-Repository Development

**Scenario**: Working on multiple related repositories.

```bash
# Frontend repository
cd ~/projects/my-app-frontend
git checkout feature/new-ui
branch-memory save "Frontend: implementing new dashboard UI, needs backend API changes"

# Switch to backend repository
cd ~/projects/my-app-backend  
git checkout feature/dashboard-api
branch-memory save "Backend: creating dashboard API to support new frontend UI

## API Endpoints Needed
- GET /api/dashboard/stats
- GET /api/dashboard/recent-activity
- GET /api/dashboard/notifications

## Database Changes
- Add dashboard_stats table
- Add activity_log indexes
"

# Each repository maintains independent memory
# Context is preserved per repository
```

### Experimental Branch Management

**Scenario**: Testing multiple approaches to a problem.

```bash
# Approach 1: Using Redux
git checkout -b experiment/redux-approach
branch-memory save "Experiment: Redux state management approach

## Hypothesis
Redux might provide better state management for complex forms

## Implementation Plan
- Install @reduxjs/toolkit
- Create store structure
- Migrate user forms to Redux

## Success Criteria
- Reduced form state bugs
- Better developer experience
- Performance improvement
"

# Approach 2: Using Zustand
git checkout main
git checkout -b experiment/zustand-approach  
branch-memory save "Experiment: Zustand state management approach

## Hypothesis
Zustand might be simpler and lighter than Redux

## Implementation Plan
- Install zustand
- Create simple stores
- Migrate user forms

## Success Criteria
- Smaller bundle size
- Simpler code
- Same functionality as Redux approach
"

# Compare approaches by switching between branches
git checkout experiment/redux-approach    # Redux context loaded
git checkout experiment/zustand-approach  # Zustand context loaded

# Make decision and clean up
git checkout main
git branch -d experiment/redux-approach experiment/zustand-approach
```

### Long-Running Feature Development

**Scenario**: Feature that spans weeks with multiple developers.

```bash
# Lead developer starts feature
git checkout -b feature/advanced-search
branch-memory save "Advanced Search Feature - Epic Planning

## Epic Overview
Implement elasticsearch-powered search with filters, facets, and auto-complete

## Architecture Decisions
- Use Elasticsearch 8.x for search engine
- React components for UI
- GraphQL for API layer
- Redis for caching

## Team Assignments
- @alice: Elasticsearch setup and indexing
- @bob: GraphQL resolvers and caching
- @charlie: React components and UI
- @david: Integration testing

## Current Phase
Planning and architecture (Week 1)

## Next Milestones
- Week 2: Backend API development
- Week 3: Frontend UI development  
- Week 4: Integration and testing
- Week 5: Performance optimization and launch
"

# Alice works on her part
branch-memory save "Elasticsearch indexing strategy implemented

## Progress Update
- ✅ Elasticsearch cluster configured
- ✅ Document mapping schema designed
- ✅ Indexing pipeline implemented
- 🔄 Working on search query optimization

## Handoff to Bob
- Search indexes are ready for GraphQL integration
- See elasticsearch.md for query examples
- Performance baseline: ~50ms for simple queries

## Next Steps for Alice
- Implement faceted search
- Add auto-complete indexing
- Performance optimization
"

# Bob continues work
branch-memory save "GraphQL search resolvers implementation

## Progress Update  
- ✅ Connected to Alice's Elasticsearch setup
- ✅ Basic search resolver implemented
- 🔄 Adding caching layer with Redis

## Integration Notes
- Search response format standardized
- Caching strategy: 5min TTL for search results
- Error handling for Elasticsearch downtime

## Ready for Charlie
- GraphQL schema published
- Search endpoint: /graphql query { search(term: String) }
- See api-docs.md for full schema
"
```

---

## 👥 Team Workflows

### Shared Configuration

**Setup team-wide defaults**:

```bash
# Create team configuration template
cat > .claude-memory.yml << 'EOF'
# Team configuration for MyCompany project
memory_dir: ".claude/memories"
auto_save_on_checkout: true
auto_save_on_commit: true
create_new_branch_memory: true
fallback_to_main: true

# Team-specific settings
memory_file_name: "CLAUDE.md"
max_backup_files: 10
memory_retention_days: 90

# Performance settings for large repository
enable_performance_logging: false
hook_timeout: 15
compress_old_memories: true
EOF

# Commit team configuration
git add .claude-memory.yml
git commit -m "Add team Claude Memory Manager configuration"
```

### Code Review Integration

**Scenario**: Including memory context in code review process.

```bash
# Before creating PR
branch-memory save "Feature complete and ready for review

## Summary
Implemented user authentication with JWT tokens and OAuth integration

## Changes Made
- Added JWT middleware for API protection
- Integrated OAuth providers (Google, GitHub)
- Created user registration/login flows
- Added comprehensive test suite

## Testing Done
- ✅ Unit tests: 98% coverage
- ✅ Integration tests: All auth flows tested
- ✅ Security testing: No vulnerabilities found
- ✅ Performance testing: <200ms response times

## Reviewer Notes
- Pay attention to JWT token expiration logic (auth.middleware.ts:45)
- New environment variables needed (see .env.example)
- Database migration required (migrations/005_add_auth_tables.sql)

## Deployment Checklist
- [ ] Update environment variables
- [ ] Run database migration
- [ ] Update reverse proxy configuration
- [ ] Monitor authentication metrics
"

# Include memory content in PR description
cat CLAUDE.md >> pr-description.md
```

### Knowledge Sharing

**Scenario**: Documenting complex solutions for team learning.

```bash
# Document complex debugging session
branch-memory save "Performance Investigation - Database Query Optimization

## Problem Statement
Dashboard loading time increased from 200ms to 3.5s after recent changes

## Investigation Process

### Step 1: Performance Profiling
- Used Chrome DevTools to identify bottleneck
- Found N+1 query problem in user activity feed
- 847 individual database queries for 20 activity items

### Step 2: Query Analysis
- Analyzed slow query log
- Identified missing index on activity_logs.user_id
- Found inefficient JOIN in ActivityService.getRecentActivity()

### Step 3: Solution Implementation
- Added composite index: (user_id, created_at, activity_type)
- Refactored query to use single JOIN with subquery
- Implemented query result caching (5min TTL)

### Results
- Dashboard load time: 3.5s → 180ms (95% improvement)
- Database query count: 847 → 3 queries
- CPU usage reduced by 60%

## Code Changes
- database/migrations/006_add_activity_indexes.sql
- src/services/ActivityService.ts (lines 45-78)
- src/controllers/DashboardController.ts (added caching)

## Lessons Learned
- Always profile before optimizing
- Index design is critical for JOIN performance
- Caching strategy should consider data freshness vs performance

## References
- Performance testing results: /docs/perf-testing-results.md
- Database optimization guide: /docs/db-optimization.md
"
```

---

## 🔧 Integration Examples

### VS Code Integration

The tool works seamlessly with VS Code's git integration:

```json
// .vscode/settings.json
{
    "git.enableSmartCommit": true,
    "git.autofetch": true,
    // Claude Memory Manager works automatically with VS Code git operations
}
```

### CI/CD Integration

**GitHub Actions example**:

```yaml
# .github/workflows/ci.yml
name: CI with Claude Context

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Install Claude Memory Manager for context
      - name: Setup Claude Memory Manager
        run: |
          curl -fsSL https://install.claude-memory.dev | bash
          branch-memory hooks install
          
      # Context is automatically available for any Claude Code usage
      - name: Generate documentation with Claude
        run: |
          # CLAUDE.md is automatically available with branch context
          claude-code generate-docs --context-file CLAUDE.md
```

### IDE Integration Examples

**JetBrains IDEs**:
```bash
# Works automatically with IntelliJ IDEA, WebStorm, etc.
# Memory switches when you change branches through IDE
```

**Git GUI Tools**:
```bash
# Compatible with:
# - SourceTree
# - GitKraken  
# - GitHub Desktop
# - Tower
# - Fork

# Memory automatically switches when you change branches in any tool
```

---

## 📝 Command Reference

### Core Commands

#### `save [description]`
Save current CLAUDE.md to branch-specific memory.

**Examples**:
```bash
# Basic save
branch-memory save

# Save with description
branch-memory save "Completed user authentication API"

# Save with detailed description
branch-memory save "Refactored database layer for better performance

- Optimized slow queries
- Added connection pooling
- Implemented query caching
- 40% performance improvement achieved"
```

**When to use**:
- Before switching to another branch
- After completing a significant milestone
- Before taking a break from current work
- When you want to document current progress

#### `load <branch>`
Load memory from a specific branch.

**Examples**:
```bash
# Load memory from main branch
branch-memory load main

# Load memory from feature branch
branch-memory load feature/user-authentication

# Load memory with branch name containing slashes
branch-memory load feature/ui/dashboard-redesign
```

**When to use**:
- When you want to see context from another branch
- Before merging branches (to understand context)
- When investigating issues in other branches

#### `switch <branch>`
Switch git branch and automatically load its memory.

**Examples**:
```bash
# Switch to existing branch
branch-memory switch main

# Switch to feature branch
branch-memory switch feature/new-api

# Switch and create new branch
branch-memory switch feature/experimental-feature
```

**When to use**:
- Instead of `git checkout` when you want automatic memory management
- When switching between active development branches
- When you want to ensure context is preserved

#### `list [format]`
List all available branch memories.

**Examples**:
```bash
# Human-readable list
branch-memory list

# JSON output for scripting
branch-memory list json

# Example output:
# Available branch memories:
# ==========================
#   → main (2.1K, modified: 2025-08-19 14:30) [current]
#     feature/auth (1.8K, modified: 2025-08-19 12:15)
#     feature/dashboard (3.2K, modified: 2025-08-18 16:45)
```

#### `status [format]`
Show comprehensive system status.

**Examples**:
```bash
# Detailed status
branch-memory status

# JSON status for monitoring
branch-memory status json
```

### System Commands

#### `config <subcommand>`
Manage configuration settings.

**Examples**:
```bash
# Show all configuration
branch-memory config show

# Get specific setting
branch-memory config get auto_save_on_checkout

# Set configuration value
branch-memory config set debug_enabled true

# Create configuration file
branch-memory config create user

# Edit configuration
branch-memory config edit user
```

#### `hooks <subcommand>`
Manage git hooks installation and status.

**Examples**:
```bash
# Check hook status
branch-memory hooks status

# Install hooks in current repository
branch-memory hooks install

# Force reinstall hooks
branch-memory hooks install --force

# Test hook functionality
branch-memory hooks test

# Verify hooks are working
branch-memory hooks verify

# Remove hooks
branch-memory hooks uninstall
```

#### `health`
Run comprehensive system health check.

**Example**:
```bash
branch-memory health

# Output:
# Claude Code Branch Memory Manager - Health Check
# ==============================================
# 
# ✓ All health checks passed
# 
# System components:
#   ✓ Core libraries
#   ✓ Git hooks  
#   ✓ Configuration system
#   ✓ Memory directory
#   ✓ File permissions
```

### Maintenance Commands

#### `backup`
Create manual backup of current memory.

**Examples**:
```bash
# Create backup before risky operation
branch-memory backup

# Output:
# ✓ Backup created: .claude/backups/main_20250819_143022_manual.md
```

#### `clean <target> [days]`
Clean up old files to save space.

**Examples**:
```bash
# Clean old backup files
branch-memory clean backups

# Clean old memory files (older than 60 days)
branch-memory clean memories 60

# Clean old log files (older than 14 days)
branch-memory clean logs 14

# Clean everything
branch-memory clean all
```

#### `diagnose`
Create comprehensive diagnostic report.

**Examples**:
```bash
# Generate diagnostic report
branch-memory diagnose

# Output:
# ✓ Diagnostic report created: diagnostic-report-20250819_143045.txt
# 
# Report includes:
#   • System information
#   • Configuration details
#   • Git repository status
#   • Hook installation status
#   • Recent log entries
#   • Performance metrics
```

---

## ⚙️ Configuration Guide

### Configuration Files

Configuration is loaded in order of precedence:

1. **Environment variables** (highest priority)
2. **Local configuration** (`.claude-memory.yml` in repository)
3. **User configuration** (`~/.claude-memory/config/user.yml`)
4. **Global configuration** (`~/.claude-memory/config/config.yml`)
5. **Default values** (lowest priority)

### Core Settings

#### Memory Management

```yaml
# Directory for storing branch memories (relative to repository root)
memory_dir: ".claude/memories"

# Name of the main memory file that Claude reads
memory_file_name: "CLAUDE.md"

# Maximum number of backup files to keep per branch
max_backup_files: 5

# Number of days to retain old memory files
memory_retention_days: 30
```

#### Automation Settings

```yaml
# Automatically save current memory when switching branches
auto_save_on_checkout: true

# Automatically add commit context to memory before commits
auto_save_on_commit: true

# Create new memory files for new branches
create_new_branch_memory: true

# Fall back to main/master branch memory if target branch has no memory
fallback_to_main: true

# Create backup before switching memory contexts
backup_before_switch: true
```

#### System Settings

```yaml
# Enable debug logging and verbose output
debug_enabled: false

# Logging level: DEBUG, INFO, WARN, ERROR, FATAL
log_level: "INFO"

# Timeout for git hook operations (seconds)
hook_timeout: 30

# Enable performance metrics logging
enable_performance_logging: false

# Enable git hooks (can disable for troubleshooting)
enable_hooks: true

# Enable safe mode with rollback capability
safe_mode: false
```

### Environment Variables

Override any setting with environment variables:

```bash
# Enable debug mode for current session
export CLAUDE_MEMORY_DEBUG_ENABLED=true
export CLAUDE_MEMORY_LOG_LEVEL=DEBUG

# Use custom memory directory
export CLAUDE_MEMORY_MEMORY_DIR="/custom/path/memories"

# Disable hooks temporarily
export CLAUDE_MEMORY_ENABLE_HOOKS=false

# Non-interactive mode for scripts
export CLAUDE_MEMORY_BATCH_MODE=true
```

### Per-Repository Configuration

Create `.claude-memory.yml` in your repository:

```yaml
# Configuration for large monorepo
auto_save_on_commit: false        # Reduce noise in large repos
memory_retention_days: 90         # Keep longer history
enable_performance_logging: true  # Monitor performance
hook_timeout: 45                  # Longer timeout for large repos

# Custom memory organization
memory_dir: ".project/contexts"   # Custom directory name
```

---

## 🏆 Best Practices

### Memory File Organization

**Structure your CLAUDE.md files consistently**:

```markdown
# CLAUDE.md Template

## Branch: feature/user-authentication

**Last Updated**: 2025-08-19 14:30
**Description**: Implementing comprehensive user authentication system

## 🎯 Current Objectives
- [ ] JWT token implementation
- [ ] OAuth provider integration  
- [ ] Password reset flow
- [ ] Multi-factor authentication

## 📈 Progress Tracking
- ✅ Database schema design (Week 1)
- ✅ Basic login/register endpoints (Week 1)
- 🔄 JWT middleware implementation (Week 2 - 60% complete)
- ⏳ OAuth integration (Week 2 - planned)
- ⏳ Password reset (Week 3 - planned)

## 🧠 Technical Context
### Current Focus
Working on JWT middleware in `src/middleware/auth.ts`

### Key Decisions Made
- Using jsonwebtoken library for JWT handling
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Storing refresh tokens in Redis

### Current Challenges
- Need to handle token refresh logic
- Deciding on logout strategy (blacklist vs short expiration)
- Integration with existing session management

### Files Being Modified
- `src/middleware/auth.ts` - JWT validation logic
- `src/controllers/auth.controller.ts` - Login/logout endpoints
- `src/models/user.model.ts` - User schema updates
- `tests/auth/` - Comprehensive test suite

## 🔗 Related Branches
- `main` - Stable branch with existing auth system
- `feature/user-model` - Database schema foundation
- `hotfix/session-security` - Recent security fixes

## 📚 Resources
- JWT best practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- OAuth 2.0 guide: https://oauth.net/2/
- Security considerations: /docs/security-guidelines.md

## 🚀 Next Session Plan
1. Complete JWT refresh logic
2. Add logout endpoint with token invalidation
3. Write integration tests for auth flow
4. Update API documentation
```

### Branching Strategy Integration

**Git Flow with Memory Management**:

```bash
# Feature development
git flow feature start user-profiles
# Memory automatically created with feature context

# Development work
branch-memory save "User profiles feature - implementing CRUD operations"

# Integration
git flow feature finish user-profiles
# Memory automatically switches back to develop branch context
```

**GitHub Flow with Memory Management**:

```bash
# Create feature branch
git checkout -b feature/improve-performance
branch-memory save "Performance improvement initiative

## Goal
Reduce page load times by 50%

## Strategy  
- Optimize database queries
- Implement caching layer
- Compress static assets
- Lazy load components
"

# Create pull request
# Include memory context in PR description to give reviewers full context
```

### Memory Descriptions Best Practices

**Good memory descriptions**:
```bash
branch-memory save "Completed API rate limiting implementation

## What was accomplished
- Added Redis-based rate limiter middleware
- Implemented sliding window algorithm
- Added rate limit headers to responses
- Created admin override mechanism

## Testing completed
- Unit tests for rate limiter logic
- Integration tests for API endpoints
- Load testing with 1000 req/sec
- Edge case testing (Redis failure scenarios)

## Ready for code review
All requirements met, comprehensive tests passing"

branch-memory save "Database migration troubleshooting - RESOLVED

## Issue encountered
Migration 005_add_user_permissions failed on staging environment

## Root cause
Foreign key constraint conflict with existing data

## Solution implemented
- Created data cleanup script
- Modified migration to handle existing data
- Added validation step to prevent future issues

## Verification
- Migration now succeeds on clean staging environment
- Backwards compatibility maintained
- Production deployment plan updated"
```

**Avoid generic descriptions**:
```bash
# Too generic
branch-memory save "work in progress"
branch-memory save "updates"
branch-memory save "fixes"

# Better
branch-memory save "User login form validation - 80% complete, need to add email verification"
branch-memory save "Database performance optimization - identified N+1 query issue, implementing fix"
branch-memory save "Security vulnerability patch - fixed SQL injection in search endpoint"
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

**Issue**: Memory not switching automatically
```bash
# Diagnosis
branch-memory hooks status

# If hooks not installed:
branch-memory hooks install

# If hooks installed but not working:
branch-memory hooks verify
branch-memory diagnose
```

**Issue**: Command not found
```bash
# Check if installed
ls -la ~/bin/branch-memory

# Check PATH
echo $PATH | grep -o "$HOME/bin"

# Add to PATH if missing
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Issue**: Permission denied
```bash
# Check permissions
branch-memory diagnose

# Fix common permission issues
chmod 755 ~/.claude-memory/
chmod +x ~/bin/branch-memory
```

### Advanced Troubleshooting

**Enable comprehensive debugging**:
```bash
# Enable debug mode
branch-memory debug

# Check detailed logs
tail -50 ~/.claude-memory/logs/claude-memory-$(date +%Y-%m-%d).log

# Generate diagnostic report
branch-memory diagnose
```

**Manual recovery**:
```bash
# If system is broken, recover manually
branch-memory clean all
branch-memory hooks install --force
branch-memory config create user
```

---

## 🔄 Migration Guide

### Upgrading from Basic Version

The installer automatically handles migration:

```bash
# Backup existing setup
branch-memory backup

# Run upgrade
curl -fsSL https://install.claude-memory.dev | bash

# Verify upgrade
branch-memory version
branch-memory health
```

### Migrating Between Systems

**Export memories for migration**:
```bash
# Create portable backup
tar -czf claude-memories-backup.tar.gz .claude/memories/

# On new system, after installation:
tar -xzf claude-memories-backup.tar.gz
```

---

**🎓 You're now ready to master branch memory management with Claude Code!**

For more advanced topics, see:
- [Configuration Reference](configuration.md) - All configuration options
- [API Reference](api-reference.md) - Complete command documentation
- [Architecture Guide](architecture.md) - How the system works internally