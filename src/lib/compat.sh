#!/bin/bash
# Claude Code Branch Memory Manager - Bash Compatibility Layer
# Provides consistent API across bash 3.2+ and different platforms

# ==============================================================================
# FEATURE DETECTION
# ==============================================================================

# Global capability flags
BASH_MAJOR_VERSION="${BASH_VERSION%%.*}"
HAS_ASSOCIATIVE_ARRAYS="false"
HAS_TIMEOUT_COMMAND="false"
HAS_ADVANCED_REGEX="false"
HAS_PROCESS_SUBSTITUTION="false"
PLATFORM_TYPE=""

# Detect bash capabilities
detect_bash_features() {
    # Check associative array support (bash 4.0+)
    if [[ $BASH_MAJOR_VERSION -ge 4 ]]; then
        HAS_ASSOCIATIVE_ARRAYS="true"
    fi
    
    # Check timeout command availability
    if command -v timeout >/dev/null 2>&1; then
        HAS_TIMEOUT_COMMAND="true"
    fi
    
    # Check process substitution support
    if [[ $BASH_MAJOR_VERSION -ge 3 ]]; then
        # Test if process substitution works
        if echo "test" | { read -r line; [[ "$line" == "test" ]]; } 2>/dev/null; then
            HAS_PROCESS_SUBSTITUTION="true"
        fi
    fi
    
    # Check regex capabilities
    if [[ "test123" =~ test[0-9]+ ]] 2>/dev/null; then
        HAS_ADVANCED_REGEX="true"
    fi
    
    # Detect platform type
    case "$(uname -s)" in
        Darwin*) PLATFORM_TYPE="macos" ;;
        Linux*)  PLATFORM_TYPE="linux" ;;
        *)       PLATFORM_TYPE="unknown" ;;
    esac
}

# ==============================================================================
# ASSOCIATIVE ARRAY COMPATIBILITY
# ==============================================================================

# Associative array polyfill for bash 3.x
# Uses indexed arrays with encoded keys

declare -a COMPAT_ARRAY_KEYS=()
declare -a COMPAT_ARRAY_VALUES=()

# Set associative array value
compat_array_set() {
    local array_name="$1"
    local key="$2"
    local value="$3"
    
    if [[ "$HAS_ASSOCIATIVE_ARRAYS" == "true" ]]; then
        # Use native associative arrays
        eval "${array_name}[\"$key\"]=\"$value\""
    else
        # Use compatibility implementation
        local encoded_key="${array_name}__${key}"
        
        # Find existing key or add new one
        local i=0
        local found=false
        
        for existing_key in "${COMPAT_ARRAY_KEYS[@]}"; do
            if [[ "$existing_key" == "$encoded_key" ]]; then
                COMPAT_ARRAY_VALUES[$i]="$value"
                found=true
                break
            fi
            ((i++))
        done
        
        if [[ "$found" == "false" ]]; then
            COMPAT_ARRAY_KEYS+=("$encoded_key")
            COMPAT_ARRAY_VALUES+=("$value")
        fi
    fi
}

# Get associative array value
compat_array_get() {
    local array_name="$1"
    local key="$2"
    local default_value="${3:-}"
    
    if [[ "$HAS_ASSOCIATIVE_ARRAYS" == "true" ]]; then
        # Use native associative arrays
        local value
        eval "value=\"\${${array_name}[\"$key\"]:-}\""
        echo "${value:-$default_value}"
    else
        # Use compatibility implementation
        local encoded_key="${array_name}__${key}"
        local i=0
        
        for existing_key in "${COMPAT_ARRAY_KEYS[@]}"; do
            if [[ "$existing_key" == "$encoded_key" ]]; then
                echo "${COMPAT_ARRAY_VALUES[$i]}"
                return 0
            fi
            ((i++))
        done
        
        echo "$default_value"
    fi
}

# Check if associative array key exists
compat_array_has_key() {
    local array_name="$1"
    local key="$2"
    
    if [[ "$HAS_ASSOCIATIVE_ARRAYS" == "true" ]]; then
        eval "[[ -n \"\${${array_name}[\"$key\"]+_}\" ]]"
    else
        local encoded_key="${array_name}__${key}"
        for existing_key in "${COMPAT_ARRAY_KEYS[@]}"; do
            if [[ "$existing_key" == "$encoded_key" ]]; then
                return 0
            fi
        done
        return 1
    fi
}

# ==============================================================================
# TIMEOUT COMPATIBILITY
# ==============================================================================

