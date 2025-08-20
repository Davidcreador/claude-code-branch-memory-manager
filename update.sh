#!/usr/bin/env bash
# Claude Code Branch Memory Manager - Update Script
# Safely updates to the latest version while preserving user data

set -euo pipefail

# Security: Set restrictive umask
umask 077

# ==============================================================================
# CONFIGURATION
# ==============================================================================

readonly SCRIPT_VERSION="2.0.0"
readonly GITHUB_REPO="Davidcreador/claude-code-branch-memory-manager"
readonly API_URL="https://api.github.com/repos/$GITHUB_REPO/releases/latest"
readonly INSTALL_DIR="$HOME/.claude-memory"
readonly BIN_DIR="$HOME/bin"
readonly BACKUP_DIR="$HOME/.claude-memory-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
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

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${CYAN}[$timestamp]${NC} ${BLUE}ℹ${NC}  $message" >&2 ;;
        "OK")    echo -e "${CYAN}[$timestamp]${NC} ${GREEN}✓${NC}  $message" >&2 ;;
        "WARN")  echo -e "${CYAN}[$timestamp]${NC} ${YELLOW}⚠${NC}  $message" >&2 ;;
        "ERROR") echo -e "${CYAN}[$timestamp]${NC} ${RED}✗${NC}  $message" >&2 ;;
        "STEP")  echo -e "${CYAN}[$timestamp]${NC} ${BOLD}▶${NC}  $message" >&2 ;;
    esac
}

