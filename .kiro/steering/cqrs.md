---
inclusion: always
---

# CQRS (Command Query Responsibility Segregation)

Este documento define cómo implementar CQRS en el proyecto usando `@nestjs/cqrs`.

## Principio Fundamental

**Separar operaciones de escritura (Commands) de operaciones de lectura (Queries)**

```
Commands (Write)          Queries (Read)
     ↓                         ↓
Write Model              Read Model
     ↓                         ↓
  Database                Database
```

## Commands (Escritura)

### Definición de Command

```typescript
import { Command } from "@nestjs/cqrs";

export class CreateAppointmentCommand extends Command<{
  appointmentId: string;
}> {
  constructor(
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
  ) {
    super();
  }
}
```

**Características:**

- Extienden `Command<TResult>` para tipado fuerte
- Inmutables (readonly properties)
- Representan intención de cambio
- Nombres en imperativo (Create, Cancel, Modify)

### Command Handler

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler
  implements ICommandHandler<CreateAppointmentCommand> {

  constructor(
    private readonly appointmentRepo: IAppointmentWriteRepository,
    private readonly capacityRepo: ICapacityWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    return await this.uow.transaction(async () => {
      // 1. Validar disponibilidad
      const capacity = await this.capacityRepo.findByOfferingAndDate(...);
      if (!capacity.hasAvailableSlots()) {
        throw new NoAvailableSlotsException();
      }

      // 2. Crear aggregate
      const appointment = Appointment.create(...);

      // 3. Actualizar capacidad
      capacity.decrementSlot();

      // 4. Persistir
      await this.appointmentRepo.save(appointment);
      await this.capacityRepo.save(capacity);

      return { appointmentId: appointment.getId().getValue() };
    });
  }
}
```

**Responsabilidades:**

- Validar comando
- Orquestar aggregates
- Manejar transacciones
- Retornar resultado

### Dispatching Commands

```typescript
import { CommandBus } from "@nestjs/cqrs";

@Controller("appointments")
export class AppointmentController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(
        dto.businessId,
        dto.customerId,
        dto.offeringId,
        dto.dateTime,
      ),
    );
    return result; // Tipado como { appointmentId: string }
  }
}
```

## Queries (Lectura)

### Definición de Query

```typescript
import { Query } from "@nestjs/cqrs";
import { AppointmentReadModel } from "../read_models/appointment.read-model";

export class GetCustomerAppointmentsQuery extends Query<
  AppointmentReadModel[]
> {
  constructor(public readonly customerId: string) {
    super();
  }
}
```

**Características:**

- Extienden `Query<TResult>` para tipado fuerte
- Inmutables
- Solo parámetros de búsqueda
- Nombres descriptivos (Get, Find, List)

### Query Handler

```typescript
import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";

@QueryHandler(GetCustomerAppointmentsQuery)
export class GetCustomerAppointmentsHandler implements IQueryHandler<GetCustomerAppointmentsQuery> {
  constructor(
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  async execute(
    query: GetCustomerAppointmentsQuery,
  ): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepo.findByCustomerId(query.customerId);
  }
}
```

**Responsabilidades:**

- Ejecutar query optimizada
- Retornar Read Model
- Sin side effects
- Sin modificar estado

### Dispatching Queries

```typescript
import { QueryBus } from "@nestjs/cqrs";

@Controller("appointments")
export class AppointmentController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    const appointments = await this.queryBus.execute(
      new GetCustomerAppointmentsQuery(user.customerId),
    );
    return appointments; // Tipado como AppointmentReadModel[]
  }
}
```

## Write Model vs Read Model

### Write Model (Domain)

```typescript
// Aggregate para escritura
export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private offeringId: UUID;
  private status: AppointmentStatus;
  private dateTime: DateTime;

  // Métodos de negocio
  cancel(): void {
    /* ... */
  }
  modify(newDateTime: DateTime): void {
    /* ... */
  }
}
```

**Características:**

- Lógica de negocio
- Validaciones
- Domain Events
- Encapsulación

### Read Model (Query)

```typescript
// DTO para lectura
export class AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string; // ← Desnormalizado
  customerPhone: string; // ← Desnormalizado
  offeringId: string;
  offeringName: string; // ← Desnormalizado
  dateTime: Date;
  status: string;
  createdAt: Date;
}
```

**Características:**

- Datos desnormalizados
- Optimizado para lectura
- Sin lógica de negocio
- Puede incluir datos de múltiples aggregates

## Repositories

### Write Repository

```typescript
export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}

