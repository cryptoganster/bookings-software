# Tasks - E2E Testing with Authentication Setup

## Overview

This document breaks down the implementation of E2E testing with authentication into manageable tasks, including the consolidation of test utilities into `apps/backend/src/tests/`.

## Current Status Summary

### ✅ Completed

- **Phase 1:** E2EAuthHelper fully implemented ✅
- **Phase 2:** Test Fixtures (Business, Customer, Appointment) ✅
- **Phase 4:** Customer E2E tests updated with real auth ✅
- **Authentication Token Fix:** Field standardization complete ✅

**Results:** 31/41 E2E tests passing (76%), 139/141 total tests passing (98.6%)

### 🔄 Ready to Implement

- **Phase 5:** Documentation (2-3 hours)
- **Phase 6:** CI/CD Integration (2-3 hours)
- **Phase 7:** Testing and Validation (2-3 hours)

### ✅ Phase 8 Complete

All test utilities have been consolidated and E2E tests migrated to their respective BC folders.

## Task Breakdown

### Phase 8: Test Utilities Consolidation (NEW - Estimated: 3-4 hours)

- [x] 8.1 Consolidate and reorganize E2E helpers (SIMPLIFIED STRUCTURE) ✅
  - Create `apps/backend/src/test-utils/e2e-helpers/` directory ✅
  - Move and rename files: ✅
    - `auth-helper.ts` → `auth.ts` ✅
    - `database-helper.ts` → `database.ts` (consolidated from setup-db.ts + test-database.config.ts) ✅
    - `types.ts` → `types.ts` ✅
    - `capacity-helper.ts` → `capacity.ts` ✅
    - `offering-helper.ts` → `offering.ts` ✅
  - Create `index.ts` to re-export all helpers ✅
  - _Requirements: 9.1, 9.2_

- [x] 8.2 Update imports to use new structure ✅
  - Update `apps/backend/test/global-setup.ts` to import from `@test-utils/e2e-helpers` ✅
  - Update all E2E test files to import from `@test-utils/e2e-helpers` ✅
  - Update integration test files to import from `@test-utils/e2e-helpers` ✅
  - Verify all tests still pass ✅
  - _Requirements: 9.1_

- [x] 8.3 Delete redundant files ✅
  - Delete `apps/backend/test/setup-db.ts` (functionality moved to database.ts) ✅
  - Delete `apps/backend/test/test-database.config.ts` (functionality moved to database.ts) ✅
  - Keep `apps/backend/test/global-setup.ts` (required by Jest) ✅
  - Keep `apps/backend/test/setup.ts` (required by Jest) ✅
  - _Requirements: 9.2_

- [x] 8.4 Migrate E2E tests to respective BC `__tests__` folders ✅
  - Move `apps/backend/test/e2e/conversation-flow.e2e-spec.ts` → `apps/backend/src/conversation/presentation/controllers/__tests__/conversation-flow.e2e-spec.ts` ✅
  - Move `apps/backend/test/e2e/customer-flow.e2e-spec.ts` → `apps/backend/src/customer/presentation/controllers/__tests__/customer-flow.e2e-spec.ts` ✅
  - Delete `apps/backend/test/e2e/app.e2e-spec.ts` (auto-generated template test) ✅
  - Update imports in migrated files to use `@test-utils/e2e-helpers` alias ✅
  - _Requirements: 9.3_

- [ ] 8.5 Separate helpers by Bounded Context (DEFERRED - See BC_SEPARATION_PROPOSAL.md)
  - Extract BusinessOwner helpers from `auth.ts` to new `account.ts`
    - Move `createBusinessOwner()` method
    - Move `createTestBusiness()` private method (BusinessOwner creation logic)
  - Extract Business helpers from `auth.ts` to new `business.ts`
    - Move business creation logic (Business entity)
  - Extract Customer helpers from `auth.ts` to new `customer.ts`
    - Move `createCustomer()` method
    - Move `createTestCustomer()` private method
  - Keep only Auth BC helpers in `auth.ts`
    - `login()`, `register()`, `refreshToken()`
    - `createTestUser()` (orchestrator that uses other helpers)
    - `createAdmin()`
  - Update `types.ts` to organize types by BC
  - Update `index.ts` to re-export all new helpers
  - Update imports in test files to use specific helpers
  - _Requirements: 9.1, 9.2_
  - **Note:** This task is deferred until Account BC and Business BC are fully implemented. See `BC_SEPARATION_PROPOSAL.md` for details.

