# Design Document - Offering Bounded Context

## Overview

El Bounded Context **Offering** implementa la gestión de servicios que un negocio ofrece a sus clientes. Sigue los principios de Clean Architecture, DDD, y CQRS estricto.

**Responsabilidades:**

- Gestionar el ciclo de vida de offerings (crear, actualizar, activar/desactivar)
- Validar reglas de negocio (duración, capacidad, unicidad de nombres)
- Proporcionar consultas optimizadas para el flujo conversacional
- Emitir eventos de dominio para integración con otros BCs
- Exponer cambios vía WebSocket para actualizaciones en tiempo real

**Integraciones:**

- **Availability BC**: Capacity referencia offeringId
- **Conversation BC**: Usa GetActiveOfferingsQuery para mostrar opciones
- **Booking BC**: Appointments referencian offeringId
- **Frontend**: Recibe actualizaciones vía WebSocket

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  - WebSocket Gateway (eventos en tiempo real)       │
│  - REST Controller (opcional para admin panel)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
│  Commands:                    Queries:               │
│  - CreateOfferingHandler      - GetActiveOfferings  │
│  - UpdateOfferingHandler      - GetOfferingById     │
│  - DeactivateOfferingHandler  - GetOfferingsByBiz   │
│                                                      │
│  Event Handlers:                                     │
│  - OnOfferingCreatedHandler (WebSocket broadcast)   │
│  - OnOfferingUpdatedHandler (WebSocket broadcast)   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                Domain Layer                          │
│  Aggregate: Offering                                 │
│  Value Objects: OfferingDuration, OfferingCapacity  │
│  Events: OfferingCreated, OfferingUpdated, etc.    │
│  Exceptions: DuplicateOfferingNameException, etc.   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│            Infrastructure Layer                      │
│  - OfferingModel (TypeORM)                          │
│  - OfferingWriteRepository                          │
│  - OfferingReadRepository                           │
│  - Mappers (Write/Read)                             │
└─────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Domain Layer

#### Aggregate: Offering

```typescript
export class Offering extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private name: string;
  private duration: OfferingDuration;
  private maxCapacityPerSlot: number;
  private maxDailyCapacity: number | null;
  private isActive: boolean;

  static create(
    id: UUID,
    businessId: UUID,
    name: string,
    duration: OfferingDuration,
    maxCapacityPerSlot: number,
    maxDailyCapacity: number | null,
  ): Offering;

  update(
    name: string,
    duration: OfferingDuration,
    maxCapacityPerSlot: number,
    maxDailyCapacity: number | null,
  ): void;

  deactivate(): void;
  activate(): void;

  // Getters
  getId(): UUID;
  getBusinessId(): UUID;
  getName(): string;
  getDuration(): OfferingDuration;
  getMaxCapacityPerSlot(): number;
  getMaxDailyCapacity(): number | null;
  isActiveOffering(): boolean;
}
```

#### Value Objects

**OfferingDuration:**

```typescript
export class OfferingDuration extends ValueObject {
  private readonly minutes: number;

  constructor(minutes: number) {
    super();
    // Validar: múltiplo de 15, mínimo 15, máximo 480 (8 horas)
  }

  getMinutes(): number;
  equals(other: OfferingDuration): boolean;
}
```

**OfferingCapacity:**

```typescript
export class OfferingCapacity extends ValueObject {
  private readonly maxPerSlot: number;
  private readonly maxDaily: number | null;

  constructor(maxPerSlot: number, maxDaily: number | null) {
    super();
    // Validar: maxPerSlot >= 1, maxDaily >= maxPerSlot si está definido
  }

  getMaxPerSlot(): number;
  getMaxDaily(): number | null;
  equals(other: OfferingCapacity): boolean;
}
```

#### Domain Events

```typescript
export class OfferingCreated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class OfferingUpdated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class OfferingDeactivated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class OfferingActivated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### Domain Exceptions

```typescript
export class OfferingNotFoundException extends DomainException {
  constructor(offeringId: string) {
    super(`Offering with id ${offeringId} not found`);
  }
}

