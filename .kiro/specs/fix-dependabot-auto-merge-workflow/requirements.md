# Fix Dependabot Auto-Merge Workflow

**Status:** ✅ Completed  
**Priority:** Critical  
**Created:** 2025-01-06

## Problem Statement

The Dependabot auto-merge workflow was broken due to incorrect JSON field references in the CI check polling logic. The workflow attempted to access fields `conclusion` and `status` which don't exist in the `gh pr checks` command output.

### Root Cause

The `gh pr checks` command only provides these fields:

- `bucket`
- `completedAt` (empty string if still running)
- `description`
- `event`
- `link`
- `name`
- `startedAt`
- `state` (values: "SUCCESS", "FAILURE", "PENDING", "QUEUED", "IN_PROGRESS")
- `workflow`

The workflow was incorrectly trying to use:

- ❌ `conclusion` (doesn't exist)
- ❌ `status` (doesn't exist)

## User Stories

### Story 1: Intelligent CI Polling

**As a** developer  
**I want** Dependabot PRs to wait for CI checks to complete before enabling auto-merge  
**So that** only PRs with passing tests get merged automatically

**Acceptance Criteria:**

- ✅ Workflow polls CI checks every 30 seconds
- ✅ Maximum wait time of 20 minutes
- ✅ Uses correct JSON fields: `state`, `completedAt`, `name`
- ✅ Detects check states: SUCCESS, FAILURE, PENDING, QUEUED, IN_PROGRESS
- ✅ Exits immediately if any check fails
- ✅ Enables auto-merge only when all checks pass
- ✅ Provides clear status messages during polling

### Story 2: Proper Error Handling

**As a** developer  
**I want** clear error messages when checks fail or timeout  
**So that** I can understand why auto-merge wasn't enabled

**Acceptance Criteria:**

- ✅ Lists failed checks by name when CI fails
- ✅ Shows timeout message after 20 minutes
- ✅ Displays current check status on timeout
- ✅ Exits with error code 1 on failure/timeout

### Story 3: Semver-Based Auto-Merge

**As a** developer  
**I want** patch and minor updates to auto-merge, but major updates to require manual review  
**So that** breaking changes don't get merged automatically

**Acceptance Criteria:**

- ✅ Patch updates (x.x.X) enable auto-merge
- ✅ Minor updates (x.X.x) enable auto-merge
- ✅ Major updates (X.x.x) get a warning comment
- ✅ Auto-merge uses squash merge strategy

## Technical Implementation

### Fixed Workflow Logic

```yaml
# Get checks with correct fields
CHECKS=$(gh pr checks "$PR_NUMBER" --json name,state,completedAt)

# Count by state (using correct field names)
SUCCESS=$(echo "$CHECKS" | jq '[.[] | select(.state == "SUCCESS")] | length')
FAILURE=$(echo "$CHECKS" | jq '[.[] | select(.state == "FAILURE")] | length')
PENDING=$(echo "$CHECKS" | jq '[.[] | select(.state == "PENDING" or .state == "QUEUED" or .state == "IN_PROGRESS" or .completedAt == "")] | length')
```

### Key Changes

1. **Removed incorrect fields:**
   - ❌ `.conclusion` → ✅ `.state`
   - ❌ `.status` → ✅ `.state`

2. **Added proper state detection:**
   - Check for `state == "SUCCESS"` for passed checks
   - Check for `state == "FAILURE"` for failed checks
   - Check for `state == "PENDING"` or `"QUEUED"` or `"IN_PROGRESS"` or `completedAt == ""` for running checks

3. **Improved polling logic:**
   - 30-second intervals (not too aggressive)
   - 20-minute maximum wait (40 iterations)
   - Clear progress messages
   - Immediate exit on failure

## Testing Strategy

### Manual Testing

1. ✅ Create test Dependabot PR
2. ✅ Verify workflow waits for CI checks
3. ✅ Verify auto-merge enables after CI passes
4. ✅ Verify workflow exits on CI failure
5. ✅ Verify timeout handling after 20 minutes

### Integration Testing

- Test with actual Dependabot PRs (#152-155)
- Verify all 14 required status checks are detected
- Verify workflow respects branch protection rules

## Deployment Plan

1. ✅ Fix workflow file in `.github/workflows/dependabot-auto-merge.yml`
2. ✅ Commit changes to `master` branch
3. ✅ Test with next Dependabot PR
4. ✅ Process existing open Dependabot PRs with `scripts/fix-dependabot-prs.sh`

## Success Metrics

- ✅ Workflow completes without JSON field errors
- ✅ Auto-merge enables only after all CI checks pass
- ✅ Clear status messages during execution
- ✅ Proper error handling on failures/timeouts
- ✅ Dependabot PRs merge automatically when CI passes

## Related Issues

- PR #160: "fix: improve Dependabot auto-merge workflow with intelligent CI polling" (BROKEN - needs this fix)
- PR #155: Test case for auto-merge functionality
- PRs #152-154, #138-151: Pending Dependabot PRs to process

## References

- GitHub CLI `gh pr checks` documentation
- GitHub Actions workflow syntax
- Dependabot auto-merge best practices
- Branch protection rules and required status checks
