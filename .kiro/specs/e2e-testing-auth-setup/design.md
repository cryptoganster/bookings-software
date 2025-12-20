# Design Document - E2E Testing with Authentication Setup

## Overview

This document outlines the technical design for implementing proper authentication in E2E tests. The design focuses on creating a reusable authentication helper that can be used across all Bounded Context E2E test suites.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Test Suite                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           E2EAuthHelper                              │  │
│  │  - login()                                           │  │
│  │  - register()                                        │  │
│  │  - createTestUser()                                  │  │
│  │  - cleanupTestUsers()                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                    ↓                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         TestUserFactory                              │  │
│  │  - createBusinessOwner()                             │  │
│  │  - createCustomer()                                  │  │
│  │  - createAdmin()                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                    ↓                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Test Fixtures                                │  │
│  │  - BusinessFixture                                   │  │
│  │  - CustomerFixture                                   │  │
│  │  - AppointmentFixture                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application                              │
│  - Auth BC (login, register, token refresh)                │
│  - Customer BC (customer operations)                        │
│  - Business BC (business operations)                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. E2EAuthHelper

**Location:** `apps/backend/src/test-utils/e2e/auth-helper.ts`

**Responsibilities:**

- Authenticate users and obtain JWT tokens
- Create test users with specific roles
- Manage token refresh
- Clean up test users after tests

**Interface:**

```typescript
export class E2EAuthHelper {
  constructor(private readonly app: INestApplication) {}

  /**
   * Login with email and password
   * @returns JWT access token
   */
  async login(email: string, password: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    return response.body.accessToken;
  }

  /**
   * Register a new user
   * @returns JWT access token and user ID
   */
  async register(
    userData: RegisterDto,
  ): Promise<{ token: string; userId: string }> {
    const response = await request(this.app.getHttpServer())
      .post("/api/auth/register")
      .send(userData)
      .expect(201);

    return {
      token: response.body.accessToken,
      userId: response.body.user.id,
    };
  }

  /**
   * Create a test user with specific role
   * @returns Test user with credentials and token
   */
  async createTestUser(
    role: UserRole,
    options?: CreateTestUserOptions,
  ): Promise<TestUser> {
    const email = this.generateTestEmail();
    const password = "Test123!@#";
    const name = options?.name || "Test User";

    const { token, userId } = await this.register({
      email,
      password,
      name,
      role,
    });

    const testUser: TestUser = {
      id: userId,
      email,
      password,
      token,
      role,
    };

    // If BUSINESS_OWNER, create associated Business
    if (role === UserRole.BUSINESS_OWNER) {
      const business = await this.createTestBusiness(
        token,
        options?.businessData,
      );
      testUser.businessId = business.id;
    }

    // If CUSTOMER, create associated Customer
    if (role === UserRole.CUSTOMER) {
      const customer = await this.createTestCustomer(
        token,
        options?.customerData,
      );
      testUser.customerId = customer.id;
    }

    this.testUsers.push(testUser);
    return testUser;
  }

  /**
   * Create a BUSINESS_OWNER test user with business
   */
  async createBusinessOwner(
    businessData?: Partial<CreateBusinessDto>,
  ): Promise<TestUser> {
    return this.createTestUser(UserRole.BUSINESS_OWNER, { businessData });
  }

  /**
   * Create a CUSTOMER test user
   */
  async createCustomer(
    customerData?: Partial<CreateCustomerDto>,
  ): Promise<TestUser> {
    return this.createTestUser(UserRole.CUSTOMER, { customerData });
  }

  /**
   * Create an ADMIN test user
   */
  async createAdmin(): Promise<TestUser> {
    return this.createTestUser(UserRole.ADMIN);
  }

  /**
   * Refresh an access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    return response.body.accessToken;
  }

  /**
   * Clean up all test users created during tests
   */
  async cleanupTestUsers(): Promise<void> {
    const dataSource = this.app.get(DataSource);

    for (const testUser of this.testUsers) {
      // Delete associated data first (due to foreign keys)
      if (testUser.businessId) {
        await dataSource.query("DELETE FROM businesses WHERE id = $1", [
          testUser.businessId,
        ]);
      }
      if (testUser.customerId) {
        await dataSource.query("DELETE FROM customers WHERE id = $1", [
          testUser.customerId,
        ]);
      }

      // Delete user
      await dataSource.query("DELETE FROM users WHERE id = $1", [testUser.id]);
    }

    this.testUsers = [];
  }

  /**
   * Generate unique test email
   */
  private generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  private testUsers: TestUser[] = [];
}
```

