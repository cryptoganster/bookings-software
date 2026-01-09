---
inclusion: fileMatch
fileMatchPattern: "apps/backend/**/*.spec.ts,apps/backend/**/*.test.ts"
---

# Backend Testing Conventions

**Testing strategies and conventions for backend (NestJS) code**

> **Cross-References:**
>
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - NestJS testing patterns
> - [21-clean-code-principles.md](./21-clean-code-principles.md) - Testing best practices
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - Domain testing patterns
> - [10-cqrs-pattern.md](./10-cqrs-pattern.md) - CQRS testing patterns

---

# Backend Testing Conventions

Este documento define las convenciones y estrategias de testing para el backend (NestJS).

## Testing Strategy

### Pirámide de Testing

```
        E2E Tests (10%)
       ↗            ↖
  Integration Tests (30%)
 ↗                      ↖
Unit Tests (60%)
```

### Tipos de Tests

1. **Unit Tests** - Aggregates, Value Objects, Domain Services (aislados, rápidos)
2. **Integration Tests** - Command/Query Handlers, Repositories, Event Handlers (con BD real)
3. **Property-Based Tests** - Propiedades universales, generación de datos aleatorios
4. **E2E Tests** - Flujos completos, HTTP requests
5. **Concurrency Tests** - Race conditions, Optimistic locking

## Unit Tests

### Aggregates

```typescript
describe("Appointment", () => {
  describe("create", () => {
    it("should create appointment with CONFIRMED status", () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const customerId = UUID.generate();
      const offeringId = UUID.generate();
      const dateTime = DateTime.fromDate(new Date("2024-12-20T10:00:00Z"));

      // Act
      const appointment = Appointment.create(
        id,
        businessId,
        customerId,
        offeringId,
        dateTime,
      );

      // Assert
      expect(appointment.getId()).toEqual(id);
      expect(appointment.getStatus().getValue()).toBe("CONFIRMED");
      expect(appointment.getUncommittedEvents()).toHaveLength(1);
      expect(appointment.getUncommittedEvents()[0]).toBeInstanceOf(
        AppointmentCreated,
      );
    });

    it("should throw error when creating appointment in the past", () => {
      // Arrange
      const pastDate = DateTime.fromDate(new Date("2020-01-01T10:00:00Z"));

      // Act & Assert
      expect(() => {
        Appointment.create(
          UUID.generate(),
          UUID.generate(),
          UUID.generate(),
          UUID.generate(),
          pastDate,
        );
      }).toThrow(CannotCreatePastAppointmentException);
    });
  });

  describe("cancel", () => {
    it("should cancel appointment and emit event", () => {
      // Arrange
      const appointment = Appointment.create(
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(new Date("2024-12-20T10:00:00Z")),
      );
      appointment.clearEvents(); // Clear creation event

      // Act
      appointment.cancel();

      // Assert
      expect(appointment.getStatus().getValue()).toBe("CANCELLED");
      expect(appointment.getUncommittedEvents()).toHaveLength(1);
      expect(appointment.getUncommittedEvents()[0]).toBeInstanceOf(
        AppointmentCancelled,
      );
    });

    it("should throw error when cancelling within 2 hours", () => {
      // Arrange
      const nearFutureDate = new Date();
      nearFutureDate.setHours(nearFutureDate.getHours() + 1); // 1 hour from now

      const appointment = Appointment.create(
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(nearFutureDate),
      );

      // Act & Assert
      expect(() => appointment.cancel()).toThrow(
        CannotCancelWithinTwoHoursException,
      );
    });
  });
});
```

### Value Objects

