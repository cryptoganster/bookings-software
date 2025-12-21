# Implementation Plan - Fix Integration Tests

## Task List

- [x] 1. Diagnose CI failure
  - Analyze GitHub Actions logs
  - Identify root cause of test failures
  - Document findings in ci-failure-analysis.md
  - _Requirements: 1.1, 1.2, 4.2_

- [x] 2. Update requirements document
  - Add Requirement 4 for entity registration
  - Document acceptance criteria for all entities
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Fix entity registration in test setup
  - Update `apps/backend/test/setup-db.ts`
  - Replace hardcoded entities array with glob pattern
  - Use `entities: ['src/**/infra/persistence/models/*.ts']`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Verify fix locally
  - Run integration tests: `pnpm --filter backend test`
  - Verify all AppointmentReadRepository tests pass
  - Verify no "relation does not exist" errors
  - _Requirements: 1.1, 1.2, 4.2, 4.3, 4.4_

- [-] 5. Commit and push changes
  - Commit fix with descriptive message
  - Push to PR #81 branch
  - _Requirements: 1.1, 1.2_

- [ ] 6. Verify CI passes
  - Monitor GitHub Actions run
  - Verify all jobs pass (especially Test Backend)
  - Verify coverage calculation works
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 7. Update implementation summary
  - Document the fix applied
  - Add verification results
  - Note any lessons learned
  - _Requirements: All_

## Notes

- The fix is straightforward: replace the hardcoded entities array with a glob pattern
- This ensures all entities are automatically discovered and registered
- No manual maintenance required when new entities are added
- The glob pattern is a standard TypeORM feature

## Success Criteria

- ✅ All integration tests pass locally
- ✅ CI pipeline passes completely
- ✅ No "relation does not exist" errors
- ✅ Test coverage is calculated correctly
- ✅ All joins with offerings, customers, and other tables work
