# E2E Helpers - Bounded Context Separation Proposal

## Problem

Currently, `apps/backend/src/test-utils/e2e-helpers/auth.ts` contains helpers for multiple Bounded Contexts:

1. **Auth BC**: `login()`, `register()`, `refreshToken()`
2. **Account BC**: `createBusinessOwner()`, BusinessOwner creation logic
3. **Business BC**: `createTestBusiness()` (Business entity creation)
4. **Customer BC**: `createCustomer()`, `createTestCustomer()`

This violates the principle of separation of concerns and makes the file harder to maintain.

## Proposed Solution

Separate helpers by Bounded Context into dedicated files:

### New File Structure

```
apps/backend/src/test-utils/e2e-helpers/
├── index.ts          # Re-exports all helpers
├── auth.ts           # Auth BC only
├── account.ts        # Account BC (BusinessOwner)
├── business.ts       # Business BC (Business entity)
├── customer.ts       # Customer BC
├── database.ts       # Database utilities
├── types.ts          # Shared types (organized by BC)
├── capacity.ts       # Availability BC
└── offering.ts       # Offering BC
```

## Detailed Breakdown

### 1. auth.ts (Auth BC)

**Keeps:**

- `login(email, password): Promise<string>`
- `register(userData): Promise<{ token, userId }>`
- `refreshToken(refreshToken): Promise<string>`
- `createTestUser(role, options): Promise<TestUser>` (orchestrator)
- `createAdmin(): Promise<TestUser>`
- `cleanupTestUsers(): Promise<void>`
- Private: `generateTestEmail()`

**Responsibilities:**

- User authentication (login, register, refresh)
- JWT token management
- Test user orchestration (calls other BC helpers)
- Cleanup coordination

### 2. account.ts (Account BC) - NEW

**Contains:**

- `createBusinessOwner(token, options?): Promise<{ businessOwnerId: string }>`
- `createTestBusinessOwner(options?): Promise<TestBusinessOwner>`
- `updateSubscriptionPlan(businessOwnerId, plan): Promise<void>`
- `completeOnboarding(businessOwnerId): Promise<void>`

**Responsibilities:**

- BusinessOwner profile creation
- Subscription management
- Onboarding flow

**Types:**

```typescript
export interface TestBusinessOwner {
  id: string;
  userId: string;
  subscriptionPlan: string;
  onboardingCompleted: boolean;
}

export interface CreateBusinessOwnerOptions {
  subscriptionPlan?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  onboardingCompleted?: boolean;
}
```

### 3. business.ts (Business BC) - NEW

**Contains:**

- `createBusiness(token, businessData): Promise<{ businessId: string }>`
- `createTestBusiness(token, options?): Promise<TestBusiness>`
- `updateBusinessInfo(businessId, data): Promise<void>`
- `deactivateBusiness(businessId): Promise<void>`

**Responsibilities:**

- Business entity creation
- Business configuration
- WhatsApp number management

**Types:**

```typescript
export interface TestBusiness {
  id: string;
  ownerId: string;
  name: string;
  whatsappNumber: string;
  address: BusinessAddress;
  timezone: string;
}

export interface CreateBusinessOptions {
  name?: string;
  whatsappNumber?: string;
  address?: Partial<BusinessAddress>;
  timezone?: string;
}
```

### 4. customer.ts (Customer BC) - NEW

**Contains:**

- `createCustomer(token, customerData): Promise<{ customerId: string }>`
- `createTestCustomer(businessId, options?): Promise<TestCustomer>`
- `linkCustomerToUser(customerId, userId): Promise<void>`
- `unlinkCustomerFromUser(customerId): Promise<void>`

**Responsibilities:**

- Customer profile creation (anonymous and registered)
- Customer-User linking
- Customer data management

**Types:**

```typescript
export interface TestCustomer {
  id: string;
  businessId: string;
  userId: string | null; // null = anonymous
  whatsappPhone: string;
  name: string | null;
}

export interface CreateCustomerOptions {
  businessId: string;
  whatsappPhone?: string;
  name?: string | null;
  userId?: string | null; // For registered customers
}
```

### 5. types.ts (Organized by BC)

```typescript
// ============================================
// AUTH BC
// ============================================

export enum UserRole {
  BUSINESS_OWNER = "BUSINESS_OWNER",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: UserRole;
  businessId?: string; // If BUSINESS_OWNER
  customerId?: string; // If CUSTOMER
  businessOwnerId?: string; // If BUSINESS_OWNER
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  initialRole: UserRole;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
  };
}

export interface RegisterResponse {
  token: string;
  userId: string;
}

// ============================================
// ACCOUNT BC
// ============================================

export interface TestBusinessOwner {
  id: string;
  userId: string;
  subscriptionPlan: string;
  onboardingCompleted: boolean;
}

export interface CreateBusinessOwnerOptions {
  subscriptionPlan?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  onboardingCompleted?: boolean;
}

// ============================================
// BUSINESS BC
// ============================================

export interface TestBusiness {
  id: string;
  ownerId: string;
  name: string;
  whatsappNumber: string;
  address: BusinessAddress;
  timezone: string;
}

export interface BusinessAddress {
  street: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
}

export interface CreateBusinessOptions {
  name?: string;
  whatsappNumber?: string;
  address?: Partial<BusinessAddress>;
  timezone?: string;
}

// ============================================
// CUSTOMER BC
// ============================================

export interface TestCustomer {
  id: string;
  businessId: string;
  userId: string | null;
  whatsappPhone: string;
  name: string | null;
}

export interface CreateCustomerOptions {
  businessId: string;
  whatsappPhone?: string;
  name?: string | null;
  userId?: string | null;
}

// ============================================
// SHARED
// ============================================

export interface CreateTestUserOptions {
  name?: string;
  businessData?: Partial<CreateBusinessOptions>;
  customerData?: Partial<CreateCustomerOptions>;
}
```