- [x] 8.6 Update Jest configuration for new structure ✅
  - Update `jest-e2e.json` to find tests in BC `__tests__` folders ✅
  - Update test patterns: `**/__tests__/**/*.e2e-spec.ts` ✅
  - Add `@test-utils` path alias to moduleNameMapper ✅
  - Verify all tests are discovered correctly ✅
  - Run full test suite to validate ✅
  - _Requirements: 10.1, 10.2_

### Phase 5: Documentation (Estimated: 2-3 hours)

- [ ] 5.1 Create developer guide
  - Write `apps/backend/src/test-utils/e2e/README.md` with quick start, common patterns, troubleshooting
  - Document E2EAuthHelper API reference
  - Document database-helper API reference (consolidated functions)
  - Document fixtures API reference
  - Provide examples for different roles and authorization testing
  - Include lessons learned from auth token field standardization
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 5.2 Create example test suite
  - Create `apps/backend/src/test-utils/e2e/examples/example.e2e-spec.ts`
  - Demonstrate authentication setup, fixture usage, role-based testing
  - Show database-helper usage for setup/teardown
  - Well-commented code showing best practices
  - _Requirements: 9.2_

### Phase 6: CI/CD Integration (Estimated: 2-3 hours)

- [ ] 6.1 Update CI/CD pipeline
  - Update `.github/workflows/ci.yml` to run E2E tests
  - Configure test database in CI
  - Set environment variables correctly
  - Report test results
  - Ensure cleanup runs even if tests fail
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 6.2 Add performance monitoring
  - Create `apps/backend/src/test-utils/e2e/performance-monitor.ts`
  - Track test execution times
  - Log slow tests (> 5 seconds)
  - Generate summary report
  - _Requirements: 8.1, 8.2_

### Phase 7: Testing and Validation (Estimated: 2-3 hours)

- [ ] 7.1 Run full test suite and validate
  - Run all E2E tests 5 times for consistency
  - Verify tests complete in under 2 minutes
  - Verify no test data left in database
  - Check for memory leaks
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7.2 Code review and refactoring
  - Review code follows project conventions
  - Ensure proper typing (no `any`)
  - Add JSDoc comments
  - Eliminate code duplication
  - Comprehensive error handling
  - _Requirements: 9.1, 9.2_

## Completed Work Summary

### Phase 1: Core Infrastructure ✅

**Files Created:**

- `apps/backend/src/test-utils/e2e/auth-helper.ts` (450 lines)
- `apps/backend/src/test-utils/e2e/types.ts` (80 lines)
- `apps/backend/src/test-utils/e2e/index.ts` (20 lines)

**Features:**

- User registration with JWT tokens
- User login with JWT tokens
- Token refresh functionality
- Test user creation with roles (BUSINESS_OWNER, CUSTOMER, ADMIN)
- Automatic cleanup of test users and associated data
- Unique email generation

### Phase 2: Test Fixtures ✅ → ❌ REMOVED

**Status:** Fixtures were created but never used in any tests. Removed to reduce complexity.

**Reason for Removal:**

- No tests were using the fixture classes
- Tests use SQL direct queries for data setup/cleanup
- `generators.ts` already provides simpler functions for test data
- Reduces maintenance burden and code complexity

**Alternative:** Tests use `generators.ts` + SQL queries for data management

### Phase 4: Customer E2E Tests ✅

