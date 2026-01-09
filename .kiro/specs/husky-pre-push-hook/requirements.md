# Pre-Push Hook - Requirements

## Overview

Implement a Husky pre-push hook that runs all backend and frontend tests before allowing a push to the remote repository. This ensures code quality and prevents broken code from being pushed.

## User Story

**As a** developer  
**I want** all tests to run automatically before pushing code  
**So that** I can catch bugs early and maintain code quality in the remote repository

## Current State

### Existing Husky Hooks

1. **pre-commit** (`.husky/pre-commit`)
   - Runs file size checks
   - Runs secret scanning
   - Runs lint-staged (ESLint, Prettier, TypeScript)
   - Well-structured with clear output and error handling

2. **commit-msg** (`.husky/commit-msg`)
   - Validates commit message format using commitlint

### Available Test Scripts (from `package.json`)

```json
{
  "test": "pnpm --filter backend run test && pnpm --filter frontend run test",
  "test:backend": "pnpm --filter backend run test",
  "test:frontend": "pnpm --filter frontend run test",
  "test:backend:e2e": "pnpm --filter backend run test:e2e"
}
```

## Requirements

### Functional Requirements

#### FR1: Pre-Push Hook Execution

- **MUST** run automatically when `git push` is executed
- **MUST** run all backend unit tests
- **MUST** run all frontend unit tests
- **MUST** block the push if any test fails
- **SHOULD** provide clear progress indicators
- **SHOULD** show which test suite is running

#### FR2: Test Execution Order

- **MUST** run backend tests first
- **MUST** run frontend tests second
- **MUST** stop execution on first failure (fail-fast)
- **SHOULD** display total execution time

#### FR3: User Experience

- **MUST** provide clear output with emojis and formatting (consistent with pre-commit)
- **MUST** show success message when all tests pass
- **MUST** show clear error message when tests fail
- **SHOULD** indicate which test suite failed
- **SHOULD** provide bypass instructions for emergency situations

#### FR4: Error Handling

- **MUST** exit with non-zero code on test failure
- **MUST** exit with non-zero code on script errors
- **MUST** use `set -e` to stop on first error
- **SHOULD** provide helpful error messages

### Non-Functional Requirements

#### NFR1: Performance

- **SHOULD** complete in reasonable time (< 5 minutes for typical test suite)
- **SHOULD** use parallel execution where possible (already handled by pnpm)

#### NFR2: Consistency

- **MUST** follow the same pattern as existing pre-commit hook
- **MUST** use same formatting style (emojis, step numbers, spacing)
- **MUST** use pnpm for package management consistency

#### NFR3: Maintainability

- **MUST** be easy to understand and modify
- **MUST** include comments explaining each step
- **SHOULD** include documentation file

## Acceptance Criteria

### AC1: Hook Creation

- [ ] File `.husky/pre-push` exists
- [ ] File is executable (`chmod +x`)
- [ ] File has proper shebang (`#!/usr/bin/env bash`)
- [ ] File uses `set -e` for error handling

### AC2: Test Execution

- [ ] Backend tests run when pushing
- [ ] Frontend tests run when pushing
- [ ] Push is blocked if backend tests fail
- [ ] Push is blocked if frontend tests fail
- [ ] Push succeeds if all tests pass

### AC3: Output Quality

- [ ] Clear progress indicators for each step
- [ ] Emojis used consistently (🧪 for tests, ✅ for success, ❌ for failure)
- [ ] Step numbers shown (Step 1/2, Step 2/2)
- [ ] Success message displayed when all tests pass
- [ ] Failure message displayed when tests fail

### AC4: Bypass Mechanism

- [ ] Hook can be bypassed with `git push --no-verify`
- [ ] Bypass instructions included in comments
- [ ] Warning about bypassing included

### AC5: Documentation

- [ ] Documentation file created (`.husky/husky-prepush.md`)
- [ ] Purpose explained
- [ ] Usage instructions provided
- [ ] Bypass instructions documented
- [ ] Troubleshooting section included

## Implementation Details

### File Structure

```
.husky/
├── pre-commit          # Existing
├── commit-msg          # Existing
├── pre-push            # NEW - To be created
└── husky-prepush.md    # NEW - Documentation
```

