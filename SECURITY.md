# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Full support    |
| 1.x.x   | ⚠️ Security fixes only |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow responsible disclosure:

### 🔒 Private Reporting

**For security issues, do NOT create a public GitHub issue.**

Instead, please report security vulnerabilities to:
- **Email**: security@claude-memory.dev
- **Subject**: `[SECURITY] Brief description of issue`

### 📋 What to Include

Please include as much information as possible:

1. **Description**: Clear description of the vulnerability
2. **Impact**: What could an attacker accomplish?
3. **Reproduction**: Step-by-step instructions to reproduce
4. **Environment**: OS, bash version, git version
5. **Proof of Concept**: If applicable (avoid destructive examples)

### Example Report
```
Subject: [SECURITY] Command injection in branch name handling

Description:
The branch name sanitization function may allow command injection 
when processing specially crafted branch names.

Impact:
An attacker could potentially execute arbitrary commands if they can 
control git branch names in a repository.

Reproduction Steps:
1. Create branch with name: `test"; rm -rf /tmp/test; echo "`
2. Run: branch-memory switch 'test"; rm -rf /tmp/test; echo "'
3. Command injection occurs during branch name processing

Environment:
- OS: Ubuntu 20.04
- Bash: 4.4.20
- Git: 2.25.1
- Tool Version: 2.0.0

Proof of Concept:
Created test repository with malicious branch name (non-destructive test)
```

## 🕐 Response Timeline

| Action | Timeline |
|--------|----------|
| **Initial Response** | Within 24 hours |
| **Triage and Assessment** | Within 72 hours |
| **Status Update** | Weekly until resolved |
| **Fix Development** | Depends on severity |
| **Security Release** | ASAP after fix validation |

## 🛡️ Security Measures

### Code Security

**Input Validation**:
- All user inputs are validated and sanitized
- Branch names are sanitized to prevent injection
- File paths are validated to prevent directory traversal
- Configuration values are validated against schemas

**Safe Operations**:
- No operations require elevated privileges
- All file operations use safe paths
- Temporary files use secure creation methods
- Sensitive operations have confirmation prompts

**Error Handling**:
- Errors don't expose sensitive information
- Stack traces are limited in production mode
- Debug information is controlled and safe

### Installation Security

**Installer Safety**:
- Never requires root/sudo privileges
- Validates all downloads and checksums
- Creates backups before making changes
- Can be run in non-interactive mode for automation

**Network Security**:
- Uses HTTPS for all network operations
- Validates TLS certificates
- No sensitive data transmitted
- Optional telemetry is clearly disclosed

### Runtime Security

**File System Access**:
- Only accesses files within git repositories
- Respects git ignore patterns
- Creates files with secure permissions
- Never modifies system files

**Git Integration**:
- Uses standard git commands only
- Doesn't modify git configuration without permission
- Respects existing git hooks
- Safe operation in CI/CD environments

## 🔍 Security Auditing

### Regular Audits
- Automated security scanning in CI/CD
- Dependency vulnerability scanning
- Code analysis with static analysis tools
- Regular manual security reviews

### Community Auditing
- Code is open source for community review
- Security researchers are welcomed
- Bug bounty program (future consideration)

## 📊 Vulnerability Disclosure

### Public Disclosure Process

1. **Fix Development**: Develop and test fix privately
2. **Security Release**: Release fix without detailed vulnerability info
3. **User Notification**: Notify users to update
4. **CVE Assignment**: Request CVE if applicable (high severity)
5. **Public Disclosure**: Full details after users have time to update

### Disclosure Timeline
- **Low Severity**: 90 days after fix release
- **Medium Severity**: 60 days after fix release  
- **High Severity**: 30 days after fix release
- **Critical Severity**: 14 days after fix release

## 🎖️ Security Hall of Fame

We recognize security researchers who help improve our security:

| Reporter | Date | Severity | Description |
|----------|------|----------|-------------|
| *None yet* | - | - | *Be the first to help us improve security!* |

## 📝 Security Advisories

Security advisories are published on:
- [GitHub Security Advisories](https://github.com/your-username/claude-code-branch-memory/security/advisories)
- Project documentation
- Release notes

## 🛠️ Security Tools

### For Users
```bash
# Check for security updates
branch-memory health

# Verify installation integrity
branch-memory diagnose

# Run in safe mode
branch-memory config set safe_mode true
```

### For Developers
```bash
# Security testing
./tests/test-runner.sh security

# Static analysis
shellcheck src/**/*.sh

# Dependency audit
# (when we add dependencies)
```

## 🤝 Coordinated Disclosure

We work with:
- **CVE coordinators** for vulnerability assignment
- **Distribution maintainers** for coordinated fixes
- **Security research community** for responsible disclosure

## 📞 Contact

- **Security Email**: security@claude-memory.dev
- **GPG Key**: Available on request
- **Response Time**: 24 hours for security issues

---

**Thank you for helping keep Claude Code Branch Memory Manager secure! 🛡️**