export class OfferingNotFoundForBusinessException extends DomainException {
  constructor(offeringId: string, businessId: string) {
    super(`Offering ${offeringId} not found for business ${businessId}`);
  }
}

export class DuplicateOfferingNameException extends DomainException {
  constructor(name: string, businessId: string) {
    super(
      `Offering with name "${name}" already exists for business ${businessId}`,
    );
  }
}

export class InvalidOfferingDurationException extends DomainException {
  constructor(minutes: number) {
    super(
      `Invalid duration: ${minutes} minutes. Must be multiple of 15, min 15, max 480`,
    );
  }
}

export class InvalidOfferingCapacityException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
```

#### Repository Interfaces

```typescript
export interface IOfferingWriteRepository {
  save(offering: Offering): Promise<void>;
  findById(id: UUID): Promise<Offering | null>;
  findByBusinessIdAndName(
    businessId: UUID,
    name: string,
  ): Promise<Offering | null>;
}

export interface IOfferingReadRepository {
  findById(id: string): Promise<OfferingReadModel | null>;
  findByBusinessId(businessId: string): Promise<OfferingReadModel[]>;
  findActiveByBusinessId(businessId: string): Promise<OfferingReadModel[]>;
}
```

### Application Layer

#### Commands

```typescript
export class CreateOfferingCommand extends Command<{ offeringId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
  ) {
    super();
  }
}

export class UpdateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
  ) {
    super();
  }
}

export class DeactivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

export class ActivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}
```

#### Queries

```typescript
export class GetActiveOfferingsQuery extends Query<OfferingReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

export class GetOfferingByIdQuery extends Query<OfferingReadModel | null> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

export class GetOfferingsByBusinessQuery extends Query<OfferingReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

#### Read Model

```typescript
export class OfferingReadModel {
  id!: string;
  businessId!: string;
  name!: string;
  durationMinutes!: number;
  maxCapacityPerSlot!: number;
  maxDailyCapacity!: number | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
```

## Data Models

### TypeORM Model

```typescript
@Entity("offerings")
export class OfferingModel {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  @Index()
  businessId!: string;

  @Column("varchar", { length: 100 })
  name!: string;

  @Column("int")
  durationMinutes!: number;

  @Column("int")
  maxCapacityPerSlot!: number;

  @Column("int", { nullable: true })
  maxDailyCapacity!: number | null;

  @Column("boolean", { default: true })
  @Index()
  isActive!: boolean;

  @Column("int", { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Índice compuesto para unicidad de nombre por negocio
  @Index(["businessId", "name"], { unique: true })
  static businessNameIndex: void;
}
```

### Database Migration

