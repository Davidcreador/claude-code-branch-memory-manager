# Claude Code Branch Memory Manager - Fish Completion
# Beautiful tab completion for fish shell users

# Main commands with descriptions
complete -c branch-memory -f
complete -c branch-memory -n '__fish_use_subcommand' -a 'save' -d 'Save current CLAUDE.md to branch memory'
complete -c branch-memory -n '__fish_use_subcommand' -a 'load' -d 'Load memory from specified branch'
complete -c branch-memory -n '__fish_use_subcommand' -a 'list' -d 'List all available branch memories'
complete -c branch-memory -n '__fish_use_subcommand' -a 'switch' -d 'Switch git branch and load its memory'
complete -c branch-memory -n '__fish_use_subcommand' -a 'status' -d 'Show current branch and memory status'
complete -c branch-memory -n '__fish_use_subcommand' -a 'config' -d 'Manage configuration settings'
complete -c branch-memory -n '__fish_use_subcommand' -a 'hooks' -d 'Manage git hooks'
complete -c branch-memory -n '__fish_use_subcommand' -a 'backup' -d 'Create timestamped backup of current memory'
complete -c branch-memory -n '__fish_use_subcommand' -a 'clean' -d 'Clean up old files'
complete -c branch-memory -n '__fish_use_subcommand' -a 'health' -d 'Perform system health check'
complete -c branch-memory -n '__fish_use_subcommand' -a 'diagnose' -d 'Create detailed diagnostic report'
complete -c branch-memory -n '__fish_use_subcommand' -a 'debug' -d 'Enable debug mode for troubleshooting'
complete -c branch-memory -n '__fish_use_subcommand' -a 'version' -d 'Show version information'
complete -c branch-memory -n '__fish_use_subcommand' -a 'help' -d 'Show help message'

# Config subcommands
complete -c branch-memory -n '__fish_seen_subcommand_from config' -a 'show' -d 'Show current configuration'
complete -c branch-memory -n '__fish_seen_subcommand_from config' -a 'get' -d 'Get specific configuration value'
complete -c branch-memory -n '__fish_seen_subcommand_from config' -a 'set' -d 'Set configuration value'
complete -c branch-memory -n '__fish_seen_subcommand_from config' -a 'create' -d 'Create default configuration file'
complete -c branch-memory -n '__fish_seen_subcommand_from config' -a 'edit' -d 'Edit configuration file'

# Config scopes for create/edit
complete -c branch-memory -n '__fish_seen_subcommand_from config; and __fish_seen_subcommand_from create edit' -a 'user' -d 'User configuration'
complete -c branch-memory -n '__fish_seen_subcommand_from config; and __fish_seen_subcommand_from create edit' -a 'local' -d 'Repository-specific configuration'
complete -c branch-memory -n '__fish_seen_subcommand_from config; and __fish_seen_subcommand_from create edit' -a 'global' -d 'System-wide configuration'

# Configuration keys for get/set
function __fish_branch_memory_config_keys
    echo "memory_dir	Directory for branch memory files"
    echo "memory_file_name	Name of the memory file (default: CLAUDE.md)"
    echo "auto_save_on_checkout	Auto-save when switching branches"
    echo "auto_save_on_commit	Auto-save before commits"
    echo "create_new_branch_memory	Create memory for new branches"
    echo "fallback_to_main	Use main branch memory as fallback"
    echo "backup_before_switch	Create backup before switching"
    echo "max_backup_files	Maximum backup files to keep"
    echo "debug_enabled	Enable debug logging"
    echo "log_level	Logging level (DEBUG, INFO, WARN, ERROR, FATAL)"
    echo "hook_timeout	Timeout for hook operations (seconds)"
    echo "enable_performance_logging	Enable performance metrics"
    echo "enable_hooks	Enable git hooks"
    echo "safe_mode	Enable safe mode with rollback"
    echo "compress_old_memories	Compress old memory files"
    echo "memory_retention_days	Days to retain memory files"
end

complete -c branch-memory -n '__fish_seen_subcommand_from config; and __fish_seen_subcommand_from get set' -a '(__fish_branch_memory_config_keys)' -f

