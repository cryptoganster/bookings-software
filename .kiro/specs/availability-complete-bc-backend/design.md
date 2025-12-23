# Design Document - Availability BC Backend

## Overview

El Bounded Context de Availability implementa la gestión completa de disponibilidad para el sistema de reservas. Incluye tres aggregates principales: Schedule, Blockout y Capacity, cada uno con sus propias responsabilidades y ciclo de vida.

## Architecture

### Bounded Context Structure

```
availability/
├── domain/
│   ├── aggregates/
│   │   ├── capacity.ts ✅ (ya existe)
│   │   ├── schedule.ts (nuevo)
│   │   └── blockout.ts (nuevo)
│   ├── events/
│   │   ├── capacity-*.ts ✅ (ya existen)
│   │   ├── schedule-*.ts (nuevos)
│   │   └── blockout-*.ts (nuevos)
│   ├── vo/
│   │   ├── time-slot.vo.ts (nuevo)
│   │   ├── date-range.vo.ts (nuevo)
│   │   └── day-of-week.vo.ts (nuevo)
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   ├── capacity-*.ts ✅ (ya existen)
│   │   │   ├── schedule-*.ts (nuevos)
│   │   │   └── blockout-*.ts (nuevos)
│   │   ├── factories/
│   │   │   ├── capacity-factory.ts ✅ (ya existe)
│   │   │   ├── schedule-factory.ts (nuevo)
│   │   │   └── blockout-factory.ts (nuevo)
│   │   └── services/
│   │       └── availability-checker.service.ts (nuevo)
│   └── read-models/
│       ├── capacity.ts ✅ (ya existe)
│       ├── schedule.ts (nuevo)
│       └── blockout.ts (nuevo)
├── app/
│   ├── commands/
│   │   ├── create-schedule/ (stub → implementar)
│   │   ├── update-schedule/ (stub → implementar)
│   │   ├── delete-schedule/ (stub → implementar)
│   │   ├── create-blockout/ (stub → implementar)
│   │   ├── remove-blockout/ (stub → implementar)
│   │   └── set-capacity/ ✅ (ya existe)
│   └── queries/
│       ├── get-schedules-by-business/ (stub → implementar)
│       ├── get-blockouts-by-business/ (stub → implementar)
│       ├── get-available-dates/ (stub → implementar)
│       └── get-available-slots/ ✅ (ya existe parcialmente)
├── infra/
│   ├── persistence/
│   │   ├── models/
│   │   │   ├── capacity.ts ✅ (ya existe)
│   │   │   ├── schedule.ts (nuevo)
│   │   │   └── blockout.ts (nuevo)
│   │   ├── repositories/
│   │   │   ├── capacity-*.ts ✅ (ya existen)
│   │   │   ├── schedule-*.ts (nuevos)
│   │   │   └── blockout-*.ts (nuevos)
│   │   ├── factories/
│   │   │   ├── capacity-factory.ts ✅ (ya existe)
│   │   │   ├── schedule-factory.ts (nuevo)
│   │   │   └── blockout-factory.ts (nuevo)
│   │   └── mappers/
│   │       ├── capacity-*.ts ✅ (ya existen)
│   │       ├── schedule-*.ts (nuevos)
│   │       └── blockout-*.ts (nuevos)
└── presentation/
    ├── controllers/
    │   ├── schedule-crud.controller.ts ✅ (ya existe)
    │   ├── blockout-crud.controller.ts ✅ (ya existe)
    │   └── availability-query.controller.ts ✅ (ya existe)
    └── dtos/
        ├── create-schedule.dto.ts ✅ (ya existe)
        ├── update-schedule.dto.ts ✅ (ya existe)
        ├── create-blockout.dto.ts ✅ (ya existe)
        ├── get-available-dates.dto.ts ✅ (ya existe)
        └── get-available-slots.dto.ts ✅ (ya existe)
```

## Components and Interfaces

### Aggregates

#### Schedule Aggregate

```typescript
export class Schedule extends AggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private dayOfWeek: DayOfWeek; // Value Object (0-6)
  private timeSlot: TimeSlot; // Value Object (startTime, endTime)
  private isActive: boolean;

  static create(
    id: UUID,
    businessId: UUID,
    dayOfWeek: DayOfWeek,
    timeSlot: TimeSlot,
  ): Schedule;

  update(timeSlot: TimeSlot): void;
  deactivate(): void;
  activate(): void;
}
```

#### Blockout Aggregate

```typescript
export class Blockout extends AggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private dateRange: DateRange; // Value Object (startDate, endDate)
  private reason: string | null;

  static create(
    id: UUID,
    businessId: UUID,
    dateRange: DateRange,
    reason: string | null,
  ): Blockout;

  isDateBlocked(date: Date): boolean;
}
```

#### Capacity Aggregate (ya existe)

```typescript
export class Capacity extends VersionedAggregateRoot {
  // Ya implementado completamente
  bookSlot(): void;
  releaseSlot(): void;
  updateCapacity(newTotalSlots: number): void;
}
```

### Value Objects

#### TimeSlot

