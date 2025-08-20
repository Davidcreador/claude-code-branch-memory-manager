# Contributing to Claude Code Branch Memory Manager

Thank you for your interest in contributing! This project thrives on community contributions, and we welcome developers of all skill levels.

## 🎯 Ways to Contribute

### 🐛 Report Bugs
- Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include system information and steps to reproduce
- Check existing issues to avoid duplicates

### 💡 Suggest Features
- Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the use case and expected behavior
- Consider implementation challenges

### 📖 Improve Documentation
- Fix typos and unclear explanations
- Add examples and use cases
- Translate documentation (future)

### 🔧 Submit Code
- Bug fixes
- Feature implementations
- Performance improvements
- Cross-platform compatibility

### 🧪 Testing
- Test on different platforms
- Report compatibility issues
- Add test cases

## 🚀 Development Setup

### Prerequisites
- **OS**: macOS 10.12+ or Linux (Ubuntu 16.04+)
- **Shell**: Bash 4.0+ (for development)
- **Git**: Version 2.0+
- **Tools**: ShellCheck for linting

### Quick Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-code-branch-memory.git
cd claude-code-branch-memory

# 3. Run development setup
./scripts/dev-setup.sh

# 4. Install the development version
./install.sh

# 5. Run tests to verify setup
./tests/test-runner.sh
```

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes
# Edit files in src/

# 3. Test your changes
./tests/test-runner.sh
shellcheck src/**/*.sh

# 4. Test installation
./install.sh --test

# 5. Commit with conventional commits
git commit -m "feat: add new memory compression feature"

# 6. Push and create pull request
git push origin feature/your-feature-name
```

## 📋 Code Standards

### Shell Script Guidelines

**1. Use ShellCheck**
```bash
# Lint all scripts
find src/ -name "*.sh" | xargs shellcheck
```

**2. Error Handling**
```bash
# Always use strict error handling
set -euo pipefail

# Handle errors gracefully
if ! some_command; then
    log_error "Command failed, attempting recovery"
    return 1
fi
```

**3. Function Documentation**
```bash
# Document complex functions
# Creates backup of memory file with timestamp
# Args:
#   $1 - reason for backup (string)
# Returns:
#   0 on success, 1 on failure
# Outputs:
#   backup file path on success
backup_memory_file() {
    local reason="$1"
    # ... implementation
}
```

**4. Compatibility**
```bash
# Support bash 3.2+ by avoiding advanced features
# Use POSIX-compliant patterns when possible
# Test on both macOS (bash 3.2) and Linux (bash 4.0+)

# Good - compatible
local files
files=$(find . -name "*.md")

# Avoid - bash 4.0+ only  
local files
readarray -t files < <(find . -name "*.md")
```

### Commit Message Format

We use [Conventional Commits](https://conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat: add memory compression for storage optimization
fix: resolve hook timeout on large repositories  
docs: update installation guide with troubleshooting section
test: add integration tests for multi-repository workflow
```

## 🧪 Testing Requirements

### Before Submitting
```bash
# 1. Run full test suite
./tests/test-runner.sh

# 2. Test on your platform
./tests/test-runner.sh component all

# 3. Run linting
shellcheck src/**/*.sh

# 4. Test installation process
./install.sh --test

# 5. Performance benchmarks (for performance changes)
./benchmarks/run-benchmarks.sh
```

### Writing Tests

**Unit Tests**:
```bash
# Test individual functions
test_memory_save_functionality() {
    setup_test_environment
    
    echo "# Test content" > CLAUDE.md
    assert_true "save_branch_memory 'main' 'Test save'" "Can save branch memory"
    assert_file_exists ".claude/memories/main.md" "Memory file created"
    
    teardown_test_environment
}
```

**Integration Tests**:
```bash
# Test complete workflows
test_branch_switching_workflow() {
    setup_git_repository
    
    # Test complete branch switching workflow
    create_memory_content "main" "Main branch work"
    git checkout -b feature/test
    assert_memory_contains "feature/test" "automatically created"
    
    cleanup_test_repository
}
```

### Platform Testing

**Required Platforms**:
- macOS 12+ (bash 3.2, 5.0)
- Ubuntu 20.04+ (bash 4.4+)
- CentOS 8+ (bash 4.4+)

**Testing Matrix**:
```bash
# Test compatibility mode
BASH_VERSION=3.2 ./tests/test-runner.sh

# Test full feature mode  
BASH_VERSION=5.1 ./tests/test-runner.sh

# Test installation methods
TEST_INSTALL_METHOD=curl ./tests/test-installation.sh
TEST_INSTALL_METHOD=wget ./tests/test-installation.sh
```

## 📬 Pull Request Process

### Before Submitting

1. **Check Requirements**:
   - [ ] All tests pass locally
   - [ ] ShellCheck passes without errors
   - [ ] Documentation updated if needed
   - [ ] CHANGELOG.md updated for user-facing changes

2. **Test Checklist**:
   - [ ] Tested on macOS and Linux
   - [ ] Tested with bash 3.2 and 4.0+
   - [ ] Installation process works
   - [ ] No breaking changes to existing workflows

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] All existing tests pass
- [ ] Added tests for new functionality
- [ ] Tested on multiple platforms
- [ ] Installation process tested

## Screenshots/Examples
If applicable, add screenshots or examples of the change.
```

### Review Process

1. **Automated Checks**: GitHub Actions run automatically
2. **Maintainer Review**: Core team reviews code and design
3. **Community Feedback**: Community members can provide input
4. **Testing**: Additional testing if needed
5. **Merge**: Approved changes are merged

## 🎖️ Recognition

Contributors are recognized in:
- CHANGELOG.md for each release
- GitHub contributors list
- Optional mention in release announcements

## 📞 Getting Help

### Questions?
- **Discussions**: [GitHub Discussions](https://github.com/your-username/claude-code-branch-memory/discussions)
- **Chat**: Join our community Discord (link in README)
- **Email**: maintainers@claude-memory.dev

### Development Issues?
- **Bugs**: [Create an issue](https://github.com/your-username/claude-code-branch-memory/issues/new/choose)
- **Feature Ideas**: [Feature request](https://github.com/your-username/claude-code-branch-memory/issues/new/choose)

## 🏗️ Project Structure

```
claude-code-branch-memory/
├── src/                        # Source code
│   ├── lib/                   # Core libraries  
│   ├── hooks/                 # Git hook templates
│   ├── bin/                   # Executable scripts
│   └── completions/           # Shell completions
├── tests/                     # Test suite
├── docs/                      # Documentation
├── examples/                  # Usage examples
├── scripts/                   # Development scripts
└── benchmarks/                # Performance benchmarks
```

### Key Files

- **`src/lib/core.sh`**: Main memory management logic
- **`src/hooks/post-checkout`**: Automatic branch switching
- **`src/bin/branch-memory`**: Main CLI utility
- **`install.sh`**: Universal installer
- **`tests/test-runner.sh`**: Comprehensive test suite

## 🔄 Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Breaking changes increment MAJOR
- New features increment MINOR  
- Bug fixes increment PATCH

### Release Checklist
1. Update version numbers in all files
2. Update CHANGELOG.md with changes
3. Run full test suite on all platforms
4. Create release notes
5. Tag release and publish

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

**Thank you for contributing to Claude Code Branch Memory Manager! 🚀**

Your contributions help thousands of developers have better coding experiences with Claude Code.