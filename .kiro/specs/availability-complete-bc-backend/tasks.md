# Implementation Plan - Availability BC Backend

## Phase 1: Domain Layer - Schedule & Blockout Aggregates ✅

- [x] 1. Create Schedule Aggregate ✅
  - [x] 1.1 Create Schedule aggregate class ✅
    - Create `apps/backend/src/availability/domain/aggregates/schedule.ts`
    - Implement `create()` factory method
    - Implement `update()` method
    - Implement `deactivate()` and `activate()` methods
    - Add validation logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create Schedule domain events ✅
    - Create `apps/backend/src/availability/domain/events/schedule-created.ts`
    - Create `apps/backend/src/availability/domain/events/schedule-updated.ts`
    - Create `apps/backend/src/availability/domain/events/schedule-deleted.ts`
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 1.3 Create Schedule value objects ✅
    - Create `apps/backend/src/availability/domain/vo/time-slot.vo.ts`
    - Create `apps/backend/src/availability/domain/vo/day-of-week.vo.ts`
    - Implement validation logic
    - _Requirements: 1.1, 1.2_

  - [x] 1.4 Write property tests for Schedule ✅
    - **Property 1: Schedule time range validity**
    - **Property 2: Schedule day of week validity**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Create Blockout Aggregate ✅
  - [x] 2.1 Create Blockout aggregate class ✅
    - Create `apps/backend/src/availability/domain/aggregates/blockout.ts`
    - Implement `create()` factory method
    - Implement `isDateBlocked()` method
    - Add validation logic
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Create Blockout domain events ✅
    - Create `apps/backend/src/availability/domain/events/blockout-created.ts`
    - Create `apps/backend/src/availability/domain/events/blockout-removed.ts`
    - _Requirements: 2.3, 2.4_

  - [x] 2.3 Create Blockout value objects ✅
    - Create `apps/backend/src/availability/domain/vo/date-range.vo.ts`
    - Implement validation logic
    - _Requirements: 2.1, 2.2_

  - [x] 2.4 Write property tests for Blockout ✅
    - **Property 3: Blockout date range validity**
    - **Property 4: Blockout no past dates**
    - **Validates: Requirements 2.1, 2.2**

- [x] 3. Create Domain Exceptions ✅
  - [x] 3.1 Create Schedule exceptions ✅
    - Create `apps/backend/src/availability/domain/exceptions/invalid-time-slot.exception.ts`
    - Create `apps/backend/src/availability/domain/exceptions/invalid-day-of-week.exception.ts`
    - Create `apps/backend/src/availability/domain/exceptions/schedule-not-found.exception.ts`
    - Create `apps/backend/src/availability/domain/exceptions/duplicate-schedule.exception.ts`
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 3.2 Create Blockout exceptions ✅
    - Create `apps/backend/src/availability/domain/exceptions/invalid-date-range.exception.ts`
    - Create `apps/backend/src/availability/domain/exceptions/past-date.exception.ts`
    - Create `apps/backend/src/availability/domain/exceptions/blockout-not-found.exception.ts`
    - _Requirements: 2.1, 2.2_

## Phase 2: Domain Layer - Interfaces & Services ✅

- [x] 4. Create Repository Interfaces ✅
  - [x] 4.1 Create Schedule repository interfaces ✅
    - Create `apps/backend/src/availability/domain/interfaces/repositories/schedule-write.ts`
    - Create `apps/backend/src/availability/domain/interfaces/repositories/schedule-read.ts`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 4.2 Create Blockout repository interfaces ✅
    - Create `apps/backend/src/availability/domain/interfaces/repositories/blockout-write.ts`
    - Create `apps/backend/src/availability/domain/interfaces/repositories/blockout-read.ts`
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 4.3 Create Factory interfaces ✅
    - Create `apps/backend/src/availability/domain/interfaces/factories/schedule-factory.ts`
    - Create `apps/backend/src/availability/domain/interfaces/factories/blockout-factory.ts`
    - _Requirements: 1.4, 2.4_

- [x] 5. Create Domain Service ✅
  - [x] 5.1 Create AvailabilityChecker service ✅
    - Create `apps/backend/src/availability/domain/interfaces/services/availability-checker.service.ts`
    - Create `apps/backend/src/availability/domain/services/availability-checker.service.ts`
    - Implement `isDateAvailable()` method
    - Implement `getAvailableTimeSlots()` method
    - **Note:** Domain Services belong in domain layer, not infrastructure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Write unit tests for AvailabilityChecker ✅
    - Create `apps/backend/src/availability/domain/services/__tests__/availability-checker.service.spec.ts`
    - Test date availability logic (6 test cases)
    - Test time slot generation (7 test cases)
    - Test blockout exclusion
    - Test capacity checking
    - All 13 tests passing ✅
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Create Read Models ✅
  - [x] 6.1 Create Schedule read model ✅
    - Create `apps/backend/src/availability/domain/read-models/schedule.ts`
    - _Requirements: 1.6_

  - [x] 6.2 Create Blockout read model ✅
    - Create `apps/backend/src/availability/domain/read-models/blockout.ts`
    - _Requirements: 2.5_