```typescript
export class CreateOfferingsTable1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "offerings",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "businessId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "durationMinutes",
            type: "int",
            isNullable: false,
          },
          {
            name: "maxCapacityPerSlot",
            type: "int",
            isNullable: false,
          },
          {
            name: "maxDailyCapacity",
            type: "int",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "version",
            type: "int",
            default: 0,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // Índice en businessId para queries frecuentes
    await queryRunner.createIndex(
      "offerings",
      new TableIndex({
        name: "IDX_offerings_businessId",
        columnNames: ["businessId"],
      }),
    );

    // Índice en isActive para filtrar activos
    await queryRunner.createIndex(
      "offerings",
      new TableIndex({
        name: "IDX_offerings_isActive",
        columnNames: ["isActive"],
      }),
    );

    // Índice único compuesto para nombre por negocio
    await queryRunner.createIndex(
      "offerings",
      new TableIndex({
        name: "IDX_offerings_businessId_name_unique",
        columnNames: ["businessId", "name"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("offerings");
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Name uniqueness per business

_For any_ business and offering name, creating two offerings with the same name should fail with DuplicateOfferingNameException
**Validates: Requirements 7.1, 7.2**

### Property 2: Duration validation

_For any_ duration value, creating an offering with duration not multiple of 15 or outside range [15, 480] should fail with InvalidOfferingDurationException
**Validates: Requirements 1.2**

### Property 3: Capacity validation

_For any_ capacity values, creating an offering with maxCapacityPerSlot < 1 should fail with InvalidOfferingCapacityException
**Validates: Requirements 1.3**

### Property 4: Active offerings query

_For any_ business, querying active offerings should return only offerings where isActive=true
**Validates: Requirements 4.1, 4.3**

### Property 5: Business isolation

_For any_ offering and business pair, querying an offering with wrong businessId should return null or throw OfferingNotFoundForBusinessException
**Validates: Requirements 6.1, 6.2**

### Property 6: Event publication

_For any_ offering operation (create/update/deactivate), the corresponding domain event should be published
**Validates: Requirements 1.5, 2.3, 3.2**

### Property 7: Deactivation preserves data

_For any_ offering, deactivating should only change isActive to false without modifying other attributes
**Validates: Requirements 3.1**

### Property 8: Update preserves identity

_For any_ offering update, the id and businessId should remain unchanged
**Validates: Requirements 2.4**

## Error Handling

### Validation Errors

- **InvalidOfferingDurationException**: Duración inválida
- **InvalidOfferingCapacityException**: Capacidad inválida
- **DuplicateOfferingNameException**: Nombre duplicado

### Not Found Errors

- **OfferingNotFoundException**: Offering no existe
- **OfferingNotFoundForBusinessException**: Offering no pertenece al negocio

### Concurrency Errors

- **ConcurrencyException**: Conflicto de versión (Optimistic Locking)

### HTTP Status Mapping

- 400 Bad Request: Validation errors
- 404 Not Found: OfferingNotFoundException
- 409 Conflict: DuplicateOfferingNameException, ConcurrencyException
- 500 Internal Server Error: Unexpected errors

## Testing Strategy

### Unit Tests

**Aggregate Tests:**

- `Offering.create()` con datos válidos
- `Offering.create()` con duración inválida (lanza excepción)
- `Offering.create()` con capacidad inválida (lanza excepción)
- `Offering.update()` modifica atributos correctamente
- `Offering.deactivate()` cambia isActive a false
- `Offering.activate()` cambia isActive a true
- Eventos se publican correctamente

**Value Object Tests:**

- `OfferingDuration` valida múltiplo de 15
- `OfferingDuration` valida rango [15, 480]
- `OfferingCapacity` valida maxPerSlot >= 1
- `OfferingCapacity` valida maxDaily >= maxPerSlot

### Property-Based Tests

**Property 1: Name uniqueness**

```typescript
test.prop([fc.uuid(), fc.string({ minLength: 3 })])(
  "creating two offerings with same name should fail",
  async (businessId, name) => {
    // Create first offering
    await createOffering(businessId, name);

    // Attempt to create second with same name
    await expect(createOffering(businessId, name)).rejects.toThrow(
      DuplicateOfferingNameException,
    );
  },
);
```

**Property 2: Duration validation**

```typescript
test.prop([fc.integer({ min: 1, max: 1000 })])(
  "invalid durations should be rejected",
  async (minutes) => {
    fc.pre(minutes % 15 !== 0 || minutes < 15 || minutes > 480);

    await expect(
      createOffering("business-1", "Service", minutes),
    ).rejects.toThrow(InvalidOfferingDurationException);
  },
);
```

**Property 3: Active offerings filter**

```typescript
test.prop([
  fc.array(
    fc.record({
      id: fc.uuid(),
      isActive: fc.boolean(),
    }),
  ),
])("active query returns only active offerings", async (offerings) => {
  // Setup offerings in DB
  await setupOfferings(offerings);

  // Query active
  const result = await queryActiveOfferings("business-1");

  // All results should be active
  expect(result.every((o) => o.isActive)).toBe(true);
});
```

### Integration Tests

**Command Handler Tests:**

- `CreateOfferingHandler` crea offering en BD
- `CreateOfferingHandler` lanza excepción si nombre duplicado
- `UpdateOfferingHandler` actualiza offering existente
- `DeactivateOfferingHandler` cambia estado a inactivo

**Query Handler Tests:**

- `GetActiveOfferingsHandler` retorna solo activos
- `GetOfferingByIdHandler` retorna offering correcto
- `GetOfferingsByBusinessHandler` filtra por businessId

**Event Handler Tests:**

- `OnOfferingCreatedHandler` emite evento WebSocket
- `OnOfferingUpdatedHandler` emite evento WebSocket
- `OnOfferingDeactivatedHandler` emite evento WebSocket

### WebSocket Integration Tests

```typescript
describe("Offering WebSocket Integration", () => {
  it("should broadcast offering:created event", async () => {
    const client = await connectWebSocket();
    await client.emit("join", { room: "offerings:business-1" });

    // Create offering
    await createOffering("business-1", "Test Service");

    // Wait for WebSocket event
    const event = await client.waitForEvent("offering:created");
    expect(event.name).toBe("Test Service");
  });
});
```

## WebSocket Events

### Event Names

- `offering:created` - Nuevo offering creado
- `offering:updated` - Offering actualizado
- `offering:deactivated` - Offering desactivado
- `offering:activated` - Offering activado

### Room Structure

- `offerings:{businessId}` - Eventos de offerings de un negocio específico

### Event Payloads

```typescript
interface OfferingCreatedPayload {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
  isActive: boolean;
}

