#!/bin/bash
# Claude Code Branch Memory Manager - Universal Installer
# One-line installation for the professional memory management system

# ==============================================================================
# INSTALLER CONFIGURATION
# ==============================================================================

readonly INSTALLER_VERSION="2.0.0"
readonly INSTALLER_NAME="Claude Code Branch Memory Manager"
readonly GITHUB_REPO="Davidcreador/claude-code-branch-memory-manager"
readonly DOWNLOAD_URL="https://github.com/$GITHUB_REPO/archive/main.tar.gz"

# Installation paths
readonly INSTALL_DIR="${HOME}/.claude-memory"
readonly BIN_DIR="${HOME}/bin"
readonly GIT_TEMPLATE_DIR="${HOME}/.git-templates"

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

# Colors for output
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly BOLD='\033[1m'
    readonly NC='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' NC=''
fi

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

# Check if we're in non-interactive mode
is_non_interactive() {
    [[ "${CLAUDE_MEMORY_BATCH_MODE:-false}" == "true" ]] || [[ ! -t 0 ]]
}

# User confirmation
confirm() {
    local question="$1"
    local default="${2:-n}"
    
    # Convert to lowercase for comparison (bash 3.2 compatible)
    local default_lower
    default_lower=$(echo "$default" | tr '[:upper:]' '[:lower:]')
    
    if is_non_interactive; then
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
# SYSTEM VALIDATION
# ==============================================================================

validate_system() {
    log "STEP" "Validating system requirements"
    
    local errors=()
    
    # Check bash version
    local bash_major="${BASH_VERSION%%.*}"
    if [[ $bash_major -ge 3 ]]; then
        log "OK" "Bash version supported: ${BASH_VERSION:-unknown}"
    else
        errors+=("Bash 3.0+ required (current: ${BASH_VERSION:-unknown})")
    fi
    
    # Check required commands
    local required_commands=("git" "mkdir" "cp" "mv" "rm" "chmod")
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            log "OK" "Required command available: $cmd"
        else
            errors+=("Required command not found: $cmd")
        fi
    done
    
    # Check git
    if command -v git >/dev/null 2>&1; then
        local git_version
        git_version=$(git --version | grep -o '[0-9]\+\.[0-9]\+' | head -1 || echo "unknown")
        log "OK" "Git version: $git_version"
    else
        errors+=("Git is required but not installed")
    fi
    
    # Check disk space (50MB minimum)
    local available_space
    case "$(uname -s)" in
        Darwin*) available_space=$(df -m "$HOME" | awk 'NR==2 {print $4}' || echo "0") ;;
        Linux*)  available_space=$(df -m "$HOME" | awk 'NR==2 {print $4}' || echo "0") ;;
        *)       available_space="100" ;;  # Assume sufficient for unknown platforms
    esac
    
    if [[ $available_space -ge 50 ]]; then
        log "OK" "Sufficient disk space: ${available_space}MB"
    else
        errors+=("Insufficient disk space: ${available_space}MB (minimum: 50MB)")
    fi
    
    # Check write permissions
    if [[ -w "$HOME" ]]; then
        log "OK" "Home directory is writable"
    else
        errors+=("Cannot write to home directory: $HOME")
    fi
    
    # Report validation results
    if [[ ${#errors[@]} -eq 0 ]]; then
        log "OK" "System validation passed"
        return 0
    else
        log "ERROR" "System validation failed:"
        for error in "${errors[@]}"; do
            echo "   • $error"
        done
        echo ""
        log "ERROR" "Please fix the above issues and try again"
        exit 1
    fi
}

# ==============================================================================
# INSTALLATION FUNCTIONS
# ==============================================================================

# Download and extract files
download_files() {
    log "STEP" "Downloading installation files"
    
    local temp_dir
    temp_dir=$(mktemp -d 2>/dev/null || mktemp -d -t 'claude-memory')
    
    # Try different download methods
    if command -v curl >/dev/null 2>&1; then
        if curl -fsSL "$DOWNLOAD_URL" -o "$temp_dir/archive.tar.gz" 2>/dev/null; then
            if tar -xzf "$temp_dir/archive.tar.gz" -C "$temp_dir" 2>/dev/null; then
                # Find the extracted directory (GitHub adds a prefix)
                local extracted_dir
                extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "claude-code-branch-memory-manager-*" | head -1)
                if [[ -n "$extracted_dir" ]]; then
                    log "OK" "Downloaded using curl"
                    echo "$extracted_dir"
                    return 0
                fi
            fi
        fi
    fi
    
    if command -v wget >/dev/null 2>&1; then
        if wget -q "$DOWNLOAD_URL" -O "$temp_dir/archive.tar.gz" 2>/dev/null; then
            if tar -xzf "$temp_dir/archive.tar.gz" -C "$temp_dir" 2>/dev/null; then
                # Find the extracted directory (GitHub adds a prefix)
                local extracted_dir
                extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "claude-code-branch-memory-manager-*" | head -1)
                if [[ -n "$extracted_dir" ]]; then
                    log "OK" "Downloaded using wget"
                    echo "$extracted_dir"
                    return 0
                fi
            fi
        fi
    fi
    
    if command -v git >/dev/null 2>&1; then
        if git clone --depth=1 "https://github.com/$GITHUB_REPO.git" "$temp_dir" 2>/dev/null; then
            log "OK" "Downloaded using git"
            echo "$temp_dir"
            return 0
        fi
    fi
    
    log "ERROR" "Failed to download installation files"
    log "ERROR" "Please check your internet connection and try again"
    rm -rf "$temp_dir"
    exit 1
}

