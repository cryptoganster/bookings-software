# Design Document - Architecture Compliance Refactor

## Overview

Este documento describe el diseño detallado para eliminar todas las violaciones arquitectónicas existentes en el sistema, asegurando el cumplimiento estricto de Clean Architecture, Domain-Driven Design (DDD), CQRS y los principios SOLID.

### Objetivos

1. **Eliminar violaciones de CQRS**: Command Handlers NO deben usar Read Repositories
2. **Mantener Clean Architecture**: Application Layer NO debe importar de Infrastructure Layer
3. **Asegurar Bounded Context Isolation**: Comunicación solo via eventos y CommandBus/QueryBus
4. **Implementar Domain Services**: Para validaciones de unicidad y existencia
5. **Aplicar Factory Pattern**: Para cargar aggregates preservando versiones
6. **Mantener Test Coverage**: Todos los tests deben pasar después del refactoring
7. **Documentar patrones**: Actualizar steering files con ejemplos correctos

### Alcance

**Bounded Contexts afectados:**

- Auth BC (RegisterHandler)
- Business BC (CreateBusinessHandler, ConfigureWhatsAppHandler)
- Booking BC (CreateAppointmentHandler)
- Customer BC (DeleteCustomerHandler)
- Conversation BC (SendAdminResponseHandler)

**Componentes a refactorizar:**

- 6 Command Handlers
- 0 nuevos Domain Services a crear
- 1 Factory a crear (ConversationFactory)
- Tests unitarios e integración
- Documentación en steering files

## Architecture

### Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────────────┐
│           Presentation Layer (Controllers)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Application Layer (Command Handlers)            │
│                                                         │
│  ❌ CreateBusinessHandler                               │
│     - Injects IBusinessReadRepository                   │
│     - Calls findByOwnerId(), findByWhatsAppPhone()      │
│                                                         │
│  ❌ SendAdminResponseHandler                            │
│     - Injects TypeORM Repository<ConversationModel>     │
│     - Injects IConversationReadRepository               │
│     - Updates DB directly without aggregate             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Infrastructure Layer (Repositories)             │
└─────────────────────────────────────────────────────────┘
```

**Problemas:**

1. ❌ Command Handlers usan Read Repositories (viola CQRS)
2. ❌ Application Layer importa TypeORM Repository (viola Clean Architecture)
3. ❌ Application Layer importa Models de Infrastructure (viola inversión de dependencias)
4. ❌ Command Handlers actualizan BD directamente sin usar aggregates (viola DDD)

### Target Architecture (Compliant)

```
┌─────────────────────────────────────────────────────────┐
│           Presentation Layer (Controllers)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Application Layer (Command Handlers)            │
│                                                         │
│  ✅ CreateBusinessHandler                               │
│     - Injects IBusinessUniquenessChecker (Domain Service)│
│     - Injects IBusinessLimitChecker (Domain Service)    │
│     - Injects IBusinessWriteRepository                  │
│                                                         │
│  ✅ SendAdminResponseHandler                            │
│     - Injects IConversationFactory                      │
│     - Injects IConversationWriteRepository              │
│     - Loads aggregate, calls method, saves              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Domain Layer (Services)                    │
│                                                         │
│  BusinessUniquenessChecker                              │
│    - Injects IBusinessReadRepository                    │
│    - isWhatsAppPhoneUnique(phone): Promise<boolean>     │
│                                                         │
│  BusinessLimitChecker                                   │
│    - Injects IBusinessReadRepository                    │
│    - canCreateBusiness(ownerId): Promise<boolean>       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Infrastructure Layer (Repositories)             │
└─────────────────────────────────────────────────────────┘
```

**Beneficios:**

1. ✅ CQRS estricto: Command Handlers solo usan Write Repositories y Factories
2. ✅ Clean Architecture: Application Layer solo depende de Domain interfaces
3. ✅ DDD: Aggregates encapsulan lógica de negocio
4. ✅ SOLID: Domain Services tienen responsabilidad única
5. ✅ Testeable: Domain Services se testean independientemente

## Components and Interfaces

### Domain Services

#### BusinessUniquenessChecker

**Ubicación:** `src/business/domain/services/business-uniqueness-checker.service.ts`

**Propósito:** Validar unicidad de WhatsApp phone en Business BC

**Interface:**

```typescript
export interface IBusinessUniquenessChecker {
  isWhatsAppPhoneUnique(
    phone: string,
    excludeBusinessId?: string,
  ): Promise<boolean>;
}
```

**Implementation:**

```typescript
@Injectable()
export class BusinessUniquenessChecker implements IBusinessUniquenessChecker {
  constructor(
    @Inject("IBusinessReadRepository")
    private readonly readRepo: IBusinessReadRepository,
  ) {}