```typescript
export class TimeSlot extends ValueObject {
  constructor(
    private readonly startTime: string, // HH:mm format
    private readonly endTime: string
  );

  isValid(): boolean;
  includes(time: string): boolean;
  getDurationInMinutes(): number;
}
```

#### DateRange

```typescript
export class DateRange extends ValueObject {
  constructor(
    private readonly startDate: Date,
    private readonly endDate: Date
  );

  isValid(): boolean;
  includes(date: Date): boolean;
  getDurationInDays(): number;
}
```

#### DayOfWeek

```typescript
export class DayOfWeek extends ValueObject {
  constructor(private readonly value: number); // 0-6

  isValid(): boolean;
  getValue(): number;
  toString(): string; // "Monday", "Tuesday", etc.
}
```

### Domain Services

#### AvailabilityChecker

```typescript
@Injectable()
export class AvailabilityChecker {
  async isDateAvailable(
    businessId: string,
    offeringId: string,
    date: Date,
  ): Promise<boolean>;

  async getAvailableTimeSlots(
    businessId: string,
    offeringId: string,
    date: Date,
    duration: number,
  ): Promise<string[]>;
}
```

## Data Models

### Schedule Model

```typescript
@Entity("schedules")
export class ScheduleModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  businessId: string;

  @Column("int")
  dayOfWeek: number; // 0-6

  @Column("time")
  startTime: string; // HH:mm

  @Column("time")
  endTime: string; // HH:mm

  @Column("boolean", { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Blockout Model

```typescript
@Entity("blockouts")
export class BlockoutModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  businessId: string;

  @Column("date")
  startDate: Date;

  @Column("date")
  endDate: Date;

  @Column("text", { nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Capacity Model (ya existe)

```typescript
@Entity("capacities")
export class CapacityModel {
  // Ya implementado
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Schedule time range validity

_For any_ schedule, the start time must always be before the end time
**Validates: Requirements 1.1**

### Property 2: Schedule day of week validity

_For any_ schedule, the day of week must be between 0 and 6 inclusive
**Validates: Requirements 1.2**

### Property 3: Blockout date range validity

_For any_ blockout, the start date must be before or equal to the end date
**Validates: Requirements 2.2**

### Property 4: Blockout no past dates

_For any_ blockout creation, the start date must not be in the past
**Validates: Requirements 2.1**

### Property 5: Capacity positive slots

_For any_ capacity, the total slots must be greater than zero
**Validates: Requirements 3.1**

### Property 6: Capacity no past dates

_For any_ capacity creation, the date must not be in the past
**Validates: Requirements 3.2**

### Property 7: Capacity update constraint

_For any_ capacity update, the new total slots must be greater than or equal to the currently booked slots
**Validates: Requirements 3.3**

### Property 8: Slot booking decrements availability

_For any_ capacity, booking a slot decrements available slots by 1 and increments booked slots by 1
**Validates: Requirements 3.4**

### Property 9: Slot release increments availability

_For any_ capacity, releasing a slot increments available slots by 1 and decrements booked slots by 1
**Validates: Requirements 3.5**

### Property 10: Available dates exclude blockouts

_For any_ query for available dates, dates within blockout ranges must not be included in the results
**Validates: Requirements 4.2**

### Property 11: Available dates exclude zero capacity

_For any_ query for available dates, dates with zero available capacity must not be included in the results
**Validates: Requirements 4.3**

### Property 12: Optimistic locking prevents double booking

_For any_ two concurrent slot bookings on the same capacity, only one must succeed and the other must receive a concurrency exception
**Validates: Requirements 5.1**

## Error Handling

### Domain Exceptions

- `InvalidTimeSlotException` - Start time >= end time
- `InvalidDayOfWeekException` - Day not in 0-6 range
- `InvalidDateRangeException` - Start date > end date
- `PastDateException` - Date is in the past
- `NegativeCapacityException` - Total slots <= 0
- `InsufficientCapacityException` - New capacity < booked slots
- `NoAvailableSlotsException` - Available slots = 0
- `ScheduleNotFoundException` - Schedule not found
- `BlockoutNotFoundException` - Blockout not found
- `CapacityNotFoundException` - Capacity not found
- `DuplicateScheduleException` - Schedule already exists for business + day

### HTTP Status Codes

- 400 Bad Request - Validation errors
- 404 Not Found - Resource not found
- 409 Conflict - Concurrency exception, duplicate schedule
- 500 Internal Server Error - Unexpected errors

## Testing Strategy

### Unit Tests

- Aggregate business logic (Schedule, Blockout, Capacity)
- Value Object validation (TimeSlot, DateRange, DayOfWeek)
- Domain Service logic (AvailabilityChecker)
- Mappers (toModel, toDomain, toReadModel)

### Integration Tests

- Command Handlers with real database
- Query Handlers with real database
- Repositories with real database
- Factories with real database

### Property-Based Tests

- Property 1-12 (listed above)
- Use fast-check library
- Minimum 100 iterations per property
- Tag each test with property number

### E2E Tests

- Schedule CRUD operations
- Blockout CRUD operations
- Availability queries
- Concurrent booking scenarios

### Concurrency Tests

- Simulate race conditions
- Test optimistic locking
- Test retry logic
- Verify version increments