@Injectable()
export class AppointmentWriteRepository implements IAppointmentWriteRepository {
  async save(appointment: Appointment): Promise<void> {
    // Usar Optimistic Locking
    // Mapear Aggregate → Model
    // Persistir
  }

  async findById(id: UUID): Promise<Appointment | null> {
    // Cargar desde BD
    // Mapear Model → Aggregate
    return appointment;
  }
}
```

### Read Repository

```typescript
export interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(businessId: string): Promise<AppointmentReadModel[]>;
  findUpcoming(businessId: string): Promise<AppointmentReadModel[]>;
}

@Injectable()
export class AppointmentReadRepository implements IAppointmentReadRepository {
  async findByCustomerId(customerId: string): Promise<AppointmentReadModel[]> {
    // Query optimizada con joins
    const results = await this.repository
      .createQueryBuilder("appointment")
      .leftJoin("customers", "c", "c.id = appointment.customerId")
      .leftJoin("offerings", "o", "o.id = appointment.offeringId")
      .select([
        "appointment.*",
        "c.name as customerName",
        "c.phone as customerPhone",
        "o.name as offeringName",
      ])
      .where("appointment.customerId = :customerId", { customerId })
      .getRawMany();

    return results.map(AppointmentReadMapper.toReadModel);
  }
}
```

## Sincronización Write → Read

### Via Domain Events

```
1. Command Handler
    ↓
2. Aggregate.apply(event)
    ↓
3. EventBus.publish(event)
    ↓
4. Event Handler
    ↓
5. Actualizar Read Model
```

### Ejemplo

```typescript
// 1. Command crea appointment
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler {
  async execute(command: CreateAppointmentCommand) {
    const appointment = Appointment.create(...);
    await this.writeRepo.save(appointment);
    // Evento AppointmentCreated publicado automáticamente
  }
}

// 2. Event Handler actualiza read model
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler {
  async handle(event: AppointmentCreated) {
    // Actualizar read model si es necesario
    // O dejar que TypeORM lo maneje automáticamente
  }
}
```

## Ventajas de CQRS

### 1. Optimización Independiente

**Escritura:**

- Transacciones
- Validaciones complejas
- Lógica de negocio
- Normalización

**Lectura:**

- Queries optimizadas
- Desnormalización
- Caching agresivo
- Índices específicos

### 2. Escalabilidad

```
Write DB (Master)
    ↓
