# Implementation Plan - Account BC (BusinessOwner)

## Phase 1: Domain Layer - Value Objects

- [x] 1.1 Create SubscriptionPlan Value Object
  - Implement factory methods: free(), basic(), pro(), enterprise()
  - Include maxBusinesses, maxAppointmentsPerMonth, price
  - Implement canUpgradeTo() method
  - _Requirements: 2.1-2.4, 7.1-7.3_

- [x] 1.2 Create SubscriptionStatus Value Object
  - Implement factory methods: active(), suspended(), cancelled()
  - Implement query methods: isActive(), isSuspended(), isCancelled()
  - _Requirements: 7.4-7.5_

- [x] 1.3 Create Domain Exceptions
  - AlreadyOnThisPlanException
  - CannotDowngradeSubscriptionException
  - OnboardingNotCompletedException
  - OnboardingAlreadyCompletedException
  - MaxBusinessesExceededException
  - _Requirements: 3.3, 4.4, 4.5, 11.3, 11.5_

### ✅ Commit Checkpoint 1

```bash
git add src/account/domain/vo src/account/domain/exceptions
git commit -m "feat(account): implement SubscriptionPlan, SubscriptionStatus VOs and domain exceptions"
```

## Phase 2: Domain Layer - Aggregate and Events

- [x] 2.1 Create BusinessOwner Aggregate
  - Extend VersionedAggregateRoot
  - Implement static create() factory method
  - Implement completeOnboarding() method
  - Implement upgradeSubscription() method
  - Implement suspendSubscription() and restoreSubscription() methods
  - Implement static fromPersistence() method
  - _Requirements: 1.2-1.5, 3.1-3.5, 4.1-4.3, 5.1-5.4, 6.1-6.5_

- [x] 2.2 Create Domain Events
  - BusinessOwnerCreated
  - BusinessOwnerOnboardingCompleted
  - BusinessOwnerSubscriptionUpgraded
  - BusinessOwnerSubscriptionSuspended
  - BusinessOwnerSubscriptionRestored
  - _Requirements: 1.5, 3.4, 4.3, 5.3, 5.5_

- [x] 2.3 Create Read Model
  - BusinessOwnerReadModel with all fields
  - _Requirements: 8.3, 9.4_

### ✅ Commit Checkpoint 2

```bash
git add src/account/domain/aggregates src/account/domain/events src/account/domain/read_models
git commit -m "feat(account): implement BusinessOwner aggregate with domain events and read model"
```

## Phase 3: Domain Layer - Interfaces

- [x] 3.1 Create IBusinessOwnerFactory interface
  - loadById(id: string): Promise<BusinessOwner | null>
  - loadByUserId(userId: string): Promise<BusinessOwner | null>
  - _Requirements: 8.2_

- [x] 3.2 Create IBusinessOwnerWriteRepository interface
  - save(businessOwner: BusinessOwner): Promise<void>
  - _Requirements: 8.1_

- [x] 3.3 Create IBusinessOwnerReadRepository interface
  - findById(id: string): Promise<BusinessOwnerReadModel | null>
  - findByUserId(userId: string): Promise<BusinessOwnerReadModel | null>
  - _Requirements: 8.3, 9.5_

### ✅ Commit Checkpoint 3

```bash
git add src/account/domain/interfaces
git commit -m "feat(account): define repository and factory interfaces for BusinessOwner"
```

## Phase 4: Application Layer - Commands

- [x] 4.1 Implement CreateBusinessOwnerCommand and Handler
  - Command extends Command<{ businessOwnerId: string }>
  - Handler creates BusinessOwner with FREE plan
  - Uses WriteRepository to persist
  - _Requirements: 1.1-1.5, 9.1_

- [x] 4.2 Implement CompleteOnboardingCommand and Handler
  - Command extends Command<void>
  - Handler loads via Factory, calls completeOnboarding(), saves
  - _Requirements: 3.1-3.5, 9.2_

- [x] 4.3 Implement UpgradeSubscriptionCommand and Handler
  - Command extends Command<void>
  - Handler validates upgrade, updates plan
  - _Requirements: 4.1-4.5, 9.3_

- [x] 4.4 Implement SuspendSubscriptionCommand and Handler
  - Command extends Command<void>
  - Handler suspends subscription
  - _Requirements: 5.1-5.3_

- [x] 4.5 Implement RestoreSubscriptionCommand and Handler
  - Command extends Command<void>
  - Handler restores subscription
  - _Requirements: 5.4-5.5_

### ✅ Commit Checkpoint 4

```bash
git add src/account/app/commands
git commit -m "feat(account): implement all command handlers for BusinessOwner"
```

## Phase 5: Application Layer - Queries and Event Handlers

- [ ] 5.1 Implement GetBusinessOwnerQuery and Handler
  - Query extends Query<BusinessOwnerReadModel>
  - Handler uses ReadRepository
  - _Requirements: 9.4_

- [ ] 5.2 Implement GetBusinessOwnerByUserIdQuery and Handler
  - Query extends Query<BusinessOwnerReadModel | null>
  - Handler uses ReadRepository
  - _Requirements: 9.5, 11.1_

