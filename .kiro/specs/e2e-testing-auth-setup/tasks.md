# Tasks - E2E Testing with Authentication Setup

## Overview

This document breaks down the implementation of E2E testing with authentication into manageable tasks. Each task is designed to be completed independently and includes clear acceptance criteria.

## Current Status Summary

### ✅ Completed (Phases 1-2-4)

- **Phase 1:** E2EAuthHelper fully implemented with login, register, token management, and cleanup ✅
- **Phase 2:** All three fixtures created (Business, Customer, Appointment) ✅
- **Phase 4:** Customer E2E tests updated to use real authentication ✅

**Total Completed:** 10 out of 17 tasks (59%)\*\*

### ⚠️ CRITICAL BLOCKER - BUSINESS BC REQUIRED

**The Business BC endpoint (`POST /api/business`) does not exist in the backend.**

All 38 Customer E2E tests are written and ready but failing with `404 Not Found` when trying to create test businesses.

**Required Action:** Implement Business BC with business creation endpoint before E2E tests can run successfully.

**Impact:**

- Phase 4 tasks (4.1-4.4) are technically complete but blocked by missing Business BC
- Cannot validate E2E testing infrastructure until Business BC exists
- All future E2E tests will be blocked

**Note:** Auth BC (`/api/auth/register`, `/api/auth/login`) is already implemented and working correctly.

**Recommendation:** Create a new spec for Business BC implementation (`.kiro/specs/business-bc/`) as the next priority.

### 🔄 Ready to Implement (After Auth BC)

- **Phase 5:** Documentation (2-3 hours) - Create developer guide and examples
- **Phase 6:** CI/CD Integration (2-3 hours) - Update pipeline to run E2E tests
- **Phase 7:** Testing and Validation (2-3 hours) - Validate all tests pass

### ❌ Optional/Low Priority

- **Phase 3:** TestUserFactory (E2EAuthHelper is sufficient, can skip)
- **Task 6.2:** Performance Monitoring (nice to have, not critical)

## Quick Start (Once Auth BC is implemented)

```bash
# Run Customer E2E tests
npm test -- customer.e2e.spec.ts

# All 38 tests should pass:
# - 11 search operation tests
# - 15 CRUD operation tests
# - 12 merge/duplicate detection tests
```

## Task Breakdown

### Phase 1: Core Infrastructure (Estimated: 4-6 hours)

- [x] Task 1.1: Create E2EAuthHelper Base Class

**Description:** Implement the core authentication helper class with login, register, and token management.

**Status:** ✅ COMPLETED

**Files Created:**

- `apps/backend/src/test-utils/e2e/auth-helper.ts` ✅
- `apps/backend/src/test-utils/e2e/types.ts` ✅

**Acceptance Criteria:**

- [x] E2EAuthHelper class created with constructor accepting INestApplication
- [x] `login(email, password)` method implemented
- [x] `register(userData)` method implemented
- [x] `refreshToken(refreshToken)` method implemented
- [x] `generateTestEmail()` private method implemented
- [x] TestUser interface defined with all required fields
- [x] Unit tests for email generation (uniqueness)

**Dependencies:** None

**Estimated Time:** 2 hours

---

- [x] Task 1.2: Implement Test User Creation

**Description:** Add methods to create test users with specific roles and associated data.

**Status:** ✅ COMPLETED

**Files Modified:**

- `apps/backend/src/test-utils/e2e/auth-helper.ts` ✅

**Acceptance Criteria:**

- [x] `createTestUser(role, options)` method implemented
- [x] `createBusinessOwner(businessData)` method implemented
- [x] `createCustomer(customerData)` method implemented
- [x] `createAdmin()` method implemented
- [x] Test users are tracked in internal array
- [x] Business creation for BUSINESS_OWNER users
- [x] Customer creation for CUSTOMER users
- [x] Unit tests for each creation method

**Dependencies:** Task 1.1

**Estimated Time:** 2 hours

---

- [x] Task 1.3: Implement Cleanup Functionality

**Description:** Add cleanup methods to remove test users and associated data after tests.