# Timeout command polyfill
compat_timeout() {
    local duration="$1"
    shift
    
    if [[ "$HAS_TIMEOUT_COMMAND" == "true" ]]; then
        timeout "$duration" "$@"
    else
        # Fallback implementation using background process and kill
        local cmd_pid
        
        # Start command in background
        "$@" &
        cmd_pid=$!
        
        # Start timeout timer in background
        (
            sleep "$duration"
            if kill -0 "$cmd_pid" 2>/dev/null; then
                kill -TERM "$cmd_pid" 2>/dev/null || true
                sleep 1
                kill -KILL "$cmd_pid" 2>/dev/null || true
            fi
        ) &
        local timer_pid=$!
        
        # Wait for command to complete
        local exit_code=0
        wait "$cmd_pid" || exit_code=$?
        
        # Clean up timer
        kill "$timer_pid" 2>/dev/null || true
        wait "$timer_pid" 2>/dev/null || true
        
        return $exit_code
    fi
}

# ==============================================================================
# FILE OPERATIONS COMPATIBILITY
# ==============================================================================

# Cross-platform file modification time
compat_file_mtime() {
    local file_path="$1"
    local format="${2:-epoch}"  # epoch|human
    
    if [[ ! -f "$file_path" ]]; then
        echo "0"
        return 1
    fi
    
    case "$PLATFORM_TYPE" in
        "macos")
            if [[ "$format" == "human" ]]; then
                stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file_path" 2>/dev/null || echo "unknown"
            else
                stat -f "%m" "$file_path" 2>/dev/null || echo "0"
            fi
            ;;
        "linux")
            if [[ "$format" == "human" ]]; then
                stat -c "%y" "$file_path" 2>/dev/null | cut -d'.' -f1 || echo "unknown"
            else
                stat -c "%Y" "$file_path" 2>/dev/null || echo "0"
            fi
            ;;
        *)
            if [[ "$format" == "human" ]]; then
                ls -l "$file_path" | awk '{print $6, $7, $8}' 2>/dev/null || echo "unknown"
            else
                echo "0"
            fi
            ;;
    esac
}

# Cross-platform file size
compat_file_size() {
    local file_path="$1"
    local format="${2:-bytes}"  # bytes|human
    
    if [[ ! -f "$file_path" ]]; then
        echo "0"
        return 1
    fi
    
    case "$format" in
        "human")
            ls -lh "$file_path" | awk '{print $5}' 2>/dev/null || echo "0"
            ;;
        "bytes")
            case "$PLATFORM_TYPE" in
                "macos")
                    stat -f "%z" "$file_path" 2>/dev/null || echo "0"
                    ;;
                "linux")
                    stat -c "%s" "$file_path" 2>/dev/null || echo "0"
                    ;;
                *)
                    ls -l "$file_path" | awk '{print $5}' 2>/dev/null || echo "0"
                    ;;
            esac
            ;;
    esac
}

# ==============================================================================
# STRING OPERATIONS COMPATIBILITY
# ==============================================================================

# Safe string matching for older bash versions
compat_string_match() {
    local string="$1"
    local pattern="$2"
    
    if [[ "$HAS_ADVANCED_REGEX" == "true" ]]; then
        [[ "$string" =~ $pattern ]]
    else
        # Fallback to case statement or grep
        case "$string" in
            $pattern) return 0 ;;
            *) return 1 ;;
        esac
    fi
}

# Safe parameter expansion
compat_string_replace() {
    local string="$1"
    local pattern="$2"
    local replacement="$3"
    local mode="${4:-first}"  # first|all
    
    if [[ $BASH_MAJOR_VERSION -ge 4 ]]; then
        # Use native parameter expansion
        case "$mode" in
            "all")
                echo "${string//$pattern/$replacement}"
                ;;
            "first"|*)
                echo "${string/$pattern/$replacement}"
                ;;
        esac
    else
        # Fallback to sed
        case "$mode" in
            "all")
                echo "$string" | sed "s/$pattern/$replacement/g"
                ;;
            "first"|*)
                echo "$string" | sed "s/$pattern/$replacement/"
                ;;
        esac
    fi
}

# ==============================================================================
# LOGGING COMPATIBILITY
# ==============================================================================

# Simple logging that works across all bash versions
compat_log() {
    local level="$1"
    local message="$2"
    local component="${3:-main}"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "DEBUG") [[ "${COMPAT_LOG_LEVEL:-INFO}" == "DEBUG" ]] && echo "[$timestamp] [DEBUG] [$component] $message" >&2 ;;
        "INFO")  echo "[$timestamp] [INFO]  [$component] $message" >&2 ;;
        "WARN")  echo "[$timestamp] [WARN]  [$component] $message" >&2 ;;
        "ERROR") echo "[$timestamp] [ERROR] [$component] $message" >&2 ;;
        "FATAL") echo "[$timestamp] [FATAL] [$component] $message" >&2 ;;
    esac
}