Read DB (Replica 1)
Read DB (Replica 2)
Read DB (Replica 3)
```

### 3. Modelos Específicos

- Write Model: Enfocado en consistencia
- Read Model: Enfocado en performance

### 4. Eventual Consistency

- Aceptable entre write y read
- Sincronización vía eventos
- Mejor performance

## Reglas de Implementación

### Commands

✅ **Hacer:**

- Un command por caso de uso
- Validación en DTOs antes de crear command
- Transacciones en handlers
- Retornar solo IDs o confirmación

❌ **No hacer:**

- Queries en command handlers
- Retornar aggregates completos
- Lógica de negocio en commands
- Commands sin handlers

### Queries

✅ **Hacer:**

- Queries optimizadas con joins
- Proyecciones específicas
- Paginación cuando sea necesario
- Caching de resultados

❌ **No hacer:**

- Modificar estado
- Usar write repositories
- Cargar aggregates completos
- Queries sin handlers

### Repositories

✅ **Hacer:**

- Separar write y read repositories
- Interfaces en domain
- Implementaciones en infrastructure
- Mappers dedicados

❌ **No hacer:**

- Mezclar write y read en mismo repository
- Exponer detalles de persistencia
- Queries complejas en write repository
- Lógica de negocio en repositories

## Testing

### Command Handler Test

```typescript
describe('CreateAppointmentHandler', () => {
  it('should create appointment and decrement capacity', async () => {
    // Arrange
    const command = new CreateAppointmentCommand(...);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.appointmentId).toBeDefined();
    expect(mockCapacityRepo.save).toHaveBeenCalled();
  });
});
```

### Query Handler Test

```typescript
describe('GetCustomerAppointmentsHandler', () => {
  it('should return customer appointments', async () => {
    // Arrange
    const query = new GetCustomerAppointmentsQuery('customer-id');
    mockReadRepo.findByCustomerId.mockResolvedValue([...]);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(result).toHaveLength(2);
    expect(mockReadRepo.findByCustomerId).toHaveBeenCalledWith('customer-id');
  });
});
```

## Registro en Módulo

```typescript
@Module({
  imports: [CqrsModule],
  providers: [
    // Command Handlers
    CreateAppointmentHandler,
    CancelAppointmentHandler,

    // Query Handlers
    GetCustomerAppointmentsHandler,
    GetAppointmentHandler,

    // Repositories
    {
      provide: "IAppointmentWriteRepository",
      useClass: AppointmentWriteRepository,
    },
    {
      provide: "IAppointmentReadRepository",
      useClass: AppointmentReadRepository,
    },
  ],
})
export class BookingModule {}
```

## CQRS Estricto: Separación con Domain Services y Factories

### Problema: Command Handlers usando Read Repositories

En CQRS estricto, los Command Handlers NO deben usar Read Repositories directamente porque:

1. ❌ Viola la separación de responsabilidades
2. ❌ Mezcla lógica de escritura con lectura
3. ❌ Dificulta la optimización independiente
4. ❌ Hace difícil escalar read y write por separado

### Solución 1: Domain Services para Validaciones

**Problema:**

```typescript
// ❌ INCORRECTO: Command Handler usando Read Repository
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepo: IBusinessReadRepository, // ❌ Violación CQRS
    @Inject('IBusinessWriteRepository')
    private readonly writeRepo: IBusinessWriteRepository,
  ) {}

  async execute(command: CreateBusinessCommand) {
    // ❌ Command Handler haciendo query
    const existing = await this.readRepo.findByWhatsAppPhone(command.phone);
    if (existing) {
      throw new WhatsAppPhoneAlreadyExistsException();
    }

    const business = Business.create(...);
    await this.writeRepo.save(business);
  }
}
```

**Solución con Domain Service:**

```typescript
// ✅ CORRECTO: Usar Domain Service
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler {
  constructor(
    @Inject('IBusinessUniquenessChecker')
    private readonly uniquenessChecker: IBusinessUniquenessChecker, // ✅ Domain Service
    @Inject('IBusinessWriteRepository')
    private readonly writeRepo: IBusinessWriteRepository,
  ) {}

  async execute(command: CreateBusinessCommand) {
    // ✅ Domain Service encapsula la validación
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(
      command.phone,
    );

    if (!isUnique) {
      throw new WhatsAppPhoneAlreadyExistsException();
    }

    const business = Business.create(...);
    await this.writeRepo.save(business);
  }
}

// Domain Service (en domain layer)
export interface IBusinessUniquenessChecker {
  isWhatsAppPhoneUnique(phone: string, excludeId?: string): Promise<boolean>;
}

// Implementación (en infrastructure layer)
@Injectable()
export class BusinessUniquenessChecker implements IBusinessUniquenessChecker {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepo: IBusinessReadRepository, // ✅ Read Repo solo en Domain Service
  ) {}

  async isWhatsAppPhoneUnique(phone: string, excludeId?: string): Promise<boolean> {
    const existing = await this.readRepo.findByWhatsAppPhone(phone);
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }
}
```

### Solución 2: Factories para Cargar Aggregates

**Problema:**

```typescript
// ❌ INCORRECTO: Write Repository con método de lectura
export interface IConversationWriteRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>; // ❌ Método de lectura en Write Repo
}

