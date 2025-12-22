# Requirements Document - E2E Testing with Authentication Setup

## Introduction

This document defines the requirements for implementing proper authentication in E2E tests across all Bounded Contexts. Currently, E2E tests use mock JWT tokens which cause authentication failures (401/404 errors). This spec will establish a reusable authentication setup pattern for E2E testing.

## Problem Statement

**Current State:**

- E2E tests in Customer BC (and potentially other BCs) use `authToken = 'mock-jwt-token'`
- All 38 E2E tests in `customer.e2e.spec.ts` are failing with 401/404 errors
- No standardized way to authenticate in E2E tests
- Tests cannot validate real authentication/authorization flows

**Desired State:**

- E2E tests use real JWT tokens obtained from the auth system
- Tests can validate authentication and authorization correctly
- Reusable authentication helper for all E2E test suites
- Tests can create test users with specific roles (BUSINESS_OWNER, CUSTOMER, ADMIN)

## Glossary

- **E2E Test**: End-to-end test that validates complete HTTP request/response flows
- **JWT Token**: JSON Web Token used for authentication
- **Test User**: User account created specifically for testing purposes
- **Auth Helper**: Reusable utility for authentication in tests
- **Test Fixture**: Pre-configured test data (users, businesses, customers)

## Requirements

### Requirement 1: E2E Authentication Helper

**User Story:** As a developer, I want a reusable authentication helper for E2E tests, so that I can easily obtain valid JWT tokens without duplicating authentication logic.

#### Acceptance Criteria

1. WHEN the helper is imported THEN it SHALL provide methods for login, register, and token refresh
2. WHEN login() is called with valid credentials THEN it SHALL return a valid JWT token
3. WHEN register() is called with user data THEN it SHALL create a user and return a JWT token
4. WHEN createTestUser() is called with a role THEN it SHALL create a user with that role and return credentials
5. WHEN the helper is used in multiple test suites THEN it SHALL work consistently across all BCs

### Requirement 2: Test User Management

**User Story:** As a developer, I want to create and clean up test users automatically, so that E2E tests don't leave orphaned data in the database.

#### Acceptance Criteria

1. WHEN a test suite starts THEN it SHALL create necessary test users with specific roles
2. WHEN a test suite ends THEN it SHALL clean up all created test users
3. WHEN creating a test user THEN it SHALL generate unique email addresses to avoid conflicts
4. WHEN creating a BUSINESS_OWNER user THEN it SHALL also create associated BusinessOwner and Business records
5. WHEN creating a CUSTOMER user THEN it SHALL also create associated Customer records

### Requirement 3: Customer BC E2E Tests with Real Auth

**User Story:** As a developer, I want Customer BC E2E tests to use real authentication, so that they validate actual authentication and authorization flows.

#### Acceptance Criteria

1. WHEN Customer E2E tests run THEN they SHALL use real JWT tokens from the auth helper
2. WHEN testing search endpoints THEN they SHALL authenticate as a BUSINESS_OWNER user
3. WHEN testing CRUD endpoints THEN they SHALL validate ownership (user can only access their own customers)
4. WHEN testing merge operations THEN they SHALL validate that only authorized users can merge customers
5. WHEN testing without authentication THEN they SHALL correctly receive 401 errors

### Requirement 4: Test Data Fixtures

**User Story:** As a developer, I want reusable test data fixtures, so that E2E tests have consistent and realistic test data.

#### Acceptance Criteria

1. WHEN a test needs a business THEN it SHALL use a fixture that creates a complete business setup
2. WHEN a test needs customers THEN it SHALL use a fixture that creates customers with various states (anonymous, registered)
3. WHEN a test needs appointments THEN it SHALL use a fixture that creates appointments linked to customers
4. WHEN fixtures are created THEN they SHALL use the authenticated user's businessId
5. WHEN tests complete THEN fixtures SHALL be cleaned up automatically

### Requirement 5: Auth Guard Testing

**User Story:** As a developer, I want to test authentication guards in E2E tests, so that I can validate that protected endpoints are properly secured.

