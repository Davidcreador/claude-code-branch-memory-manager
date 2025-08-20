#!/usr/bin/env bash
# Claude Code Branch Memory Manager - Uninstaller
# Professional Edition v2.0.0
# 
# This script completely removes the Claude Code Branch Memory Manager from your system
# It will optionally backup your memory files before removal

set -euo pipefail

# ==============================================================================
# CONSTANTS
# ==============================================================================

readonly SCRIPT_VERSION="2.0.0"
readonly INSTALL_DIR="$HOME/.claude-memory"
readonly BIN_DIR="$HOME/bin"
readonly GIT_TEMPLATE_DIR="$HOME/.git-templates"
readonly BACKUP_DIR="$HOME/.claude-memory-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output (if terminal supports it)
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
    readonly RED=$(tput setaf 1)
    readonly GREEN=$(tput setaf 2)
    readonly YELLOW=$(tput setaf 3)
    readonly BLUE=$(tput setaf 4)
    readonly CYAN=$(tput setaf 6)
    readonly BOLD=$(tput bold)
    readonly NC=$(tput sgr0)
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' NC=''
fi

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

# Logging functions
log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${CYAN}[$timestamp]${NC} ${BLUE}ℹ${NC}  $message" ;;
        "OK")    echo -e "${CYAN}[$timestamp]${NC} ${GREEN}✓${NC}  $message" ;;
        "WARN")  echo -e "${CYAN}[$timestamp]${NC} ${YELLOW}⚠${NC}  $message" ;;
        "ERROR") echo -e "${CYAN}[$timestamp]${NC} ${RED}✗${NC}  $message" >&2 ;;
        "STEP")  echo -e "${CYAN}[$timestamp]${NC} ${BOLD}▶${NC}  $message" ;;
    esac
}

# User confirmation
confirm() {
    local question="$1"
    local default="${2:-n}"
    
    # Convert to lowercase for comparison (bash 3.2 compatible)
    local default_lower
    default_lower=$(echo "$default" | tr '[:upper:]' '[:lower:]')
    
    # Skip confirmation if non-interactive
    if [[ ! -t 0 ]]; then
        [[ "$default_lower" =~ ^y ]]
        return $?
    fi
    
    local prompt="y/N"
    [[ "$default_lower" =~ ^y ]] && prompt="Y/n"
    
    read -p "$(echo -e "${BLUE}?${NC} $question ($prompt): ")" -n 1 -r
    echo ""
    [[ $REPLY =~ ^[Yy]$ ]] || ([[ -z $REPLY ]] && [[ "$default_lower" =~ ^y ]])
}

# ==============================================================================
# BACKUP FUNCTIONS
# ==============================================================================

