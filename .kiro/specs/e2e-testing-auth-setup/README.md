# E2E Testing with Authentication Setup - Spec

## Status: ⚠️ BLOCKED - Business BC Required

**Progress:** 59% Complete (10/17 tasks)

**Critical Blocker:** Business BC endpoint (`POST /api/businesses`) doesn't exist. All 38 Customer E2E tests are written but failing with 404 errors.

**Action Required:** Implement Business BC before E2E tests can run successfully.

**Note:** Auth BC is already implemented and working correctly. The blocker is specifically the Business BC.

---

## Overview

This spec defines the implementation of proper authentication for E2E tests across all Bounded Contexts. Currently, E2E tests use mock JWT tokens which cause authentication failures. This spec establishes a reusable authentication setup pattern.

## Problem

**Current State:**

- Customer BC E2E tests: 38 tests failing (all with 401/404 errors)
- Mock JWT token: `'mock-jwt-token'` doesn't work with real auth guards
- No standardized authentication setup for E2E tests
- Cannot validate real authentication/authorization flows

**Impact:**

- E2E tests don't validate actual security
- Authentication bugs can slip through to production
- No confidence in authorization logic
- Difficult to add new E2E tests

## Solution

Create a comprehensive E2E testing infrastructure with:

1. **E2EAuthHelper** - Reusable authentication helper
2. **TestUserFactory** - Factory for creating test users with complex setups
3. **Test Fixtures** - Reusable test data creation (Business, Customer, Appointment)
4. **Documentation** - Clear guide with examples
5. **CI/CD Integration** - E2E tests run in pipeline

## Key Features

### 1. Real Authentication

- Obtain JWT tokens from actual auth endpoints
- Test real authentication flows
- Validate token expiration and refresh

### 2. Role-Based Testing

- Create users with specific roles (BUSINESS_OWNER, CUSTOMER, ADMIN)
- Test role-based access control
- Support multiple roles per user (marketplace scenario)

### 3. Automatic Cleanup

- Track all created test users
- Clean up associated data (businesses, customers, appointments)
- Handle cleanup even if tests fail

### 4. Reusable Fixtures

- Create realistic test data
- Consistent data across test suites
- Easy to use and extend

### 5. Performance Optimized

- Reuse test users where possible
- Bulk cleanup operations
- Parallel test execution support

## Documents

### Core Documentation

#### [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) ⭐ START HERE

One-page quick reference with current status, blocker, and next steps.

#### [SUMMARY.md](./SUMMARY.md)

Executive summary with complete overview of what's done, what's blocked, and what's next.

#### [STATUS.md](./STATUS.md)

Detailed current status with completed work, remaining work, and blocker analysis.

#### [NEXT_STEPS.md](./NEXT_STEPS.md)

Action plan for unblocking and completing the E2E testing infrastructure.

#### [ARCHITECTURE.md](./ARCHITECTURE.md)

Visual diagrams showing system architecture, data flow, and component dependencies.

### Original Spec Documents

#### [requirements.md](./requirements.md)

Detailed requirements with user stories, acceptance criteria, and correctness properties.

**Key Requirements:**

- Requirement 1: E2E Authentication Helper
- Requirement 2: Test User Management
- Requirement 3: Customer BC E2E Tests with Real Auth
- Requirement 4: Test Data Fixtures
- Requirement 5: Auth Guard Testing
- Requirement 6: Multi-Role Testing
- Requirement 7: Token Refresh Testing
- Requirement 8: E2E Test Performance
- Requirement 9: Documentation and Examples
- Requirement 10: CI/CD Integration

#### [design.md](./design.md)

Technical design with architecture, component diagrams, and implementation details.

**Key Components:**

- E2EAuthHelper class
- TestUserFactory class
- Test Fixtures (Business, Customer, Appointment)
- Data flow diagrams
- Error handling strategies
- Performance considerations

#### [tasks.md](./tasks.md)

Breakdown of implementation into 17 manageable tasks across 7 phases.

**Phases:**