### 6. index.ts (Re-exports)

```typescript
// Auth BC
export { E2EAuthHelper } from "./auth";

// Account BC
export * from "./account";

// Business BC
export * from "./business";

// Customer BC
export * from "./customer";

// Database utilities
export * from "./database";

// Types
export * from "./types";

// Other BCs
export * from "./capacity";
export * from "./offering";
```

## Migration Strategy

### Step 1: Create New Files

1. Create `account.ts` with BusinessOwner helpers
2. Create `business.ts` with Business helpers
3. Create `customer.ts` with Customer helpers

### Step 2: Extract Code

1. Move BusinessOwner logic from `auth.ts` to `account.ts`
2. Move Business logic from `auth.ts` to `business.ts`
3. Move Customer logic from `auth.ts` to `customer.ts`

### Step 3: Update auth.ts

Keep only:

- Authentication methods (login, register, refresh)
- Test user orchestration (calls other helpers)
- Cleanup coordination

Update `createTestUser()` to use new helpers:

```typescript
async createTestUser(role: UserRole, options?: CreateTestUserOptions): Promise<TestUser> {
  const email = this.generateTestEmail();
  const password = 'Test123!@#';
  const name = options?.name || 'Test User';

  const { token, userId } = await this.register({
    email,
    password,
    name,
    initialRole: role,
  });

  const testUser: TestUser = {
    id: userId,
    email,
    password,
    token,
    role,
  };

  // If BUSINESS_OWNER, use account helper
  if (role === UserRole.BUSINESS_OWNER) {
    const { businessOwnerId } = await createBusinessOwner(token);
    testUser.businessOwnerId = businessOwnerId;

    // Use business helper
    const { businessId } = await createBusiness(token, options?.businessData);
    testUser.businessId = businessId;

    // Refresh token
    testUser.token = await this.login(email, password);
  }

  // If CUSTOMER, use customer helper
  if (role === UserRole.CUSTOMER && options?.customerData) {
    const { customerId } = await createCustomer(token, options.customerData);
    testUser.customerId = customerId;
  }

  this.testUsers.push(testUser);
  return testUser;
}
```

### Step 4: Update Types

Organize `types.ts` by BC with clear section comments.

### Step 5: Update index.ts

Add re-exports for new files.

### Step 6: Update Test Files

Update imports in test files:

```typescript
// Before
import { E2EAuthHelper } from "@test-utils/e2e-helpers";

// After - specific imports
import { E2EAuthHelper } from "@test-utils/e2e-helpers/auth";
import { createBusinessOwner } from "@test-utils/e2e-helpers/account";
import { createBusiness } from "@test-utils/e2e-helpers/business";
import { createCustomer } from "@test-utils/e2e-helpers/customer";

// Or - use index re-exports
import {
  E2EAuthHelper,
  createBusinessOwner,
  createBusiness,
  createCustomer,
} from "@test-utils/e2e-helpers";
```

## Benefits

1. ✅ **Separation of Concerns**: Each file handles one BC
2. ✅ **Easier Maintenance**: Smaller, focused files
3. ✅ **Better Organization**: Clear BC boundaries
4. ✅ **Reusability**: Helpers can be used independently
5. ✅ **Scalability**: Easy to add new BC helpers
6. ✅ **Follows DDD**: Respects Bounded Context architecture

## Example Usage

### Creating a Business Owner with Business

```typescript
// Using orchestrator (auth.ts)
const businessOwner = await authHelper.createBusinessOwner({
  name: "John Doe",
  whatsappNumber: "+18095551234",
});

// Using individual helpers
const { token, userId } = await authHelper.register({
  email: "john@example.com",
  password: "Test123!",
  name: "John Doe",
  initialRole: UserRole.BUSINESS_OWNER,
});

const { businessOwnerId } = await createBusinessOwner(token);
const { businessId } = await createBusiness(token, {
  name: "My Business",
  whatsappNumber: "+18095551234",
});
```

### Creating an Anonymous Customer

```typescript
const { customerId } = await createCustomer(token, {
  businessId: "business-uuid",
  whatsappPhone: "+18095559999",
  name: null, // Anonymous
  userId: null, // Not linked to User
});
```

### Creating a Registered Customer

```typescript
// First create User
const { token, userId } = await authHelper.register({
  email: "customer@example.com",
  password: "Test123!",
  name: "Jane Doe",
  initialRole: UserRole.CUSTOMER,
});

// Then create Customer linked to User
const { customerId } = await createCustomer(token, {
  businessId: "business-uuid",
  whatsappPhone: "+18095559999",
  name: "Jane Doe",
  userId: userId, // Linked to User
});
```

## Timeline

**Estimated Time:** 45 minutes

1. Create new files (10 min)
2. Extract code (15 min)
3. Update auth.ts (10 min)
4. Update types.ts and index.ts (5 min)
5. Test and verify (5 min)

## Acceptance Criteria

- [ ] `account.ts` created with BusinessOwner helpers
- [ ] `business.ts` created with Business helpers
- [ ] `customer.ts` created with Customer helpers
- [ ] `auth.ts` contains only Auth BC logic
- [ ] `types.ts` organized by BC
- [ ] `index.ts` re-exports all helpers
- [ ] All tests pass with new structure
- [ ] No breaking changes to existing test code

---

**Status:** Proposed  
**Phase:** 8.5  
**Priority:** High (architectural improvement)  
**Date:** December 21, 2024