confirm() {
    local question="$1"
    local default="${2:-n}"
    
    # Convert to lowercase for comparison
    local default_lower
    default_lower=$(echo "$default" | tr '[:upper:]' '[:lower:]')
    
    # Skip confirmation if non-interactive
    if [[ ! -t 0 ]] || [[ "${UPDATE_NON_INTERACTIVE:-false}" == "true" ]]; then
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
# VERSION FUNCTIONS
# ==============================================================================

get_current_version() {
    if [[ -f "$BIN_DIR/branch-memory" ]]; then
        local version
        version=$("$BIN_DIR/branch-memory" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        echo "${version:-unknown}"
    else
        echo "not_installed"
    fi
}

get_latest_version() {
    local latest_version
    
    # Try to get version from GitHub API
    if command -v curl >/dev/null 2>&1; then
        latest_version=$(curl -fsSL "$API_URL" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"v?([0-9]+\.[0-9]+\.[0-9]+)".*/\1/' | head -1)
    elif command -v wget >/dev/null 2>&1; then
        latest_version=$(wget -qO- "$API_URL" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"v?([0-9]+\.[0-9]+\.[0-9]+)".*/\1/' | head -1)
    fi
    
    # Fallback to checking the raw install script
    if [[ -z "$latest_version" ]]; then
        local install_url="https://raw.githubusercontent.com/$GITHUB_REPO/main/install.sh"
        latest_version=$(curl -fsSL "$install_url" 2>/dev/null | grep 'INSTALLER_VERSION=' | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/' | head -1)
    fi
    
    echo "${latest_version:-unknown}"
}

version_compare() {
    local version1="$1"
    local version2="$2"
    
    # Handle special cases
    [[ "$version1" == "unknown" ]] || [[ "$version2" == "unknown" ]] && return 1
    [[ "$version1" == "not_installed" ]] && return 0
    [[ "$version1" == "$version2" ]] && return 1
    
    # Compare versions
    local IFS=.
    local i ver1=($version1) ver2=($version2)
    
    # Fill empty fields in ver1 with zeros
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
    done
    
    return 1
}

# ==============================================================================
# BACKUP FUNCTIONS
# ==============================================================================

create_backup() {
    log "STEP" "Creating backup of current installation"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup installation directory
    if [[ -d "$INSTALL_DIR" ]]; then
        cp -r "$INSTALL_DIR" "$BACKUP_DIR/claude-memory" 2>/dev/null || {
            log "WARN" "Could not backup installation directory"
        }
    fi
    
    # Backup binary
    if [[ -f "$BIN_DIR/branch-memory" ]]; then
        mkdir -p "$BACKUP_DIR/bin"
        cp "$BIN_DIR/branch-memory" "$BACKUP_DIR/bin/" 2>/dev/null || {
            log "WARN" "Could not backup binary"
        }
    fi
    
    # Backup user configurations
    if [[ -f "$HOME/.claude-memory.yml" ]]; then
        cp "$HOME/.claude-memory.yml" "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Save version information
    echo "$(get_current_version)" > "$BACKUP_DIR/version.txt"
    
    log "OK" "Backup created at: $BACKUP_DIR"
}

rollback_from_backup() {
    log "STEP" "Rolling back to previous version"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "ERROR" "No backup found at: $BACKUP_DIR"
        return 1
    fi
    
    # Restore installation directory
    if [[ -d "$BACKUP_DIR/claude-memory" ]]; then
        rm -rf "$INSTALL_DIR"
        cp -r "$BACKUP_DIR/claude-memory" "$INSTALL_DIR"
    fi
    
    # Restore binary
    if [[ -f "$BACKUP_DIR/bin/branch-memory" ]]; then
        cp "$BACKUP_DIR/bin/branch-memory" "$BIN_DIR/"
        chmod +x "$BIN_DIR/branch-memory"
    fi
    
    # Restore configurations
    if [[ -f "$BACKUP_DIR/.claude-memory.yml" ]]; then
        cp "$BACKUP_DIR/.claude-memory.yml" "$HOME/"
    fi
    
    log "OK" "Successfully rolled back to previous version"
}

# ==============================================================================
# UPDATE FUNCTIONS
# ==============================================================================

download_update() {
    log "STEP" "Downloading latest version"
    
    # Create secure temp directory
    local temp_dir
    temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/claude-update.XXXXXX") || {
        log "ERROR" "Failed to create temporary directory"
        return 1
    }
    trap 'rm -rf "$temp_dir"' EXIT INT TERM
    
    # Download the latest installer
    local installer_url="https://raw.githubusercontent.com/$GITHUB_REPO/main/install.sh"
    
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$installer_url" -o "$temp_dir/install.sh" || {
            log "ERROR" "Failed to download installer"
            return 1
        }
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$temp_dir/install.sh" "$installer_url" || {
            log "ERROR" "Failed to download installer"
            return 1
        }
    else
        log "ERROR" "Neither curl nor wget available"
        return 1
    fi
    
    # Verify installer integrity if checksums are available
    local checksums_url="https://raw.githubusercontent.com/$GITHUB_REPO/main/checksums.txt"
    if curl -fsSL "$checksums_url" -o "$temp_dir/checksums.txt" 2>/dev/null; then
        log "INFO" "Verifying installer integrity"
        cd "$temp_dir"
        if command -v sha256sum >/dev/null 2>&1; then
            if sha256sum -c checksums.txt 2>/dev/null | grep -q "install.sh: OK"; then
                log "OK" "Integrity verified"
            else
                log "WARN" "Checksum verification failed - proceed with caution"
                if ! confirm "Continue without verification?" "n"; then
                    return 1
                fi
            fi
        elif command -v shasum >/dev/null 2>&1; then
            if shasum -a 256 -c checksums.txt 2>/dev/null | grep -q "install.sh: OK"; then
                log "OK" "Integrity verified"
            fi
        fi
    fi
    
    echo "$temp_dir"
}

preserve_user_data() {
    log "STEP" "Preserving user data and configurations"
    
    # Create temp storage for user data
    local preserve_dir
    preserve_dir=$(mktemp -d "${TMPDIR:-/tmp}/claude-preserve.XXXXXX")
    
    # Preserve memory files
    if [[ -d "$INSTALL_DIR/memories" ]]; then
        cp -r "$INSTALL_DIR/memories" "$preserve_dir/" 2>/dev/null || true
    fi
    
    # Preserve configurations
    if [[ -d "$INSTALL_DIR/config" ]]; then
        cp -r "$INSTALL_DIR/config" "$preserve_dir/" 2>/dev/null || true
    fi
    
    # Preserve logs
    if [[ -d "$INSTALL_DIR/logs" ]]; then
        cp -r "$INSTALL_DIR/logs" "$preserve_dir/" 2>/dev/null || true
    fi
    
    echo "$preserve_dir"
}

restore_user_data() {
    local preserve_dir="$1"
    
    log "STEP" "Restoring user data and configurations"
    
    # Restore memory files
    if [[ -d "$preserve_dir/memories" ]]; then
        mkdir -p "$INSTALL_DIR"
        cp -r "$preserve_dir/memories" "$INSTALL_DIR/" 2>/dev/null || true
    fi
    
    # Restore configurations
    if [[ -d "$preserve_dir/config" ]]; then
        cp -r "$preserve_dir/config" "$INSTALL_DIR/" 2>/dev/null || true
    fi
    
    # Restore logs
    if [[ -d "$preserve_dir/logs" ]]; then
        cp -r "$preserve_dir/logs" "$INSTALL_DIR/" 2>/dev/null || true
    fi
    
    # Clean up
    rm -rf "$preserve_dir"
    
    log "OK" "User data restored"
}

perform_update() {
    local temp_dir="$1"
    
    log "STEP" "Performing update"
    
    # Preserve user data
    local preserve_dir
    preserve_dir=$(preserve_user_data)
    
    # Run the installer
    export UPDATE_MODE="true"
    export CLAUDE_MEMORY_BATCH_MODE="true"
    
    if bash "$temp_dir/install.sh"; then
        log "OK" "Installation completed"
        
        # Restore user data
        restore_user_data "$preserve_dir"
        
        # Apply security hardening if available
        if [[ -f "$INSTALL_DIR/security-hardening.sh" ]]; then
            log "INFO" "Applying security hardening"
            bash "$INSTALL_DIR/security-hardening.sh" >/dev/null 2>&1 || {
                log "WARN" "Security hardening failed - run manually"
            }
        fi
        
        return 0
    else
        log "ERROR" "Installation failed"
        restore_user_data "$preserve_dir"
        return 1
    fi
}

check_for_updates() {
    log "INFO" "Checking for updates"
    
    local current_version
    local latest_version
    
    current_version=$(get_current_version)
    latest_version=$(get_latest_version)
    
    log "INFO" "Current version: $current_version"
    log "INFO" "Latest version: $latest_version"
    
    if version_compare "$current_version" "$latest_version"; then
        log "OK" "Update available: $current_version → $latest_version"
        return 0
    else
        log "INFO" "You have the latest version"
        return 1
    fi
}

# ==============================================================================
# MAIN UPDATE PROCESS
# ==============================================================================

main() {
    # Clear screen and show header
    clear
    echo -e "${BOLD}╭─────────────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}│  Claude Code Branch Memory Manager Updater        │${NC}"
    echo -e "${BOLD}│  Safe update with automatic backup                │${NC}"
    echo -e "${BOLD}╰─────────────────────────────────────────────────────╯${NC}"
    echo ""
    
    # Check for updates
    if ! check_for_updates; then
        echo ""
        log "INFO" "No update needed"
        
        # Ask if user wants to reinstall anyway
        if confirm "Reinstall current version anyway?" "n"; then
            log "INFO" "Proceeding with reinstallation"
        else
            exit 0
        fi
    fi
    
    echo ""
    
    # Show what will happen
    echo "The updater will:"
    echo "  1. Create a backup of your current installation"
    echo "  2. Preserve all your memory files and configurations"
    echo "  3. Download and verify the latest version"
    echo "  4. Install the update"
    echo "  5. Restore your data and apply security hardening"
    echo ""
    
    if ! confirm "Proceed with update?" "y"; then
        log "INFO" "Update cancelled"
        exit 0
    fi
    
    echo ""
    
    # Create backup
    create_backup
    
    # Download update
    local temp_dir
    temp_dir=$(download_update) || {
        log "ERROR" "Failed to download update"
        exit 1
    }
    
    # Perform update
    if perform_update "$temp_dir"; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${GREEN}✓${NC} Update Complete!"
        echo ""
        
        # Show new version
        local new_version
        new_version=$(get_current_version)
        echo "Version: $new_version"
        echo ""
        
        echo "What's preserved:"
        echo "  ✓ All your memory files"
        echo "  ✓ Your configurations"
        echo "  ✓ Your git hooks"
        echo ""
        
        echo "Backup location:"
        echo "  $BACKUP_DIR"
        echo ""
        
        echo "To rollback if needed:"
        echo "  $0 --rollback"
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    else
        log "ERROR" "Update failed"
        echo ""
        
        if confirm "Rollback to previous version?" "y"; then
            rollback_from_backup
        else
            echo ""
            echo "Your backup is preserved at:"
            echo "  $BACKUP_DIR"
            echo ""
            echo "To rollback manually, run:"
            echo "  $0 --rollback"
        fi
        
        exit 1
    fi
}

# ==============================================================================
# COMMAND LINE INTERFACE
# ==============================================================================

case "${1:-}" in
    --check|-c)
        if check_for_updates; then
            echo ""
            echo "To update, run: $0"
        fi
        ;;
        
    --rollback|-r)
        # Find most recent backup
        latest_backup=$(ls -dt "$HOME"/.claude-memory-backup-* 2>/dev/null | head -1)
        if [[ -n "$latest_backup" ]]; then
            BACKUP_DIR="$latest_backup"
            rollback_from_backup
        else
            log "ERROR" "No backup found"
            exit 1
        fi
        ;;
        
    --force|-f)
        export UPDATE_NON_INTERACTIVE="true"
        main
        ;;
        
    --help|-h)
        echo "Claude Code Branch Memory Manager - Update Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --check, -c     Check for updates without installing"
        echo "  --rollback, -r  Rollback to previous version from backup"
        echo "  --force, -f     Force update without prompts"
        echo "  --help, -h      Show this help message"
        echo "  --version, -v   Show current version"
        echo ""
        echo "Examples:"
        echo "  $0              # Interactive update"
        echo "  $0 --check      # Check for updates"
        echo "  $0 --rollback   # Rollback to previous version"
        echo ""
        ;;
        
    --version|-v)
        echo "Update Script Version: $SCRIPT_VERSION"
        echo "Installed Version: $(get_current_version)"
        ;;
        
    *)
        main "$@"
        ;;
esac