# Factory Pattern para CQRS Estricto

Este documento define el patrón Factory para mantener CQRS estricto en el proyecto.

## Propósito

El patrón Factory resuelve el problema de **cómo cargar aggregates del dominio para modificarlos** sin violar CQRS estricto.

### Problema que Resuelve

En CQRS estricto:

- **Write Repositories** solo deben tener métodos de escritura (`save`, `delete`)
- **Read Repositories** solo deben retornar read models (DTOs) para queries
- **Command Handlers** necesitan cargar aggregates con lógica de negocio para modificarlos

❌ **Solución incorrecta:**

```typescript
// Write Repository con método de lectura (VIOLA CQRS)
interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>; // ❌ Método de lectura
}
```

✅ **Solución correcta:**

```typescript
// Factory para cargar aggregates
interface IAppointmentFactory {
  loadById(id: string): Promise<Appointment | null>;
}

// Write Repository solo escritura
interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
}

// Read Repository solo lectura (retorna DTOs)
interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
}
```

## Diferencias Clave

### Factory vs Read Repository vs Write Repository

| Aspecto               | Factory                          | Read Repository            | Write Repository      |
| --------------------- | -------------------------------- | -------------------------- | --------------------- |
| **Propósito**         | Cargar aggregates para modificar | Obtener datos para mostrar | Persistir aggregates  |
| **Retorna**           | Domain Aggregate (con lógica)    | Read Model (DTO)           | void                  |
| **Usado en**          | Command Handlers                 | Query Handlers             | Command Handlers      |
| **Capa**              | Infrastructure                   | Infrastructure             | Infrastructure        |
| **Interfaz en**       | Domain                           | Domain                     | Domain                |
| **Lógica de negocio** | ✅ Sí (aggregate)                | ❌ No (DTO)                | ❌ No (solo persiste) |

### Ejemplo Completo

```typescript
// ============================================
// DOMAIN LAYER
// ============================================

// 1. Factory Interface (domain/interfaces/factories/)
export interface IAppointmentFactory {
  /**
   * Loads an Appointment aggregate for modification
   * @returns Domain aggregate with business logic
   */
  loadById(id: string): Promise<Appointment | null>;
}

// 2. Write Repository Interface (domain/interfaces/repositories/)
export interface IAppointmentWriteRepository {
  /**
   * Persists an appointment aggregate
   * Uses optimistic locking with version field
   */
  save(appointment: Appointment): Promise<void>;
}

// 3. Read Repository Interface (domain/interfaces/repositories/)
export interface IAppointmentReadRepository {
  /**
   * Gets appointment data for display
   * @returns Read model (DTO) without business logic
   */
  findById(id: string): Promise<AppointmentReadModel | null>;
}

// ============================================
// INFRASTRUCTURE LAYER
// ============================================

// 4. Factory Implementation (infra/persistence/factories/)
@Injectable()
export class AppointmentFactory implements IAppointmentFactory {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async loadById(id: string): Promise<Appointment | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    // Reconstruct aggregate with business logic
    return Appointment.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      UUID.fromString(model.offeringId),
      model.dateTime,
      AppointmentStatus.fromString(model.status),
      model.version, // ← Preserves version for optimistic locking
    );
  }
}

// 5. Write Repository Implementation (infra/persistence/repositories/)
@Injectable()
export class AppointmentWriteRepository implements IAppointmentWriteRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
    private readonly uow: IUnitOfWork,
  ) {}

  async save(appointment: Appointment): Promise<void> {
    await this.uow.transaction(async () => {
      const model = AppointmentWriteMapper.toModel(appointment);

      // Optimistic locking: update only if version matches
      const result = await this.repository
        .createQueryBuilder()
        .update(AppointmentModel)
        .set({
          ...model,
          version: appointment.getVersion().getValue() + 1,
        })
        .where("id = :id", { id: appointment.getId().getValue() })
        .andWhere("version = :version", {
          version: appointment.getVersion().getValue(),
        })
        .execute();

      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Appointment ${appointment.getId()} was modified`,
        );
      }
    });
  }
}

// 6. Read Repository Implementation (infra/persistence/repositories/)
@Injectable()
export class AppointmentReadRepository implements IAppointmentReadRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async findById(id: string): Promise<AppointmentReadModel | null> {
    const model = await this.repository
      .createQueryBuilder("appointment")
      .leftJoin("customers", "c", "c.id = appointment.customerId")
      .leftJoin("offerings", "o", "o.id = appointment.offeringId")
      .select([
        "appointment.*",
        "c.name as customerName",
        "o.name as offeringName",
      ])
      .where("appointment.id = :id", { id })
      .getRawOne();