  async isWhatsAppPhoneUnique(
    phone: string,
    excludeBusinessId?: string,
  ): Promise<boolean> {
    const existing = await this.readRepo.findByWhatsAppPhone(phone);

    if (!existing) {
      return true;
    }

    // Si estamos actualizando, permitir el mismo business
    if (excludeBusinessId && existing.id === excludeBusinessId) {
      return true;
    }

    return false;
  }
}
```

#### BusinessLimitChecker

**Ubicación:** `src/business/domain/services/business-limit-checker.service.ts`

**Propósito:** Validar límites de negocios según subscription plan

**Interface:**

```typescript
export interface IBusinessLimitChecker {
  canCreateBusiness(ownerId: string): Promise<boolean>;
  getBusinessCount(ownerId: string): Promise<number>;
  getMaxBusinessesAllowed(ownerId: string): Promise<number>;
}
```

**Implementation:**

```typescript
@Injectable()
export class BusinessLimitChecker implements IBusinessLimitChecker {
  constructor(
    @Inject("IBusinessReadRepository")
    private readonly businessReadRepo: IBusinessReadRepository,
    @Inject("IBusinessOwnerReadRepository")
    private readonly ownerReadRepo: IBusinessOwnerReadRepository,
  ) {}

  async canCreateBusiness(ownerId: string): Promise<boolean> {
    const [currentCount, maxAllowed] = await Promise.all([
      this.getBusinessCount(ownerId),
      this.getMaxBusinessesAllowed(ownerId),
    ]);

    return currentCount < maxAllowed;
  }

  async getBusinessCount(ownerId: string): Promise<number> {
    const businesses = await this.businessReadRepo.findByOwnerId(ownerId);
    return businesses.length;
  }

  async getMaxBusinessesAllowed(ownerId: string): Promise<number> {
    const owner = await this.ownerReadRepo.findByUserId(ownerId);

    if (!owner) {
      throw new BusinessOwnerNotFoundException(ownerId);
    }

    // Retornar límite según subscription plan
    return owner.subscriptionPlan.maxBusinesses;
  }
}
```

#### UserUniquenessChecker

**Ubicación:** `src/auth/domain/services/user-uniqueness-checker.service.ts`

**Propósito:** Validar unicidad de email en Auth BC

**Interface:**

```typescript
export interface IUserUniquenessChecker {
  isEmailUnique(email: string): Promise<boolean>;
}
```

**Implementation:**

```typescript
@Injectable()
export class UserUniquenessChecker implements IUserUniquenessChecker {
  constructor(
    @Inject("IUserReadRepository")
    private readonly readRepo: IUserReadRepository,
  ) {}