# Hooks subcommands
complete -c branch-memory -n '__fish_seen_subcommand_from hooks' -a 'status' -d 'Show hook installation status'
complete -c branch-memory -n '__fish_seen_subcommand_from hooks' -a 'install' -d 'Install hooks in current repository'
complete -c branch-memory -n '__fish_seen_subcommand_from hooks' -a 'uninstall' -d 'Remove hooks from current repository'
complete -c branch-memory -n '__fish_seen_subcommand_from hooks' -a 'test' -d 'Test hook functionality'
complete -c branch-memory -n '__fish_seen_subcommand_from hooks' -a 'verify' -d 'Verify hooks are properly installed'

# Hooks install options
complete -c branch-memory -n '__fish_seen_subcommand_from hooks; and __fish_seen_subcommand_from install' -l 'force' -s 'f' -d 'Force overwrite existing hooks'

# Clean subcommands
complete -c branch-memory -n '__fish_seen_subcommand_from clean' -a 'backups' -d 'Clean up old backup files'
complete -c branch-memory -n '__fish_seen_subcommand_from clean' -a 'memories' -d 'Clean up old memory files'
complete -c branch-memory -n '__fish_seen_subcommand_from clean' -a 'logs' -d 'Clean up old log files'
complete -c branch-memory -n '__fish_seen_subcommand_from clean' -a 'all' -d 'Clean up all old files'

# Days option for clean memories/logs
function __fish_branch_memory_clean_days
    echo "7	One week"
    echo "14	Two weeks"
    echo "30	One month (default)"
    echo "60	Two months"
    echo "90	Three months"
end

complete -c branch-memory -n '__fish_seen_subcommand_from clean; and __fish_seen_subcommand_from memories logs' -a '(__fish_branch_memory_clean_days)' -f

# List/status format options
complete -c branch-memory -n '__fish_seen_subcommand_from list status' -a 'human' -d 'Human-readable format (default)'
complete -c branch-memory -n '__fish_seen_subcommand_from list status' -a 'json' -d 'JSON format for scripting'

# Dynamic completion for branch memories
function __fish_branch_memory_memories
    # Check if we're in a git repository
    if not git rev-parse --git-dir >/dev/null 2>&1
        return
    end
    
    set -l memory_dir ".claude/memories"
    
    # Get memory directory from config if available
    if command -v branch-memory >/dev/null 2>&1
        set memory_dir (branch-memory config get memory_dir 2>/dev/null; or echo ".claude/memories")
    end
    
    if test -d "$memory_dir"
        for file in "$memory_dir"/*.md
            if test -f "$file"
                set -l basename (basename "$file" .md)
                # Convert sanitized name back to likely branch name
                set basename (echo "$basename" | sed 's/_/\//g')
                
                # Get file size and modification time for description
                set -l size (ls -lh "$file" | awk '{print $5}')
                set -l mtime
                if test (uname -s) = "Darwin"
                    set mtime (stat -f "%Sm" -t "%m/%d" "$file" 2>/dev/null; or echo "unknown")
                else
                    set mtime (stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 | cut -d'-' -f2,3 | tr '-' '/'; or echo "unknown")
                end
                
                echo "$basename	Memory ($size, modified $mtime)"
            end
        end
    end
end

complete -c branch-memory -n '__fish_seen_subcommand_from load' -a '(__fish_branch_memory_memories)' -f

# Dynamic completion for git branches
function __fish_branch_memory_git_branches
    # Check if we're in a git repository
    if not git rev-parse --git-dir >/dev/null 2>&1
        return
    end
    
    # Get all branches with last commit message
    git for-each-ref --format='%(refname:short)	%(subject)' refs/heads/ 2>/dev/null | while read -l branch desc
        # Truncate long descriptions
        if test (string length "$desc") -gt 60
            set desc (string sub -l 57 "$desc")...
        end
        echo "$branch	$desc"
    end
end

complete -c branch-memory -n '__fish_seen_subcommand_from switch' -a '(__fish_branch_memory_git_branches)' -f

# Global options (work with any command)
complete -c branch-memory -l 'help' -s 'h' -d 'Show help message'
complete -c branch-memory -l 'version' -s 'v' -d 'Show version information'
complete -c branch-memory -l 'debug' -d 'Enable debug output'
complete -c branch-memory -l 'quiet' -s 'q' -d 'Suppress non-error output'

# Common aliases completion
complete -c bmem -w branch-memory
complete -c bm -w branch-memory