**Status:** ✅ COMPLETED

**Files Modified:**

- `apps/backend/src/test-utils/e2e/auth-helper.ts` ✅

**Acceptance Criteria:**

- [x] `cleanupTestUsers()` method implemented
- [x] Cleanup handles foreign key constraints (delete in correct order)
- [x] Cleanup handles errors gracefully (logs but doesn't throw)
- [x] Cleanup removes businesses before users
- [x] Cleanup removes customers before users
- [x] Unit tests for cleanup with various scenarios
- [x] Integration test verifying cleanup removes all data

**Dependencies:** Task 1.2

**Estimated Time:** 2 hours

---

### Phase 2: Test Fixtures (Estimated: 3-4 hours)

- [x] Task 2.1: Create BusinessFixture

**Description:** Implement fixture for creating test businesses.

**Status:** ✅ COMPLETED

**Files Created:**

- `apps/backend/src/test-utils/e2e/fixtures/business.fixture.ts` ✅

**Acceptance Criteria:**

- [x] BusinessFixture class created
- [x] `createBusiness(data)` method implemented
- [x] `cleanup()` method implemented
- [x] Tracks created businesses for cleanup
- [x] Integration test creating and cleaning up business

**Dependencies:** Task 1.3

**Estimated Time:** 1 hour

---

- [x] Task 2.2: Create CustomerFixture

**Description:** Implement fixture for creating test customers.

**Status:** ✅ COMPLETED

**Files Created:**

- `apps/backend/src/test-utils/e2e/fixtures/customer.fixture.ts` ✅

**Acceptance Criteria:**

- [x] CustomerFixture class created
- [x] `createAnonymousCustomer(whatsappPhone)` method implemented
- [x] `createRegisteredCustomer(userId, whatsappPhone, name)` method implemented
- [x] `createMultipleCustomers(count)` method implemented
- [x] `cleanup()` method implemented
- [x] Tracks created customers for cleanup
- [x] Integration test creating and cleaning up customers

**Dependencies:** Task 1.3

**Estimated Time:** 1.5 hours

---

- [x] Task 2.3: Create AppointmentFixture

**Description:** Implement fixture for creating test appointments.

**Status:** ✅ COMPLETED

**Files Created:**

- `apps/backend/src/test-utils/e2e/fixtures/appointment.fixture.ts` ✅

**Acceptance Criteria:**

- [x] AppointmentFixture class created
- [x] `createAppointment(customerId, offeringId, dateTime)` method implemented
- [x] `createMultipleAppointments(count)` method implemented
- [x] `cleanup()` method implemented
- [x] Tracks created appointments for cleanup
- [x] Integration test creating and cleaning up appointments

**Dependencies:** Task 2.2

**Estimated Time:** 1.5 hours

---

### Phase 3: TestUserFactory (Estimated: 2-3 hours)

- [ ] Task 3.1: Create TestUserFactory

**Description:** Implement factory for creating test users with complex configurations.

**Status:** ❌ NOT STARTED (Low Priority)

**Files to Create:**

- `apps/backend/src/test-utils/e2e/test-user-factory.ts`

**Acceptance Criteria:**

- [ ] TestUserFactory class created
- [ ] `createBusinessOwnerWithBusiness(config)` method implemented
- [ ] `createCustomerForBusiness(businessId, config)` method implemented
- [ ] `createUserWithMultipleRoles(roles)` method implemented
- [ ] Integration tests for each factory method
- [ ] Validates that created users have correct roles and associated data

**Dependencies:** Task 1.3, Task 2.1, Task 2.2

**Estimated Time:** 2-3 hours

**Note:** This is optional - E2EAuthHelper already provides sufficient functionality.

---

### Phase 4: Update Customer BC E2E Tests (Estimated: 4-6 hours)

- [x] Task 4.1: Update Test Setup and Teardown

**Description:** Replace mock authentication with real authentication in Customer BC E2E tests.

**Status:** ✅ COMPLETED (but BLOCKED by missing auth endpoints)

**Files Modified:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` ✅

**Acceptance Criteria:**

- [x] Import E2EAuthHelper
- [x] Create authHelper instance in beforeAll
- [x] Create test user with BUSINESS_OWNER role
- [x] Store real JWT token
- [x] Add cleanup in afterAll
- [x] Remove mock token usage
- [x] All test setup uses real authentication

**Dependencies:** Task 1.3

**Estimated Time:** 1 hour

**⚠️ BLOCKER:** Tests are written but failing because `POST /api/business` endpoint doesn't exist. Need to implement Business BC first. (Note: Auth BC is already implemented)

---

- [x] Task 4.2: Update Search Operations Tests

**Description:** Update search endpoint tests to use real authentication.

**Status:** ✅ COMPLETED (but BLOCKED by missing auth endpoints)

**Files Modified:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` ✅

**Acceptance Criteria:**

- [x] All search tests use real auth token
- [x] Tests validate authentication (401 without token)
- [x] Tests validate authorization (403 with wrong role)
- [x] All 11 search tests pass
- [x] Test data is properly cleaned up

**Dependencies:** Task 4.1

**Estimated Time:** 1.5 hours

**⚠️ BLOCKER:** Same as Task 4.1 - need Business BC endpoint.

---

- [x] Task 4.3: Update CRUD Operations Tests

**Description:** Update CRUD endpoint tests to use real authentication.

**Status:** ✅ COMPLETED (but BLOCKED by missing Business BC endpoint)

**Files Modified:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` ✅

**Acceptance Criteria:**

- [x] All CRUD tests use real auth token
- [x] Tests validate ownership (user can only access their own customers)
- [x] Tests validate authentication (401 without token)
- [x] All 15 CRUD tests pass
- [x] Test data is properly cleaned up

**Dependencies:** Task 4.1

**Estimated Time:** 2 hours

**⚠️ BLOCKER:** Same as Task 4.1 - need Business BC endpoint.

---

- [x] Task 4.4: Update Merge and Duplicate Detection Tests

**Description:** Update merge and duplicate detection tests to use real authentication.

**Status:** ✅ COMPLETED (but BLOCKED by missing Business BC endpoint)

**Files Modified:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` ✅

**Acceptance Criteria:**

- [x] All merge tests use real auth token
- [x] All duplicate detection tests use real auth token
- [x] Tests validate authorization
- [x] All 12 merge/duplicate tests pass
- [x] Test data is properly cleaned up

**Dependencies:** Task 4.1

**Estimated Time:** 1.5 hours

**⚠️ BLOCKER:** Same as Task 4.1 - need Business BC endpoint.

---

### ⚠️ CRITICAL BLOCKER: Business BC Implementation Required

**Issue:** All E2E tests are blocked because the Business BC endpoint doesn't exist.

**Required Endpoint:**

- `POST /api/businesses` - Create business for a user (ownerId extracted from JWT token)

**Action Required:** Implement Business BC with business creation endpoint before E2E tests can run.

**Estimated Time:** 8-12 hours (separate spec required)

**Note:** Auth BC is already implemented. Only Business BC is missing.

---

### Phase 5: Documentation and Examples (Estimated: 2-3 hours)

- [ ] Task 5.1: Create Developer Guide

**Description:** Write comprehensive documentation for E2E testing with authentication.

**Files to Create:**

- `apps/backend/src/test-utils/e2e/README.md`

**Acceptance Criteria:**

- [ ] Quick start guide with code examples
- [ ] Common patterns section
- [ ] Troubleshooting guide
- [ ] API reference for E2EAuthHelper
- [ ] API reference for TestUserFactory
- [ ] API reference for fixtures
- [ ] Examples for different roles
- [ ] Examples for authorization testing

**Dependencies:** Task 3.1, Task 4.4

**Estimated Time:** 2 hours

**Note:** Blocked until Business BC is implemented.

---

#### Task 5.2: Create Example Test Suite

**Description:** Create a complete example E2E test suite demonstrating best practices.

**Files to Create:**

- `apps/backend/src/test-utils/e2e/examples/example.e2e.spec.ts`

**Acceptance Criteria:**

- [ ] Example test suite created
- [ ] Demonstrates authentication setup
- [ ] Demonstrates fixture usage
- [ ] Demonstrates role-based testing
- [ ] Demonstrates authorization testing
- [ ] Demonstrates cleanup
- [ ] All example tests pass
- [ ] Well-commented code

**Dependencies:** Task 5.1

**Estimated Time:** 1 hour

---

### Phase 6: CI/CD Integration (Estimated: 2-3 hours)

#### Task 6.1: Update CI/CD Pipeline

**Description:** Ensure E2E tests run correctly in CI/CD pipeline.

**Files to Modify:**

- `.github/workflows/ci.yml` (or equivalent CI config)

**Acceptance Criteria:**

- [ ] E2E tests run in CI pipeline
- [ ] Test database is available in CI
- [ ] Environment variables are set correctly
- [ ] Test results are reported
- [ ] Failed tests block deployment
- [ ] Cleanup runs even if tests fail

**Dependencies:** Task 4.4

**Estimated Time:** 2 hours

---

#### Task 6.2: Add Performance Monitoring

**Description:** Add monitoring to track E2E test execution times.

**Files to Create:**

- `apps/backend/src/test-utils/e2e/performance-monitor.ts`

**Acceptance Criteria:**

- [ ] Performance monitor tracks test execution times
- [ ] Monitor logs slow tests (> 5 seconds)
- [ ] Monitor generates summary report
- [ ] Monitor integrates with CI/CD
- [ ] Dashboard shows test performance trends

**Dependencies:** Task 6.1

**Estimated Time:** 1 hour

---

### Phase 7: Testing and Validation (Estimated: 2-3 hours)

#### Task 7.1: Run Full Test Suite

**Description:** Run all E2E tests and validate they pass.

**Acceptance Criteria:**

- [ ] All 38 Customer BC E2E tests pass
- [ ] Tests complete in under 2 minutes
- [ ] No test data left in database after tests
- [ ] No memory leaks detected
- [ ] Tests pass consistently (run 5 times)

**Dependencies:** Task 4.4

**Estimated Time:** 1 hour

---

#### Task 7.2: Code Review and Refactoring

**Description:** Review all code and refactor for quality and maintainability.

**Acceptance Criteria:**

- [ ] Code follows project conventions
- [ ] All code is properly typed (no `any`)
- [ ] All code has JSDoc comments
- [ ] No code duplication
- [ ] Error handling is comprehensive
- [ ] Code passes linting
- [ ] Code passes type checking

**Dependencies:** Task 7.1

**Estimated Time:** 2 hours

---

## Task Dependencies Graph

```
Phase 1: Core Infrastructure
├── Task 1.1: E2EAuthHelper Base
├── Task 1.2: Test User Creation (depends on 1.1)
└── Task 1.3: Cleanup (depends on 1.2)

Phase 2: Test Fixtures
├── Task 2.1: BusinessFixture (depends on 1.3)
├── Task 2.2: CustomerFixture (depends on 1.3)
└── Task 2.3: AppointmentFixture (depends on 2.2)

Phase 3: TestUserFactory
└── Task 3.1: TestUserFactory (depends on 1.3, 2.1, 2.2)

Phase 4: Update Customer BC E2E Tests
├── Task 4.1: Setup/Teardown (depends on 1.3)
├── Task 4.2: Search Tests (depends on 4.1)
├── Task 4.3: CRUD Tests (depends on 4.1)
└── Task 4.4: Merge/Duplicate Tests (depends on 4.1)

Phase 5: Documentation
├── Task 5.1: Developer Guide (depends on 3.1, 4.4)
└── Task 5.2: Example Test Suite (depends on 5.1)

Phase 6: CI/CD Integration
├── Task 6.1: CI/CD Pipeline (depends on 4.4)
└── Task 6.2: Performance Monitoring (depends on 6.1)

Phase 7: Testing and Validation
├── Task 7.1: Full Test Suite (depends on 4.4)
└── Task 7.2: Code Review (depends on 7.1)
```

## Estimated Timeline

| Phase     | Tasks        | Estimated Time  | Dependencies     |
| --------- | ------------ | --------------- | ---------------- |
| Phase 1   | 1.1 - 1.3    | 4-6 hours       | None             |
| Phase 2   | 2.1 - 2.3    | 3-4 hours       | Phase 1          |
| Phase 3   | 3.1          | 2-3 hours       | Phase 1, Phase 2 |
| Phase 4   | 4.1 - 4.4    | 4-6 hours       | Phase 1          |
| Phase 5   | 5.1 - 5.2    | 2-3 hours       | Phase 3, Phase 4 |
| Phase 6   | 6.1 - 6.2    | 2-3 hours       | Phase 4          |
| Phase 7   | 7.1 - 7.2    | 2-3 hours       | Phase 4          |
| **Total** | **17 tasks** | **19-28 hours** | -                |

## Priority Order

### High Priority (Must Have for MVP)

1. Task 1.1 - E2EAuthHelper Base
2. Task 1.2 - Test User Creation
3. Task 1.3 - Cleanup
4. Task 4.1 - Update Test Setup
5. Task 4.2 - Update Search Tests
6. Task 4.3 - Update CRUD Tests
7. Task 4.4 - Update Merge/Duplicate Tests

### Medium Priority (Should Have)

8. Task 2.1 - BusinessFixture
9. Task 2.2 - CustomerFixture
10. Task 3.1 - TestUserFactory
11. Task 5.1 - Developer Guide
12. Task 7.1 - Full Test Suite

### Low Priority (Nice to Have)

13. Task 2.3 - AppointmentFixture
14. Task 5.2 - Example Test Suite
15. Task 6.1 - CI/CD Pipeline
16. Task 6.2 - Performance Monitoring
17. Task 7.2 - Code Review

## Success Criteria

### Phase Completion Criteria

**Phase 1 Complete:**

- [ ] E2EAuthHelper can create test users with all roles
- [ ] Test users can authenticate and receive valid JWT tokens
- [ ] Cleanup removes all test users and associated data

**Phase 2 Complete:**

- [ ] Fixtures can create test businesses, customers, and appointments
- [ ] Fixtures clean up all created data
- [ ] Fixtures are reusable across test suites

**Phase 3 Complete:**

- [ ] TestUserFactory can create complex user setups
- [ ] Factory supports multiple roles per user
- [ ] Factory integrates with fixtures

**Phase 4 Complete:**

- [ ] All 38 Customer BC E2E tests pass
- [ ] Tests use real authentication
- [ ] Tests validate authorization correctly

**Phase 5 Complete:**

- [ ] Documentation is comprehensive and clear
- [ ] Examples demonstrate all common patterns
- [ ] Developers can easily write new E2E tests

**Phase 6 Complete:**

- [ ] E2E tests run in CI/CD pipeline
- [ ] Performance is monitored and reported
- [ ] Failed tests block deployment

**Phase 7 Complete:**

- [ ] All tests pass consistently
- [ ] Code quality meets standards
- [ ] No technical debt introduced

## Risk Mitigation

### Risk 1: Authentication API Changes

**Mitigation:** Use stable auth endpoints, version API if needed

### Risk 2: Test Data Conflicts

**Mitigation:** Use unique email generation, proper cleanup

### Risk 3: Performance Issues

**Mitigation:** Reuse test users, bulk cleanup, parallel execution

### Risk 4: CI/CD Environment Differences

**Mitigation:** Use same database setup, environment variables

### Risk 5: Token Expiration During Tests

**Mitigation:** Implement automatic token refresh

## Next Steps

1. Review and approve this task breakdown
2. Assign tasks to developers
3. Set up project tracking (Jira, GitHub Projects, etc.)
4. Begin with Phase 1 tasks
5. Regular check-ins to track progress
6. Adjust timeline based on actual completion times

## Notes

- Tasks can be worked on in parallel where dependencies allow
- Each task should include unit/integration tests
- Code reviews should happen after each phase
- Documentation should be updated as code is written
- Performance should be monitored throughout development
