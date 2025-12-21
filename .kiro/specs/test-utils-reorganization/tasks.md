# Implementation Plan - Test Utils Reorganization

## Phase 1: Prepare New Structure ✅

- [x] 1.1 Create test/setup/ directory
  - Create directory for test configuration files
  - _Requirements: 7.1_

- [x] 1.2 Create test/utils/ directory
  - Create directory for general test utilities
  - _Requirements: 3.1_

- [x] 1.3 Create test/e2e/fixtures/ directory
  - Create directory for E2E fixtures (classes with state)
  - _Requirements: 2.1_

- [x] 1.4 Verify current test status
  - Run `pnpm test:backend` to ensure all tests pass before reorganization
  - Document current test count: 119 test suites (117 passed, 2 failed), 1068 tests (1026 passed, 42 failed)
  - Note: Failures are in customer.e2e.spec.ts (business endpoint 404) - will be fixed during reorganization
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Phase 2: Move Test Setup Files

- [ ] 2.1 Move jest-e2e.json to test/setup/
  - Move `test/jest-e2e.json` → `test/setup/jest-e2e.json`
  - Update `rootDir` path in jest-e2e.json
  - Update `setupFilesAfterEnv` path in jest-e2e.json
  - _Requirements: 7.2, 7.3_

- [ ] 2.2 Move README.md to test/setup/
  - Move `test/README.md` → `test/setup/README.md`
  - _Requirements: 7.1_

- [ ] 2.3 Move setup-db.ts to test/setup/
  - Move `test/setup-db.ts` → `test/setup/setup-db.ts`
  - _Requirements: 7.1_

- [ ] 2.4 Move setup-test-db.sh to test/setup/
  - Move `test/setup-test-db.sh` → `test/setup/setup-test-db.sh`
  - _Requirements: 7.1_

- [ ] 2.5 Move setup.ts to test/setup/
  - Move `test/setup.ts` → `test/setup/setup.ts`
  - _Requirements: 7.1_

- [ ] 2.6 Update package.json scripts
  - Update any scripts that reference moved setup files
  - Update jest config paths if needed
  - _Requirements: 7.3_

- [ ] 2.7 Verify E2E tests still pass
  - Run `pnpm test:e2e:backend` to verify setup files work
  - _Requirements: 7.4, 8.3_

- [ ] 2.8 Commit Phase 2 changes
  - Commit message: `refactor(test): move test setup files to test/setup/`
  - Include all moved setup files and updated configurations
  - _Requirements: 7.1, 7.2, 7.3_

## Phase 3: Move Generators

- [ ] 3.1 Move generators.ts to test/utils/
  - Move `src/test-utils/generators.ts` → `test/utils/generators.ts`
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Update imports in PBT tests
  - Find all imports of `@test-utils/generators`
  - Update to use new path
  - Files to update:
    - `src/booking/app/commands/create-appointment/__tests__/handler.pbt.spec.ts`
    - `src/booking/app/commands/cancel-appointment/__tests__/handler-retry.pbt.spec.ts`
    - `src/booking/infra/persistence/repositories/__tests__/appointment-write.pbt.spec.ts`
    - `src/booking/domain/aggregates/__tests__/appointment.pbt.spec.ts`
    - `src/booking/domain/aggregates/__tests__/appointment-events.pbt.spec.ts`
  - _Requirements: 3.3_

- [ ] 3.3 Update tsconfig.json path alias
  - Update `@test-utils/*` to point to `test/utils/*`
  - _Requirements: 3.5, 6.1_

- [ ] 3.4 Update Jest moduleNameMapper
  - Update `@test-utils/(.*)$` mapping in package.json
  - _Requirements: 3.5, 6.5_

- [ ] 3.5 Verify PBT tests pass
  - Run PBT tests to verify generators work
  - _Requirements: 3.4, 8.4_

- [ ] 3.6 Commit Phase 3 changes
  - Commit message: `refactor(test): move generators to test/utils/`
  - Include moved generators.ts, updated imports, and path aliases
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

## Phase 4: Move E2E Helpers