@CommandHandler(SendAdminResponseCommand)
export class SendAdminResponseHandler {
  constructor(
    @Inject("IConversationWriteRepository")
    private readonly writeRepo: IConversationWriteRepository, // ❌ Tiene método de lectura
  ) {}

  async execute(command: SendAdminResponseCommand) {
    // ❌ Write Repository cargando aggregate
    const conversation = await this.writeRepo.findById(command.conversationId);
    conversation.resolveAdminQuery();
    await this.writeRepo.save(conversation);
  }
}
```

**Solución con Factory:**

```typescript
// ✅ CORRECTO: Factory para cargar, Write Repository para persistir
export interface IConversationFactory {
  loadById(id: string): Promise<Conversation | null>; // ✅ Factory carga aggregates
}

export interface IConversationWriteRepository {
  save(conversation: Conversation): Promise<void>; // ✅ Solo escritura
}

@CommandHandler(SendAdminResponseCommand)
export class SendAdminResponseHandler {
  constructor(
    @Inject("IConversationFactory")
    private readonly factory: IConversationFactory, // ✅ Factory para cargar
    @Inject("IConversationWriteRepository")
    private readonly writeRepo: IConversationWriteRepository, // ✅ Write Repo para persistir
  ) {}

  async execute(command: SendAdminResponseCommand) {
    // ✅ Factory carga aggregate con lógica de negocio
    const conversation = await this.factory.loadById(command.conversationId);

    if (!conversation) {
      throw new ConversationNotFoundException(command.conversationId);
    }

    // ✅ Ejecutar lógica de negocio
    conversation.resolveAdminQuery();

    // ✅ Write Repository persiste
    await this.writeRepo.save(conversation);
  }
}

// Factory Implementation (en infrastructure layer)
@Injectable()
export class ConversationFactory implements IConversationFactory {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
  ) {}

  async loadById(id: string): Promise<Conversation | null> {
    const model = await this.repository.findOne({ where: { id } });
    if (!model) return null;

    // ✅ Reconstruir aggregate con lógica de negocio
    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      // ... otros campos
      model.version, // ← Preserva versión para optimistic locking
    );
  }
}
```

### Comparación: Domain Service vs Factory

| Aspecto         | Domain Service                   | Factory                                   |
| --------------- | -------------------------------- | ----------------------------------------- |
| **Propósito**   | Validaciones de negocio          | Cargar aggregates para modificar          |
| **Retorna**     | boolean, primitivos, VOs         | Domain Aggregate (con lógica)             |
| **Usado en**    | Command Handlers (validación)    | Command Handlers (modificación)           |
| **Inyecta**     | Read Repositories                | TypeORM Repository                        |
| **Ejemplo**     | `isWhatsAppPhoneUnique()`        | `loadById()`                              |
| **Cuándo usar** | Validar antes de crear/modificar | Cargar aggregate existente para modificar |

### Flujo Completo con CQRS Estricto

```typescript
// ============================================
// COMMAND: Crear Business
// ============================================

@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler {
  constructor(
    @Inject('IBusinessUniquenessChecker')
    private readonly uniquenessChecker: IBusinessUniquenessChecker, // ✅ Domain Service
    @Inject('IBusinessLimitChecker')
    private readonly limitChecker: IBusinessLimitChecker, // ✅ Domain Service
    @Inject('IBusinessWriteRepository')
    private readonly writeRepo: IBusinessWriteRepository, // ✅ Write Repository
  ) {}

  async execute(command: CreateBusinessCommand) {
    // 1. Validar con Domain Services
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(command.phone);
    if (!isUnique) throw new WhatsAppPhoneAlreadyExistsException();

    const canCreate = await this.limitChecker.canCreateBusiness(command.ownerId);
    if (!canCreate) throw new BusinessLimitExceededException();

    // 2. Crear aggregate
    const business = Business.create(...);

    // 3. Persistir con Write Repository
    await this.writeRepo.save(business);

    return { businessId: business.getId().getValue() };
  }
}