```typescript
describe("AppointmentStatus", () => {
  describe("confirmed", () => {
    it("should create CONFIRMED status", () => {
      const status = AppointmentStatus.confirmed();
      expect(status.getValue()).toBe("CONFIRMED");
    });
  });

  describe("canBeCancelled", () => {
    it("should return true for CONFIRMED status", () => {
      const status = AppointmentStatus.confirmed();
      expect(status.canBeCancelled()).toBe(true);
    });

    it("should return false for CANCELLED status", () => {
      const status = AppointmentStatus.cancelled();
      expect(status.canBeCancelled()).toBe(false);
    });

    it("should return false for COMPLETED status", () => {
      const status = AppointmentStatus.completed();
      expect(status.canBeCancelled()).toBe(false);
    });
  });

  describe("fromString", () => {
    it("should create status from valid string", () => {
      const status = AppointmentStatus.fromString("CONFIRMED");
      expect(status.getValue()).toBe("CONFIRMED");
    });

    it("should throw error for invalid string", () => {
      expect(() => AppointmentStatus.fromString("INVALID")).toThrow(
        InvalidAppointmentStatusException,
      );
    });
  });

  describe("equals", () => {
    it("should return true for same status", () => {
      const status1 = AppointmentStatus.confirmed();
      const status2 = AppointmentStatus.confirmed();
      expect(status1.equals(status2)).toBe(true);
    });

    it("should return false for different status", () => {
      const status1 = AppointmentStatus.confirmed();
      const status2 = AppointmentStatus.cancelled();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
```

### Domain Services

```typescript
describe("BusinessUniquenessChecker", () => {
  let checker: BusinessUniquenessChecker;
  let mockReadRepo: jest.Mocked<IBusinessReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findByWhatsAppPhone: jest.fn(),
    } as any;

    checker = new BusinessUniquenessChecker(mockReadRepo);
  });

  describe("isWhatsAppPhoneUnique", () => {
    it("should return true when phone not found", async () => {
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

      const result = await checker.isWhatsAppPhoneUnique("+18095551234");

      expect(result).toBe(true);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith(
        "+18095551234",
      );
    });

    it("should return false when phone exists for different business", async () => {
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue({
        id: "business-1",
        whatsappPhone: "+18095551234",
      } as any);

      const result = await checker.isWhatsAppPhoneUnique("+18095551234");

      expect(result).toBe(false);
    });

    it("should return true when phone exists for same business (update scenario)", async () => {
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue({
        id: "business-1",
        whatsappPhone: "+18095551234",
      } as any);

      const result = await checker.isWhatsAppPhoneUnique(
        "+18095551234",
        "business-1",
      );

      expect(result).toBe(true);
    });
  });
});
```

## Integration Tests

### Command Handlers

```typescript
describe("CreateAppointmentHandler (Integration)", () => {
  let module: TestingModule;
  let handler: CreateAppointmentHandler;
  let appointmentRepo: IAppointmentWriteRepository;
  let capacityFactory: ICapacityFactory;
  let capacityRepo: ICapacityWriteRepository;
  let customerChecker: ICustomerExistenceChecker;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: "test",
          password: "test",
          database: "test_db",
          entities: [AppointmentModel, CapacityModel],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([AppointmentModel, CapacityModel]),
        CqrsModule,
      ],
      providers: [
        CreateAppointmentHandler,
        {
          provide: "IAppointmentWriteRepository",
          useClass: AppointmentWriteRepository,
        },
        {
          provide: "ICapacityFactory",
          useClass: CapacityFactory,
        },
        {
          provide: "ICapacityWriteRepository",
          useClass: CapacityWriteRepository,
        },
        {
          provide: "ICustomerExistenceChecker",
          useValue: {
            exists: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: "IUnitOfWork",
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    handler = module.get(CreateAppointmentHandler);
    appointmentRepo = module.get("IAppointmentWriteRepository");
    capacityFactory = module.get("ICapacityFactory");
    capacityRepo = module.get("ICapacityWriteRepository");
    customerChecker = module.get("ICustomerExistenceChecker");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should create appointment and decrement capacity", async () => {
    // Arrange
    const offeringId = UUID.generate();
    const dateTime = new Date("2024-12-20T10:00:00Z");

    // Create capacity first
    const capacity = Capacity.create(UUID.generate(), offeringId, dateTime, 10);
    await capacityRepo.save(capacity);

    const command = new CreateAppointmentCommand(
      UUID.generate().getValue(),
      UUID.generate().getValue(),
      offeringId.getValue(),
      dateTime,
    );

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.appointmentId).toBeDefined();

    // Verify capacity was decremented
    const updatedCapacity = await capacityFactory.loadByOfferingAndDate(
      offeringId,
      dateTime,
    );
    expect(updatedCapacity.getAvailableSlots()).toBe(9);
  });

  it("should throw error when no capacity available", async () => {
    // Arrange
    const offeringId = UUID.generate();
    const dateTime = new Date("2024-12-20T10:00:00Z");

    // Create capacity with 0 slots
    const capacity = Capacity.create(UUID.generate(), offeringId, dateTime, 0);
    await capacityRepo.save(capacity);

    const command = new CreateAppointmentCommand(
      UUID.generate().getValue(),
      UUID.generate().getValue(),
      offeringId.getValue(),
      dateTime,
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      NoAvailableSlotsException,
    );
  });

  it("should throw error when customer does not exist", async () => {
    // Arrange
    jest.spyOn(customerChecker, "exists").mockResolvedValue(false);

    const command = new CreateAppointmentCommand(
      UUID.generate().getValue(),
      "non-existent-customer",
      UUID.generate().getValue(),
      new Date("2024-12-20T10:00:00Z"),
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      CustomerNotFoundException,
    );
  });
});
```

