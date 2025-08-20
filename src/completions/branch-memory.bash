#!/bin/bash
# Claude Code Branch Memory Manager - Bash Completion
# Intelligent tab completion for the branch-memory command

# Main completion function
_branch_memory_completion() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local cmd="${COMP_WORDS[1]:-}"
    
    # Main commands
    local main_commands="save load list switch status config hooks backup clean health diagnose debug version help"
    
    # Subcommands for each main command
    local config_commands="show get set create edit"
    local hooks_commands="status install uninstall test verify"
    local clean_commands="backups memories logs all"
    local list_formats="human json"
    local status_formats="human json"
    
    case "${COMP_CWORD}" in
        1)
            # Complete main commands
            COMPREPLY=($(compgen -W "$main_commands" -- "$cur"))
            ;;
        2)
            case "$cmd" in
                config)
                    COMPREPLY=($(compgen -W "$config_commands" -- "$cur"))
                    ;;
                hooks)
                    COMPREPLY=($(compgen -W "$hooks_commands" -- "$cur"))
                    ;;
                clean)
                    COMPREPLY=($(compgen -W "$clean_commands" -- "$cur"))
                    ;;
                list)
                    COMPREPLY=($(compgen -W "$list_formats" -- "$cur"))
                    ;;
                status)
                    COMPREPLY=($(compgen -W "$status_formats" -- "$cur"))
                    ;;
                load)
                    # Complete with available branch memories
                    _complete_branch_memories
                    ;;
                switch)
                    # Complete with git branches
                    _complete_git_branches
                    ;;
                save)
                    # No completion for description (free text)
                    return 0
                    ;;
                *)
                    return 0
                    ;;
            esac
            ;;
        3)
            case "$cmd" in
                config)
                    case "$prev" in
                        get|set)
                            # Complete configuration keys
                            _complete_config_keys
                            ;;
                        *)
                            return 0
                            ;;
                    esac
                    ;;
                hooks)
                    case "$prev" in
                        install)
                            COMPREPLY=($(compgen -W "--force -f" -- "$cur"))
                            ;;
                        *)
                            return 0
                            ;;
                    esac
                    ;;
                clean)
                    case "$prev" in
                        memories|logs)
                            # Complete with number of days
                            COMPREPLY=($(compgen -W "7 14 30 60 90" -- "$cur"))
                            ;;
                        *)
                            return 0
                            ;;
                    esac
                    ;;
                *)
                    return 0
                    ;;
            esac
            ;;
        *)
            return 0
            ;;
    esac
}

# Complete with available branch memories
_complete_branch_memories() {
    local memory_dir=".claude/memories"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        return 0
    fi
    
    # Get memory directory from config if available
    if command -v branch-memory >/dev/null 2>&1; then
        memory_dir=$(branch-memory config get memory_dir 2>/dev/null || echo ".claude/memories")
    fi
    
    if [[ -d "$memory_dir" ]]; then
        local memories=()
        for file in "$memory_dir"/*.md; do
            [[ -f "$file" ]] || continue
            local basename
            basename=$(basename "$file" .md)
            # Convert sanitized name back to likely branch name
            basename=$(echo "$basename" | sed 's/_/\//g')
            memories+=("$basename")
        done
        
        COMPREPLY=($(compgen -W "${memories[*]}" -- "$cur"))
    fi
}

# Complete with git branches
_complete_git_branches() {
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        return 0
    fi
    
    local branches
    branches=$(git branch --format='%(refname:short)' 2>/dev/null | grep -v '^HEAD$' | tr '\n' ' ')
    
    COMPREPLY=($(compgen -W "$branches" -- "$cur"))
}

# Complete with configuration keys
_complete_config_keys() {
    local config_keys="memory_dir memory_file_name auto_save_on_checkout auto_save_on_commit create_new_branch_memory fallback_to_main backup_before_switch max_backup_files debug_enabled log_level hook_timeout enable_performance_logging enable_hooks safe_mode compress_old_memories memory_retention_days"
    
    COMPREPLY=($(compgen -W "$config_keys" -- "$cur"))
}

# Register the completion function
complete -F _branch_memory_completion branch-memory

# Also register for common aliases
complete -F _branch_memory_completion bmem
complete -F _branch_memory_completion bm