  async isEmailUnique(email: string): Promise<boolean> {
    const existing = await this.readRepo.findByEmail(email);
    return !existing;
  }
}
```

#### CustomerExistenceChecker

**Ubicación:** `src/customer/domain/services/customer-existence-checker.service.ts`

**Propósito:** Verificar existencia de Customer en Customer BC

**Interface:**

```typescript
export interface ICustomerExistenceChecker {
  exists(customerId: string): Promise<boolean>;
  getCustomer(customerId: string): Promise<CustomerReadModel | null>;
}
```

**Implementation:**

```typescript
@Injectable()
export class CustomerExistenceChecker implements ICustomerExistenceChecker {
  constructor(
    @Inject("ICustomerReadRepository")
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async exists(customerId: string): Promise<boolean> {
    const customer = await this.readRepo.findById(customerId);
    return !!customer;
  }

  async getCustomer(customerId: string): Promise<CustomerReadModel | null> {
    return this.readRepo.findById(customerId);
  }
}
```

#### CustomerAppointmentChecker

**Ubicación:** `src/customer/domain/services/customer-appointment-checker.service.ts`

**Propósito:** Verificar citas futuras de un customer

**Interface:**

```typescript
export interface ICustomerAppointmentChecker {
  hasFutureAppointments(customerId: string): Promise<boolean>;
  getFutureAppointmentsCount(customerId: string): Promise<number>;
}
```

**Implementation:**

```typescript
@Injectable()
export class CustomerAppointmentChecker implements ICustomerAppointmentChecker {
  constructor(
    @Inject("IAppointmentReadRepository")
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  async hasFutureAppointments(customerId: string): Promise<boolean> {
    const count = await this.getFutureAppointmentsCount(customerId);
    return count > 0;
  }

  async getFutureAppointmentsCount(customerId: string): Promise<number> {
    const now = new Date();
    const appointments =
      await this.appointmentReadRepo.findByCustomerId(customerId);

    return appointments.filter(
      (apt) => apt.dateTime > now && apt.status !== "CANCELLED",
    ).length;
  }
}
```

### Factories

#### ConversationFactory

**Ubicación:** `src/conversation/infra/persistence/factories/conversation-factory.ts`

**Propósito:** Cargar Conversation aggregate desde persistencia para modificación

**Interface:**

```typescript
// src/conversation/domain/interfaces/factories/conversation-factory.ts
export interface IConversationFactory {
  loadById(id: string): Promise<Conversation | null>;
}
```

**Implementation:**

```typescript
@Injectable()
export class ConversationFactory implements IConversationFactory {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
  ) {}