### 2. TestUserFactory

**Location:** `apps/backend/src/test-utils/e2e/test-user-factory.ts`

**Responsibilities:**

- Factory methods for creating test users with specific configurations
- Generate realistic test data
- Handle complex user setups (e.g., user with multiple roles)

**Interface:**

```typescript
export class TestUserFactory {
  constructor(private readonly authHelper: E2EAuthHelper) {}

  /**
   * Create a business owner with a complete business setup
   */
  async createBusinessOwnerWithBusiness(
    businessConfig?: Partial<BusinessConfig>,
  ): Promise<TestBusinessOwner> {
    const testUser = await this.authHelper.createBusinessOwner({
      name: businessConfig?.businessName || "Test Business",
      whatsappNumber: businessConfig?.whatsappNumber || "+18095551234",
      address: businessConfig?.address || "123 Test St",
      timezone: businessConfig?.timezone || "America/Santo_Domingo",
    });

    return {
      ...testUser,
      business: {
        id: testUser.businessId!,
        name: businessConfig?.businessName || "Test Business",
      },
    };
  }

  /**
   * Create a customer linked to a specific business
   */
  async createCustomerForBusiness(
    businessId: string,
    customerConfig?: Partial<CustomerConfig>,
  ): Promise<TestCustomer> {
    const testUser = await this.authHelper.createCustomer({
      businessId,
      whatsappPhone: customerConfig?.whatsappPhone || "+18095559999",
      name: customerConfig?.name || "Test Customer",
    });

    return {
      ...testUser,
      customer: {
        id: testUser.customerId!,
        businessId,
      },
    };
  }

  /**
   * Create a user with multiple roles (marketplace scenario)
   */
  async createUserWithMultipleRoles(roles: UserRole[]): Promise<TestUser> {
    // Create user with first role
    const testUser = await this.authHelper.createTestUser(roles[0]);

    // Add additional roles
    for (let i = 1; i < roles.length; i++) {
      await this.addRoleToUser(testUser.id, roles[i], testUser.token);
    }

    testUser.role = roles; // Update to array of roles
    return testUser;
  }

  private async addRoleToUser(
    userId: string,
    role: UserRole,
    token: string,
  ): Promise<void> {
    // Call API to add role (this would be an admin endpoint)
    // For now, directly update database
    const dataSource = this.authHelper["app"].get(DataSource);
    await dataSource.query(
      "UPDATE users SET roles = array_append(roles, $1) WHERE id = $2",
      [role, userId],
    );
  }
}
```

### 3. Test Fixtures

**Location:** `apps/backend/src/test-utils/e2e/fixtures/`

**Responsibilities:**

- Create realistic test data
- Provide reusable data setups for common scenarios
- Clean up fixture data after tests

#### BusinessFixture

```typescript
export class BusinessFixture {
  constructor(
    private readonly app: INestApplication,
    private readonly authToken: string,
  ) {}

  async createBusiness(data?: Partial<CreateBusinessDto>): Promise<Business> {
    const response = await request(this.app.getHttpServer())
      .post("/api/businesses")
      .set("Authorization", `Bearer ${this.authToken}`)
      .send({
        name: data?.name || "Test Business",
        whatsappNumber: data?.whatsappNumber || "+18095551234",
        address: data?.address || "123 Test St",
        timezone: data?.timezone || "America/Santo_Domingo",
      })
      .expect(201);

    this.createdBusinesses.push(response.body.id);
    return response.body;
  }

  async cleanup(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    for (const businessId of this.createdBusinesses) {
      await dataSource.query("DELETE FROM businesses WHERE id = $1", [
        businessId,
      ]);
    }
    this.createdBusinesses = [];
  }

  private createdBusinesses: string[] = [];
}
```

#### CustomerFixture