## Phase 3: Infrastructure Layer - Persistence ✅

- [x] 7. Create TypeORM Models ✅
  - [x] 7.1 Create Schedule model ✅
    - Create `apps/backend/src/availability/infra/persistence/models/schedule.ts`
    - Add TypeORM decorators
    - Add indexes (businessId, dayOfWeek)
    - _Requirements: 1.3_

  - [x] 7.2 Create Blockout model ✅
    - Create `apps/backend/src/availability/infra/persistence/models/blockout.ts`
    - Add TypeORM decorators
    - Add indexes (businessId, startDate, endDate)
    - _Requirements: 2.3_

- [x] 8. Create Mappers ✅
  - [x] 8.1 Create Schedule mappers ✅
    - Create `apps/backend/src/availability/infra/persistence/mappers/schedule-write.mapper.ts`
    - Create `apps/backend/src/availability/infra/persistence/mappers/schedule-read.mapper.ts`
    - Implement `toModel()`, `toDomain()`, `toReadModel()`
    - _Requirements: 1.3, 1.6_

  - [x] 8.2 Create Blockout mappers ✅
    - Create `apps/backend/src/availability/infra/persistence/mappers/blockout-write.mapper.ts`
    - Create `apps/backend/src/availability/infra/persistence/mappers/blockout-read.mapper.ts`
    - Implement `toModel()`, `toDomain()`, `toReadModel()`
    - _Requirements: 2.3, 2.5_

  - [x] 8.3 Write unit tests for mappers ✅
    - Test Schedule mappers
    - Test Blockout mappers
    - Test round-trip conversions
    - _Requirements: 1.3, 2.3_

- [x] 9. Create Repositories ✅
  - [x] 9.1 Create Schedule repositories ✅
    - Create `apps/backend/src/availability/infra/persistence/repositories/schedule-write.ts`
    - Create `apps/backend/src/availability/infra/persistence/repositories/schedule-read.ts`
    - Implement save(), findById(), findByBusinessAndDay()
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 9.2 Create Blockout repositories ✅
    - Create `apps/backend/src/availability/infra/persistence/repositories/blockout-write.ts`
    - Create `apps/backend/src/availability/infra/persistence/repositories/blockout-read.ts`
    - Implement save(), findById(), findByBusinessAndDateRange()
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 9.3 Write integration tests for repositories ✅
    - [x] Schedule write repository integration tests (save, update, delete)
    - [x] Schedule read repository integration tests (findById, findByBusinessId, findByBusinessAndDay)
    - [x] Blockout write repository integration tests (save, delete)
    - [x] Blockout read repository integration tests (findById, findByBusinessId, findByBusinessAndDateRange)
    - [x] All repository integration tests passing (216 total tests)
    - Create `apps/backend/src/availability/infra/persistence/repositories/__tests__/schedule-repositories.integration.spec.ts`
    - Create `apps/backend/src/availability/infra/persistence/repositories/__tests__/blockout-repositories.integration.spec.ts`
    - Test Schedule repositories with real database (save, findById, findByBusinessId, findByBusinessAndDay)
    - Test Blockout repositories with real database (save, delete, findById, findByBusinessId, findByBusinessAndDateRange)
    - Test query methods with various scenarios
    - Test transaction support with UnitOfWork
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4, 2.5_

- [x] 10. Create Factories ✅
  - [x] 10.1 Create Schedule factory ✅
    - Create `apps/backend/src/availability/infra/persistence/factories/schedule-factory.ts`
    - Implement `loadById()` method
    - Implement `loadByBusinessAndDay()` method
    - _Requirements: 1.4_

  - [x] 10.2 Create Blockout factory ✅
    - Create `apps/backend/src/availability/infra/persistence/factories/blockout-factory.ts`
    - Implement `loadById()` method
    - _Requirements: 2.4_

  - [x] 10.3 Write integration tests for factories ✅
    - [x] Schedule factory integration tests (loadById, loadByBusinessAndDay) - 10 tests passing
    - [x] Blockout factory integration tests (loadById) - 9 tests passing
    - [x] Test aggregate reconstruction with business logic
    - [x] Test all days of week, time ranges, active/inactive states
    - [x] Test single-day and multi-day blockouts
    - [x] Test isDateBlocked method works correctly
    - [x] Fixed timezone issues with UTC normalization in DateRange VO
    - [x] Fixed PostgreSQL date column type (changed from 'date' to 'timestamp')
    - [x] All factory integration tests passing
    - Create `apps/backend/src/availability/infra/persistence/factories/__tests__/schedule-factory.integration.spec.ts`
    - Create `apps/backend/src/availability/infra/persistence/factories/__tests__/blockout-factory.integration.spec.ts`
    - _Requirements: 1.4, 2.4_