    if (!model) return null;

    return AppointmentReadMapper.toReadModel(model);
  }
}

// ============================================
// APPLICATION LAYER
// ============================================

// 7. Command Handler usando Factory + Write Repository
@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler implements ICommandHandler<CancelAppointmentCommand> {
  constructor(
    @Inject("IAppointmentFactory")
    private readonly factory: IAppointmentFactory, // ← Factory para cargar
    @Inject("IAppointmentWriteRepository")
    private readonly writeRepo: IAppointmentWriteRepository, // ← Write repo para persistir
  ) {}

  async execute(command: CancelAppointmentCommand): Promise<void> {
    // 1. Load aggregate using factory
    const appointment = await this.factory.loadById(command.appointmentId);

    if (!appointment) {
      throw new AppointmentNotFoundException(command.appointmentId);
    }

    // 2. Execute business logic
    appointment.cancel(); // ← Business logic in aggregate

    // 3. Persist using write repository
    await this.writeRepo.save(appointment);
  }
}

// 8. Query Handler usando Read Repository
@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler implements IQueryHandler<GetAppointmentQuery> {
  constructor(
    @Inject("IAppointmentReadRepository")
    private readonly readRepo: IAppointmentReadRepository, // ← Read repo para queries
  ) {}

  async execute(query: GetAppointmentQuery): Promise<AppointmentReadModel> {
    const appointment = await this.readRepo.findById(query.appointmentId);

    if (!appointment) {
      throw new AppointmentNotFoundException(query.appointmentId);
    }

    return appointment; // ← Returns DTO, not aggregate
  }
}
```

## Flujo Completo

### Command (Modificación)

```
1. Controller → CommandBus.execute(CancelAppointmentCommand)
2. CancelAppointmentHandler:
   a. factory.loadById() → Appointment aggregate (con lógica)
   b. appointment.cancel() → Ejecuta lógica de negocio
   c. writeRepo.save() → Persiste cambios
3. EventBus publica AppointmentCancelled
```

### Query (Lectura)

```
1. Controller → QueryBus.execute(GetAppointmentQuery)
2. GetAppointmentHandler:
   a. readRepo.findById() → AppointmentReadModel (DTO)
3. Return DTO al controller
```

## Cuándo Usar Cada Uno

### Usar Factory cuando:

- ✅ Necesitas modificar un aggregate existente
- ✅ Necesitas ejecutar lógica de negocio
- ✅ Estás en un Command Handler
- ✅ Necesitas el aggregate con su versión para optimistic locking

### Usar Read Repository cuando:

- ✅ Solo necesitas mostrar datos
- ✅ Estás en un Query Handler
- ✅ No vas a modificar el aggregate
- ✅ Necesitas datos desnormalizados (joins)

### Usar Write Repository cuando:

- ✅ Necesitas persistir un aggregate
- ✅ Necesitas eliminar un aggregate
- ✅ Estás en un Command Handler (después de modificar)

## Reglas y Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Factory interface en domain
// src/booking/domain/interfaces/factories/appointment-factory.ts
export interface IAppointmentFactory {
  loadById(id: string): Promise<Appointment | null>;
}

// 2. Factory implementation en infrastructure
// src/booking/infra/persistence/factories/appointment-factory.ts
@Injectable()
export class AppointmentFactory implements IAppointmentFactory {
  // Usa TypeORM Repository
  // Usa Aggregate.fromPersistence()
}

// 3. Registrar en módulo con token
@Module({
  providers: [
    {
      provide: 'IAppointmentFactory',
      useClass: AppointmentFactory,
    },
  ],
})
export class BookingModule {}

// 4. Inyectar en command handlers
constructor(
  @Inject('IAppointmentFactory')
  private readonly factory: IAppointmentFactory,
) {}

// 5. Usar factory para cargar, write repo para persistir
const appointment = await this.factory.loadById(id);
appointment.cancel();
await this.writeRepo.save(appointment);
```

### ❌ No Hacer