  async loadById(id: string): Promise<Conversation | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    // Reconstruct aggregate with business logic
    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      model.customerPhone,
      ConversationStatus.fromString(model.status),
      ConversationState.fromString(model.state),
      model.lastMessageAt,
      model.version, // ← Preservar versión para optimistic locking
    );
  }
}
```

### Refactored Command Handlers

#### SendAdminResponseHandler (Refactored)

**Ubicación:** `src/conversation/app/commands/send-admin-response/handler.ts`

**Cambios:**

1. ❌ Eliminar `@InjectRepository(ConversationModel)`
2. ❌ Eliminar `@Inject('IConversationReadRepository')`
3. ✅ Agregar `@Inject('IConversationFactory')`
4. ✅ Agregar `@Inject('IConversationWriteRepository')`
5. ✅ Cargar aggregate con factory
6. ✅ Llamar método del aggregate
7. ✅ Persistir con write repository

**Implementation:**

```typescript
@CommandHandler(SendAdminResponseCommand)
@Injectable()
export class SendAdminResponseHandler implements ICommandHandler<SendAdminResponseCommand> {
  constructor(
    @Inject("IConversationFactory")
    private readonly conversationFactory: IConversationFactory,
    @Inject("IConversationWriteRepository")
    private readonly conversationWriteRepo: IConversationWriteRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: SendAdminResponseCommand): Promise<void> {
    // 1. Load conversation aggregate using factory
    const conversation = await this.conversationFactory.loadById(
      command.conversationId,
    );

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with id ${command.conversationId} not found`,
      );
    }

    // 2. Call aggregate method to resolve admin query
    conversation.resolveAdminQuery();

    // 3. Persist aggregate using write repository
    await this.conversationWriteRepo.save(conversation);

    // 4. Send message via WhatsApp
    await this.commandBus.execute(
      new SendWhatsAppMessageCommand(
        command.conversationId,
        command.message,
        "TEXT",
        conversation.getCustomerPhone(), // ← Obtener de aggregate
        true, // isFromAdmin = true
      ),
    );
  }
}
```

#### CreateBusinessHandler (Refactored)

**Ubicación:** `src/business/app/commands/create-business/handler.ts`

**Cambios:**

1. ❌ Eliminar `@Inject('IBusinessReadRepository')`
2. ✅ Agregar `@Inject('IBusinessUniquenessChecker')`
3. ✅ Agregar `@Inject('IBusinessLimitChecker')`
4. ✅ Usar domain services para validaciones

**Implementation:**

```typescript
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler implements ICommandHandler<CreateBusinessCommand> {
  constructor(
    @Inject("IBusinessWriteRepository")
    private readonly writeRepo: IBusinessWriteRepository,
    @Inject("IBusinessUniquenessChecker")
    private readonly uniquenessChecker: IBusinessUniquenessChecker,
    @Inject("IBusinessLimitChecker")
    private readonly limitChecker: IBusinessLimitChecker,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(
    command: CreateBusinessCommand,
  ): Promise<{ businessId: string }> {
    // 1. Validate uniqueness using domain service
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(
      command.whatsappNumber,
    );

    if (!isUnique) {
      throw new WhatsAppPhoneAlreadyExistsException(command.whatsappNumber);
    }

    // 2. Validate business limit using domain service
    const canCreate = await this.limitChecker.canCreateBusiness(
      command.ownerId,
    );

    if (!canCreate) {
      const [current, max] = await Promise.all([
        this.limitChecker.getBusinessCount(command.ownerId),
        this.limitChecker.getMaxBusinessesAllowed(command.ownerId),
      ]);

      throw new BusinessLimitExceededException(current, max);
    }

    // 3. Create aggregate
    const business = Business.create(
      UUID.generate(),
      UUID.fromString(command.ownerId),
      command.name,
      WhatsAppNumber.fromString(command.whatsappNumber),
      BusinessAddress.create(command.address),
      Timezone.fromString(command.timezone),
    );

    // 4. Persist
    await this.uow.transaction(async () => {
      await this.writeRepo.save(business);
    });

    return { businessId: business.getId().getValue() };
  }
}
```

## Data Models

### Conversation Aggregate (Updated)

**Ubicación:** `src/conversation/domain/aggregates/conversation.ts`

**Nuevo método:**

```typescript
export class Conversation extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private customerPhone: string;
  private status: ConversationStatus;
  private state: ConversationState;
  private lastMessageAt: Date;

  // ... existing methods ...

  /**
   * Resolve admin query and update status to RESOLVED
   */
  resolveAdminQuery(): void {
    if (this.status.getValue() === "RESOLVED") {
      throw new ConversationAlreadyResolvedException(this.id.getValue());
    }

    this.status = ConversationStatus.resolved();
    this.incrementVersion();
    this.apply(new AdminQueryResolved(this.id.getValue()));
  }

  /**
   * Get customer phone for sending messages
   */
  getCustomerPhone(): string {
    return this.customerPhone;
  }

  /**
   * Factory method for reconstruction from persistence
   */
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    customerPhone: string,
    status: ConversationStatus,
    state: ConversationState,
    lastMessageAt: Date,
    version: number,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.status = status;
    conversation.state = state;
    conversation.lastMessageAt = lastMessageAt;
    conversation.setVersion(version); // ← Preservar versión
    return conversation;
  }
}
```

### New Domain Event

**Ubicación:** `src/conversation/domain/events/admin-query-resolved.event.ts`

```typescript
export class AdminQueryResolved {
  constructor(
    public readonly conversationId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Command Handlers Use Domain Services for Validation

_For any_ command handler that needs to validate uniqueness or existence, the handler should inject and use a domain service instead of a read repository.

**Validates: Requirements 1.1, 1.2, 1.5**

**Rationale:** This maintains CQRS strict separation by keeping read operations out of command handlers. Domain services encapsulate the read logic, making it reusable and testable.

### Property 2: Command Handlers Only Inject Write Repositories and Factories

_For any_ command handler, the constructor should only inject write repositories (IWriteRepository) and factories (IFactory), never read repositories (IReadRepository).

**Validates: Requirements 1.3, 2.4**

**Rationale:** This enforces CQRS at the type level. Command handlers are for writing, so they should only have write dependencies.

### Property 3: Application Layer Does Not Import Infrastructure

_For any_ file in the application layer (app/ directory), the file should not import from infrastructure layer (infra/ directory).

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

**Rationale:** This maintains Clean Architecture's dependency inversion principle. Application layer depends on domain interfaces, not infrastructure implementations.

### Property 4: Domain Services Return Boolean for Validation

_For any_ domain service method that validates uniqueness or existence, the method should return a boolean value (true/false).

**Validates: Requirements 4.1, 4.5**

**Rationale:** Validation methods should be pure functions that return boolean results without side effects. This makes them predictable and testable.

### Property 5: Factory Preserves Aggregate Version

_For any_ factory that loads an aggregate, the returned aggregate should have the same version field as the persisted model.

**Validates: Requirements 5.2**

**Rationale:** Optimistic locking requires preserving the version field when loading aggregates. This prevents lost updates in concurrent scenarios.

### Property 6: Write Repositories Do Not Have Load Methods

_For any_ write repository interface (IWriteRepository), the interface should not have methods like findById(), findAll(), or any query methods.

**Validates: Requirements 5.5**

**Rationale:** Write repositories are for persistence only. Loading aggregates should be done through factories to maintain CQRS separation.

### Property 7: Cross-BC Communication Uses CommandBus/QueryBus

_For any_ event handler that reacts to events from another BC, the handler should use CommandBus or QueryBus instead of importing aggregates directly.

**Validates: Requirements 3.1, 3.2, 3.3**

**Rationale:** This maintains bounded context isolation. BCs communicate through commands, queries, and events, not direct imports.

### Property 8: No Cross-BC Aggregate Imports

_For any_ file in a BC's application layer, the file should not import aggregates from other BCs.

**Validates: Requirements 3.4, 17.1**

**Rationale:** Aggregates are internal to a BC. Cross-BC dependencies should be through interfaces and events only.

### Property 9: Retry Logic Handles ConcurrencyException

_For any_ command handler that modifies a versioned aggregate, the handler should implement retry logic that catches ConcurrencyException and retries up to 3 times.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

**Rationale:** Optimistic locking can cause concurrent updates to fail. Retry logic with exponential backoff handles this gracefully.

### Property 10: Event Handlers Do Not Propagate Exceptions

_For any_ event handler, exceptions thrown during execution should be caught and logged, not propagated to the event publisher.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

**Rationale:** Event handlers implement eventual consistency. One handler failing should not prevent other handlers from executing.

### Property 11: Domain Services Are Idempotent

_For any_ domain service validation method, calling the method multiple times with the same input should return the same result.

**Validates: Requirements 19.2**

**Rationale:** Validation methods should be pure functions without side effects. Idempotence ensures predictable behavior.

### Property 12: Path Aliases Used Correctly

_For any_ import statement in the codebase, imports from other modules should use TypeScript path aliases (@shared/_, @{bc}/_) instead of relative paths (../../).

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Rationale:** Path aliases improve code readability and make refactoring easier. They also enforce architectural boundaries.

## Error Handling

### Domain Service Errors

**BusinessUniquenessChecker:**

- No errors thrown - returns boolean
- Handles null results from repository gracefully

**BusinessLimitChecker:**

- `BusinessOwnerNotFoundException`: When owner not found
- Returns boolean for limit checks

**UserUniquenessChecker:**

- No errors thrown - returns boolean

**CustomerExistenceChecker:**

- No errors thrown - returns boolean or null

**CustomerAppointmentChecker:**

- No errors thrown - returns boolean or count

### Command Handler Errors

**SendAdminResponseHandler:**

- `NotFoundException`: When conversation not found by factory
- `ConversationAlreadyResolvedException`: When trying to resolve already resolved conversation
- `ConcurrencyException`: When optimistic locking fails (handled with retry)

**CreateBusinessHandler:**

- `WhatsAppPhoneAlreadyExistsException`: When phone not unique
- `BusinessLimitExceededException`: When owner reached business limit
- `BusinessOwnerNotFoundException`: When owner not found (from limit checker)

### Retry Logic Error Handling

```typescript
async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ConcurrencyException) {
        attempt++;

        if (attempt >= maxRetries) {
          throw new Error(
            `Unable to complete operation after ${maxRetries} attempts. ` +
            `Please try again. (Concurrent modification detected)`
          );
        }

        // Exponential backoff: 100ms * 2^attempt
        const delay = 100 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Continue to next iteration to retry
      } else {
        // Other errors are not retryable
        throw error;
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in retry logic');
}
```

### Event Handler Error Handling

```typescript
@EventsHandler(SomeEvent)
export class OnSomeEventHandler implements IEventHandler<SomeEvent> {
  constructor(
    private readonly logger: Logger,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: SomeEvent): Promise<void> {
    try {
      // Execute command
      await this.commandBus.execute(new SomeCommand(event.data));
    } catch (error) {
      // Log error with full context
      this.logger.error("Failed to handle SomeEvent", {
        event,
        error: error.message,
        stack: error.stack,
      });

      // DO NOT re-throw - allow other handlers to execute
      // Eventual consistency: this will be retried or handled manually
    }
  }
}
```

## Testing Strategy

### Unit Tests

#### Domain Services

**Test Coverage:** > 90%

**Test Cases:**

1. **BusinessUniquenessChecker**
   - Returns true when phone not found
   - Returns false when phone exists
   - Returns true when phone exists but belongs to same business (update scenario)
   - Handles null results from repository

2. **BusinessLimitChecker**
   - Returns true when under limit
   - Returns false when at limit
   - Returns false when over limit
   - Throws exception when owner not found
   - Correctly calculates business count
   - Correctly retrieves max businesses from subscription plan

3. **UserUniquenessChecker**
   - Returns true when email not found
   - Returns false when email exists

4. **CustomerExistenceChecker**
   - Returns true when customer exists
   - Returns false when customer not found
   - Returns customer data when found
   - Returns null when not found

5. **CustomerAppointmentChecker**
   - Returns true when future appointments exist
   - Returns false when no future appointments
   - Correctly counts future appointments
   - Excludes cancelled appointments
   - Excludes past appointments

**Example Test:**

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

  it("should return true when phone not found", async () => {
    mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

    const result = await checker.isWhatsAppPhoneUnique("+18095551234");

    expect(result).toBe(true);
    expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith(
      "+18095551234",
    );
  });

  it("should return false when phone exists", async () => {
    mockReadRepo.findByWhatsAppPhone.mockResolvedValue({
      id: "business-1",
      whatsappNumber: "+18095551234",
    } as any);

    const result = await checker.isWhatsAppPhoneUnique("+18095551234");

    expect(result).toBe(false);
  });

  it("should return true when phone exists but belongs to same business", async () => {
    mockReadRepo.findByWhatsAppPhone.mockResolvedValue({
      id: "business-1",
      whatsappNumber: "+18095551234",
    } as any);

    const result = await checker.isWhatsAppPhoneUnique(
      "+18095551234",
      "business-1",
    );

    expect(result).toBe(true);
  });
});
```

#### Command Handlers

**Test Coverage:** > 80%

**Test Cases:**

1. **SendAdminResponseHandler**
   - Successfully resolves admin query
   - Throws NotFoundException when conversation not found
   - Calls factory.loadById()
   - Calls conversation.resolveAdminQuery()
   - Calls writeRepo.save()
   - Dispatches SendWhatsAppMessageCommand
   - Retries on ConcurrencyException
   - Throws after max retries

2. **CreateBusinessHandler**
   - Successfully creates business
   - Throws when phone not unique
   - Throws when business limit exceeded
   - Calls uniquenessChecker.isWhatsAppPhoneUnique()
   - Calls limitChecker.canCreateBusiness()
   - Calls writeRepo.save()

**Example Test:**

```typescript
describe("SendAdminResponseHandler", () => {
  let handler: SendAdminResponseHandler;
  let mockFactory: jest.Mocked<IConversationFactory>;
  let mockWriteRepo: jest.Mocked<IConversationWriteRepository>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockFactory = {
      loadById: jest.fn(),
    } as any;

    mockWriteRepo = {
      save: jest.fn(),
    } as any;

    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    handler = new SendAdminResponseHandler(
      mockFactory,
      mockWriteRepo,
      mockCommandBus,
    );
  });

  it("should successfully resolve admin query", async () => {
    const mockConversation = {
      resolveAdminQuery: jest.fn(),
      getCustomerPhone: jest.fn().mockReturnValue("+18095551234"),
    } as any;

    mockFactory.loadById.mockResolvedValue(mockConversation);

    const command = new SendAdminResponseCommand(
      "conversation-1",
      "Admin response message",
    );

    await handler.execute(command);

    expect(mockFactory.loadById).toHaveBeenCalledWith("conversation-1");
    expect(mockConversation.resolveAdminQuery).toHaveBeenCalled();
    expect(mockWriteRepo.save).toHaveBeenCalledWith(mockConversation);
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conversation-1",
        message: "Admin response message",
        isFromAdmin: true,
      }),
    );
  });

  it("should throw NotFoundException when conversation not found", async () => {
    mockFactory.loadById.mockResolvedValue(null);

    const command = new SendAdminResponseCommand("non-existent", "Message");

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
```

### Integration Tests

**Test Coverage:** > 70%

**Test Cases:**

1. **Domain Services with Real Repositories**
   - Test with test database
   - Verify actual database queries
   - Test transaction isolation

2. **Command Handlers with Real Dependencies**
   - Test with test database
   - Verify aggregates are persisted correctly
   - Verify events are published
   - Test retry logic with concurrent updates

**Example Test:**

```typescript
describe("CreateBusinessHandler Integration", () => {
  let handler: CreateBusinessHandler;
  let testHelper: IntegrationTestHelper;

  beforeEach(async () => {
    testHelper = await IntegrationTestHelper.create();
    handler = testHelper.module.get(CreateBusinessHandler);
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  it("should create business and persist to database", async () => {
    // Arrange
    const owner = await testHelper.createBusinessOwner();
    const command = new CreateBusinessCommand(
      owner.userId,
      "Test Business",
      "+18095551234",
      { street: "123 Main St", city: "Santo Domingo" },
      "America/Santo_Domingo",
    );

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.businessId).toBeDefined();

    const business = await testHelper.findBusinessById(result.businessId);
    expect(business).toBeDefined();
    expect(business.name).toBe("Test Business");
    expect(business.whatsappNumber).toBe("+18095551234");
  });

  it("should throw when phone already exists", async () => {
    // Arrange
    const owner = await testHelper.createBusinessOwner();
    await testHelper.createBusiness(owner.userId, "+18095551234");

    const command = new CreateBusinessCommand(
      owner.userId,
      "Another Business",
      "+18095551234", // Same phone
      { street: "456 Oak St", city: "Santiago" },
      "America/Santo_Domingo",
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      WhatsAppPhoneAlreadyExistsException,
    );
  });
});
```

### Property-Based Tests

**Test Coverage:** Domain Services

**Test Cases:**

1. **Idempotence of Domain Services**
   - Calling validation method twice with same input returns same result
   - No side effects from validation methods

**Example Test:**

```typescript
import { fc, test } from "@fast-check/vitest";

describe("BusinessUniquenessChecker PBT", () => {
  test.prop([fc.string()])("should be idempotent", async (phone) => {
    const mockReadRepo = {
      findByWhatsAppPhone: jest.fn().mockResolvedValue(null),
    } as any;

    const checker = new BusinessUniquenessChecker(mockReadRepo);

    const result1 = await checker.isWhatsAppPhoneUnique(phone);
    const result2 = await checker.isWhatsAppPhoneUnique(phone);

    expect(result1).toBe(result2);
  });
});
```

### E2E Tests

**Test Coverage:** Critical Flows

**Test Cases:**

1. **Admin Response Flow**
   - Admin sends response to customer query
   - Conversation status updated to RESOLVED
   - WhatsApp message sent
   - Verify end-to-end behavior

2. **Business Creation Flow**
   - Owner creates business
   - Validations pass
   - Business persisted
   - Events published

## Implementation Plan

See `tasks.md` for detailed implementation tasks.

## References

- `.kiro/steering/architecture.md` - Clean Architecture principles
- `.kiro/steering/ddd-patterns.md` - DDD tactical patterns
- `.kiro/steering/cqrs.md` - CQRS implementation
- `.kiro/steering/factory-pattern.md` - Factory pattern for CQRS
- `.kiro/steering/bounded-contexts.md` - BC communication patterns
- `.kiro/steering/architecture-boundaries.md` - Layer dependency rules
- `apps/backend/ARCHITECTURE_DEBT.md` - Current violations documented