## Phase 4: Application Layer - Commands

- [x] 11. Implement Schedule Commands
  - [x] 11.1 Implement CreateScheduleCommand handler
    - Create `apps/backend/src/availability/app/commands/create-schedule/handler.ts`
    - Implement business logic
    - Add validation
    - Use UnitOfWork for transactions
    - _Requirements: 1.1, 1.2, 1.3, 6.1_

  - [x] 11.2 Implement UpdateScheduleCommand handler
    - Create `apps/backend/src/availability/app/commands/update-schedule/handler.ts`
    - Load aggregate via factory
    - Update and persist
    - _Requirements: 1.4_

  - [x] 11.3 Implement DeleteScheduleCommand handler
    - Create `apps/backend/src/availability/app/commands/delete-schedule/handler.ts`
    - Load aggregate via factory
    - Deactivate and persist
    - _Requirements: 1.5_

  - [x] 11.4 Write unit tests for Schedule command handlers
    - Test CreateScheduleHandler
    - Test UpdateScheduleHandler
    - Test DeleteScheduleHandler
    - Mock dependencies
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12. Implement Blockout Commands
  - [x] 12.1 Implement CreateBlockoutCommand handler
    - Create `apps/backend/src/availability/app/commands/create-blockout/handler.ts`
    - Implement business logic
    - Add validation
    - Use UnitOfWork for transactions
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 12.2 Implement RemoveBlockoutCommand handler
    - Create `apps/backend/src/availability/app/commands/remove-blockout/handler.ts`
    - Load aggregate via factory
    - Delete from repository
    - _Requirements: 2.4_

  - [x] 12.3 Write unit tests for Blockout command handlers
    - Test CreateBlockoutHandler
    - Test RemoveBlockoutHandler
    - Mock dependencies
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

## Phase 5: Application Layer - Queries

- [ ] 13. Implement Schedule Queries
  - [ ] 13.1 Implement GetSchedulesByBusinessQuery handler
    - Create `apps/backend/src/availability/app/queries/get-schedules-by-business/handler.ts`
    - Use read repository
    - Return read models
    - _Requirements: 1.6_

  - [ ] 13.2 Write unit tests for Schedule query handlers
    - Test GetSchedulesByBusinessHandler
    - Mock read repository
    - _Requirements: 1.6_

- [ ] 14. Implement Blockout Queries
  - [ ] 14.1 Implement GetBlockoutsByBusinessQuery handler
    - Create `apps/backend/src/availability/app/queries/get-blockouts-by-business/handler.ts`
    - Use read repository
    - Return read models
    - _Requirements: 2.5_

  - [ ] 14.2 Write unit tests for Blockout query handlers
    - Test GetBlockoutsByBusinessHandler
    - Mock read repository
    - _Requirements: 2.5_

- [ ] 15. Implement Availability Queries
  - [ ] 15.1 Implement GetAvailableDatesQuery handler
    - Create `apps/backend/src/availability/app/queries/get-available-dates/handler.ts`
    - Use AvailabilityChecker service
    - Filter by schedules, blockouts, capacity
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 15.2 Enhance GetAvailableSlotsQuery handler
    - Update `apps/backend/src/availability/app/queries/get-available-slots/handler.ts`
    - Use AvailabilityChecker service
    - Generate time slots based on offering duration
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ] 15.3 Write unit tests for Availability query handlers
    - Test GetAvailableDatesHandler
    - Test GetAvailableSlotsHandler
    - Mock dependencies
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

## Phase 6: Module Registration & E2E Tests