### Query Handlers

```typescript
describe("GetCustomerAppointmentsHandler (Integration)", () => {
  let module: TestingModule;
  let handler: GetCustomerAppointmentsHandler;
  let readRepo: IAppointmentReadRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: "test",
          password: "test",
          database: "test_db",
          entities: [AppointmentModel],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [
        GetCustomerAppointmentsHandler,
        {
          provide: "IAppointmentReadRepository",
          useClass: AppointmentReadRepository,
        },
      ],
    }).compile();

    handler = module.get(GetCustomerAppointmentsHandler);
    readRepo = module.get("IAppointmentReadRepository");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should return customer appointments", async () => {
    // Arrange
    const customerId = UUID.generate().getValue();
    const query = new GetCustomerAppointmentsQuery(customerId);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(Array.isArray(result)).toBe(true);
    result.forEach((appointment) => {
      expect(appointment.customerId).toBe(customerId);
    });
  });
});
```

### Event Handlers

```typescript
describe("OnAppointmentCreatedHandler (Integration)", () => {
  let module: TestingModule;
  let handler: OnAppointmentCreatedHandler;
  let commandBus: CommandBus;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [OnAppointmentCreatedHandler],
    }).compile();

    handler = module.get(OnAppointmentCreatedHandler);
    commandBus = module.get(CommandBus);
  });

  it("should schedule reminder when appointment is created", async () => {
    // Arrange
    const event = new AppointmentCreated(
      "appointment-id",
      "business-id",
      "customer-id",
      "offering-id",
      new Date("2024-12-20T10:00:00Z"),
    );

    const commandBusSpy = jest.spyOn(commandBus, "execute");

    // Act
    await handler.handle(event);

    // Assert
    expect(commandBusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: "appointment-id",
      }),
    );
  });
});
```

## Property-Based Tests

```typescript
import { fc, test } from "@fast-check/vitest";

describe("Appointment PBT", () => {
  test.prop([
    fc.string({ minLength: 36, maxLength: 36 }), // UUID
    fc.date({ min: new Date(), max: new Date("2025-12-31") }), // Future date
  ])(
    "should always create appointment with CONFIRMED status",
    (id, dateTime) => {
      const appointment = Appointment.create(
        UUID.fromString(id),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(dateTime),
      );

      expect(appointment.getStatus().getValue()).toBe("CONFIRMED");
    },
  );

  test.prop([fc.integer({ min: 0, max: 1000 })])(
    "should preserve version for any valid version number",
    (version) => {
      const appointment = Appointment.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(new Date("2024-12-20T10:00:00Z")),
        AppointmentStatus.confirmed(),
        version,
      );

      expect(appointment.getVersion().getValue()).toBe(version);
    },
  );
});
```

## Concurrency Tests

```typescript
describe("Appointment Concurrency", () => {
  it("should handle concurrent cancellations with optimistic locking", async () => {
    // Arrange
    const appointment = Appointment.create(
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(new Date("2024-12-20T10:00:00Z")),
    );
    await appointmentRepo.save(appointment);

    // Act - Simulate two concurrent cancellations
    const promise1 = handler.execute(
      new CancelAppointmentCommand(appointment.getId().getValue()),
    );
    const promise2 = handler.execute(
      new CancelAppointmentCommand(appointment.getId().getValue()),
    );

    // Assert - One should succeed, one should fail with ConcurrencyException
    const results = await Promise.allSettled([promise1, promise2]);

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBeInstanceOf(ConcurrencyException);
  });
});
```