backup_memories() {
    log "STEP" "Backing up memory files"
    
    local memory_count=0
    local backup_created=false
    
    # Find all memory directories in git repositories
    while IFS= read -r -d '' git_dir; do
        local repo_dir
        repo_dir=$(dirname "$git_dir")
        local memory_dir="$repo_dir/.claude/memories"
        
        if [[ -d "$memory_dir" ]] && [[ -n "$(ls -A "$memory_dir" 2>/dev/null || true)" ]]; then
            if [[ "$backup_created" == "false" ]]; then
                mkdir -p "$BACKUP_DIR/memories"
                backup_created=true
            fi
            
            local repo_name
            repo_name=$(basename "$repo_dir")
            local backup_path="$BACKUP_DIR/memories/$repo_name"
            
            cp -r "$memory_dir" "$backup_path" 2>/dev/null || true
            memory_count=$((memory_count + $(ls -1 "$memory_dir" 2>/dev/null | wc -l)))
            
            log "OK" "Backed up memories from: $repo_name"
        fi
    done < <(find "$HOME" -maxdepth 5 -name ".git" -type d -print0 2>/dev/null || true)
    
    # Backup global configuration if exists
    if [[ -d "$INSTALL_DIR/config" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$INSTALL_DIR/config" "$BACKUP_DIR/" 2>/dev/null || true
        log "OK" "Backed up configuration files"
    fi
    
    if [[ "$backup_created" == "true" ]]; then
        log "OK" "Backup completed: $memory_count memory files saved to $BACKUP_DIR"
        return 0
    else
        log "INFO" "No memory files found to backup"
        return 1
    fi
}

# ==============================================================================
# REMOVAL FUNCTIONS
# ==============================================================================

remove_git_hooks() {
    log "STEP" "Removing git hooks from repositories"
    
    local hooks_removed=0
    
    # Find all git repositories and remove our hooks
    while IFS= read -r -d '' git_dir; do
        local hooks_dir="$git_dir/hooks"
        local repo_dir
        repo_dir=$(dirname "$git_dir")
        local repo_name
        repo_name=$(basename "$repo_dir")
        
        # Check if our hooks are installed
        if [[ -f "$hooks_dir/post-checkout" ]] && grep -q "claude-memory" "$hooks_dir/post-checkout" 2>/dev/null; then
            rm -f "$hooks_dir/post-checkout" "$hooks_dir/pre-commit" 2>/dev/null || true
            hooks_removed=$((hooks_removed + 1))
            log "OK" "Removed hooks from: $repo_name"
        fi
    done < <(find "$HOME" -maxdepth 5 -name ".git" -type d -print0 2>/dev/null || true)
    
    if [[ $hooks_removed -gt 0 ]]; then
        log "OK" "Removed hooks from $hooks_removed repositories"
    else
        log "INFO" "No git hooks found to remove"
    fi
}

remove_git_template() {
    log "STEP" "Removing git template configuration"
    
    # Check if git template is set to our directory
    local current_template
    current_template=$(git config --global init.templatedir 2>/dev/null || echo "")
    
    if [[ "$current_template" == "$GIT_TEMPLATE_DIR" ]]; then
        git config --global --unset init.templatedir 2>/dev/null || true
        log "OK" "Removed git template configuration"
    fi
    
    # Remove template directory
    if [[ -d "$GIT_TEMPLATE_DIR" ]]; then
        rm -rf "$GIT_TEMPLATE_DIR"
        log "OK" "Removed git template directory"
    fi
}

remove_shell_integration() {
    log "STEP" "Removing shell integration"
    
    local configs_updated=0
    
    # Shell configuration files to check
    local -a shell_configs=(
        "$HOME/.bashrc"
        "$HOME/.bash_profile"
        "$HOME/.zshrc"
        "$HOME/.config/fish/config.fish"
    )
    
    for config in "${shell_configs[@]}"; do
        if [[ -f "$config" ]]; then
            # Create temp file
            local temp_file
            temp_file=$(mktemp)
            
            # Remove our PATH addition
            if grep -q "Claude Memory Manager installer" "$config" 2>/dev/null; then
                # Remove the line and the one before and after it
                sed '/# Added by Claude Memory Manager installer/,+1d' "$config" > "$temp_file"
                
                # Check if the file changed
                if ! cmp -s "$config" "$temp_file"; then
                    cp "$temp_file" "$config"
                    configs_updated=$((configs_updated + 1))
                    log "OK" "Removed PATH from: $(basename "$config")"
                fi
            fi
            
            rm -f "$temp_file"
        fi
    done
    
    if [[ $configs_updated -gt 0 ]]; then
        log "OK" "Updated $configs_updated shell configuration files"
        log "INFO" "Restart your terminal for changes to take effect"
    fi
}

remove_binaries() {
    log "STEP" "Removing binary files"
    
    # Remove from ~/bin
    if [[ -f "$BIN_DIR/branch-memory" ]]; then
        rm -f "$BIN_DIR/branch-memory"
        log "OK" "Removed branch-memory from ~/bin"
    fi
    
    # Remove symlinks if they exist
    if [[ -L "/usr/local/bin/branch-memory" ]]; then
        if confirm "Remove symlink from /usr/local/bin?" "n"; then
            sudo rm -f "/usr/local/bin/branch-memory" 2>/dev/null || {
                log "WARN" "Could not remove /usr/local/bin/branch-memory (may need sudo)"
            }
        fi
    fi
}

remove_installation() {
    log "STEP" "Removing installation directory"
    
    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
        log "OK" "Removed installation directory: $INSTALL_DIR"
    else
        log "INFO" "Installation directory not found"
    fi
}

remove_memory_directories() {
    if ! confirm "Remove ALL memory directories from repositories?" "n"; then
        log "INFO" "Keeping memory directories in repositories"
        return
    fi
    
    log "STEP" "Removing memory directories from repositories"
    
    local dirs_removed=0
    
    # Find and remove all .claude/memories directories
    while IFS= read -r -d '' memory_dir; do
        local repo_dir
        repo_dir=$(dirname "$(dirname "$memory_dir")")
        local repo_name
        repo_name=$(basename "$repo_dir")
        
        rm -rf "$memory_dir"
        dirs_removed=$((dirs_removed + 1))
        log "OK" "Removed memories from: $repo_name"
        
        # Remove .claude directory if empty
        local claude_dir
        claude_dir=$(dirname "$memory_dir")
        if [[ -d "$claude_dir" ]] && [[ -z "$(ls -A "$claude_dir" 2>/dev/null || true)" ]]; then
            rmdir "$claude_dir" 2>/dev/null || true
        fi
    done < <(find "$HOME" -maxdepth 6 -type d -path "*/.claude/memories" -print0 2>/dev/null || true)
    
    if [[ $dirs_removed -gt 0 ]]; then
        log "OK" "Removed memory directories from $dirs_removed repositories"
    else
        log "INFO" "No memory directories found"
    fi
}

# ==============================================================================
# MAIN UNINSTALL PROCESS
# ==============================================================================

main() {
    # Clear screen and show header
    clear
    echo -e "${BOLD}╭─────────────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}│  Claude Code Branch Memory Manager Uninstaller    │${NC}"
    echo -e "${BOLD}│  Professional Edition v${SCRIPT_VERSION}                    │${NC}"
    echo -e "${BOLD}╰─────────────────────────────────────────────────────╯${NC}"
    echo ""
    echo "This will remove the Claude Code Branch Memory Manager from your system."
    echo ""
    
    # Check if installed
    if [[ ! -d "$INSTALL_DIR" ]] && [[ ! -f "$BIN_DIR/branch-memory" ]]; then
        log "WARN" "Claude Memory Manager does not appear to be installed"
        
        if ! confirm "Continue anyway?" "n"; then
            log "INFO" "Uninstall cancelled"
            exit 0
        fi
    fi
    
    # Confirm uninstallation
    echo -e "${YELLOW}WARNING:${NC} This will remove:"
    echo "  • The branch-memory command"
    echo "  • Git hooks from repositories"
    echo "  • Configuration files"
    echo "  • Installation directory"
    echo ""
    
    if ! confirm "Do you want to proceed with uninstallation?" "n"; then
        log "INFO" "Uninstall cancelled"
        exit 0
    fi
    
    echo ""
    
    # Ask about backup
    if confirm "Would you like to backup your memory files first?" "y"; then
        if backup_memories; then
            echo ""
            log "INFO" "You can restore your memories later by copying them back to .claude/memories"
            echo ""
        fi
    fi
    
    # Perform uninstallation
    remove_git_hooks
    remove_git_template
    remove_shell_integration
    remove_binaries
    remove_installation
    
    # Ask about memory directories
    echo ""
    remove_memory_directories
    
    # Final summary
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}✓${NC} Uninstallation Complete!"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]]; then
        echo "Your memories have been backed up to:"
        echo "  ${CYAN}$BACKUP_DIR${NC}"
        echo ""
    fi
    
    echo "Thank you for using Claude Code Branch Memory Manager!"
    echo "We hope it helped improve your development workflow."
    echo ""
    echo "If you'd like to reinstall later:"
    echo "  ${CYAN}curl -fsSL https://raw.githubusercontent.com/Davidcreador/claude-code-branch-memory-manager/main/install.sh | bash${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
}

# ==============================================================================
# SCRIPT ENTRY POINT
# ==============================================================================

# Handle command line arguments
case "${1:-}" in
    --force|-f)
        log "WARN" "Force mode enabled - skipping confirmations"
        export FORCE_MODE="true"
        ;;
    --help|-h)
        echo "Claude Code Branch Memory Manager Uninstaller v${SCRIPT_VERSION}"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --force, -f    Skip all confirmations"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show version information"
        echo ""
        exit 0
        ;;
    --version|-v)
        echo "Claude Code Branch Memory Manager Uninstaller v${SCRIPT_VERSION}"
        exit 0
        ;;
esac

# Run main uninstallation
main "$@"