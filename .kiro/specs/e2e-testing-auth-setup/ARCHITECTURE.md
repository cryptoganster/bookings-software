# E2E Testing Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Test Suite                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Customer E2E Tests (38 tests)                           │  │
│  │  - Search Operations (11 tests)                          │  │
│  │  - CRUD Operations (15 tests)                            │  │
│  │  - Merge/Duplicate Detection (12 tests)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  E2EAuthHelper                                           │  │
│  │  - createBusinessOwner()                                 │  │
│  │  - createCustomer()                                      │  │
│  │  - createAdmin()                                         │  │
│  │  - cleanupTestUsers()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Test Fixtures                                           │  │
│  │  - BusinessFixture                                       │  │
│  │  - CustomerFixture                                       │  │
│  │  - AppointmentFixture                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                     HTTP Requests
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API                                 │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Auth BC        │  │   Customer BC    │  │  Business BC │ │
│  │   ✅ EXISTS      │  │   ✅ EXISTS      │  │  ❌ MISSING  │ │
│  │                  │  │                  │  │              │ │
│  │ POST /auth/      │  │ GET /customers/  │  │ POST /       │ │
│  │   register       │  │   search         │  │   businesses │ │
│  │ POST /auth/      │  │ POST /customers  │  │              │ │
│  │   login          │  │ GET /customers/  │  │ ← BLOCKER    │ │
│  │                  │  │   :id            │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## E2E Test Flow (Current - BLOCKED)

```
1. Test starts
   ↓
2. E2EAuthHelper.createBusinessOwner()
   ↓
3. POST /api/auth/register
   ✅ SUCCESS (Auth BC exists)
   ↓
4. POST /api/businesses
   ❌ 404 NOT FOUND (Business BC doesn't exist)
   ↓
5. Test fails
   ❌ All 38 tests blocked
```

## E2E Test Flow (After Business BC Implementation)

```
1. Test starts
   ↓
2. E2EAuthHelper.createBusinessOwner()
   ↓
3. POST /api/auth/register
   ✅ SUCCESS (Auth BC exists)
   ↓
4. POST /api/businesses
   ✅ SUCCESS (Business BC implemented)
   ↓
5. Test continues with authenticated user + business
   ↓
6. Test makes requests to Customer BC
   ✅ SUCCESS
   ↓
7. Test completes
   ✅ All 38 tests pass
```

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Testing Infrastructure                  │
│                                                                 │
│  Phase 1: E2EAuthHelper                    ✅ COMPLETE         │
│  Phase 2: Test Fixtures                    ✅ COMPLETE         │
│  Phase 4: Customer E2E Tests               ✅ COMPLETE         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  BLOCKER: Business BC                   ❌ MISSING        │ │
│  │                                                           │ │
│  │  Required:                                                │ │
│  │  - Business aggregate                                     │ │
│  │  - CreateBusinessCommand                                  │ │
│  │  - Business repository                                    │ │
│  │  - POST /api/businesses endpoint                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Phase 5: Documentation                    ⏳ PENDING         │
│  Phase 6: CI/CD Integration                ⏳ PENDING         │
│  Phase 7: Testing & Validation             ⏳ PENDING         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Creation Flow

```
E2EAuthHelper.createBusinessOwner()
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. Register User                                                │
│    POST /api/auth/register                                      │
│    Body: { email, password, name, initialRole: BUSINESS_OWNER } │
│    Response: { accessToken, userId }                            │
│    Status: ✅ Works (Auth BC exists)                            │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Create Business                                              │
│    POST /api/businesses                                         │
│    Headers: { Authorization: Bearer <token> }                   │
│    Body: { name, whatsappNumber, address, timezone }            │
│    Response: { id, ownerId, name, ... }                         │
│    Status: ❌ 404 Not Found (Business BC doesn't exist)         │
└─────────────────────────────────────────────────────────────────┘
    ↓
❌ Test fails here - cannot continue
```

### Expected Flow (After Business BC)

```
E2EAuthHelper.createBusinessOwner()
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. Register User                                                │
│    POST /api/auth/register                                      │
│    Status: ✅ Works                                             │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Create Business                                              │
│    POST /api/businesses                                         │
│    Status: ✅ Works (Business BC implemented)                   │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Return TestUser                                              │
│    {                                                            │
│      id: userId,                                                │
│      email: 'test-123@example.com',                             │
│      token: 'eyJhbGc...',                                       │
│      businessId: 'business-uuid',                               │
│      role: BUSINESS_OWNER                                       │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
    ↓
✅ Test continues with authenticated user + business
```

