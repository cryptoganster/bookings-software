# Husky Pre-Commit Hooks - Developer Guide

## Quick Start

### Installation

Husky is automatically installed when you run `pnpm install`:

```bash
pnpm install
# Husky hooks are now set up in .git/hooks
```

### Making a Commit

Just commit normally - pre-commit checks run automatically:

```bash
git add .
git commit -m "feat: add new feature"
# Pre-commit hooks run automatically
# If all checks pass → commit succeeds ✅
# If any check fails → commit blocked ❌
```

## Pre-Commit Checks

### 1. ESLint (Linting)

Checks code quality on staged files.

**If it fails:**

```bash
# Auto-fix most issues
pnpm lint:fix

# Or fix manually and retry
git add .
git commit -m "feat: add new feature"
```

### 2. Prettier (Formatting)

Checks code formatting on staged files.

**If it fails:**

```bash
# Auto-format all files
pnpm format

# Or format specific files
pnpm format:backend
pnpm format:frontend

# Then retry
git add .
git commit -m "feat: add new feature"
```

### 3. TypeScript (Type Checking)

Checks for type errors on staged files.

**If it fails:**

```bash
# Fix type errors manually
# Then retry
git add .
git commit -m "feat: add new feature"
```

### 4. Commit Message Validation

Checks commit message format (conventional commits).

**Format:** `<type>: <description>`

**Valid types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Tests
- `docs` - Documentation
- `style` - Code style (formatting)
- `perf` - Performance improvement
- `chore` - Maintenance
- `ci` - CI/CD changes

**Examples:**

```bash
✅ git commit -m "feat: add appointment cancellation"
✅ git commit -m "fix(booking): resolve concurrency issue"
✅ git commit -m "refactor: extract mapper to separate class"
❌ git commit -m "fix bug"
❌ git commit -m "changes"
```

### 5. Secret Scanning

Detects potential secrets (API keys, passwords) in staged files.

**If it fails:**

```bash
# Remove the secret from the file
# Then retry
git add .
git commit -m "feat: add new feature"
```

### 6. File Size Limits

Prevents files larger than 5MB from being committed.

**If it fails:**

```bash
# Option 1: Remove the large file
git reset HEAD large-file.bin
rm large-file.bin

# Option 2: Use Git LFS for large files
git lfs track "*.bin"
git add .gitattributes
git add large-file.bin
git commit -m "chore: add large file with LFS"
```

## Troubleshooting

### "Pre-commit hook failed"

**Step 1:** Read the error message carefully

```
❌ ESLint Error in src/booking/domain/aggregates/appointment.ts:42
   Unexpected var, use let or const instead
```

**Step 2:** Fix the issue

```bash
# Edit the file and fix the error
# Or use auto-fix
pnpm lint:fix
```

**Step 3:** Retry the commit

```bash
git add .
git commit -m "feat: add new feature"
```

### "Commit message validation failed"

**Error:**

```
❌ Commit message validation failed
   Current: "fix bug in appointment"
   Expected format: "<type>: <description>"
```

**Fix:**

```bash
# Use git commit --amend to fix the message
git commit --amend -m "fix(booking): resolve appointment issue"
```

### "Potential secret detected"

**Error:**

```
❌ Potential secret detected in .env.local
   Pattern: "AKIA[0-9A-Z]{16}" (AWS Access Key)
```

**Fix:**

```bash
# Remove the secret from the file
# Use environment variables instead
# Then retry
git add .
git commit -m "feat: add new feature"
```

### "File too large"

**Error:**

```
❌ File too large: dist/main.js (12.5MB)
   Maximum allowed: 5MB
```

**Fix:**

```bash
# Option 1: Remove from staging
git reset HEAD dist/main.js

# Option 2: Add to .gitignore
echo "dist/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore dist folder"
```

## Bypassing Hooks (Emergency Only)

If you absolutely must bypass hooks:

```bash
git commit --no-verify -m "feat: emergency fix"
```

**⚠️ WARNING:**

- Use only in emergencies
- CI/CD will still validate your code
- Document why you bypassed hooks
- Notify your team