- [ ] 4.1 Move auth-helper.ts to test/e2e/helpers/
  - Move `src/test-utils/e2e/auth-helper.ts` → `test/e2e/helpers/auth-helper.ts`
  - _Requirements: 1.2_

- [ ] 4.2 Move types.ts to test/e2e/helpers/
  - Move `src/test-utils/e2e/types.ts` → `test/e2e/helpers/types.ts`
  - _Requirements: 1.3_

- [ ] 4.3 Update imports in E2E tests
  - Find all imports of `@test-utils/e2e`
  - Update to use `@e2e-helpers/*`
  - File to update:
    - `src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts`
  - _Requirements: 1.4_

- [ ] 4.4 Update tsconfig.json path alias
  - Add `@e2e-helpers/*` pointing to `test/e2e/helpers/*`
  - _Requirements: 6.2_

- [ ] 4.5 Update Jest moduleNameMapper
  - Add `@e2e-helpers/(.*)$` mapping in package.json
  - _Requirements: 6.5_

- [ ] 4.6 Verify E2E tests pass
  - Run `pnpm test:e2e:backend` to verify helpers work
  - _Requirements: 1.5, 8.3_

- [ ] 4.7 Commit Phase 4 changes
  - Commit message: `refactor(test): move E2E helpers to test/e2e/helpers/`
  - Include moved auth-helper.ts, types.ts, updated imports, and path aliases
  - _Requirements: 1.2, 1.3, 1.4, 6.2_

## Phase 5: Handle Fixtures

- [ ] 5.1 Verify if fixtures are used
  - Search for imports of fixtures in all test files
  - Document findings
  - _Requirements: 2.3_

- [ ] 5.2 Decision: Move or Delete
  - If used: Move to `test/e2e/fixtures/`
  - If not used: Delete fixtures
  - _Requirements: 2.1, 2.4_

- [ ] 5.3 Move fixtures if used
  - Move `src/test-utils/e2e/fixtures/appointment.fixture.ts` → `test/e2e/fixtures/appointment.fixture.ts`
  - Move `src/test-utils/e2e/fixtures/business.fixture.ts` → `test/e2e/fixtures/business.fixture.ts`
  - Move `src/test-utils/e2e/fixtures/customer.fixture.ts` → `test/e2e/fixtures/customer.fixture.ts`
  - _Requirements: 2.1_

- [ ] 5.4 Update imports if fixtures moved
  - Update all imports to use `@e2e-fixtures/*`
  - _Requirements: 2.5_

- [ ] 5.5 Add path alias if fixtures moved
  - Add `@e2e-fixtures/*` to tsconfig.json
  - Add `@e2e-fixtures/(.*)$` to Jest moduleNameMapper
  - _Requirements: 6.2, 6.5_

- [ ] 5.6 Delete fixtures if not used
  - Delete `src/test-utils/e2e/fixtures/` directory
  - _Requirements: 2.4_

- [ ] 5.7 Verify tests pass
  - Run tests to verify fixtures work or are properly removed
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5.8 Commit Phase 5 changes
  - Commit message: `refactor(test): move E2E fixtures to test/e2e/fixtures/` (if moved) OR `refactor(test): remove unused E2E fixtures` (if deleted)
  - Include moved/deleted fixtures, updated imports (if moved), and path aliases (if moved)
  - _Requirements: 2.1, 2.4, 2.5_

## Phase 6: Move E2E Tests from Controllers

- [ ] 6.1 Move customer.e2e.spec.ts to test/e2e/
  - Move `src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` → `test/e2e/customer-api.e2e-spec.ts`
  - _Requirements: 4.2_

- [ ] 6.2 Update imports in moved test
  - Update relative imports to use path aliases
  - Update imports of helpers to use `@e2e-helpers/*`
  - _Requirements: 4.3_

- [ ] 6.3 Verify E2E tests pass
  - Run `pnpm test:e2e:backend` to verify moved test works
  - Verify all 13 E2E tests pass
  - _Requirements: 4.4, 8.3_