# Install core system
install_system() {
    local source_dir="$1"
    
    log "STEP" "Installing core system"
    
    # Create directories
    mkdir -p "$INSTALL_DIR"/{lib,hooks,bin,config,docs,logs,tmp}
    mkdir -p "$BIN_DIR"
    mkdir -p "$GIT_TEMPLATE_DIR/hooks"
    
    # Copy source files
    cp "$source_dir/src/bin/branch-memory" "$BIN_DIR/"
    cp "$source_dir/src/bin/branch-memory" "$INSTALL_DIR/bin/"
    chmod +x "$BIN_DIR/branch-memory" "$INSTALL_DIR/bin/branch-memory"
    
    # Copy libraries
    if [[ -d "$source_dir/src/lib" ]]; then
        cp "$source_dir/src/lib/"* "$INSTALL_DIR/lib/" 2>/dev/null || true
    fi
    
    # Copy hooks
    cp "$source_dir/src/hooks/"* "$INSTALL_DIR/hooks/"
    cp "$source_dir/src/hooks/"* "$GIT_TEMPLATE_DIR/hooks/"
    chmod +x "$INSTALL_DIR/hooks/"* "$GIT_TEMPLATE_DIR/hooks/"*
    
    # Copy documentation
    if [[ -d "$source_dir/docs" ]]; then
        cp -r "$source_dir/docs/"* "$INSTALL_DIR/docs/" 2>/dev/null || true
    fi
    
    # Copy completions
    if [[ -d "$source_dir/src/completions" ]]; then
        mkdir -p "$INSTALL_DIR/completions"
        cp "$source_dir/src/completions/"* "$INSTALL_DIR/completions/" 2>/dev/null || true
    fi
    
    log "OK" "Core system installed"
}

# Configure git integration
configure_git() {
    log "STEP" "Configuring git integration"
    
    # Set git template directory
    if git config --global init.templatedir "$GIT_TEMPLATE_DIR" 2>/dev/null; then
        log "OK" "Git template directory configured"
    else
        log "WARN" "Failed to configure git template directory"
    fi
    
    # Install hooks in current repository if we're in one
    if git rev-parse --git-dir >/dev/null 2>&1; then
        local repo_name
        repo_name=$(basename "$(pwd)")
        
        if confirm "Install hooks in current repository '$repo_name'?" "y"; then
            if "$BIN_DIR/branch-memory" hooks install >/dev/null 2>&1; then
                log "OK" "Hooks installed in repository: $repo_name"
            else
                log "WARN" "Failed to install hooks (can install later with: branch-memory hooks install)"
            fi
        fi
    fi
}

# Set up shell integration
setup_shell() {
    log "STEP" "Setting up shell integration"
    
    # Check if ~/bin is in PATH
    if [[ ":$PATH:" == *":$BIN_DIR:"* ]]; then
        log "OK" "~/bin is already in PATH"
    else
        log "WARN" "~/bin is not in PATH"
        
        local shell_config=""
        case "$(basename "${SHELL:-bash}")" in
            bash)
                shell_config="${HOME}/.bashrc"
                [[ -f "${HOME}/.bash_profile" ]] && shell_config="${HOME}/.bash_profile"
                ;;
            zsh)
                shell_config="${HOME}/.zshrc"
                ;;
            fish)
                shell_config="${HOME}/.config/fish/config.fish"
                ;;
        esac
        
        if [[ -n "$shell_config" ]] && confirm "Add ~/bin to PATH in $shell_config?" "y"; then
            echo "" >> "$shell_config"
            echo "# Added by Claude Memory Manager installer" >> "$shell_config"
            case "$(basename "${SHELL:-bash}")" in
                fish)
                    echo "fish_add_path ~/bin" >> "$shell_config"
                    ;;
                *)
                    echo 'export PATH="$HOME/bin:$PATH"' >> "$shell_config"
                    ;;
            esac
            log "OK" "Added ~/bin to PATH"
            log "INFO" "Restart your terminal or run: source $shell_config"
        else
            log "INFO" "To use branch-memory globally, add ~/bin to your PATH"
        fi
    fi
}

