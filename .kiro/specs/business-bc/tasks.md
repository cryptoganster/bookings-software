# Implementation Plan - Business BC

## Phase 1: Domain Layer - Value Objects ✅ COMPLETE

- [x] 1.1 Create Timezone Value Object
  - Implement static create() factory method
  - Validate against IANA timezone list
  - Implement getValue() method
  - _Requirements: 4.1, 4.2, 8.2_

- [x] 1.2 Create BusinessAddress Value Object
  - Implement static create() factory method
  - Validate required fields (street, city)
  - Implement toObject() method
  - _Requirements: 5.1, 5.2, 8.3_

- [x] 1.3 Create Domain Exceptions
  - WhatsAppPhoneAlreadyExistsException (reuse WhatsAppPhone from @shared/vo)
  - InvalidTimezoneException
  - InvalidBusinessNameException
  - InvalidBusinessAddressException
  - OnboardingNotCompletedException
  - MaxBusinessesExceededException
  - BusinessNotFoundException
  - _Requirements: 3.5, 4.2, 1.2, 2.3, 2.5_

### ✅ Commit Checkpoint 1 - DONE

```bash
git commit ff97e45
"feat(business): implement Phase 1 - Value Objects and Domain Exceptions"
```

## Phase 2: Domain Layer - Aggregate and Events

- [x] 2.1 Create Business Aggregate
  - Extend VersionedAggregateRoot
  - Import WhatsAppPhone from @shared/vo/whatsapp-phone
  - Implement static create() factory method with ownerId → User.id
  - Implement updateInfo() method
  - Implement configureWhatsApp() method (validates WhatsAppPhone uniqueness)
  - Implement deactivate() and activate() methods (idempotent)
  - Implement static fromPersistence() method
  - Implement all getters
  - _Requirements: 1.1-1.5, 6.1-6.5, 7.1-7.5_

- [x] 2.2 Create Domain Events
  - BusinessCreated (businessId, ownerId, name, whatsappPhone: string)
  - BusinessInfoUpdated (businessId, name)
  - BusinessWhatsAppConfigured (businessId, whatsappPhone: string)
  - BusinessDeactivated (businessId)
  - BusinessActivated (businessId)
  - _Requirements: 1.5, 3.3, 6.3, 6.5_

- [x] 2.3 Create Read Model
  - BusinessReadModel with all fields
  - Include computed fields if needed
  - _Requirements: 9.3, 10.4, 10.5_

### ✅ Commit Checkpoint 2 - DONE

```bash
git commit 0472826
"feat(business): implement Business aggregate with domain events"
```

## Phase 3: Domain Layer - Interfaces ✅ COMPLETE

- [x] 3.1 Create IBusinessFactory interface
  - loadById(id: string): Promise<Business | null>
  - _Requirements: 9.2_

- [x] 3.2 Create IBusinessWriteRepository interface
  - save(business: Business): Promise<void>
  - _Requirements: 9.1_

- [x] 3.3 Create IBusinessReadRepository interface
  - findById(id: string): Promise<BusinessReadModel | null>
  - findByOwnerId(ownerId: string): Promise<BusinessReadModel[]>
  - findByWhatsAppPhone(whatsappPhone: string): Promise<BusinessReadModel | null>
  - _Requirements: 9.3, 10.5, 12.4_

### ✅ Commit Checkpoint 3 - DONE

```bash
git commit 67e15bc
"feat(business): define repository and factory interfaces for Business"
```

## Phase 4: Application Layer - Commands

- [x] 4.1 Implement CreateBusinessCommand and Handler
  - Command extends Command<{ businessId: string }>
  - Handler validates BusinessOwner via GetBusinessOwnerByUserIdQuery
  - Handler validates onboardingCompleted=true
  - Handler validates business count < maxBusinesses
  - Handler validates WhatsAppPhone uniqueness via findByWhatsAppPhone
  - Handler creates Business with ownerId = User.id
  - _Requirements: 1.1-1.5, 2.1-2.5, 10.1, 11.1-11.5_

- [x] 4.2 Implement UpdateBusinessInfoCommand and Handler
  - Command extends Command<void>
  - Handler loads via Factory, updates info, saves
  - _Requirements: 10.2_

- [x] 4.3 Implement ConfigureWhatsAppCommand and Handler
  - Command extends Command<void>
  - Handler validates WhatsAppPhone uniqueness via findByWhatsAppPhone before update
  - _Requirements: 3.1-3.5, 10.3_

- [x] 4.4 Implement DeactivateBusinessCommand and Handler
  - Command extends Command<void>
  - Handler loads via Factory, deactivates, saves
  - _Requirements: 6.1, 6.3_

- [x] 4.5 Implement ActivateBusinessCommand and Handler
  - Command extends Command<void>
  - Handler loads via Factory, activates, saves
  - _Requirements: 6.4, 6.5_

### ✅ Commit Checkpoint 4 - DONE

```bash
git commit 341bbf5
"feat(business): implement all command handlers for Business"
```

## Phase 5: Application Layer - Queries ✅ COMPLETE

- [x] 5.1 Implement GetBusinessQuery and Handler
  - Query extends Query<BusinessReadModel>
  - Handler uses ReadRepository
  - _Requirements: 10.4_

- [x] 5.2 Implement GetBusinessesByOwnerIdQuery and Handler
  - Query extends Query<BusinessReadModel[]>
  - Handler uses ReadRepository
  - _Requirements: 10.5_

- [x] 5.3 Implement GetBusinessByWhatsAppPhoneQuery and Handler
  - Query extends Query<BusinessReadModel | null>
  - Handler uses ReadRepository
  - Used by Conversation BC to identify business
  - _Requirements: 12.4_

