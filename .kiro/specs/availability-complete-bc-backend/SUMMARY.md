# Availability BC Backend - Executive Summary

## What is This?

Complete implementation spec for the Availability Bounded Context backend. This BC manages business hours, date blockouts, and appointment capacity.

## Why Do We Need This?

The Availability BC is **critical** for the booking system:

- Determines **when** customers can book appointments (business hours)
- Determines **which dates** are unavailable (holidays, vacations)
- Determines **how many** appointments can be booked (capacity limits)

Without this BC fully implemented, the frontend cannot:

- Show available dates to customers
- Show available time slots
- Prevent overbooking
- Respect business hours

## Current State

### ✅ What Exists (30%)

- Capacity aggregate (complete with optimistic locking)
- Capacity repositories and factory
- SetCapacityCommand handler
- Controllers and DTOs (all created)
- Command/Query stubs (all created)

### ❌ What's Missing (70%)

- **Schedule aggregate** - Business hours by day of week
- **Blockout aggregate** - Date range blocking
- **Value Objects** - TimeSlot, DateRange, DayOfWeek
- **Domain Service** - AvailabilityChecker (coordinates all 3 aggregates)
- **Repositories** - Schedule and Blockout (write + read)
- **Factories** - Schedule and Blockout
- **Command Handlers** - 5 handlers (create/update/delete schedule, create/remove blockout)
- **Query Handlers** - 3 handlers (get schedules, get blockouts, get available dates)
- **TypeORM Models** - Schedule and Blockout
- **Mappers** - Schedule and Blockout
- **Tests** - Unit, Integration, E2E, Property-based
- **Migrations** - Database tables for schedules and blockouts

## What Needs to Be Built?

### 3 Main Components

1. **Schedule Aggregate**
   - Manages business hours (e.g., "Monday 9:00-17:00")
   - One schedule per business per day of week
   - No versioning needed (low concurrency)

2. **Blockout Aggregate**
   - Manages blocked date ranges (e.g., "Dec 24-26: Christmas")
   - Multiple blockouts per business
   - No versioning needed (low concurrency)

3. **AvailabilityChecker Service**
   - Coordinates Schedule + Blockout + Capacity
   - Determines if a date/time is available
   - Used by queries to filter available dates/slots

### Implementation Phases

1. **Domain Layer** (1 day)
   - Create Schedule and Blockout aggregates
   - Create value objects (TimeSlot, DateRange, DayOfWeek)
   - Create domain events
   - Create repository interfaces
   - Create AvailabilityChecker service

2. **Infrastructure Layer** (1 day)
   - Create TypeORM models
   - Create repositories (write + read)
   - Create factories
   - Create mappers
   - Write integration tests

3. **Application Layer** (1 day)
   - Implement 5 command handlers
   - Implement 3 query handlers
   - Write unit tests

4. **Integration & Testing** (1 day)
   - Register everything in module
   - Create database migrations
   - Write E2E tests
   - Write property-based tests
   - Write concurrency tests

## Impact

### High Priority

- **Blocks:** Frontend integration (Phase 2 of frontend-enhancements)
- **Affects:** Customer booking flow, business configuration
- **Risk:** Without this, customers cannot see available dates/times

### Dependencies

- **Requires:** Nothing (all dependencies exist)
- **Blocks:** Frontend Phase 2, Customer booking flow

## Effort Estimate

- **Time:** 3-4 days
- **Complexity:** Medium (simpler than Booking BC)
- **Tasks:** 20 major tasks, ~80 subtasks
- **Tests:** ~50 unit tests, ~20 integration tests, ~15 E2E tests, 12 property tests

## Success Metrics

- [ ] All 3 aggregates implemented and tested
- [ ] All 5 command handlers working
- [ ] All 3 query handlers working
- [ ] AvailabilityChecker service working
- [ ] All E2E tests passing
- [ ] Database migrations applied
- [ ] Module exports correct interfaces
- [ ] Frontend can query available dates/slots

## Next Steps

1. **Review** this spec with team
2. **Approve** requirements and design
3. **Start** with Phase 1 (Domain Layer)
4. **Follow** tasks.md step by step
5. **Test** continuously (TDD approach)
6. **Integrate** with frontend once complete

## References

- **Requirements:** `requirements.md` - What needs to be built
- **Design:** `design.md` - How to build it
- **Tasks:** `tasks.md` - Step-by-step implementation plan
- **README:** `README.md` - Detailed overview

## Questions?

- **What is Schedule?** Business hours by day of week (e.g., "Monday 9-5")
- **What is Blockout?** Blocked date ranges (e.g., "Dec 24-26: Christmas")
- **What is Capacity?** Slot limits per offering per date (already implemented)
- **Why 3 aggregates?** Each has different lifecycle and responsibilities
- **Why AvailabilityChecker?** Coordinates all 3 to determine availability
- **Why no versioning on Schedule/Blockout?** Low concurrency, no race conditions expected
- **Why versioning on Capacity?** High concurrency, race conditions possible (already handled)

---

**Status:** Ready for implementation  
**Priority:** HIGH  
**Estimated:** 3-4 days  
**Blockers:** None