## E2E Tests

```typescript
describe("Appointments (E2E)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password" });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("/appointments (POST)", () => {
    return request(app.getHttpServer())
      .post("/appointments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        businessId: "business-uuid",
        customerId: "customer-uuid",
        offeringId: "offering-uuid",
        dateTime: "2024-12-20T10:00:00Z",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.appointmentId).toBeDefined();
      });
  });

  it("/appointments (GET)", () => {
    return request(app.getHttpServer())
      .get("/appointments")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it("/appointments/:id (DELETE)", async () => {
    // Create appointment first
    const createResponse = await request(app.getHttpServer())
      .post("/appointments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        businessId: "business-uuid",
        customerId: "customer-uuid",
        offeringId: "offering-uuid",
        dateTime: "2024-12-20T10:00:00Z",
      });

    const appointmentId = createResponse.body.appointmentId;

    // Cancel appointment
    return request(app.getHttpServer())
      .delete(`/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(204);
  });
});
```

## Testing Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('should create appointment', async () => {
  // Arrange - Setup test data
  const command = new CreateAppointmentCommand(...);
  mockCapacityRepo.findByOfferingAndDate.mockResolvedValue(capacity);

  // Act - Execute the code under test
  const result = await handler.execute(command);

  // Assert - Verify the outcome
  expect(result.appointmentId).toBeDefined();
});
```

### Test Naming

```typescript
// ✅ Good - Descriptive, explains what and why
it("should create appointment when capacity is available", () => {});
it("should throw NoAvailableSlotsException when capacity is full", () => {});
it("should emit AppointmentCreated event after successful creation", () => {});

// ❌ Bad - Vague, doesn't explain scenario
it("test1", () => {});
it("works", () => {});
it("creates appointment", () => {});
```

### Test Independence

```typescript
// ✅ Good - Each test is independent
describe('Appointment', () => {
  let appointment: Appointment;

  beforeEach(() => {
    // Fresh setup for each test
    appointment = Appointment.create(...);
  });

  it('test 1', () => {
    // Uses fresh appointment
  });

  it('test 2', () => {
    // Uses fresh appointment, independent of test 1
  });
});

// ❌ Bad - Tests depend on each other
describe('Appointment', () => {
  let appointment: Appointment;

  it('test 1', () => {
    appointment = Appointment.create(...);
  });

  it('test 2', () => {
    // Depends on test 1 running first
    appointment.cancel();
  });
});
```

### Mocking

```typescript
// ✅ Good - Mock external dependencies
const mockRepo = {
  save: jest.fn(),
  findById: jest.fn(),
} as jest.Mocked<IAppointmentWriteRepository>;

// ❌ Bad - Don't mock the system under test
const mockAppointment = {
  cancel: jest.fn(),
} as jest.Mocked<Appointment>;
```

## Test Coverage

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical paths covered
- **E2E Tests:** Main user flows covered

### Running Coverage

```bash
# Backend tests with coverage
pnpm --filter backend test:coverage

# View coverage report
open apps/backend/coverage/lcov-report/index.html
```

### Coverage Reports

```bash
# Generate coverage report
pnpm --filter backend test:coverage

# Expected output:
# Statements   : 85% ( 1234/1450 )
# Branches     : 80% ( 567/708 )
# Functions    : 82% ( 234/285 )
# Lines        : 85% ( 1200/1411 )
```

## Troubleshooting

### Tests Failing Randomly

**Causa:** Race conditions, shared state, timing issues

**Solución:**

- Ensure test independence (use `beforeEach`)
- Avoid shared mutable state
- Use `jest.useFakeTimers()` for time-dependent tests

### Database Connection Issues

**Causa:** Test database not running or misconfigured

**Solución:**

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Verify connection
psql -h localhost -U test -d test_db
```

### Slow Tests

**Causa:** Too many integration/E2E tests, database operations

**Solución:**

- Increase unit test ratio (60% unit, 30% integration, 10% E2E)
- Use in-memory database for integration tests
- Run E2E tests in parallel

---

**Last Updated:** January 9, 2026  
**Status:** Active
