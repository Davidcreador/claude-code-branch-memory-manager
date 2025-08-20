#!/bin/bash
# Claude Code Branch Memory Manager - Compatible Logging Framework
# Simplified logging system compatible with older bash versions

# Set error handling
set -eo pipefail

# Global logging configuration
LOG_LEVEL="${CLAUDE_MEMORY_LOG_LEVEL:-INFO}"
LOG_FORMAT="${CLAUDE_MEMORY_LOG_FORMAT:-human}"
LOG_FILE="${CLAUDE_MEMORY_LOG_FILE:-}"
LOG_DIR="${HOME}/.claude-memory/logs"

# Log level constants
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_WARN=2
LOG_LEVEL_ERROR=3
LOG_LEVEL_FATAL=4

# Color constants
COLOR_DEBUG="\033[0;36m"
COLOR_INFO="\033[0;34m"
COLOR_WARN="\033[1;33m"
COLOR_ERROR="\033[0;31m"
COLOR_FATAL="\033[1;31m"
COLOR_RESET="\033[0m"

# Initialize logging system
init_logger() {
    mkdir -p "$LOG_DIR"
    
    if [[ -z "$LOG_FILE" ]]; then
        LOG_FILE="$LOG_DIR/claude-memory-$(date +%Y-%m-%d).log"
    fi
}

# Get timestamp
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Convert log level name to number
get_log_level_number() {
    case "$1" in
        "DEBUG") echo $LOG_LEVEL_DEBUG ;;
        "INFO")  echo $LOG_LEVEL_INFO ;;
        "WARN")  echo $LOG_LEVEL_WARN ;;
        "ERROR") echo $LOG_LEVEL_ERROR ;;
        "FATAL") echo $LOG_LEVEL_FATAL ;;
        *) echo $LOG_LEVEL_INFO ;;
    esac
}

# Get current log level number
get_current_log_level_number() {
    get_log_level_number "$LOG_LEVEL"
}

# Check if log level should be output
should_log() {
    local level="$1"
    local current_level_num
    current_level_num=$(get_current_log_level_number)
    local check_level_num
    check_level_num=$(get_log_level_number "$level")
    
    [[ $check_level_num -ge $current_level_num ]]
}

# Get color for log level
get_log_color() {
    case "$1" in
        "DEBUG") echo -e "$COLOR_DEBUG" ;;
        "INFO")  echo -e "$COLOR_INFO" ;;
        "WARN")  echo -e "$COLOR_WARN" ;;
        "ERROR") echo -e "$COLOR_ERROR" ;;
        "FATAL") echo -e "$COLOR_FATAL" ;;
        *) echo -e "$COLOR_INFO" ;;
    esac
}

# Core logging function
_log() {
    local level="$1"
    local message="$2"
    local component="${3:-main}"
    
    if ! should_log "$level"; then
        return 0
    fi
    
    local timestamp
    timestamp=$(get_timestamp)
    
    case "$LOG_FORMAT" in
        "json")
            printf '{"timestamp":"%s","level":"%s","component":"%s","message":"%s"}\n' \
                "$timestamp" "$level" "$component" "$message"
            ;;
        "human"|*)
            local color
            color=$(get_log_color "$level")
            local reset
            reset=$(echo -e "$COLOR_RESET")
            
            if [[ -t 2 ]]; then
                printf "%s [%s] %s%-5s%s: %s\n" \
                    "$timestamp" "$component" "$color" "$level" "$reset" "$message"
            else
                printf "%s [%s] %-5s: %s\n" \
                    "$timestamp" "$component" "$level" "$message"
            fi
            ;;
    esac >&2
    
    # Also log to file if specified
    if [[ -n "$LOG_FILE" ]]; then
        printf "%s [%s] %-5s: %s\n" \
            "$timestamp" "$component" "$level" "$message" >> "$LOG_FILE"
    fi
}

# Public logging functions
log_debug() {
    _log "DEBUG" "$1" "${2:-main}"
}

log_info() {
    _log "INFO" "$1" "${2:-main}"
}

log_warn() {
    _log "WARN" "$1" "${2:-main}"
}

log_error() {
    _log "ERROR" "$1" "${2:-main}"
}

log_fatal() {
    _log "FATAL" "$1" "${2:-main}"
}

# Performance logging
log_perf() {
    local operation="$1"
    local duration="$2"
    local component="${3:-perf}"
    
    _log "INFO" "Operation '$operation' completed in ${duration}ms" "$component"
}

# Set log level
set_log_level() {
    local new_level="$1"
    
    case "$new_level" in
        "DEBUG"|"INFO"|"WARN"|"ERROR"|"FATAL")
            LOG_LEVEL="$new_level"
            log_info "Log level set to $new_level" "logger"
            return 0
            ;;
        *)
            log_error "Invalid log level: $new_level. Valid levels: DEBUG, INFO, WARN, ERROR, FATAL" "logger"
            return 1
            ;;
    esac
}

# Get current log level
get_log_level() {
    echo "$LOG_LEVEL"
}

# Initialize when sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    init_logger
fi