1. Core Infrastructure (4-6 hours) ✅ COMPLETE
2. Test Fixtures (3-4 hours) ✅ COMPLETE
3. TestUserFactory (2-3 hours) ❌ OPTIONAL (can skip)
4. Update Customer BC E2E Tests (4-6 hours) ✅ COMPLETE (blocked by Business BC)
5. Documentation and Examples (2-3 hours) ⏳ PENDING
6. CI/CD Integration (2-3 hours) ⏳ PENDING
7. Testing and Validation (2-3 hours) ⏳ PENDING

**Total Estimated Time:** 19-28 hours (10-12 hours remaining after Business BC)

## Quick Start (After Implementation)

```typescript
import { E2EAuthHelper } from "@test-utils/e2e/auth-helper";

describe("My E2E Tests", () => {
  let authHelper: E2EAuthHelper;
  let testUser: TestUser;

  beforeAll(async () => {
    authHelper = new E2EAuthHelper(app);
    testUser = await authHelper.createBusinessOwner();
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
  });

  it("should access protected endpoint", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/customers/search")
      .set("Authorization", `Bearer ${testUser.token}`)
      .expect(200);

    expect(response.body).toHaveProperty("customers");
  });
});
```

## Success Criteria

1. ✅ All 38 Customer BC E2E tests pass with real authentication
2. ✅ Auth helper is reusable across all BC E2E test suites
3. ✅ E2E tests validate authentication and authorization correctly
4. ✅ Test data is cleaned up automatically after each test suite
5. ✅ E2E tests run in under 2 minutes for Customer BC
6. ✅ Documentation and examples are clear and comprehensive
7. ✅ E2E tests run successfully in CI/CD pipelines

## Benefits

### For Developers

- Easy to write new E2E tests
- Consistent authentication setup
- Clear examples and documentation
- Fast test execution

### For Quality

- Real authentication validation
- Authorization testing
- Catch security bugs early
- Confidence in production code

### For CI/CD

- Automated E2E testing
- Fast feedback on PRs
- Block deployment on failures
- Performance monitoring

## Timeline

| Phase     | Duration        | Deliverable                             |
| --------- | --------------- | --------------------------------------- |
| Phase 1   | 4-6 hours       | E2EAuthHelper with cleanup              |
| Phase 2   | 3-4 hours       | Test fixtures                           |
| Phase 3   | 2-3 hours       | TestUserFactory                         |
| Phase 4   | 4-6 hours       | Customer BC E2E tests passing           |
| Phase 5   | 2-3 hours       | Documentation complete                  |
| Phase 6   | 2-3 hours       | CI/CD integration                       |
| Phase 7   | 2-3 hours       | Code review and validation              |
| **Total** | **19-28 hours** | **Complete E2E testing infrastructure** |

## Dependencies

### Required

- Auth BC fully implemented ✅ (already exists at `apps/backend/src/auth/`)
- Customer BC fully implemented ✅ (already exists at `apps/backend/src/customer/`)
- **Business BC** ❌ **MISSING** - Critical blocker (need `apps/backend/src/business/`)
- Test database available ✅
- NestJS testing utilities configured ✅

### Optional

- CI/CD pipeline configured
- Performance monitoring tools

## Out of Scope

- Performance testing with large datasets
- Load testing with concurrent users
- Integration with external services (WhatsApp API)
- Frontend E2E tests
- Security penetration testing

## Next Steps

1. **Review Spec** - Review requirements, design, and tasks
2. **Approve Spec** - Get approval from team lead
3. **Assign Tasks** - Assign Phase 1 tasks to developers
4. **Begin Implementation** - Start with Task 1.1 (E2EAuthHelper Base)
5. **Track Progress** - Regular check-ins and updates
6. **Iterate** - Adjust based on learnings

## Related Specs

- `.kiro/specs/customer-bc/` - Customer BC implementation
- `.kiro/specs/auth-bc-roles-refactor/` - Auth BC implementation
- `.kiro/steering/user-customer-businessowner-architecture.md` - Identity architecture

## Questions?

For questions or clarifications:

1. Review the requirements.md for detailed acceptance criteria
2. Check the design.md for technical implementation details
3. See tasks.md for specific task breakdown
4. Ask in #dev-help Slack channel

## Status

- **Created:** December 20, 2024
- **Status:** 📝 Draft - Ready for Review
- **Owner:** Development Team
- **Priority:** High (blocks E2E testing validation)

---

**Last Updated:** December 20, 2024