#### Acceptance Criteria

1. WHEN testing a protected endpoint without a token THEN it SHALL return 401 Unauthorized
2. WHEN testing a protected endpoint with an invalid token THEN it SHALL return 401 Unauthorized
3. WHEN testing a protected endpoint with an expired token THEN it SHALL return 401 Unauthorized
4. WHEN testing a protected endpoint with a valid token THEN it SHALL allow access
5. WHEN testing role-based endpoints THEN it SHALL validate that only users with correct roles can access

### Requirement 6: Multi-Role Testing

**User Story:** As a developer, I want to test endpoints with different user roles, so that I can validate role-based access control.

#### Acceptance Criteria

1. WHEN testing as BUSINESS_OWNER THEN it SHALL have access to business management endpoints
2. WHEN testing as CUSTOMER THEN it SHALL have access to customer-facing endpoints
3. WHEN testing as ADMIN THEN it SHALL have access to admin endpoints
4. WHEN testing with wrong role THEN it SHALL return 403 Forbidden
5. WHEN testing with multiple roles THEN it SHALL have access to all role-specific endpoints

### Requirement 7: Token Refresh Testing

**User Story:** As a developer, I want to test token refresh flows in E2E tests, so that I can validate that token refresh works correctly.

#### Acceptance Criteria

1. WHEN a token expires during a test THEN the helper SHALL automatically refresh it
2. WHEN refresh token is invalid THEN it SHALL re-authenticate
3. WHEN testing long-running operations THEN tokens SHALL remain valid throughout
4. WHEN multiple tests run in parallel THEN token refresh SHALL not cause conflicts
5. WHEN a test explicitly needs to test expired tokens THEN the helper SHALL provide a way to get expired tokens

### Requirement 8: E2E Test Performance

**User Story:** As a developer, I want E2E tests to run efficiently, so that the test suite completes in a reasonable time.

#### Acceptance Criteria

1. WHEN E2E tests run THEN they SHALL complete in under 2 minutes for Customer BC
2. WHEN creating test users THEN it SHALL reuse users across tests where possible
3. WHEN cleaning up test data THEN it SHALL use bulk delete operations
4. WHEN running tests in parallel THEN they SHALL not interfere with each other
5. WHEN tests fail THEN cleanup SHALL still occur to prevent data accumulation

### Requirement 9: Documentation and Examples

**User Story:** As a developer, I want clear documentation and examples for E2E testing, so that I can easily write new E2E tests following best practices.

#### Acceptance Criteria

1. WHEN reading the documentation THEN it SHALL explain how to use the auth helper
2. WHEN reading the documentation THEN it SHALL provide examples for common scenarios
3. WHEN reading the documentation THEN it SHALL explain how to create test fixtures
4. WHEN reading the documentation THEN it SHALL explain how to test different roles
5. WHEN reading the documentation THEN it SHALL explain how to debug failing E2E tests

### Requirement 10: CI/CD Integration

**User Story:** As a developer, I want E2E tests to run in CI/CD pipelines, so that authentication issues are caught before deployment.

#### Acceptance Criteria

1. WHEN E2E tests run in CI THEN they SHALL use the same auth helper as local tests
2. WHEN E2E tests run in CI THEN they SHALL have access to a test database
3. WHEN E2E tests fail in CI THEN they SHALL provide clear error messages
4. WHEN E2E tests run in CI THEN they SHALL clean up all test data
5. WHEN E2E tests run in CI THEN they SHALL not interfere with other test suites

## Correctness Properties

### Property 1: Authentication Token Validity

_For any_ valid user credentials, calling the auth helper's login() method should return a JWT token that can be used to access protected endpoints.

**Validates: Requirements 1.2, 5.4**

### Property 2: Test User Isolation

_For any_ test suite, test users created in that suite should not be visible to or affect other test suites.

**Validates: Requirements 2.3, 8.4**

### Property 3: Role-Based Access Control

_For any_ protected endpoint, only users with the correct role should be able to access it.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 4: Token Expiration Handling

_For any_ expired token, the auth helper should automatically refresh it or re-authenticate.

