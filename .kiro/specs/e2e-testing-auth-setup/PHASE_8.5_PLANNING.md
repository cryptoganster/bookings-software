# Phase 8.5 Planning - BC Separation Complete ✅

## What We Did

Documented the proposal for separating E2E helpers by Bounded Context to maintain clean architecture and follow DDD principles.

## Problem Identified

The current `auth.ts` file contains helpers for multiple Bounded Contexts:

```typescript
// auth.ts currently has:
- Auth BC: login(), register(), refreshToken()
- Account BC: createBusinessOwner(), BusinessOwner logic
- Business BC: createTestBusiness() (Business entity)
- Customer BC: createCustomer(), createTestCustomer()
```

This violates separation of concerns and makes the file harder to maintain.

## Solution Proposed

Create dedicated files for each Bounded Context:

```
apps/backend/src/test-utils/e2e-helpers/
├── auth.ts           # Auth BC only (login, register, refresh)
├── account.ts        # Account BC (BusinessOwner) - NEW
├── business.ts       # Business BC (Business entity) - NEW
├── customer.ts       # Customer BC - NEW
├── database.ts       # Database utilities
├── types.ts          # Organized by BC
├── capacity.ts       # Availability BC
├── offering.ts       # Offering BC
└── index.ts          # Re-exports all
```

## Files Created

1. ✅ **BC_SEPARATION_PROPOSAL.md** - Complete proposal document with:
   - Problem statement
   - Detailed breakdown of each file
   - Migration strategy (6 steps)
   - Code examples
   - Benefits
   - Timeline (45 min)
   - Acceptance criteria

2. ✅ **PHASE_8.5_PLANNING.md** - This file (planning summary)

## Key Design Decisions

### 1. auth.ts Becomes Orchestrator

```typescript
// auth.ts keeps:
- Authentication methods (login, register, refresh)
- createTestUser() - orchestrates other BC helpers
- createAdmin(), createBusinessOwner(), createCustomer() - convenience methods
- cleanupTestUsers() - cleanup coordination
```

### 2. New BC-Specific Files

**account.ts (Account BC)**

```typescript
export async function createBusinessOwner(
  token: string,
  options?: CreateBusinessOwnerOptions,
): Promise<{ businessOwnerId: string }> {
  // BusinessOwner creation logic
}
```

**business.ts (Business BC)**

```typescript
export async function createBusiness(
  token: string,
  options?: CreateBusinessOptions,
): Promise<{ businessId: string }> {
  // Business entity creation logic
}
```

**customer.ts (Customer BC)**

```typescript
export async function createCustomer(
  token: string,
  options?: CreateCustomerOptions,
): Promise<{ customerId: string }> {
  // Customer creation logic (anonymous or registered)
}
```

### 3. Types Organized by BC

```typescript
// types.ts structure:
// ============================================
// AUTH BC
// ============================================
export interface TestUser { ... }
export enum UserRole { ... }

// ============================================
// ACCOUNT BC
// ============================================
export interface TestBusinessOwner { ... }

// ============================================
// BUSINESS BC
// ============================================
export interface TestBusiness { ... }

// ============================================
// CUSTOMER BC
// ============================================
export interface TestCustomer { ... }
```

## Migration Strategy

### Step 1: Create New Files (10 min)

- Create `account.ts`
- Create `business.ts`
- Create `customer.ts`

### Step 2: Extract Code (15 min)

- Move BusinessOwner logic to `account.ts`
- Move Business logic to `business.ts`
- Move Customer logic to `customer.ts`

### Step 3: Update auth.ts (10 min)

- Keep only Auth BC methods
- Update `createTestUser()` to use new helpers
- Keep orchestration logic

### Step 4: Update Types (5 min)

- Organize `types.ts` by BC
- Add section comments

### Step 5: Update index.ts (5 min)

- Add re-exports for new files

### Step 6: Test (5 min)

- Verify all tests pass
- Check imports work correctly

## Benefits

1. ✅ **Separation of Concerns** - Each file handles one BC
2. ✅ **Easier Maintenance** - Smaller, focused files
3. ✅ **Better Organization** - Clear BC boundaries
4. ✅ **Reusability** - Helpers can be used independently
5. ✅ **Scalability** - Easy to add new BC helpers
6. ✅ **Follows DDD** - Respects Bounded Context architecture

## Example Usage After Migration

### Before (Current)

```typescript
import { E2EAuthHelper } from "@test-utils/e2e-helpers";

const authHelper = new E2EAuthHelper(app);
const businessOwner = await authHelper.createBusinessOwner();
```

### After (Proposed)

```typescript
// Option 1: Use orchestrator
import { E2EAuthHelper } from '@test-utils/e2e-helpers';

const authHelper = new E2EAuthHelper(app);
const businessOwner = await authHelper.createBusinessOwner();

// Option 2: Use individual helpers
import {
  E2EAuthHelper,
  createBusinessOwner,
  createBusiness
} from '@test-utils/e2e-helpers';

const { token, userId } = await authHelper.register({ ... });
const { businessOwnerId } = await createBusinessOwner(token);
const { businessId } = await createBusiness(token, { ... });
```

## Timeline

**Estimated:** 45 minutes  
**Actual:** TBD (not yet implemented)

## Next Steps

1. Review proposal with team
2. Get approval for BC separation
3. Implement Phase 8.5 (45 min)
4. Update test files to use new structure
5. Verify all tests pass

## Acceptance Criteria

- [ ] `account.ts` created with BusinessOwner helpers
- [ ] `business.ts` created with Business helpers
- [ ] `customer.ts` created with Customer helpers
- [ ] `auth.ts` contains only Auth BC logic
- [ ] `types.ts` organized by BC with section comments
- [ ] `index.ts` re-exports all helpers
- [ ] All tests pass with new structure
- [ ] No breaking changes to existing test code
- [ ] Documentation updated

## Related Documents

- **Proposal:** `.kiro/specs/e2e-testing-auth-setup/BC_SEPARATION_PROPOSAL.md`
- **Tasks:** `.kiro/specs/e2e-testing-auth-setup/tasks.md` (Phase 8.5)
- **Architecture:** `.kiro/steering/user-customer-businessowner-architecture.md`
- **Bounded Contexts:** `.kiro/steering/bounded-contexts.md`

---

**Status:** Planning Complete ✅  
**Phase:** 8.5  
**Date:** December 21, 2024  
**Next:** Ready for implementation
