# Dependabot Auto-Merge Configuration

## Overview

This repository uses Dependabot with automated merging for dependency updates to maintain security and keep dependencies up-to-date with minimal manual intervention.

## How It Works

### Automatic Merging

The workflow `.github/workflows/dependabot-auto-merge.yml` automatically:

1. **Detects Dependabot PRs** - Triggers only when `dependabot[bot]` creates a PR
2. **Waits for CI** - Waits 2 minutes for CI checks to start
3. **Auto-approves and merges** based on update type:
   - ✅ **Patch updates** (e.g., 1.0.0 → 1.0.1): Auto-merged
   - ✅ **Minor updates** (e.g., 1.0.0 → 1.1.0): Auto-merged
   - ⚠️ **Major updates** (e.g., 1.0.0 → 2.0.0): Requires manual review

### Safety Measures

- **CI must pass**: Auto-merge only happens if all CI checks succeed
- **Squash merge**: Keeps git history clean
- **Manual review for breaking changes**: Major updates are flagged for review

## Update Schedule

Dependabot runs **weekly on Mondays at 9:00 AM** and checks:

- Backend dependencies (`/apps/backend`)
- Frontend dependencies (`/apps/frontend`)
- Shared packages (`/packages/shared-types`)
- Root workspace dependencies (`/`)
- GitHub Actions (`/.github/workflows`)

## Configuration Files

- **Dependabot config**: `.github/dependabot.yml`
- **Auto-merge workflow**: `.github/workflows/dependabot-auto-merge.yml`

## Manual Intervention

### When to Review Manually

You should manually review PRs when:

1. **Major version updates** - May contain breaking changes
2. **CI checks fail** - Auto-merge won't trigger
3. **Multiple dependencies updated** - Review combined impact

### How to Disable Auto-Merge

To disable auto-merge for a specific PR:

```bash
# Comment on the PR
@dependabot ignore this major version
```

Or disable the workflow temporarily by editing `.github/workflows/dependabot-auto-merge.yml`.

## Security

- **Patch updates are prioritized** - Security fixes are auto-merged quickly
- **All updates go through CI** - Tests must pass before merge
- **Dependabot alerts** - GitHub will alert on known vulnerabilities

## Monitoring

Check the following to monitor auto-merge:

1. **Actions tab**: See workflow runs
2. **Pull Requests**: See which PRs were auto-merged
3. **Dependabot alerts**: Check for security vulnerabilities

## Troubleshooting

### Auto-merge didn't trigger

**Possible causes:**

- CI checks are still running (wait 2+ minutes)
- CI checks failed
- Update is a major version (requires manual review)
- Workflow permissions issue

**Solution:**
Check the Actions tab for workflow logs.

### Too many PRs

**Solution:**
Adjust `open-pull-requests-limit` in `.github/dependabot.yml`.

### Want to batch updates

**Solution:**
Close individual Dependabot PRs and create a manual batch update PR (like we did with PR #127).

## Best Practices

1. ✅ Let patch and minor updates auto-merge
2. ✅ Review major updates carefully
3. ✅ Monitor CI failures
4. ✅ Keep Dependabot config up-to-date
5. ✅ Periodically review merged updates

## References

- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub Actions auto-merge guide](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
