# Husky Pre-Push Hook

## Purpose

Automatically runs all backend and frontend tests before allowing a push to the remote repository. This ensures code quality and prevents broken code from being pushed.

## What It Does

The pre-push hook executes the following steps in order:

1. **Backend Tests** - Runs all backend unit tests (`pnpm test:backend`)
2. **Frontend Tests** - Runs all frontend unit tests (`pnpm test:frontend`)
3. **Blocks Push** - If any test fails, the push is blocked
4. **Allows Push** - If all tests pass, the push proceeds

## When It Runs

- Automatically before every `git push` command
- Runs after pre-commit checks but before code is sent to remote
- Can be bypassed with `git push --no-verify` (not recommended)

## Output Example

```bash
🧪 Running pre-push checks...

🔬 Step 1/2: Running backend tests...
 PASS  src/booking/domain/aggregates/__tests__/appointment.spec.ts
 PASS  src/conversation/app/commands/__tests__/process-incoming-message.spec.ts
 ...

🎨 Step 2/2: Running frontend tests...
 PASS  src/shared/api/__tests__/client.test.ts
 ...

✅ All tests passed! Pushing to remote...
```

## How to Bypass (Emergency Only)

```bash
git push --no-verify
```

⚠️ **Warning**: Only bypass in emergencies. Pushing failing tests can:

- Break CI/CD pipelines
- Affect other developers
- Introduce bugs to the codebase
- Violate team quality standards

## When to Bypass

Use `--no-verify` only in these situations:

- **Emergency hotfix** - Critical production issue that needs immediate fix
- **CI/CD is down** - Tests pass locally but CI is unavailable
- **Known flaky test** - Test is flaky and team is aware (fix the test ASAP)
- **Documentation only** - Pushing only documentation changes (though tests should still pass)

## Troubleshooting

### Tests are taking too long

**Problem**: Pre-push hook takes more than 5 minutes

**Solutions**:

- Run tests locally before committing: `pnpm test`
- Optimize slow tests
- Consider running only unit tests in pre-push (move E2E to CI)
- Use `git push --no-verify` only if absolutely necessary

### Tests fail unexpectedly

**Problem**: Tests pass locally but fail in pre-push hook

**Solutions**:

1. Run tests manually to verify:
   ```bash
   pnpm test:backend
   pnpm test:frontend
   ```
2. Check for uncommitted changes that affect tests
3. Ensure all dependencies are installed: `pnpm install`
4. Clear test cache: `pnpm test:backend --clearCache`

### Hook doesn't run

**Problem**: Pre-push hook is not executing

**Solutions**:

1. Verify Husky is installed:
   ```bash
   pnpm prepare
   ```
2. Check hook file exists and is executable:
   ```bash
   ls -la .husky/pre-push
   ```
3. Ensure you're in the repository root
4. Check Git hooks are enabled:
   ```bash
   git config core.hooksPath
   ```

### Backend tests fail

**Problem**: Backend tests fail in pre-push

**Solutions**:

1. Run backend tests locally:
   ```bash
   pnpm test:backend
   ```
2. Check error messages for specific test failures
3. Fix failing tests before pushing
4. If tests are flaky, investigate and fix root cause

### Frontend tests fail

**Problem**: Frontend tests fail in pre-push

**Solutions**:

1. Run frontend tests locally:
   ```bash
   pnpm test:frontend
   ```
2. Check for missing dependencies or environment variables
3. Fix failing tests before pushing
4. Ensure browser environment is properly configured

### Permission denied error

**Problem**: `Permission denied: .husky/pre-push`

**Solution**:

```bash
chmod +x .husky/pre-push
```

## Related Hooks

- **pre-commit** (`.husky/pre-commit`) - Runs linting, formatting, and type checking before commit
- **commit-msg** (`.husky/commit-msg`) - Validates commit message format

## Configuration

The hook uses the following npm scripts from `package.json`:

```json
{
  "test:backend": "pnpm --filter backend run test",
  "test:frontend": "pnpm --filter frontend run test"
}
```

To modify what tests run, update these scripts in the root `package.json`.

## Best Practices

1. **Run tests locally first** - Don't rely solely on the hook
2. **Keep tests fast** - Aim for < 5 minutes total execution time
3. **Fix flaky tests immediately** - Don't let them accumulate
4. **Don't bypass habitually** - Only use `--no-verify` in emergencies
5. **Update tests with code** - Keep tests in sync with implementation

## Performance Tips

- **Parallel execution** - pnpm already runs tests in parallel where possible
- **Test splitting** - Consider splitting unit and E2E tests
- **Cache optimization** - Ensure test runners use caching effectively
- **Selective testing** - Run only affected tests (future enhancement)

## Metrics

Track these metrics to ensure hook effectiveness:

- **Average execution time** - Should be < 5 minutes
- **Bypass rate** - Should be < 5% of pushes
- **Test failure rate** - Indicates code quality
- **CI/CD failure rate** - Should decrease with pre-push hook

## Future Enhancements

- Add E2E tests to pre-push (optional, may be too slow)
- Add integration tests
- Implement selective test execution (only run tests for changed files)
- Add performance benchmarks
- Skip tests for specific branches (e.g., `main` if CI handles it)
- Add test result caching

## Support

If you encounter issues not covered here:

1. Check the [Husky documentation](https://typicode.github.io/husky/)
2. Review the [pnpm workspace documentation](https://pnpm.io/filtering)
3. Ask the team in Slack/Discord
4. Create an issue in the repository

## Version History

- **v1.0** (2025-01-04) - Initial implementation with backend and frontend tests