```typescript
export class CustomerFixture {
  constructor(
    private readonly app: INestApplication,
    private readonly authToken: string,
    private readonly businessId: string,
  ) {}

  async createAnonymousCustomer(whatsappPhone?: string): Promise<Customer> {
    const dataSource = this.app.get(DataSource);
    const customer = {
      id: UUID.generate().getValue(),
      business_id: this.businessId,
      whatsapp_phone:
        whatsappPhone || `+1809555${Math.floor(1000 + Math.random() * 9000)}`,
      name: null,
      user_id: null,
    };

    await dataSource.getRepository(CustomerModel).save(customer);
    this.createdCustomers.push(customer.id);
    return customer;
  }

  async createRegisteredCustomer(
    userId: string,
    whatsappPhone?: string,
    name?: string,
  ): Promise<Customer> {
    const dataSource = this.app.get(DataSource);
    const customer = {
      id: UUID.generate().getValue(),
      business_id: this.businessId,
      whatsapp_phone:
        whatsappPhone || `+1809555${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || "Test Customer",
      user_id: userId,
    };

    await dataSource.getRepository(CustomerModel).save(customer);
    this.createdCustomers.push(customer.id);
    return customer;
  }

  async createMultipleCustomers(count: number): Promise<Customer[]> {
    const customers: Customer[] = [];
    for (let i = 0; i < count; i++) {
      const customer = await this.createAnonymousCustomer();
      customers.push(customer);
    }
    return customers;
  }

  async cleanup(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    for (const customerId of this.createdCustomers) {
      await dataSource.query("DELETE FROM customers WHERE id = $1", [
        customerId,
      ]);
    }
    this.createdCustomers = [];
  }

  private createdCustomers: string[] = [];
}
```

## Data Flow

### Test Setup Flow

```
1. Test Suite Starts
   ↓
2. Create E2EAuthHelper
   ↓
3. Create Test User (e.g., BUSINESS_OWNER)
   ↓
4. Register User via /api/auth/register
   ↓
5. Receive JWT Token
   ↓
6. Create Associated Records (Business, Customer, etc.)
   ↓
7. Store Test User in Helper
   ↓
8. Tests Execute with Valid Token
   ↓
9. Test Suite Ends
   ↓
10. Cleanup Test Users and Data
```

### Authentication Flow

```
1. Test Needs Authentication
   ↓
2. Call authHelper.createBusinessOwner()
   ↓
3. Helper Calls /api/auth/register
   ↓
4. Auth BC Creates User with Role
   ↓
5. Auth BC Returns JWT Token
   ↓
6. Helper Creates Business (if BUSINESS_OWNER)
   ↓
7. Helper Returns TestUser with Token
   ↓
8. Test Uses Token in Authorization Header
   ↓
9. Request Passes Through JWT Guard
   ↓
