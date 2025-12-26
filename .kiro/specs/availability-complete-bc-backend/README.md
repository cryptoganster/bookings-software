# Availability BC Backend - Complete Implementation

## Overview

Este spec define la implementación completa del Bounded Context de Availability para el backend del sistema de reservas. El BC es responsable de gestionar horarios de atención, bloqueos de fechas y capacidad de slots.

## Current Status

### ✅ Already Implemented

- **Capacity Aggregate:** Completamente implementado con optimistic locking
- **Capacity Events:** CapacityCreated, SlotBooked, SlotReleased, CapacityChanged
- **Capacity Repositories:** Write y Read repositories
- **Capacity Factory:** Para cargar aggregates
- **SetCapacityCommand:** Handler completo
- **GetAvailableSlotsQuery:** Handler parcial (necesita mejoras)
- **Controllers:** ScheduleCrudController, BlockoutCrudController, AvailabilityQueryController
- **DTOs:** Todos los DTOs necesarios
- **Command/Query Stubs:** Todos creados

### ❌ Missing Implementation

- **Schedule Aggregate:** No existe
- **Blockout Aggregate:** No existe
- **Value Objects:** TimeSlot, DateRange, DayOfWeek
- **Domain Service:** AvailabilityChecker
- **Schedule Repositories:** Write y Read
- **Blockout Repositories:** Write y Read
- **Schedule Factory:** No existe
- **Blockout Factory:** No existe
- **Command Handlers:** Create/Update/Delete Schedule, Create/Remove Blockout
- **Query Handlers:** GetSchedulesByBusiness, GetBlockoutsByBusiness, GetAvailableDates
- **TypeORM Models:** Schedule, Blockout
- **Mappers:** Schedule y Blockout
- **Tests:** Unit, Integration, E2E, Property-based
- **Database Migrations:** schedules y blockouts tables

## Architecture

```
Availability BC
├── Capacity (✅ Complete)
│   ├── Aggregate ✅
│   ├── Events ✅
│   ├── Repositories ✅
│   ├── Factory ✅
│   └── Commands/Queries ✅
├── Schedule (❌ Missing)
│   ├── Aggregate ❌
│   ├── Events ❌
│   ├── Repositories ❌
│   ├── Factory ❌
│   └── Commands/Queries ❌
└── Blockout (❌ Missing)
    ├── Aggregate ❌
    ├── Events ❌
    ├── Repositories ❌
    ├── Factory ❌
    └── Commands/Queries ❌
```

## Key Concepts

### Schedule

- **Purpose:** Define business operating hours by day of week
- **Example:** Monday 9:00-17:00, Tuesday 10:00-18:00
- **Aggregate:** Schedule (businessId, dayOfWeek, startTime, endTime)
- **No Versioning:** No concurrency issues expected

### Blockout

- **Purpose:** Block specific date ranges (vacations, holidays)
- **Example:** December 24-26 (Christmas), July 1-15 (Vacation)
- **Aggregate:** Blockout (businessId, startDate, endDate, reason)
- **No Versioning:** No concurrency issues expected

### Capacity

- **Purpose:** Limit number of appointments per offering per date
- **Example:** Haircut service: 10 slots on 2024-12-25
- **Aggregate:** Capacity (offeringId, date, totalSlots, availableSlots, bookedSlots)
- **Versioning:** ✅ Uses optimistic locking (already implemented)

### AvailabilityChecker (Domain Service)

- **Purpose:** Determine if a date/time is available for booking
- **Logic:**
  1. Check if date is within business hours (Schedule)
  2. Check if date is not blocked (Blockout)
  3. Check if capacity is available (Capacity)
- **Stateless:** No internal state, only coordinates aggregates

## Dependencies

### Internal

- `@shared/kernel` - VersionedAggregateRoot, ValueObject, IUnitOfWork
- `@shared/vo` - UUID, AggregateVersion
- `@offering/*` - Para validar que offering existe

### External

- `@nestjs/cqrs` - CommandBus, QueryBus, EventBus
- `@nestjs/typeorm` - TypeORM integration
- `typeorm` - ORM
- `pg` - PostgreSQL driver

## Testing Strategy

### Unit Tests (60%)

- Aggregate business logic
- Value Object validation
- Domain Service logic
- Mappers

### Integration Tests (30%)

- Command/Query Handlers with real DB
- Repositories with real DB
- Factories with real DB

### Property-Based Tests (5%)

- 12 properties defined in design.md
- Use fast-check library
- Minimum 100 iterations

### E2E Tests (5%)

- Schedule CRUD
- Blockout CRUD
- Availability queries
- Concurrent bookings

## Implementation Order

1. **Domain Layer First** - Aggregates, Events, VOs, Interfaces
2. **Infrastructure Layer** - Models, Repositories, Factories, Mappers
3. **Application Layer** - Command/Query Handlers
4. **Module Registration** - Wire everything together
5. **Database Migrations** - Create tables
6. **Testing** - Unit, Integration, E2E, Property-based

## References

- **PRD:** `.kiro/steering/PRD.md` (sections on Availability BC)
- **Architecture:** `.kiro/steering/architecture.md`
- **DDD Patterns:** `.kiro/steering/ddd-patterns.md`
- **CQRS:** `.kiro/steering/cqrs.md`
- **Factory Pattern:** `.kiro/steering/factory-pattern.md`
- **Capacity Reference:** `apps/backend/src/availability/domain/aggregates/capacity.ts`

## Getting Started

1. Read `requirements.md` to understand what needs to be built
2. Read `design.md` to understand the architecture and components
3. Follow `tasks.md` to implement step by step
4. Use Capacity aggregate as reference for patterns
5. Use Booking BC and Offering BC as reference for structure

## Success Criteria

- [ ] All 20 major tasks completed
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] All 12 property-based tests passing
- [ ] Database migrations applied successfully
- [ ] Module registered and exports correct interfaces
- [ ] Controllers return correct responses
- [ ] Concurrency tests pass (optimistic locking works)

## Timeline

- **Estimated:** 3-4 days
- **Priority:** HIGH (blocking frontend integration)
- **Blockers:** None (all dependencies exist)

## Notes

- Schedule and Blockout are simpler than Capacity (no versioning needed)
- AvailabilityChecker is the key service that ties everything together
- Follow CQRS strictly: Commands modify, Queries read
- Use Factory pattern for loading aggregates (not write repository)
- All commands use UnitOfWork for transactions
- Property-based tests are optional but highly recommended
- E2E tests should cover happy path and error cases