## Bounded Context Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Architecture                        │
│                                                                 │
│  ┌──────────────┐                                               │
│  │   Auth BC    │  ✅ Implemented                               │
│  │              │                                               │
│  │  - User      │  Handles authentication                       │
│  │  - JWT       │  Issues tokens                                │
│  └──────────────┘                                               │
│         ↓                                                        │
│  ┌──────────────┐                                               │
│  │ Business BC  │  ❌ NOT Implemented ← BLOCKER                 │
│  │              │                                               │
│  │  - Business  │  Stores business info                         │
│  │  - ownerId   │  References User.id                           │
│  └──────────────┘                                               │
│         ↓                                                        │
│  ┌──────────────┐                                               │
│  │ Customer BC  │  ✅ Implemented                               │
│  │              │                                               │
│  │  - Customer  │  Stores customer info                         │
│  │  - businessId│  References Business.id                       │
│  └──────────────┘                                               │
│                                                                 │
│  Note: Customer BC depends on Business BC                       │
│        Tests cannot run without Business BC                     │
└─────────────────────────────────────────────────────────────────┘
```

## Test Execution Timeline

### Current State (BLOCKED)

```
Time    Action                              Status
─────────────────────────────────────────────────────────────
0ms     Test suite starts                   ✅
10ms    Create E2EAuthHelper                ✅
20ms    Call createBusinessOwner()          ✅
30ms    POST /api/auth/register             ✅ 201 Created
50ms    POST /api/businesses                ❌ 404 Not Found
60ms    Test fails                          ❌
─────────────────────────────────────────────────────────────
Total: 60ms (failed)
```

### Expected State (After Business BC)

```
Time    Action                              Status
─────────────────────────────────────────────────────────────
0ms     Test suite starts                   ✅
10ms    Create E2EAuthHelper                ✅
20ms    Call createBusinessOwner()          ✅
30ms    POST /api/auth/register             ✅ 201 Created
50ms    POST /api/businesses                ✅ 201 Created
70ms    Test continues                      ✅
100ms   POST /api/customers                 ✅ 201 Created
120ms   GET /api/customers/search           ✅ 200 OK
140ms   Test completes                      ✅
─────────────────────────────────────────────────────────────
Total: 140ms (passed)
```

## File Structure

```
apps/backend/src/
├── auth/                           ✅ EXISTS
│   ├── domain/
│   ├── app/
│   ├── infra/
│   └── presentation/
│       └── controllers/
│           └── auth.controller.ts  ← POST /api/auth/register
│                                      POST /api/auth/login
│
├── business/                       ❌ DOESN'T EXIST ← BLOCKER
│   ├── domain/                     ← Need to create
│   ├── app/                        ← Need to create
│   ├── infra/                      ← Need to create
│   └── presentation/               ← Need to create
│       └── controllers/
│           └── business.controller.ts  ← POST /api/businesses
│
├── customer/                       ✅ EXISTS
│   ├── domain/
│   ├── app/
│   ├── infra/
│   └── presentation/
│       └── controllers/
│           └── customer-crud.ts    ← GET /api/customers
│           └── customer-search.ts  ← GET /api/customers/search
│
└── test-utils/                     ✅ EXISTS
    └── e2e/
        ├── auth-helper.ts          ✅ Complete
        ├── types.ts                ✅ Complete
        └── fixtures/
            ├── business.fixture.ts ✅ Complete
            ├── customer.fixture.ts ✅ Complete
            └── appointment.fixture.ts ✅ Complete
```

## Critical Path

```
┌─────────────────────────────────────────────────────────────────┐
│                     Critical Path to Unblock                    │
│                                                                 │
│  1. Create Business BC Spec                                     │
│     Location: .kiro/specs/business-bc/                          │
│     Time: 2-3 hours                                             │
│                                                                 │
│  2. Implement Business BC                                       │
│     - Business aggregate                                        │
│     - CreateBusinessCommand + handler                           │
│     - Business repository (write + read)                        │
│     - Business controller                                       │
│     - POST /api/businesses endpoint                             │
│     Time: 8-12 hours                                            │
│                                                                 │
│  3. Validate E2E Tests Pass                                     │
│     npm test -- customer.e2e.spec.ts                            │
│     Expected: 38/38 tests pass                                  │
│     Time: 30 minutes                                            │
│                                                                 │
│  4. Complete E2E Testing Infrastructure                         │
│     - Documentation                                             │
│     - CI/CD integration                                         │
│     - Testing & validation                                      │
│     Time: 6-8 hours                                             │
│                                                                 │
│  Total Time: ~17-24 hours                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Success Metrics

### Before Business BC

- ❌ 0/38 Customer E2E tests passing
- ❌ E2E infrastructure blocked
- ❌ Cannot test other BCs

### After Business BC

- ✅ 38/38 Customer E2E tests passing
- ✅ E2E infrastructure fully functional
- ✅ Pattern ready for other BCs
- ✅ CI/CD integration complete
- ✅ Documentation complete

## Conclusion

The E2E testing infrastructure is **architecturally sound** and **implementation complete**. The only blocker is the missing Business BC, which is a **critical dependency** for all E2E testing.

Once Business BC is implemented, the entire E2E testing system will be operational and can be applied to all other Bounded Contexts.

---

**Last Updated:** December 20, 2024
