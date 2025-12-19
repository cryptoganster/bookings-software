# Husky Pre-Commit Hooks - Maintenance Guide

## Overview

This document provides maintenance procedures for the Husky pre-commit hooks system.

## Regular Maintenance Tasks

### Monthly Tasks

#### 1. Update Dependencies

```bash
# Check for outdated dependencies
pnpm outdated

# Update Husky
pnpm update husky

# Update lint-staged
pnpm update lint-staged

# Update commitlint
pnpm update @commitlint/cli @commitlint/config-conventional

# Test after updates
pnpm lint
pnpm typecheck
git commit -m "chore: update husky dependencies" --allow-empty
```

#### 2. Review Secret Patterns

Review and update secret patterns in `scripts/pre-commit-secrets.sh`:

```bash
# Edit the script
code scripts/pre-commit-secrets.sh

# Common patterns to add:
# - New API key formats
# - New cloud provider credentials
# - New authentication tokens
# - Database connection strings

# Test the updated script
bash scripts/pre-commit-secrets.sh
```

#### 3. Review `.secretsignore`

Check for false positives and update `.secretsignore`:

```bash
# Review current exclusions
cat .secretsignore

# Add new exclusions if needed
echo "path/to/false/positive" >> .secretsignore
```

### Quarterly Tasks

#### 1. Performance Review

```bash
# Measure hook execution time
time git commit -m "test: performance check" --allow-empty

# Target: < 10 seconds
# Current: ~1.5 seconds

# If slow, profile each check:
time bash scripts/pre-commit-filesize.sh
time bash scripts/pre-commit-secrets.sh
time pnpm exec lint-staged
```

#### 2. Review Hook Bypass Usage

```bash
# Search for --no-verify usage in git history
git log --all --grep="--no-verify" --oneline

# If high usage, investigate why developers are bypassing hooks
```

#### 3. Update Documentation

Review and update `.kiro/steering/husky-precommit.md`:
- Add new troubleshooting scenarios
- Update examples
- Add new FAQs
- Update dependency versions

## Adding New Checks

### 1. Create New Script

```bash
# Create script in scripts/ directory
touch scripts/pre-commit-newcheck.sh
chmod +x scripts/pre-commit-newcheck.sh
```

### 2. Script Template

```bash
#!/usr/bin/env bash

# Pre-commit check: [Description]
# Exit codes: 0 = success, 1 = failure

set -e

echo "Running [check name]..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to check"
  exit 0
fi

# Your check logic here
for file in $STAGED_FILES; do
  # Check each file
  if [[ condition ]]; then
    echo "❌ Error in $file: [description]"
    echo "💡 Fix: [suggestion]"
    exit 1
  fi
done

echo "✅ [Check name] passed"
exit 0
```

### 3. Add to Pre-Commit Hook

Edit `.husky/pre-commit`:

```bash
# Add new check
echo "📋 Step X/Y: Running [check name]..."
bash scripts/pre-commit-newcheck.sh
echo ""
```

### 4. Test New Check

```bash
# Test with sample files
git add .
git commit -m "test: new check"

# Verify it works correctly
```

### 5. Document New Check

Update `.kiro/steering/husky-precommit.md`:
- Add to "Pre-Commit Checks" section
- Add troubleshooting section
- Add examples

## Updating Secret Patterns

### Common Secret Patterns

```bash
# AWS Access Key
AKIA[0-9A-Z]{16}

# AWS Secret Key
[0-9a-zA-Z/+=]{40}

# GitHub Token
ghp_[0-9a-zA-Z]{36}

# Slack Token
xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[0-9a-zA-Z]{24,32}

# Stripe API Key
sk_live_[0-9a-zA-Z]{24,}

# JWT Token
eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*

# Private Key
-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----

# Password in URL
[a-zA-Z]{3,10}://[^/\\s:@]{3,20}:[^/\\s:@]{3,20}@.{1,100}
```

### Adding New Pattern

1. Edit `scripts/pre-commit-secrets.sh`
2. Add pattern to the appropriate section
3. Test with sample file:

```bash
# Create test file
echo "AKIA1234567890123456" > test-secret.txt
git add test-secret.txt

# Test detection
bash scripts/pre-commit-secrets.sh

# Should detect the secret
# Clean up
git reset HEAD test-secret.txt
rm test-secret.txt
```

## Troubleshooting Common Issues

### Issue: Hooks Not Running

**Diagnosis:**
```bash
# Check if hooks are installed
ls -la .git/hooks/

# Should see pre-commit and commit-msg
```

**Fix:**
```bash
# Reinstall hooks
pnpm install
```

### Issue: Hooks Running Slowly

**Diagnosis:**
```bash
# Profile each check
time bash scripts/pre-commit-filesize.sh
time bash scripts/pre-commit-secrets.sh
time pnpm exec lint-staged
```

**Fix:**
- Optimize slow scripts
- Reduce number of files checked
- Use caching where possible

### Issue: False Positives in Secret Scanning

**Fix:**
```bash
# Add to .secretsignore
echo "path/to/file" >> .secretsignore
echo "specific-pattern-to-ignore" >> .secretsignore
```

### Issue: Lint-Staged Not Running on Some Files

**Diagnosis:**
```bash
# Check .lintstagedrc.json patterns
cat .lintstagedrc.json

# Test pattern matching
pnpm exec lint-staged --debug
```

**Fix:**
- Update patterns in `.lintstagedrc.json`
- Ensure file extensions are included

## Monitoring

### Metrics to Track

1. **Hook Execution Time**
   - Target: < 10 seconds
   - Current: ~1.5 seconds
   - Track over time

2. **Hook Bypass Rate**
   - Count `--no-verify` usage
   - Investigate if > 5%

3. **False Positive Rate**
   - Track `.secretsignore` additions
   - Review patterns if growing rapidly

4. **Developer Feedback**
   - Survey team quarterly
   - Address pain points

### Logging

Currently, hooks log to stdout/stderr. For production monitoring:

```bash
# Add logging to hooks (future enhancement)
LOG_FILE=".husky/hooks.log"
echo "$(date): Hook executed" >> $LOG_FILE
```

## Backup and Recovery

### Backup Hook Configuration

```bash
# Backup hooks
tar -czf husky-backup-$(date +%Y%m%d).tar.gz .husky/ scripts/ .lintstagedrc.json commitlint.config.js .secretsignore

# Store in safe location
mv husky-backup-*.tar.gz ~/backups/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf husky-backup-YYYYMMDD.tar.gz

# Reinstall hooks
pnpm install
```

## Emergency Procedures

### Disable All Hooks Temporarily

```bash
# Rename hooks directory
mv .husky .husky.disabled

# Re-enable
mv .husky.disabled .husky
```

### Disable Specific Check

Edit `.husky/pre-commit` and comment out the check:

```bash
# # 2. Secret scanning
# echo "🔍 Step 2/3: Scanning for secrets..."
# bash scripts/pre-commit-secrets.sh
# echo ""
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-19 | Initial maintenance guide |

## Contact

For issues or questions:
- GitHub Issues: Create issue with `[husky]` tag
- Team Lead: Direct message
- Slack: #dev-help

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team