// ============================================
// COMMAND: Modificar Business
// ============================================

@CommandHandler(ConfigureWhatsAppCommand)
export class ConfigureWhatsAppHandler {
  constructor(
    @Inject('IBusinessFactory')
    private readonly factory: IBusinessFactory, // ✅ Factory para cargar
    @Inject('IBusinessUniquenessChecker')
    private readonly uniquenessChecker: IBusinessUniquenessChecker, // ✅ Domain Service
    @Inject('IBusinessWriteRepository')
    private readonly writeRepo: IBusinessWriteRepository, // ✅ Write Repository
  ) {}

  async execute(command: ConfigureWhatsAppCommand) {
    // 1. Cargar aggregate con Factory
    const business = await this.factory.loadById(command.businessId);
    if (!business) throw new BusinessNotFoundException();

    // 2. Validar con Domain Service (excluir business actual)
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(
      command.phone,
      command.businessId, // ← Excluir business actual
    );
    if (!isUnique) throw new WhatsAppPhoneAlreadyExistsException();

    // 3. Ejecutar lógica de negocio
    business.configureWhatsApp(command.phone);

    // 4. Persistir con Write Repository
    await this.writeRepo.save(business);
  }
}

// ============================================
// QUERY: Obtener Business
// ============================================

@QueryHandler(GetBusinessQuery)
export class GetBusinessHandler {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepo: IBusinessReadRepository, // ✅ Read Repository
  ) {}

  async execute(query: GetBusinessQuery): Promise<BusinessReadModel> {
    // ✅ Read Repository retorna DTO
    const business = await this.readRepo.findById(query.businessId);
    if (!business) throw new BusinessNotFoundException();
    return business; // ← DTO, no aggregate
  }
}
```

### Beneficios de CQRS Estricto

1. ✅ **Separación Clara:** Commands usan Domain Services/Factories, Queries usan Read Repositories
2. ✅ **Optimización Independiente:** Read y Write pueden optimizarse por separado
3. ✅ **Escalabilidad:** Read replicas, Write master
4. ✅ **Testeable:** Domain Services y Factories se testean independientemente
5. ✅ **Mantenible:** Cambios en validaciones no afectan queries
6. ✅ **SOLID:** Dependency Inversion, Single Responsibility

## Anti-Patterns

❌ **No hacer:**

1. **Queries en Command Handlers**

   ```typescript
   // MAL
   async execute(command: CreateAppointmentCommand) {
     const appointments = await this.readRepo.findAll(); // ❌
   }
   ```

2. **Modificar Estado en Query Handlers**

   ```typescript
   // MAL
   async execute(query: GetAppointmentQuery) {
     const appointment = await this.repo.findById(query.id);
     appointment.markAsViewed(); // ❌
     await this.repo.save(appointment); // ❌
   }
   ```

3. **Retornar Aggregates en Queries**

   ```typescript
   // MAL
   async execute(query: GetAppointmentQuery): Promise<Appointment> { // ❌
     return this.writeRepo.findById(query.id);
   }
   ```

4. **Usar Write Repository en Queries**
   ```typescript
   // MAL
   @QueryHandler(GetAppointmentQuery)
   export class GetAppointmentHandler {
     constructor(
       private readonly writeRepo: IAppointmentWriteRepository, // ❌
     ) {}
   }
   ```

✅ **Hacer:**

1. **Separación Clara**

   ```typescript
   // Command Handler
   async execute(command: CreateAppointmentCommand) {
     await this.writeRepo.save(appointment);
   }

   // Query Handler
   async execute(query: GetAppointmentQuery) {
     return this.readRepo.findById(query.id);
   }
   ```

2. **Read Models Específicos**

   ```typescript
   export class AppointmentReadModel {
     // Datos desnormalizados para UI
   }
   ```

3. **Sincronización via Eventos**
   ```typescript
   @EventsHandler(AppointmentCreated)
   export class UpdateReadModelHandler {
     async handle(event: AppointmentCreated) {
       // Actualizar read model
     }
   }
   ```