```typescript
// 1. NO poner métodos de lectura en write repository
interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>; // ❌ INCORRECTO
}

// 2. NO usar read repository para cargar aggregates
const appointment = await this.readRepo.findById(id); // ❌ Retorna DTO
appointment.cancel(); // ❌ DTO no tiene lógica de negocio

// 3. NO usar factory en query handlers
@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler {
  constructor(
    private readonly factory: IAppointmentFactory, // ❌ INCORRECTO
  ) {}
}

// 4. NO retornar aggregates desde factories sin versión
return new Appointment(...); // ❌ Falta versión
return Appointment.fromPersistence(..., version); // ✅ CORRECTO

// 5. NO mezclar responsabilidades
class AppointmentFactory {
  async loadById(id: string): Promise<Appointment> {
    const model = await this.repository.findOne({ where: { id } });
    const aggregate = Appointment.fromPersistence(...);
    await this.repository.save(aggregate); // ❌ Factory no debe persistir
    return aggregate;
  }
}
```

## Aggregate.fromPersistence()

Todos los aggregates deben tener un método estático `fromPersistence()` para reconstrucción:

```typescript
export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private status: AppointmentStatus;
  // ... otros campos

  // Factory method para crear nueva instancia
  static create(...): Appointment {
    const appointment = new Appointment();
    // ... inicializar campos
    appointment.apply(new AppointmentCreated(...));
    appointment.incrementVersion();
    return appointment;
  }

  // Factory method para reconstruir desde BD
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: Date,
    status: AppointmentStatus,
    version: number, // ← IMPORTANTE: Preservar versión
  ): Appointment {
    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = status;
    appointment.setVersion(version); // ← Restaurar versión
    return appointment;
  }
}
```

## Testing

### Test de Factory

```typescript
describe("AppointmentFactory", () => {
  let factory: AppointmentFactory;
  let repository: Repository<AppointmentModel>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppointmentFactory,
        {
          provide: getRepositoryToken(AppointmentModel),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get(AppointmentFactory);
    repository = module.get(getRepositoryToken(AppointmentModel));
  });

  it("should reconstruct aggregate with correct version", async () => {
    // Arrange
    const model = {
      id: "uuid",
      businessId: "business-uuid",
      customerId: "customer-uuid",
      offeringId: "offering-uuid",
      dateTime: new Date(),
      status: "CONFIRMED",
      version: 5, // ← Versión específica
    };
    jest.spyOn(repository, "findOne").mockResolvedValue(model);

    // Act
    const appointment = await factory.loadById("uuid");

    // Assert
    expect(appointment).toBeDefined();
    expect(appointment.getVersion().getValue()).toBe(5); // ← Verifica versión
    expect(appointment.getId().getValue()).toBe("uuid");
  });

  it("should return null when not found", async () => {
    jest.spyOn(repository, "findOne").mockResolvedValue(null);

    const appointment = await factory.loadById("non-existent");

    expect(appointment).toBeNull();
  });

  it("should reconstruct aggregate with business logic", async () => {
    const model = {
      /* ... */
    };
    jest.spyOn(repository, "findOne").mockResolvedValue(model);

    const appointment = await factory.loadById("uuid");

    // Verify business logic is available
    expect(() => appointment.cancel()).not.toThrow();
  });
});
```

### Property-Based Test

```typescript
import { fc, test } from "@fast-check/vitest";

describe("AppointmentFactory PBT", () => {
  test.prop([fc.integer({ min: 0, max: 1000 })])(
    "should preserve version for any valid version number",
    async (version) => {
      // Arrange
      const model = {
        id: "uuid",
        // ... otros campos
        version,
      };
      jest.spyOn(repository, "findOne").mockResolvedValue(model);

      // Act
      const appointment = await factory.loadById("uuid");

      // Assert
      expect(appointment.getVersion().getValue()).toBe(version);
    },
  );
});
```

## Beneficios

1. ✅ **CQRS Estricto:** Separación clara entre lectura y escritura
2. ✅ **Single Responsibility:** Cada componente tiene una responsabilidad
3. ✅ **Testeable:** Factories, repositories y handlers se testean independientemente
4. ✅ **Optimistic Locking:** Factories preservan versión del aggregate
5. ✅ **Lógica de Negocio:** Aggregates cargados tienen toda su lógica
6. ✅ **Escalabilidad:** Read y write pueden optimizarse independientemente

## Referencias

- **Implementación de referencia:** `src/availability/infra/persistence/factories/capacity-factory.ts`
- **Interfaz de referencia:** `src/availability/domain/interfaces/factories/capacity-factory.ts`
- **Steering relacionado:** `.kiro/steering/ddd-patterns.md`
- **Spec:** `.kiro/specs/factory-pattern-cqrs/`