### Script Template (Based on pre-commit pattern)

```bash
#!/usr/bin/env bash

# Pre-push hook - Runs all tests before push
# To bypass: git push --no-verify (NOT RECOMMENDED)

set -e

echo "🧪 Running pre-push checks..."
echo ""

# 1. Backend tests
echo "🔬 Step 1/2: Running backend tests..."
pnpm test:backend
echo ""

# 2. Frontend tests
echo "🎨 Step 2/2: Running frontend tests..."
pnpm test:frontend
echo ""

echo "✅ All tests passed! Pushing to remote..."
echo ""
```

### Documentation Template

```markdown
# Husky Pre-Push Hook

## Purpose

Automatically runs all backend and frontend tests before allowing a push to the remote repository.

## What It Does

1. Runs all backend unit tests
2. Runs all frontend unit tests
3. Blocks push if any test fails
4. Allows push if all tests pass

## When It Runs

- Automatically before every `git push`
- Can be bypassed with `git push --no-verify` (not recommended)

## How to Bypass (Emergency Only)

\`\`\`bash
git push --no-verify
\`\`\`

⚠️ **Warning**: Only bypass in emergencies. Pushing failing tests can break CI/CD and affect other developers.

## Troubleshooting

### Tests are taking too long

- Consider running tests locally before committing
- Use `git push --no-verify` only if absolutely necessary

### Tests fail unexpectedly

- Run tests manually: `pnpm test`
- Check if tests pass locally before pushing
- Fix failing tests before pushing

### Hook doesn't run

- Ensure Husky is installed: `pnpm prepare`
- Check hook is executable: `ls -la .husky/pre-push`
- Verify hook file exists

## Related Hooks

- **pre-commit**: Runs linting, formatting, and type checking
- **commit-msg**: Validates commit message format
```

## Testing Strategy

### Manual Testing

1. **Test with passing tests**

   ```bash
   # Ensure all tests pass
   pnpm test

   # Try to push
   git push

   # Expected: Push succeeds after tests run
   ```

2. **Test with failing backend tests**

   ```bash
   # Break a backend test temporarily
   # Try to push
   git push

   # Expected: Push blocked, error message shown
   ```

3. **Test with failing frontend tests**

   ```bash
   # Break a frontend test temporarily
   # Try to push
   git push

   # Expected: Push blocked, error message shown
   ```

4. **Test bypass mechanism**

   ```bash
   git push --no-verify

   # Expected: Push succeeds without running tests
   ```

### Verification Checklist

- [ ] Hook runs automatically on `git push`
- [ ] Backend tests execute first
- [ ] Frontend tests execute second
- [ ] Push blocked on backend test failure
- [ ] Push blocked on frontend test failure
- [ ] Push succeeds when all tests pass
- [ ] Clear output with progress indicators
- [ ] Bypass works with `--no-verify`
- [ ] Documentation is clear and helpful

## Dependencies

- **Husky**: Already installed (v9.1.7)
- **pnpm**: Already configured
- **Test scripts**: Already defined in package.json

## Risks and Mitigations

| Risk                     | Impact                       | Mitigation                                       |
| ------------------------ | ---------------------------- | ------------------------------------------------ |
| Tests take too long      | Developers bypass hook       | Keep tests fast, provide clear progress          |
| Flaky tests              | False positives block pushes | Fix flaky tests, document bypass for emergencies |
| Hook doesn't run         | Tests not validated          | Clear installation instructions, verify in CI    |
| Developers always bypass | Hook becomes useless         | Educate team, enforce in CI/CD                   |

## Success Metrics

- [ ] Zero broken code pushed to remote (tests catch issues)
- [ ] Developers use hook without complaints
- [ ] CI/CD failures decrease (issues caught earlier)
- [ ] Hook execution time < 5 minutes

## Future Enhancements

- Add E2E tests to pre-push (optional, may be too slow)
- Add integration tests
- Add performance benchmarks
- Parallel test execution optimization
- Skip tests for specific branches (e.g., skip for `main` if CI handles it)

## References

- Existing pre-commit hook: `.husky/pre-commit`
- Husky documentation: https://typicode.github.io/husky/
- pnpm workspace commands: https://pnpm.io/filtering