# Run post-installation tests
test_installation() {
    log "STEP" "Testing installation"
    
    local test_errors=()
    
    # Test command availability
    if command -v branch-memory >/dev/null 2>&1; then
        log "OK" "branch-memory command is available"
    else
        if [[ -x "$BIN_DIR/branch-memory" ]]; then
            log "WARN" "branch-memory installed but not in PATH"
        else
            test_errors+=("branch-memory command not available")
        fi
    fi
    
    # Test basic functionality
    if "$BIN_DIR/branch-memory" version >/dev/null 2>&1; then
        log "OK" "Basic functionality test passed"
    else
        test_errors+=("Basic functionality test failed")
    fi
    
    # Test git repository integration if available
    if git rev-parse --git-dir >/dev/null 2>&1; then
        if "$BIN_DIR/branch-memory" status >/dev/null 2>&1; then
            log "OK" "Git repository integration test passed"
        else
            test_errors+=("Git repository integration test failed")
        fi
    fi
    
    if [[ ${#test_errors[@]} -eq 0 ]]; then
        log "OK" "All installation tests passed"
        return 0
    else
        log "ERROR" "Installation tests failed:"
        for error in "${test_errors[@]}"; do
            echo "   • $error"
        done
        return 1
    fi
}

# ==============================================================================
# MAIN INSTALLATION
# ==============================================================================

print_header() {
    clear
    echo -e "${BOLD}${BLUE}╭─────────────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}${BLUE}│  Claude Code Branch Memory Manager Installer      │${NC}"
    echo -e "${BOLD}${BLUE}│  Professional Edition v$INSTALLER_VERSION                    │${NC}"
    echo -e "${BOLD}${BLUE}╰─────────────────────────────────────────────────────╯${NC}"
    echo ""
    echo "This installer will set up automatic branch-specific memory management"
    echo "for Claude Code. Your CLAUDE.md files will automatically switch when"
    echo "you change git branches."
    echo ""
}

show_success() {
    echo ""
    echo -e "${BOLD}${GREEN}🎉 Installation Complete!${NC}"
    echo ""
    echo -e "${BOLD}What was installed:${NC}"
    echo "  ✓ Claude Memory Manager in $INSTALL_DIR"
    echo "  ✓ Git hooks for automatic memory switching"
    echo "  ✓ branch-memory command in $BIN_DIR"
    echo "  ✓ Documentation and support files"
    echo ""
    echo -e "${BOLD}Quick Start:${NC}"
    echo "  # Check installation"
    echo "  branch-memory --version"
    echo ""
    echo "  # Save current work"
    echo '  echo "# My project work" > CLAUDE.md'
    echo '  branch-memory save "Initial setup"'
    echo ""
    echo "  # Test branch switching"
    echo "  git checkout -b test-branch"
    echo "  # Memory automatically switches!"
    echo ""
    echo -e "${BOLD}Documentation:${NC}"
    echo "  Quick Start: $INSTALL_DIR/docs/quick-start.md"
    echo "  User Guide:  $INSTALL_DIR/docs/user-guide.md"
    echo "  Support:     https://github.com/$GITHUB_REPO/issues"
    echo ""
    
    if git rev-parse --git-dir >/dev/null 2>&1; then
        echo -e "${GREEN}🚀 Git hooks are active in this repository!${NC}"
        echo "Your memory will automatically switch when you change branches."
    else
        echo -e "${BLUE}💡 For git repositories: cd /path/to/repo && branch-memory hooks install${NC}"
    fi
    
    echo ""
    echo "Happy coding with Claude! 🎊"
}

# Main installation function
install() {
    local start_time
    start_time=$(date +%s)
    
    print_header
    
    # Validate system
    validate_system
    
    # Download files
    local temp_dir
    temp_dir=$(download_files)
    
    # Install system
    install_system "$temp_dir"
    
    # Configure git
    configure_git
    
    # Setup shell
    setup_shell
    
    # Test installation
    if test_installation; then
        # Cleanup
        rm -rf "$temp_dir"
        
        # Show success
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        show_success
        echo -e "${CYAN}Installation completed in ${duration}s${NC}"
    else
        log "ERROR" "Installation completed but tests failed"
        log "INFO" "Try running: branch-memory health"
        exit 1
    fi
}

# ==============================================================================
# COMMAND LINE INTERFACE
# ==============================================================================

show_help() {
    cat << EOF
Claude Code Branch Memory Manager Installer

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --help, -h     Show this help message
    --batch        Non-interactive installation
    --debug        Enable debug output

EXAMPLES:
    # Standard installation
    $0

    # Non-interactive (for automation)
    CLAUDE_MEMORY_BATCH_MODE=true $0

    # One-line installation
    curl -fsSL https://raw.githubusercontent.com/$GITHUB_REPO/main/install.sh | bash

ABOUT:
    Claude Code Branch Memory Manager automatically manages branch-specific
    CLAUDE.md files, so Claude always has the right context for your current
    work. Switch branches seamlessly without losing development context.

SUPPORT:
    Repository: https://github.com/$GITHUB_REPO
    Issues:     https://github.com/$GITHUB_REPO/issues
    
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --batch)
            export CLAUDE_MEMORY_BATCH_MODE=true
            shift
            ;;
        --debug)
            set -x
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
if ! install; then
    log "ERROR" "Installation failed"
    exit 1
fi