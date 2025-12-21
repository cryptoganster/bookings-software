# GitHub CLI Update - Fix for Projects (classic) Deprecation Warning

**Date:** December 21, 2025  
**Issue:** GitHub CLI showing "Projects (classic) is being deprecated" warning when using `gh pr edit`  
**Status:** ✅ RESOLVED

## Problem

When attempting to update PR #78 using `gh pr edit`, the command failed with:

```
GraphQL: Projects (classic) is being deprecated in favor of the new Projects experience
```

This occurred even without using any project-related flags.

## Root Cause

- **GitHub CLI Version:** 2.67.0 (outdated)
- **Known Bug:** Issues #11983, #12320, #11992 in cli/cli repository
- **Fix Released:** GitHub CLI v2.82.1 (December 2024)

The older version of GitHub CLI was not correctly detecting the classic projects API deprecation, causing the command to fail.

## Solution

### 1. Updated GitHub CLI

```bash
brew upgrade gh
```

**Result:**

- Old version: 2.67.0 (February 11, 2025)
- New version: 2.83.2 (December 10, 2025)

### 2. Verified Fix

```bash
gh --version
# gh version 2.83.2 (2025-12-10)

gh pr edit 78 --title "feat(customer): Complete Customer BC Backend-Frontend Integration"
# ✅ Success - no warnings
```

### 3. Updated PR Successfully

```bash
gh pr edit 78 --body "..."
# ✅ Success - PR updated with comprehensive description
```

## Verification

```bash
gh pr view 78
```

**Result:**

- ✅ Title updated correctly
- ✅ Body updated with full description
- ✅ No deprecation warnings
- ✅ All changes visible on GitHub

## Key Learnings

1. **Always keep GitHub CLI updated** - Critical bug fixes are released regularly
2. **Check release notes** - v2.82.1 specifically fixed this issue
3. **Use Homebrew for updates** - `brew upgrade gh` is the easiest method on macOS
4. **Workaround available** - If update not possible, use `gh api` directly

## References

- [GitHub CLI Issue #11983](https://github.com/cli/cli/issues/11983)
- [GitHub CLI Issue #12320](https://github.com/cli/cli/issues/12320)
- [GitHub CLI Release v2.82.1](https://github.com/cli/cli/releases/tag/v2.82.1)
- [Projects (classic) Sunset Notice](https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/)

## Impact

- ✅ PR #78 successfully updated
- ✅ No more deprecation warnings
- ✅ GitHub CLI fully functional
- ✅ Ready for future PR operations

## Next Steps

- Monitor GitHub CLI releases for future updates
- Consider setting up automatic updates via Homebrew
- Document this issue for team reference