# ==============================================================================
# CONFIGURATION COMPATIBILITY
# ==============================================================================

# Simple key-value configuration system for older bash
declare -a COMPAT_CONFIG_KEYS=()
declare -a COMPAT_CONFIG_VALUES=()

# Set configuration value
compat_config_set() {
    local key="$1"
    local value="$2"
    
    # Find existing key or add new one
    local i=0
    local found=false
    
    for existing_key in "${COMPAT_CONFIG_KEYS[@]}"; do
        if [[ "$existing_key" == "$key" ]]; then
            COMPAT_CONFIG_VALUES[$i]="$value"
            found=true
            break
        fi
        ((i++))
    done
    
    if [[ "$found" == "false" ]]; then
        COMPAT_CONFIG_KEYS+=("$key")
        COMPAT_CONFIG_VALUES+=("$value")
    fi
}

# Get configuration value
compat_config_get() {
    local key="$1"
    local default_value="${2:-}"
    
    local i=0
    for existing_key in "${COMPAT_CONFIG_KEYS[@]}"; do
        if [[ "$existing_key" == "$key" ]]; then
            echo "${COMPAT_CONFIG_VALUES[$i]}"
            return 0
        fi
        ((i++))
    done
    
    echo "$default_value"
}

# Load configuration from simple key=value file
compat_config_load() {
    local config_file="$1"
    
    if [[ ! -f "$config_file" ]]; then
        return 1
    fi
    
    # Parse simple key: value format
    while IFS=': ' read -r key value || [[ -n "$key" ]]; do
        # Skip comments and empty lines
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue
        
        # Clean up key and value
        key=$(echo "$key" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        
        # Remove quotes
        value=$(echo "$value" | sed 's/^["'"'"']//' | sed 's/["'"'"']$//')
        
        if [[ -n "$key" && -n "$value" ]]; then
            compat_config_set "$key" "$value"
        fi
    done < "$config_file"
}

# ==============================================================================
# INITIALIZATION
# ==============================================================================

# Initialize compatibility layer
init_compat() {
    detect_bash_features
    
    # Set default configuration
    compat_config_set "memory_dir" ".claude/memories"
    compat_config_set "memory_file_name" "CLAUDE.md"
    compat_config_set "auto_save_on_checkout" "true"
    compat_config_set "auto_save_on_commit" "true"
    compat_config_set "debug_enabled" "false"
    compat_config_set "log_level" "INFO"
    
    # Load user configuration if available
    local config_file="${HOME}/.claude-memory/config/user.yml"
    if [[ -f "$config_file" ]]; then
        compat_config_load "$config_file"
    fi
    
    # Set logging level
    COMPAT_LOG_LEVEL=$(compat_config_get "log_level" "INFO")
}

# ==============================================================================
# API FUNCTIONS
# ==============================================================================

# Get current git branch (compatible implementation)
compat_get_current_branch() {
    if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
        local branch
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        
        if [[ "$branch" == "HEAD" ]]; then
            echo "detached-head"
        else
            echo "$branch"
        fi
    else
        echo "unknown"
    fi
}

# Sanitize branch name for filename (compatible)
compat_sanitize_branch_name() {
    local branch_name="$1"
    
    # Use sed for maximum compatibility
    echo "$branch_name" | sed 's/[^a-zA-Z0-9._-]/_/g' | sed 's/_\+/_/g'
}

# Check if file exists and is not empty
compat_file_has_content() {
    local file_path="$1"
    [[ -f "$file_path" && -s "$file_path" ]]
}

# Create directory safely
compat_mkdir() {
    local dir_path="$1"
    
    if [[ ! -d "$dir_path" ]]; then
        mkdir -p "$dir_path" 2>/dev/null || {
            compat_log "ERROR" "Failed to create directory: $dir_path"
            return 1
        }
    fi
    return 0
}

# Copy file safely with backup
compat_copy_file() {
    local source="$1"
    local destination="$2"
    local create_backup="${3:-true}"
    
    if [[ ! -f "$source" ]]; then
        compat_log "ERROR" "Source file not found: $source"
        return 1
    fi
    
    # Create backup if destination exists
    if [[ -f "$destination" && "$create_backup" == "true" ]]; then
        local backup_file="${destination}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$destination" "$backup_file" || {
            compat_log "WARN" "Failed to create backup: $backup_file"
        }
    fi
    
    # Copy file
    cp "$source" "$destination" || {
        compat_log "ERROR" "Failed to copy file: $source -> $destination"
        return 1
    }
    
    return 0
}

# ==============================================================================
# CORE MEMORY FUNCTIONS (COMPATIBLE)
# ==============================================================================

# Save branch memory (compatible implementation)
compat_save_branch_memory() {
    local branch_name="$1"
    local description="${2:-Manual save}"
    
    local memory_dir
    memory_dir=$(compat_config_get "memory_dir" ".claude/memories")
    local memory_file_name
    memory_file_name=$(compat_config_get "memory_file_name" "CLAUDE.md")
    local safe_branch
    safe_branch=$(compat_sanitize_branch_name "$branch_name")
    
    # Ensure memory directory exists
    compat_mkdir "$memory_dir" || return 1
    
    # Check if current memory file exists
    if ! compat_file_has_content "$memory_file_name"; then
        compat_log "WARN" "No current memory file found: $memory_file_name"
        return 1
    fi
    
    local memory_file="$memory_dir/$safe_branch.md"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Create enhanced memory file
    {
        echo "# Claude Code Memory - Branch: $branch_name"
        echo ""
        echo "**Last Updated**: $timestamp"
        echo "**Description**: $description"
        echo ""
        echo "---"
        echo ""
        cat "$memory_file_name"
    } > "$memory_file" || {
        compat_log "ERROR" "Failed to save memory file: $memory_file"
        return 1
    }
    
    compat_log "INFO" "Saved memory for branch '$branch_name'"
    return 0
}

# Load branch memory (compatible implementation)
compat_load_branch_memory() {
    local branch_name="$1"
    
    local memory_dir
    memory_dir=$(compat_config_get "memory_dir" ".claude/memories")
    local memory_file_name
    memory_file_name=$(compat_config_get "memory_file_name" "CLAUDE.md")
    local safe_branch
    safe_branch=$(compat_sanitize_branch_name "$branch_name")
    
    local memory_file="$memory_dir/$safe_branch.md"
    
    if [[ ! -f "$memory_file" ]]; then
        compat_log "WARN" "No memory found for branch '$branch_name'"
        
        # Try fallback to main branch
        if [[ "$(compat_config_get "fallback_to_main" "true")" == "true" ]]; then
            for main_branch in "main" "master" "develop"; do
                local main_memory_file="$memory_dir/$(compat_sanitize_branch_name "$main_branch").md"
                if [[ -f "$main_memory_file" ]]; then
                    compat_log "INFO" "Using fallback memory from branch '$main_branch'"
                    memory_file="$main_memory_file"
                    break
                fi
            done
        fi
        
        if [[ ! -f "$memory_file" ]]; then
            return 1
        fi
    fi
    
    # Load the memory file
    if compat_copy_file "$memory_file" "$memory_file_name" "true"; then
        compat_log "INFO" "Loaded memory for branch '$branch_name'"
        return 0
    else
        compat_log "ERROR" "Failed to load memory from: $memory_file"
        return 1
    fi
}

# List branch memories (compatible implementation)
compat_list_memories() {
    local memory_dir
    memory_dir=$(compat_config_get "memory_dir" ".claude/memories")
    
    if [[ ! -d "$memory_dir" ]]; then
        echo "No branch memories found"
        return 1
    fi
    
    local current_branch
    current_branch=$(compat_get_current_branch)
    local safe_current
    safe_current=$(compat_sanitize_branch_name "$current_branch")
    
    echo "Available branch memories:"
    echo "========================="
    
    local found_any=false
    for file in "$memory_dir"/*.md; do
        [[ -f "$file" ]] || continue
        found_any=true
        
        local basename
        basename=$(basename "$file" .md)
        local size
        size=$(compat_file_size "$file" "human")
        local modified
        modified=$(compat_file_mtime "$file" "human")
        
        if [[ "$basename" == "$safe_current" ]]; then
            echo "  → $basename ($size, modified: $modified) [current]"
        else
            echo "    $basename ($size, modified: $modified)"
        fi
    done
    
    if [[ "$found_any" == "false" ]]; then
        echo "No branch memories found"
        return 1
    fi
    
    return 0
}

# ==============================================================================
# MAIN COMPATIBILITY API
# ==============================================================================

# Initialize compatibility layer when sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    init_compat
fi

# Provide consistent API regardless of bash version
if [[ "$HAS_ASSOCIATIVE_ARRAYS" == "true" ]]; then
    # Full-featured mode
    compat_log "DEBUG" "Full bash features available (version $BASH_MAJOR_VERSION)" "compat"
else
    # Compatibility mode
    compat_log "INFO" "Using compatibility mode for bash $BASH_MAJOR_VERSION" "compat"
fi

# Export capability flags for other scripts
export BASH_MAJOR_VERSION
export HAS_ASSOCIATIVE_ARRAYS
export HAS_TIMEOUT_COMMAND
export HAS_ADVANCED_REGEX
export HAS_PROCESS_SUBSTITUTION
export PLATFORM_TYPE