10. Endpoint Validates User and Role
```

## Database Schema Considerations

### Test User Identification

To easily identify and clean up test users, we'll use a consistent email pattern:

```
test-{timestamp}-{random}@example.com
```

This allows us to:

1. Identify test users by email pattern
2. Avoid conflicts with real users
3. Clean up orphaned test data if needed

### Cleanup Strategy

1. **Cascade Deletes:** Rely on database foreign key constraints with `ON DELETE CASCADE` where appropriate
2. **Manual Cleanup:** For complex relationships, manually delete in correct order
3. **Bulk Operations:** Use bulk delete queries for efficiency

## Error Handling

### Authentication Failures

```typescript
try {
  const token = await authHelper.login(email, password);
} catch (error) {
  if (error.status === 401) {
    throw new Error("Authentication failed: Invalid credentials");
  }
  if (error.status === 500) {
    throw new Error("Authentication failed: Server error");
  }
  throw error;
}
```

### Token Expiration

```typescript
async makeAuthenticatedRequest(url: string, token: string): Promise<any> {
  try {
    return await request(this.app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  } catch (error) {
    if (error.status === 401) {
      // Token expired, refresh and retry
      const newToken = await this.authHelper.refreshToken(refreshToken);
      return await request(this.app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);
    }
    throw error;
  }
}
```

### Cleanup Failures

```typescript
async cleanupTestUsers(): Promise<void> {
  const errors: Error[] = [];

  for (const testUser of this.testUsers) {
    try {
      await this.deleteTestUser(testUser);
    } catch (error) {
      errors.push(error);
      console.error(`Failed to cleanup test user ${testUser.id}:`, error);
    }
  }

  if (errors.length > 0) {
    console.warn(`Cleanup completed with ${errors.length} errors`);
  }
}
```

## Performance Considerations

### Test User Reuse

For tests that don't modify user data, reuse the same test user:

```typescript
describe("Customer Search E2E", () => {
  let sharedTestUser: TestUser;

  beforeAll(async () => {
    sharedTestUser = await authHelper.createBusinessOwner();
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
  });

  // All tests use sharedTestUser
});
```

### Parallel Test Execution

Ensure test users don't conflict:

```typescript
// Each test suite gets unique test users
const testUser = await authHelper.createBusinessOwner();
// Email will be unique: test-1234567890-abc123@example.com
```

### Bulk Cleanup

Use bulk delete operations:

```typescript
async cleanupTestUsers(): Promise<void> {
  const dataSource = this.app.get(DataSource);
  const userIds = this.testUsers.map(u => u.id);

  // Bulk delete
  await dataSource.query(
    'DELETE FROM users WHERE id = ANY($1)',
    [userIds],
  );
}
```

## Testing Strategy

### Unit Tests for Auth Helper

```typescript
describe("E2EAuthHelper", () => {
  it("should generate unique test emails", () => {
    const email1 = authHelper["generateTestEmail"]();
    const email2 = authHelper["generateTestEmail"]();
    expect(email1).not.toBe(email2);
  });

  it("should create business owner with business", async () => {
    const testUser = await authHelper.createBusinessOwner();
    expect(testUser.role).toBe(UserRole.BUSINESS_OWNER);
    expect(testUser.businessId).toBeDefined();
  });
});
```

### Integration Tests for Fixtures

```typescript
describe("CustomerFixture", () => {
  it("should create anonymous customer", async () => {
    const customer = await customerFixture.createAnonymousCustomer();
    expect(customer.user_id).toBeNull();
    expect(customer.whatsapp_phone).toMatch(/^\+1809555\d{4}$/);
  });
});
```

## Migration Path

### Phase 1: Create Auth Helper and Fixtures

- Implement E2EAuthHelper
- Implement TestUserFactory
- Implement basic fixtures (Business, Customer)

### Phase 2: Update Customer BC E2E Tests

- Replace mock tokens with real authentication
- Add proper test setup and cleanup
- Validate all 38 tests pass

### Phase 3: Document and Standardize

- Create documentation with examples
- Add to developer guide
- Create templates for new E2E tests

### Phase 4: Apply to Other BCs

- Update other BC E2E tests to use auth helper
- Ensure consistency across all test suites

## Security Considerations

### Test User Credentials

- Use strong passwords for test users
- Don't hardcode sensitive data
- Clean up test users after tests

### Token Management

- Don't log tokens in test output
- Refresh tokens before expiration
- Invalidate tokens after tests

### Database Access

- Use test database, never production
- Ensure proper isolation between test suites
- Clean up all test data

## Documentation

### Developer Guide Section

````markdown
# E2E Testing with Authentication

## Quick Start

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
      .get("/api/protected")
      .set("Authorization", `Bearer ${testUser.token}`)
      .expect(200);
  });
});
```
````

## Common Patterns

### Testing Different Roles

```typescript
const businessOwner = await authHelper.createBusinessOwner();
const customer = await authHelper.createCustomer();
const admin = await authHelper.createAdmin();
```

### Testing Authorization

```typescript
it("should deny access without correct role", async () => {
  const customer = await authHelper.createCustomer();

  await request(app.getHttpServer())
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${customer.token}`)
    .expect(403); // Forbidden
});
```

```

## Success Metrics

1. **Test Pass Rate:** 100% of Customer BC E2E tests pass
2. **Test Execution Time:** < 2 minutes for Customer BC E2E suite
3. **Code Reuse:** Auth helper used in all BC E2E test suites
4. **Documentation:** Complete guide with examples
5. **CI/CD Integration:** E2E tests run successfully in pipeline

## Future Enhancements

1. **Token Caching:** Cache tokens for faster test execution
2. **Test Data Seeding:** Pre-seed common test data
3. **Parallel Execution:** Optimize for parallel test runs
4. **Performance Monitoring:** Track E2E test execution times
5. **Visual Test Reports:** Generate HTML reports for E2E tests
```