**Files Modified:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` (1200 lines, 41 tests)

**Test Coverage:**

- 11 search operation tests
- 15 CRUD operation tests
- 12 merge/duplicate detection tests
- 3 authorization tests

**Results:** 31/41 tests passing (76% pass rate)

### Authentication Token Field Standardization ✅

**Files Modified:**

- `apps/backend/src/auth/app/commands/login/handler.ts`
- `apps/backend/src/auth/app/commands/register/handler.ts`
- `apps/backend/src/auth/app/commands/register/command.ts`
- `apps/backend/src/test-utils/e2e/auth-helper.ts`
- `apps/backend/src/test-utils/e2e/types.ts`

**Impact:** Fixed 31 E2E tests, increased total pass rate from 77% to 98.6%

## File Migration Map

### Consolidation Strategy

**Keep in `apps/backend/test/`** (Jest requirements):

- `global-setup.ts` - Jest global setup hook
- `setup.ts` - Jest setupFilesAfterEnv hook
- `jest-e2e.json` - Jest E2E configuration

**Consolidate into `apps/backend/src/test-utils/e2e/database-helper.ts`**:

- `apps/backend/test/setup-db.ts` → Functions: cleanDatabase, createTestDataSource, setupTestDatabase, teardownTestDatabase
- `apps/backend/test/test-database.config.ts` → Function: getTestTypeOrmConfig

**Organize E2E utilities in `apps/backend/src/test-utils/e2e-helpers/`**:

```
apps/backend/src/test-utils/e2e-helpers/
├── index.ts                # ✅ Re-export all helpers
├── auth.ts                 # ✅ Main authentication helper (E2EAuthHelper)
├── database.ts             # ✅ Consolidated DB utilities
├── types.ts                # ✅ TypeScript interfaces
├── capacity.ts             # ✅ Capacity helper functions
└── offering.ts             # ✅ Offering helper functions
```

**Note:** Simplified structure - no nested subdirectories. All helpers in one flat directory.

**Migrate E2E tests to BC `__tests__` folders**:

```
apps/backend/test/e2e/
├── conversation-flow.e2e-spec.ts → apps/backend/src/conversation/presentation/controllers/__tests__/conversation-flow.e2e-spec.ts
├── customer-flow.e2e-spec.ts     → apps/backend/src/customer/presentation/controllers/__tests__/customer-flow.e2e-spec.ts
└── app.e2e-spec.ts               → ❌ DELETE (auto-generated template)
```

## Final Structure

```
apps/backend/
├── test/
│   ├── global-setup.ts          # ✅ KEEP - Jest global setup
│   ├── setup.ts                 # ✅ KEEP - Jest setupFilesAfterEnv
│   └── jest-e2e.json            # ✅ KEEP - Jest E2E config
└── src/
    ├── test-utils/
    │   ├── e2e-helpers/
    │   │   ├── index.ts            # Re-export all helpers
    │   │   ├── auth.ts             # E2EAuthHelper class
    │   │   ├── database.ts         # Consolidated DB utilities
    │   │   ├── types.ts            # TypeScript interfaces
    │   │   ├── capacity.ts         # Capacity helper functions
    │   │   └── offering.ts         # Offering helper functions
    │   ├── examples/
    │   │   └── example.e2e-spec.ts # Example test suite
    │   └── generators.ts           # Test data generators
    ├── conversation/
    │   └── presentation/
    │       └── controllers/
    │           └── __tests__/
    │               └── conversation-flow.e2e-spec.ts
    └── customer/
        └── presentation/
            └── controllers/
                └── __tests__/
                    ├── customer.e2e.spec.ts
                    └── customer-flow.e2e-spec.ts
```

**Note:** Simplified flat structure for e2e-helpers - no nested subdirectories.

## Estimated Timeline

| Phase     | Tasks        | Estimated Time  | Status                      |
| --------- | ------------ | --------------- | --------------------------- |
| Phase 1   | 1.1 - 1.3    | 4-6 hours       | ✅ Complete                 |
| Phase 2   | 2.1 - 2.3    | 3-4 hours       | ✅ Complete (then removed)  |
| Phase 4   | 4.1 - 4.4    | 4-6 hours       | ✅ Complete                 |
| Phase 8   | 8.1 - 8.6    | 3-4 hours       | 🔄 In Progress (8.1 ✅)     |
| Phase 5   | 5.1 - 5.2    | 2-3 hours       | 🔄 Ready                    |
| Phase 6   | 6.1 - 6.2    | 2-3 hours       | 🔄 Ready                    |
| Phase 7   | 7.1 - 7.2    | 2-3 hours       | 🔄 Ready                    |
| **Total** | **20 tasks** | **20-29 hours** | **60% done (8.1 complete)** |

## Success Criteria

### Phase 8 Complete When:

- [x] `database.ts` created with consolidated DB utilities ✅
- [x] `e2e-helpers/` directory created with flat structure ✅
- [x] All helpers moved and renamed ✅
- [x] `index.ts` re-exports all helpers ✅
- [ ] All imports updated to use `@test-utils/e2e-helpers`
- [ ] `setup-db.ts` and `test-database.config.ts` deleted
- [ ] E2E tests migrated to respective BC `__tests__` folders
- [ ] Jest configuration updated to find tests in new locations
- [ ] All tests pass with new structure

### Overall Complete When:

- [ ] All E2E tests passing (target: 100%)
- [ ] Tests run in < 2 minutes
- [ ] Documentation complete with examples
- [ ] CI/CD integration working
- [ ] Pattern ready for other BCs

## Notes

- Phase 3 (TestUserFactory) is optional - E2EAuthHelper is sufficient
- Phase 8 consolidates database utilities and organizes E2E structure
- Phase 8 should be completed before Phase 5-7
- `global-setup.ts` and `setup.ts` remain in `test/` (required by Jest)
- `setup-db.ts` and `test-database.config.ts` are consolidated into `database-helper.ts`
- E2E tests in `conversation-flow` and `customer-flow` test integration flows, not just CRUD operations
- `app.e2e-spec.ts` is a NestJS template test and should be deleted
- E2E tests should be co-located with their respective BCs in `__tests__/` folders