- [ ] 5.3 Implement OnUserRegisteredHandler
  - Listens to UserRegistered event from Auth BC
  - Filters by role=BUSINESS_OWNER
  - Dispatches CreateBusinessOwnerCommand
  - _Requirements: 10.1-10.5_

### ✅ Commit Checkpoint 5

```bash
git add src/account/app/queries src/account/app/event_handlers
git commit -m "feat(account): implement queries and OnUserRegisteredHandler"
```

## Phase 6: Infrastructure Layer - Persistence

- [ ] 6.1 Create BusinessOwnerModel (TypeORM Entity)
  - Map all fields to database columns
  - Define relationships and indexes
  - _Requirements: 12.1-12.3_

- [ ] 6.2 Create BusinessOwnerWriteMapper
  - toModel(aggregate): BusinessOwnerModel
  - _Requirements: 8.1, 8.4_

- [ ] 6.3 Create BusinessOwnerReadMapper
  - toReadModel(model): BusinessOwnerReadModel
  - _Requirements: 8.3_

- [ ] 6.4 Implement BusinessOwnerFactory
  - Implements IBusinessOwnerFactory
  - Uses TypeORM Repository
  - Calls BusinessOwner.fromPersistence()
  - _Requirements: 8.2_

- [ ] 6.5 Implement BusinessOwnerWriteRepository
  - Implements IBusinessOwnerWriteRepository
  - Uses Optimistic Locking with version field
  - Throws ConcurrencyException on conflict
  - _Requirements: 8.1, 8.4, 8.5_

- [ ] 6.6 Implement BusinessOwnerReadRepository
  - Implements IBusinessOwnerReadRepository
  - Optimized queries for read models
  - _Requirements: 8.3_

### ✅ Commit Checkpoint 6

```bash
git add src/account/infra/persistence
git commit -m "feat(account): implement persistence layer with repositories, factory and mappers"
```

## Phase 7: Infrastructure Layer - Database

- [ ] 7.1 Create Migration: CreateBusinessOwnersTable
  - Create business_owners table with all columns
  - Add unique index on user_id
  - Add foreign key to users(id)
  - _Requirements: 12.1-12.3_

- [ ] 7.2 Create Seed: BusinessOwnersSeed
  - Create 2 business owners (FREE and PRO plans)
  - Link to existing users
  - _Requirements: 12.4-12.5_

- [ ] 7.3 Run migrations and verify schema
  - Execute migration
  - Verify table structure
  - _Requirements: 12.1-12.3_

### ✅ Commit Checkpoint 7

```bash
git add src/account/infra/migrations
git commit -m "feat(account): add database migration and seed for business_owners table"
```

## Phase 8: Module Configuration and Testing

- [ ] 8.1 Configure AccountModule
  - Register all command handlers
  - Register all query handlers
  - Register event handlers
  - Register repositories with DI tokens
  - Register factory with DI token
  - Import CqrsModule
  - Import TypeOrmModule.forFeature([BusinessOwnerModel])
  - _Requirements: All_

- [ ] 8.2 Update shared-types package
  - Add BusinessOwnerDto to packages/shared-types/src/index.ts
  - Export type for frontend consumption
  - _Requirements: Note in Introduction_

- [ ]\* 8.3 Write Unit Tests
  - Test SubscriptionPlan VO (factory methods, canUpgradeTo)
  - Test SubscriptionStatus VO (factory methods, query methods)
  - Test BusinessOwner Aggregate (create, completeOnboarding, upgradeSubscription)
  - _Requirements: 13.1-13.3_

- [ ]\* 8.4 Write Property-Based Tests
  - **Property 1: Subscription upgrade is monotonic**
  - **Validates: Requirements 4.1, 4.4**
  - **Property 2: Version increments on state changes**
  - **Validates: Requirements 6.4**
  - _Requirements: 13.3_

- [ ]\* 8.5 Write Integration Tests
  - Test CreateBusinessOwnerHandler
  - Test OnUserRegisteredHandler (mock event)
  - Test BusinessOwnerWriteRepository (Optimistic Locking)
  - _Requirements: 13.4-13.5_

- [ ] 8.6 Run all validations
  - pnpm --filter backend typecheck
  - pnpm --filter backend lint
  - pnpm --filter backend format
  - pnpm --filter backend test

### ✅ Commit Checkpoint 8

```bash
git add src/account packages/shared-types
git commit -m "feat(account): configure AccountModule, add tests and update shared-types"
```

---

## Summary

**Total Tasks:** 28 (20 required + 8 optional tests)

**Phases:**

1. Value Objects (3 tasks)
2. Aggregate and Events (3 tasks)
3. Interfaces (3 tasks)
4. Commands (5 tasks)
5. Queries and Event Handlers (3 tasks)
6. Persistence (6 tasks)
7. Database (3 tasks)
8. Module and Testing (6 tasks)

**Key Integration Points:**

- Auth BC: Listens to UserRegistered event
- Business BC: Provides validation queries for business creation

**Testing Focus:**

- Subscription upgrade monotonicity (PBT)
- Version increments (PBT)
- Optimistic Locking (Integration)
- Event-driven creation (Integration)