- [ ] 6.4 Verify no E2E tests remain in src/
  - Search for `*.e2e.spec.ts` or `*.e2e-spec.ts` in `src/`
  - Ensure none exist
  - _Requirements: 4.5_

- [ ] 6.5 Commit Phase 6 changes
  - Commit message: `refactor(test): move customer E2E test to test/e2e/`
  - Include moved customer-api.e2e-spec.ts and updated imports
  - _Requirements: 4.2, 4.3, 4.5_

## Phase 7: Clean Up

- [ ] 7.1 Delete src/test-utils/e2e/index.ts
  - Remove index file
  - _Requirements: 5.1_

- [ ] 7.2 Delete src/test-utils/e2e/ directory
  - Remove entire e2e directory
  - _Requirements: 5.1_

- [ ] 7.3 Delete src/test-utils/ directory
  - Remove entire test-utils directory
  - _Requirements: 5.1_

- [ ] 7.4 Verify no references remain
  - Search for imports from `src/test-utils`
  - Ensure none exist
  - _Requirements: 5.2_

- [ ] 7.5 Verify directory structure
  - Confirm `src/test-utils/` does not exist
  - Confirm `test/setup/` exists with all files
  - Confirm `test/utils/` exists with generators.ts
  - Confirm `test/e2e/helpers/` exists with auth-helper.ts and types.ts
  - Confirm `test/e2e/fixtures/` exists (if fixtures were moved) or doesn't exist (if deleted)
  - _Requirements: 5.1, 7.5_

- [ ] 7.6 Commit Phase 7 changes
  - Commit message: `refactor(test): remove src/test-utils/ directory`
  - Include deletion of src/test-utils/ and verification of structure
  - _Requirements: 5.1, 5.2_

## Phase 8: Final Verification

- [ ] 8.1 Run all unit tests
  - Execute `pnpm test:backend --testPathPattern="spec.ts$"`
  - Verify all pass
  - _Requirements: 8.1_

- [ ] 8.2 Run all integration tests
  - Execute `pnpm test:backend --testPathPattern="integration.spec.ts$"`
  - Verify all pass
  - _Requirements: 8.2_

- [ ] 8.3 Run all E2E tests
  - Execute `pnpm test:e2e:backend`
  - Verify all 13 tests pass
  - _Requirements: 8.3_

- [ ] 8.4 Run all PBT tests
  - Execute `pnpm test:backend --testPathPattern="pbt.spec.ts$"`
  - Verify all pass
  - _Requirements: 8.4_

- [ ] 8.5 Run full test suite
  - Execute `pnpm test:backend`
  - Verify all tests pass
  - _Requirements: 8.5_

- [ ] 8.6 Run type check
  - Execute `pnpm typecheck:backend`
  - Verify no errors
  - _Requirements: 5.3, 6.4_

- [ ] 8.7 Run linter
  - Execute `pnpm lint:backend`
  - Verify no errors
  - _Requirements: 5.4_

- [ ] 8.8 Verify final structure
  - Document final directory structure
  - Confirm matches design document
  - _Requirements: 5.1, 7.5_

- [ ] 8.9 Final commit
  - Commit message: `refactor(test): complete test utilities reorganization`
  - Include any final adjustments and documentation updates
  - Create summary of changes in commit message body
  - _Requirements: All_

## Summary

This implementation plan reorganizes test utilities to:

- ✅ Consolidate all test code in `test/` directory
- ✅ Separate test setup, helpers, fixtures, and utilities
- ✅ Remove `src/test-utils/` completely
- ✅ Update all imports and path aliases
- ✅ Maintain 100% test compatibility (13 E2E + unit + integration + PBT)
- ✅ Commit after each major phase for easy rollback

**Total Tasks:** 53 tasks across 8 phases (includes 6 commit tasks)

**Commit Strategy:**

- Phase 2: After moving setup files
- Phase 3: After moving generators
- Phase 4: After moving E2E helpers
- Phase 5: After handling fixtures
- Phase 6: After moving E2E tests
- Phase 7: After cleanup
- Phase 8: Final commit with summary