### ✅ Commit Checkpoint 5 - DONE

```bash
git commit [hash]
"feat(business): implement query handlers for Business"
```

## Phase 6: Infrastructure Layer - Persistence

- [ ] 6.1 Create BusinessModel (TypeORM Entity)
  - Map all fields to database columns
  - Define indexes (whatsapp_number unique, owner_id)
  - FK: owner_id → users(id)
  - _Requirements: 13.1-13.3_

- [ ] 6.2 Create BusinessWriteMapper
  - toModel(aggregate): BusinessModel
  - _Requirements: 9.1_

- [ ] 6.3 Create BusinessReadMapper
  - toReadModel(model): BusinessReadModel
  - _Requirements: 9.3_

- [ ] 6.4 Implement BusinessFactory
  - Implements IBusinessFactory
  - Uses TypeORM Repository
  - Calls Business.fromPersistence()
  - _Requirements: 9.2_

- [ ] 6.5 Implement BusinessWriteRepository
  - Implements IBusinessWriteRepository
  - Uses Optimistic Locking with version field
  - Throws ConcurrencyException on conflict
  - _Requirements: 9.1, 9.4, 9.5_

- [ ] 6.6 Implement BusinessReadRepository
  - Implements IBusinessReadRepository
  - Optimized queries for read models
  - _Requirements: 9.3_

### ✅ Commit Checkpoint 6

```bash
git add src/business/infra/persistence
git commit -m "feat(business): implement persistence layer with repositories, factory and mappers"
```

## Phase 7: Infrastructure Layer - Database

- [ ] 7.1 Create Migration: CreateBusinessesTable
  - Create businesses table with all columns
  - Add unique index on whatsapp_phone (reuse column name from Customer BC)
  - Add index on owner_id
  - Add foreign key to users(id) (NOT business_owners)
  - _Requirements: 13.1-13.3_

- [ ] 7.2 Create Seed: BusinessesSeed
  - Create 2 businesses linked to existing users
  - Use unique, valid WhatsAppPhone numbers (E.164 format)
  - Use valid IANA timezones
  - _Requirements: 13.4-13.5_

- [ ] 7.3 Run migrations and verify schema
  - Execute migration
  - Verify table structure
  - Verify FK constraint
  - _Requirements: 13.1-13.3_

### ✅ Commit Checkpoint 7

```bash
git add src/business/infra/migrations
git commit -m "feat(business): add database migration and seed for businesses table"
```

## Phase 8: Module Configuration and Testing

- [ ] 8.1 Configure BusinessModule
  - Register all command handlers
  - Register all query handlers
  - Register repositories with DI tokens
  - Register factory with DI token
  - Import CqrsModule
  - Import TypeOrmModule.forFeature([BusinessModel])
  - Import AccountModule (for GetBusinessOwnerByUserIdQuery)
  - _Requirements: All_

- [ ] 8.2 Update shared-types package
  - Add BusinessDto to packages/shared-types/src/index.ts
  - Export type for frontend consumption
  - _Requirements: Note in Introduction_

- [ ]\* 8.3 Write Unit Tests
  - Test Timezone VO (IANA validation)
  - Test BusinessAddress VO (required fields validation)
  - Test Business Aggregate (create, updateInfo, deactivate, activate)
  - Note: WhatsAppPhone VO already tested in Customer BC
  - _Requirements: 14.1-14.3_

- [ ]\* 8.4 Write Property-Based Tests
  - **Property 1: WhatsAppPhone global uniqueness**
  - **Validates: Requirements 1.3, 3.2**
  - **Property 2: Business count respects subscription limits**
  - **Validates: Requirements 2.4, 2.5, 11.4, 11.5**
  - **Property 3: Business.ownerId references User.id**
  - **Validates: Requirements 1.1, 11.1**
  - _Requirements: 14.5_

- [ ]\* 8.5 Write Integration Tests
  - Test CreateBusinessHandler with BusinessOwner validation
  - Test CreateBusinessHandler with WhatsAppPhone uniqueness
  - Test BusinessWriteRepository (Optimistic Locking)
  - _Requirements: 14.4_

- [ ] 8.6 Run all validations
  - pnpm --filter backend typecheck
  - pnpm --filter backend lint
  - pnpm --filter backend format
  - pnpm --filter backend test

### ✅ Commit Checkpoint 8

```bash
git add src/business packages/shared-types
git commit -m "feat(business): configure BusinessModule, add tests and update shared-types"
```

---

## Summary

**Total Tasks:** 27 (19 required + 8 optional tests)

**Phases:**

1. Value Objects (3 tasks - reuse WhatsAppPhone from @shared/vo)
2. Aggregate and Events (3 tasks)
3. Interfaces (3 tasks)
4. Commands (5 tasks)
5. Queries (3 tasks)
6. Persistence (6 tasks)
7. Database (3 tasks)
8. Module and Testing (6 tasks)

**Key Integration Points:**

- Account BC: Queries BusinessOwner for validation (onboarding, limits)
- Shared VO: Reuses WhatsAppPhone from @shared/vo/whatsapp-phone
- Other BCs: Validate businessId exists before creating related entities

**Critical Relationship:**

- `Business.ownerId → User.id` (NOT BusinessOwner.id)
- FK in database: `owner_id REFERENCES users(id)`

**Testing Focus:**

- WhatsAppPhone E.164 validation already tested in Customer BC (reuse)
- WhatsAppPhone global uniqueness (PBT)
- Business count limits (PBT)
- ownerId references User.id (PBT)
- Optimistic Locking (Integration)
- BusinessOwner validation (Integration)