- [ ] 16. Update AvailabilityModule
  - [ ] 16.1 Register all command handlers
    - Add CreateScheduleHandler
    - Add UpdateScheduleHandler
    - Add DeleteScheduleHandler
    - Add CreateBlockoutHandler
    - Add RemoveBlockoutHandler
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4_

  - [ ] 16.2 Register all query handlers
    - Add GetSchedulesByBusinessHandler
    - Add GetBlockoutsByBusinessHandler
    - Add GetAvailableDatesHandler
    - Update GetAvailableSlotsHandler registration
    - _Requirements: 1.6, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 16.3 Register all repositories and factories
    - Add Schedule repositories (write, read)
    - Add Blockout repositories (write, read)
    - Add Schedule factory
    - Add Blockout factory
    - Add AvailabilityChecker service
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4, 2.5_

  - [ ] 16.4 Register TypeORM models
    - Add ScheduleModel to TypeOrmModule.forFeature()
    - Add BlockoutModel to TypeOrmModule.forFeature()
    - _Requirements: 1.3, 2.3_

- [ ] 17. Create E2E Tests
  - [ ] 17.1 Create Schedule E2E tests
    - Create `apps/backend/src/availability/presentation/controllers/__tests__/schedule-crud.e2e.spec.ts`
    - Test POST /api/schedules
    - Test GET /api/schedules
    - Test PUT /api/schedules/:id
    - Test DELETE /api/schedules/:id
    - Test validation errors
    - Test authorization
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 17.2 Create Blockout E2E tests
    - Create `apps/backend/src/availability/presentation/controllers/__tests__/blockout-crud.e2e.spec.ts`
    - Test POST /api/blockouts
    - Test GET /api/blockouts
    - Test DELETE /api/blockouts/:id
    - Test validation errors
    - Test authorization
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 17.3 Create Availability Query E2E tests
    - Create `apps/backend/src/availability/presentation/controllers/__tests__/availability-query.e2e.spec.ts`
    - Test GET /api/availability/dates
    - Test GET /api/availability/slots
    - Test filtering logic
    - Test edge cases
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

## Phase 7: Database Migrations

- [ ] 18. Create Database Migrations
  - [ ] 18.1 Create Schedule table migration
    - Create migration file
    - Add schedules table
    - Add indexes (businessId, dayOfWeek)
    - Add unique constraint (businessId + dayOfWeek)
    - _Requirements: 1.3, 6.1_

  - [ ] 18.2 Create Blockout table migration
    - Create migration file
    - Add blockouts table
    - Add indexes (businessId, startDate, endDate)
    - _Requirements: 2.3_

  - [ ] 18.3 Run migrations
    - Execute migrations in development
    - Verify tables created
    - Verify indexes created
    - _Requirements: 1.3, 2.3_

## Phase 8: Property-Based Tests & Concurrency Tests

- [ ] 19. Write Property-Based Tests
  - [x] 19.1 Write Capacity property tests ✅
    - **Property 5: Capacity positive slots**
    - **Property 6: Capacity no past dates**
    - **Property 7: Capacity update constraint**
    - **Property 8: Slot booking decrements availability**
    - **Property 9: Slot release increments availability**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ] 19.2 Write Availability query property tests
    - **Property 10: Available dates exclude blockouts**
    - **Property 11: Available dates exclude zero capacity**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 20. Write Concurrency Tests
  - [ ] 20.1 Write concurrent booking tests
    - **Property 12: Optimistic locking prevents double booking**
    - Simulate race conditions
    - Test retry logic
    - Verify version increments
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

## Summary

### Total Tasks: 20 major tasks, ~80 subtasks

- **Phase 1 (Domain - Aggregates):** 3 tasks
- **Phase 2 (Domain - Interfaces):** 3 tasks
- **Phase 3 (Infrastructure):** 4 tasks
- **Phase 4 (Application - Commands):** 2 tasks
- **Phase 5 (Application - Queries):** 3 tasks
- **Phase 6 (Module & E2E):** 2 tasks
- **Phase 7 (Migrations):** 1 task
- **Phase 8 (Property & Concurrency Tests):** 2 tasks

### Estimated Time: 3-4 days

- **Phase 1-2 (Domain):** 1 day
- **Phase 3 (Infrastructure):** 1 day
- **Phase 4-5 (Application):** 1 day
- **Phase 6-8 (Integration & Testing):** 1 day

### Priority

- **HIGH:** All tasks (blocking frontend integration)

### Dependencies

- Capacity aggregate already exists ✅
- Controllers and DTOs already exist ✅
- Command/Query stubs already exist ✅
- Need to implement: Aggregates, Handlers, Repositories, Factories, Tests

### Notes

- Tasks marked with `*` are optional (tests) but highly recommended
- Follow patterns from Booking BC and Offering BC
- Use optimistic locking for Capacity (already implemented)
- Schedule and Blockout don't need versioning (no concurrency issues)
- AvailabilityChecker is a Domain Service (stateless)
- All commands use UnitOfWork for transactions
- All queries use read repositories (CQRS)