## Performance

Pre-commit hooks should complete in **< 10 seconds** for typical commits.

**If hooks are slow:**

1. Check which check is slow (watch the progress messages)
2. Report to team lead
3. We can optimize that specific check

## Monorepo Behavior

### Backend Changes Only

```bash
git add apps/backend/src/booking/...
git commit -m "feat(booking): add appointment"
# Only backend checks run
# Frontend checks are skipped
```

### Frontend Changes Only

```bash
git add apps/frontend/src/features/...
git commit -m "feat(auth): add login form"
# Only frontend checks run
# Backend checks are skipped
```

### Both Backend and Frontend

```bash
git add apps/backend/src/...
git add apps/frontend/src/...
git commit -m "feat: add new feature"
# Both backend and frontend checks run
```

## Common Issues

### Issue: "lint-staged not found"

**Solution:**

```bash
pnpm install
```

### Issue: "commitlint not found"

**Solution:**

```bash
pnpm install
```

### Issue: Hooks not running

**Solution:**

```bash
# Reinstall Husky
pnpm install
# Or manually set up hooks
pnpm exec husky install
```

### Issue: "Permission denied" on hook script

**Solution:**

```bash
# Make hook executable
chmod +x .husky/pre-commit
```

## Configuration

### Lint-Staged Configuration

File: `.lintstagedrc.json`

Defines which linters run on which file types.

### Commit Message Rules

File: `commitlint.config.js`

Defines valid commit message formats.

### Secret Patterns

File: `.secretsignore`

Lists false positives to ignore in secret scanning.

## Getting Help

### Documentation

- See `.kiro/steering/husky-precommit.md` (this file)
- See `.kiro/specs/husky-precommit-hooks/` for detailed spec

### Common Fixes

1. **Linting errors:** `pnpm lint:fix`
2. **Formatting errors:** `pnpm format`
3. **Type errors:** Fix manually
4. **Commit message:** `git commit --amend -m "..."`
5. **Secrets:** Remove from file

### Ask for Help

- Slack: #dev-help
- GitHub Issues: Create issue with `[husky]` tag
- Team Lead: Direct message

## Best Practices

✅ **Do:**

- Fix issues locally before pushing
- Use auto-fix commands when available
- Write clear commit messages
- Keep commits focused and small
- Review error messages carefully

❌ **Don't:**

- Use `--no-verify` casually
- Commit secrets or credentials
- Commit large files (> 5MB)
- Ignore linting errors
- Write vague commit messages

## Useful Commands

```bash
# Format all code
pnpm format

# Format backend only
pnpm format:backend

# Format frontend only
pnpm format:frontend

# Lint all code
pnpm lint

# Lint and fix
pnpm lint:fix

# Type check
pnpm typecheck

# Run all checks (like pre-commit)
pnpm pre-commit:check

# Bypass hooks (emergency only)
git commit --no-verify -m "..."

# Reinstall hooks
pnpm exec husky install
```

## FAQ

**Q: Why are my hooks not running?**
A: Run `pnpm install` to set up Husky.

**Q: Can I disable hooks?**
A: Not recommended, but you can use `--no-verify` (emergency only).

**Q: Why is my commit blocked?**
A: Read the error message - it tells you exactly what to fix.

**Q: How do I fix formatting errors?**
A: Run `pnpm format` to auto-fix most issues.

**Q: How do I fix linting errors?**
A: Run `pnpm lint:fix` to auto-fix, or fix manually.

**Q: How do I fix type errors?**
A: Fix manually - TypeScript errors require code changes.

**Q: How do I fix commit message errors?**
A: Use `git commit --amend -m "correct message"`.

**Q: How do I commit large files?**
A: Use Git LFS: `git lfs track "*.bin"`.

**Q: How do I commit secrets?**
A: Don't! Remove them and use environment variables.

**Q: How long should pre-commit take?**
A: < 10 seconds for typical commits.

**Q: What if I'm in a hurry?**
A: Fix the issues - it's faster than dealing with CI failures later.

---

**Last Updated:** December 18, 2025  
**Version:** 1.0  
**Status:** Active
