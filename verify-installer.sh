#!/bin/bash
# Claude Code Branch Memory Manager - Installer Verification
# Verifies integrity and authenticity of the installer before execution

set -euo pipefail

# Configuration
readonly REPO="Davidcreador/claude-code-branch-memory-manager"
readonly INSTALLER_URL="https://raw.githubusercontent.com/$REPO/main/install.sh"
readonly CHECKSUMS_URL="https://raw.githubusercontent.com/$REPO/main/checksums.txt"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Functions
log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Main verification process
main() {
    echo "Claude Code Branch Memory Manager - Secure Installation"
    echo "========================================================"
    echo ""
    
    # Create secure temp directory
    local temp_dir
    temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/claude-verify.XXXXXX") || {
        log_error "Failed to create secure temporary directory"
        exit 1
    }
    trap 'rm -rf "$temp_dir"' EXIT INT TERM
    
    # Download installer
    log_warning "Downloading installer..."
    if ! curl -fsSL "$INSTALLER_URL" -o "$temp_dir/install.sh" 2>/dev/null; then
        log_error "Failed to download installer"
        exit 1
    fi
    log_success "Installer downloaded"
    
    # Download checksums
    log_warning "Downloading checksums..."
    if curl -fsSL "$CHECKSUMS_URL" -o "$temp_dir/checksums.txt" 2>/dev/null; then
        log_success "Checksums downloaded"
        
        # Verify checksum
        log_warning "Verifying integrity..."
        cd "$temp_dir"
        if command -v sha256sum >/dev/null 2>&1; then
            if sha256sum -c checksums.txt 2>/dev/null | grep -q "install.sh: OK"; then
                log_success "Integrity verified with SHA256"
            else
                log_error "Checksum verification failed!"
                echo ""
                echo "This could mean:"
                echo "  1. The file was corrupted during download"
                echo "  2. The file has been tampered with"
                echo "  3. You're experiencing a MITM attack"
                echo ""
                echo "DO NOT run the installer. Report this issue at:"
                echo "https://github.com/$REPO/issues"
                exit 1
            fi
        elif command -v shasum >/dev/null 2>&1; then
            if shasum -a 256 -c checksums.txt 2>/dev/null | grep -q "install.sh: OK"; then
                log_success "Integrity verified with SHA256"
            else
                log_error "Checksum verification failed!"
                exit 1
            fi
        else
            log_warning "No SHA256 tool available, skipping integrity check"
        fi
    else
        log_warning "Checksums not available, proceeding without verification"
        log_warning "For maximum security, verify manually at:"
        echo "    https://github.com/$REPO"
    fi
    
    # Security checks on installer content
    log_warning "Performing security analysis..."
    
    # Check for dangerous commands
    local dangerous_patterns=(
        "rm -rf /"
        "dd if=/dev/zero"
        "chmod 777"
        "curl.*|.*sh"
        "wget.*|.*sh"
        "> /dev/sda"
        "mkfs"
        ":(){ :|:& };:"
    )
    
    local issues_found=0
    for pattern in "${dangerous_patterns[@]}"; do
        if grep -q "$pattern" "$temp_dir/install.sh" 2>/dev/null; then
            log_warning "Found potentially dangerous pattern: $pattern"
            ((issues_found++))
        fi
    done
    
    if [[ $issues_found -gt 0 ]]; then
        log_warning "Found $issues_found potential security concerns"
        echo ""
        read -p "Do you want to review the installer before running? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            less "$temp_dir/install.sh"
        fi
    else
        log_success "Security analysis passed"
    fi
    
    # Final confirmation
    echo ""
    echo "Ready to install Claude Code Branch Memory Manager"
    echo ""
    read -p "Proceed with installation? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_success "Starting installation..."
        echo ""
        bash "$temp_dir/install.sh"
    else
        log_warning "Installation cancelled"
        exit 0
    fi
}

# Run main function
main "$@"