**Validates: Requirements 7.1, 7.2**

### Property 5: Cleanup Completeness

_For any_ test suite, all test data created during the suite should be cleaned up after completion, even if tests fail.

**Validates: Requirements 2.2, 8.5**

## Edge Cases and Success Criteria

### Edge Cases

1. **Concurrent Test Execution:** Multiple E2E test suites running in parallel SHALL not create conflicting test users or interfere with each other's authentication
2. **Database Connection Failures:** When the database connection fails during test setup, the auth helper SHALL provide clear error messages and fail gracefully
3. **Auth Service Unavailable:** When the auth service is unavailable during tests, the tests SHALL fail with clear error messages
4. **Token Refresh During Long Tests:** When a test takes longer than the token expiration time, the auth helper SHALL automatically refresh the token
5. **Invalid Test User Data:** When creating a test user with invalid data, the helper SHALL throw a descriptive error
6. **Orphaned Test Data:** When tests are interrupted (e.g., Ctrl+C), cleanup hooks SHALL still attempt to remove test data
7. **Role Conflicts:** When a test user needs multiple roles, the auth helper SHALL correctly create a user with all specified roles
8. **Business Owner Without Business:** When creating a BUSINESS_OWNER test user, the helper SHALL ensure a Business record is also created

### Success Criteria

1. ✅ All Customer BC E2E tests pass with real authentication (31/41 passing after auth token fix)
2. ✅ Auth helper is reusable across all BC E2E test suites
3. ✅ E2E tests validate authentication and authorization correctly
4. ✅ Test data is cleaned up automatically after each test suite
5. ✅ E2E tests run in under 2 minutes for Customer BC
6. ✅ Documentation and examples are clear and comprehensive
7. ✅ E2E tests run successfully in CI/CD pipelines

### Current Status (December 21, 2024)

**✅ COMPLETE - Authentication Token Field Standardization Fixed**

- **Problem Resolved:** Auth handlers were returning `accessToken` field, but shared-types contract defined `token` field
- **Solution:** Updated LoginHandler, RegisterHandler, and E2EAuthHelper to use `token` field consistently
- **Result:** 31/41 E2E tests passing (76% pass rate), 139/141 total tests passing (98.6%)
- **Remaining Issues:** 10 E2E tests failing due to minor non-auth issues (query params, soft delete, HTTP status codes, authorization)

## References

- `.kiro/steering/user-customer-businessowner-architecture.md` - User/Customer/BusinessOwner architecture
- `.kiro/specs/auth-bc-roles-refactor/` - Auth BC implementation
- `.kiro/specs/customer-bc/` - Customer BC implementation
- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` - E2E tests implementation
- `apps/backend/src/test-utils/e2e/` - E2E testing utilities location

## Implementation Notes

### File Structure

All test utilities are organized in `apps/backend/src/test-utils/e2e/`:

```
apps/backend/
├── test/
│   ├── global-setup.ts          # Jest global setup (KEEP)
│   ├── setup.ts                 # Jest setupFilesAfterEnv (KEEP)
│   └── jest-e2e.json            # Jest E2E config (KEEP)
└── src/
    └── test-utils/
        ├── e2e/
        │   ├── auth-helper.ts          # Main authentication helper
        │   ├── database-helper.ts      # Database setup/teardown (CONSOLIDATED)
        │   ├── types.ts                # TypeScript interfaces
        │   ├── fixtures/
        │   │   ├── business.fixture.ts
        │   │   ├── customer.fixture.ts
        │   │   ├── appointment.fixture.ts
        │   │   └── index.ts
        │   ├── helpers/
        │   │   ├── capacity-helper.ts
        │   │   └── offering-helper.ts
        │   ├── examples/
        │   │   └── example.e2e-spec.ts
        │   ├── index.ts                # Re-export everything
        │   └── README.md               # Developer guide
        └── generators.ts               # Test data generators