interface OfferingUpdatedPayload {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
}

interface OfferingDeactivatedPayload {
  id: string;
  businessId: string;
}
```

### Event Handler Implementation

```typescript
@EventsHandler(OfferingCreated)
export class OnOfferingCreatedHandler implements IEventHandler<OfferingCreated> {
  constructor(private readonly eventBroadcaster: EventBroadcaster) {}

  async handle(event: OfferingCreated) {
    await this.eventBroadcaster.broadcastToRoom(
      `offerings:${event.businessId}`,
      "offering:created",
      {
        id: event.offeringId,
        businessId: event.businessId,
        name: event.name,
        durationMinutes: event.durationMinutes,
        // ... otros campos
      },
    );
  }
}
```

## Integration Points

### With Conversation BC

**Actualizar ProcessIncomingMessageHandler:**

```typescript
// ANTES (hardcoded):
const buttons: Button[] = [
  { id: "service-1", title: "Corte de Pelo" },
  { id: "service-2", title: "Lavado" },
];

// DESPUÉS (usando query):
const offerings = await this.queryBus.execute(
  new GetActiveOfferingsQuery(businessId),
);

const buttons: Button[] = offerings.map((o) => ({
  id: o.id,
  title: o.name,
}));
```

### With Availability BC

**Capacity ya referencia offeringId:**

- No requiere cambios en Capacity
- Capacity.offeringId debe ser UUID válido de Offering
- Validación opcional: verificar que offering existe al crear Capacity

### With Booking BC

**Appointments ya referencian offeringId:**

- No requiere cambios en Appointment
- Validación opcional: verificar que offering existe y está activo

## Performance Considerations

### Índices de Base de Datos

1. **businessId**: Queries frecuentes por negocio
2. **isActive**: Filtrar offerings activos
3. **businessId + name (unique)**: Validar unicidad

### Caching Strategy (Futuro)

- Cache de offerings activos por businessId (TTL: 5 minutos)
- Invalidar cache al crear/actualizar/desactivar offering
- Usar Redis para cache distribuido

### Query Optimization

- `GetActiveOfferingsQuery`: Usar índice compuesto (businessId, isActive)
- Ordenar alfabéticamente en BD (ORDER BY name)
- Limitar resultados si es necesario (LIMIT)

## Deployment Considerations

### Migration Order

1. Crear tabla `offerings`
2. Crear índices
3. Seed offerings iniciales (opcional)
4. Actualizar código de Conversation para usar query

### Rollback Plan

1. Revertir código de Conversation a hardcoded
2. Drop tabla `offerings`

### Monitoring

- Trackear frecuencia de DuplicateOfferingNameException
- Monitorear latencia de queries
- Alertar si no hay offerings activos para un negocio
