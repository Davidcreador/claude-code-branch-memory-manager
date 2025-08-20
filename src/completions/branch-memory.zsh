#compdef branch-memory
# Claude Code Branch Memory Manager - Zsh Completion
# Advanced tab completion for zsh users

# Main completion function
_branch_memory() {
    local context curcontext="$curcontext" state line
    local -A opt_args
    
    # Define the command structure
    _arguments -C \
        '1: :_branch_memory_commands' \
        '*::arg:->args' \
        && return 0
    
    case $state in
        args)
            case ${words[1]} in
                save)
                    _message "description (optional)"
                    ;;
                load)
                    _branch_memory_branch_memories
                    ;;
                switch)
                    _branch_memory_git_branches
                    ;;
                list)
                    _arguments \
                        '1: :_branch_memory_formats'
                    ;;
                status)
                    _arguments \
                        '1: :_branch_memory_formats'
                    ;;
                config)
                    _branch_memory_config_command
                    ;;
                hooks)
                    _branch_memory_hooks_command
                    ;;
                clean)
                    _branch_memory_clean_command
                    ;;
            esac
            ;;
    esac
}

# Complete main commands with descriptions
_branch_memory_commands() {
    local -a commands
    commands=(
        'save:Save current CLAUDE.md to branch memory'
        'load:Load memory from specified branch'
        'list:List all available branch memories'
        'switch:Switch git branch and load its memory'
        'status:Show current branch and memory status'
        'config:Manage configuration settings'
        'hooks:Manage git hooks'
        'backup:Create timestamped backup of current memory'
        'clean:Clean up old files'
        'health:Perform system health check'
        'diagnose:Create detailed diagnostic report'
        'debug:Enable debug mode for troubleshooting'
        'version:Show version information'
        'help:Show help message'
    )
    
    _describe 'commands' commands
}

# Complete format options
_branch_memory_formats() {
    local -a formats
    formats=(
        'human:Human-readable format (default)'
        'json:JSON format for scripting'
    )
    
    _describe 'formats' formats
}

# Complete config subcommands
_branch_memory_config_command() {
    local -a config_commands
    config_commands=(
        'show:Show current configuration'
        'get:Get specific configuration value'
        'set:Set configuration value'
        'create:Create default configuration file'
        'edit:Edit configuration file'
    )
    
    case ${words[2]} in
        get|set)
            if [[ ${words[2]} == "get" || ${#words[@]} -eq 3 ]]; then
                _branch_memory_config_keys
            fi
            ;;
        create|edit)
            _arguments \
                '1: :(user local global)'
            ;;
        *)
            _describe 'config commands' config_commands
            ;;
    esac
}

# Complete hooks subcommands
_branch_memory_hooks_command() {
    local -a hooks_commands
    hooks_commands=(
        'status:Show hook installation status'
        'install:Install hooks in current repository'
        'uninstall:Remove hooks from current repository'
        'test:Test hook functionality'
        'verify:Verify hooks are properly installed'
    )
    
    case ${words[2]} in
        install)
            _arguments \
                '1: :(--force -f)'
            ;;
        *)
            _describe 'hooks commands' hooks_commands
            ;;
    esac
}

# Complete clean subcommands
_branch_memory_clean_command() {
    local -a clean_targets
    clean_targets=(
        'backups:Clean up old backup files'
        'memories:Clean up old memory files'
        'logs:Clean up old log files'
        'all:Clean up all old files'
    )
    
    case ${words[2]} in
        memories|logs)
            if [[ ${#words[@]} -eq 3 ]]; then
                _message "days to keep (default: 30)"
            fi
            ;;
        *)
            _describe 'clean targets' clean_targets
            ;;
    esac
}

# Complete configuration keys
_branch_memory_config_keys() {
    local -a config_keys
    config_keys=(
        'memory_dir:Directory for branch memory files'
        'memory_file_name:Name of the memory file'
        'auto_save_on_checkout:Auto-save when switching branches'
        'auto_save_on_commit:Auto-save before commits'
        'create_new_branch_memory:Create memory for new branches'
        'fallback_to_main:Use main branch memory as fallback'
        'backup_before_switch:Create backup before switching'
        'max_backup_files:Maximum backup files to keep'
        'debug_enabled:Enable debug logging'
        'log_level:Logging level (DEBUG|INFO|WARN|ERROR)'
        'hook_timeout:Timeout for hook operations'
        'enable_performance_logging:Enable performance metrics'
        'enable_hooks:Enable git hooks'
        'safe_mode:Enable safe mode with rollback'
        'compress_old_memories:Compress old memory files'
        'memory_retention_days:Days to retain memory files'
    )
    
    _describe 'configuration keys' config_keys
}

# Complete branch memories
_branch_memory_branch_memories() {
    local memory_dir=".claude/memories"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        return 1
    fi
    
    # Get memory directory from config if available
    if command -v branch-memory >/dev/null 2>&1; then
        memory_dir=$(branch-memory config get memory_dir 2>/dev/null || echo ".claude/memories")
    fi
    
    if [[ -d "$memory_dir" ]]; then
        local -a memories
        for file in "$memory_dir"/*.md; do
            [[ -f "$file" ]] || continue
            local basename
            basename=$(basename "$file" .md)
            # Convert sanitized name back to likely branch name
            basename=$(echo "$basename" | sed 's/_/\//g')
            
            # Get file modification time for description
            local mtime
            if [[ "$OSTYPE" == darwin* ]]; then
                mtime=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || echo "unknown")
            else
                mtime=$(stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            fi
            
            memories+=("$basename:Memory from $mtime")
        done
        
        _describe 'branch memories' memories
    fi
}

# Complete git branches
_branch_memory_git_branches() {
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        return 1
    fi
    
    local -a branches
    local branch_list
    branch_list=$(git branch --format='%(refname:short)' 2>/dev/null | grep -v '^HEAD$')
    
    while IFS= read -r branch; do
        [[ -n "$branch" ]] || continue
        
        # Get last commit message for description
        local commit_msg
        commit_msg=$(git log -1 --format="%s" "$branch" 2>/dev/null | cut -c1-50)
        [[ ${#commit_msg} -gt 47 ]] && commit_msg="${commit_msg:0:47}..."
        
        branches+=("$branch:$commit_msg")
    done <<< "$branch_list"
    
    _describe 'git branches' branches
}

# Initialize completion
_branch_memory "$@"

# Register completion for aliases
compdef _branch_memory bmem
compdef _branch_memory bm