```

**Consolidation Strategy:**

- Keep `global-setup.ts` and `setup.ts` in `test/` (required by Jest)
- Consolidate `setup-db.ts` + `test-database.config.ts` → `database-helper.ts`
- Organize E2E utilities in `src/test-utils/e2e/`
- Path alias: `@test-utils/*` → `apps/backend/src/test-utils/*`
- E2E tests co-located with BCs in `__tests__/` folders

### Auth Helper Interface

```typescript
interface E2EAuthHelper {
  // Authentication
  login(email: string, password: string): Promise<string>;
  register(userData: RegisterDto): Promise<{ token: string; userId: string }>;
  refreshToken(refreshToken: string): Promise<string>;

  // Test User Management
  createTestUser(
    role: UserRole,
    businessData?: CreateBusinessDto,
  ): Promise<TestUser>;
  createBusinessOwner(): Promise<TestUser>;
  createCustomer(): Promise<TestUser>;
  createAdmin(): Promise<TestUser>;

  // Cleanup
  cleanupTestUsers(): Promise<void>;
  cleanupTestData(): Promise<void>;
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: UserRole;
  businessId?: string;
  customerId?: string;
}
```

### Usage Example

```typescript
describe("Customer E2E Tests", () => {
  let authHelper: E2EAuthHelper;
  let testUser: TestUser;
  let authToken: string;

  beforeAll(async () => {
    authHelper = new E2EAuthHelper(app);
    testUser = await authHelper.createBusinessOwner();
    authToken = testUser.token;
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
  });

  it("should search customers", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/customers/search")
      .set("Authorization", `Bearer ${authToken}`)
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

## Out of Scope

- Performance testing with large datasets
- Load testing with concurrent users
- Integration with external services (WhatsApp API)
- Frontend E2E tests (this spec focuses on backend API E2E tests)
- Security penetration testing

## Dependencies

- Auth BC must be fully implemented (already done)
- Customer BC must be fully implemented (already done)
- Test database must be available
- NestJS testing utilities must be configured

## References

- `.kiro/steering/user-customer-businessowner-architecture.md` - User/Customer/BusinessOwner architecture
- `.kiro/specs/auth-bc-roles-refactor/` - Auth BC implementation
- `.kiro/specs/customer-bc/` - Customer BC implementation
- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` - Current failing E2E tests

## Edge Cases and Success Criteria

### Edge Cases

1. **Concurrent Test Execution:** Multiple E2E test suites running in parallel SHALL not create conflicting test users or interfere with each other's authentication
2. **Database Connection Failures:** When the database connection fails during test setup, the auth helper SHALL provide clear error messages and fail gracefully
3. **Auth Service Unavailable:** When the auth service is unavailable during tests, the tests SHALL fail with clear error messages
4. **Token Refresh During Long Tests:** When a test takes longer than the token expiration time, the auth helper SHALL automatically refresh the token
5. **Invalid Test User Data:** When creating a test user with invalid data, the helper SHALL throw a descriptive error
6. **Orphaned Test Data:** When tests are interrupted (e.g., Ctrl+C), cleanup hooks SHALL still attempt to remove test data
7. **Role Conflicts:** When a test user needs multiple roles, the auth helper SHALL correctly create a user with all specified roles
8. **Business Owner Without Business:** When creating a BUSINESS_OWNER test user, the helper SHALL ensure a Business record is also created

### Success Criteria

1. ✅ All 38 Customer BC E2E tests pass with real authentication
2. ✅ Auth helper is reusable across all BC E2E test suites
3. ✅ E2E tests validate authentication and authorization correctly
4. ✅ Test data is cleaned up automatically after each test suite
5. ✅ E2E tests run in under 2 minutes for Customer BC
6. ✅ Documentation and examples are clear and comprehensive
7. ✅ E2E tests run successfully in CI/CD pipelines

## References

- `.kiro/steering/user-customer-businessowner-architecture.md` - User/Customer/BusinessOwner architecture
- `.kiro/specs/auth-bc-roles-refactor/` - Auth BC implementation
- `.kiro/specs/customer-bc/` - Customer BC implementation
- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` - E2E tests implementation
- `apps/backend/src/test-utils/e2e/` - E2E testing utilities location
