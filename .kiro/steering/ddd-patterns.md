---
inclusion: always
---

# Domain-Driven Design (DDD) Patterns

Patrones tácticos de DDD aplicados en el proyecto.

## Aggregates

**Definición:** Cluster de objetos de dominio tratados como unidad. **Características:** Raíz única, invariantes garantizadas, ID único, límite de transacción, publica eventos.

**Reglas:** ✅ Aggregates pequeños, validar invariantes, publicar eventos, factory methods, encapsular estado | ❌ Referencias a otros aggregates (solo IDs), transacciones cruzadas, setters públicos, lógica de persistencia, aggregates anémicos

```typescript
export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private status: AppointmentStatus;
  private dateTime: DateTime;

  static create(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime,
  ): Appointment {
    if (dateTime.isInPast()) throw new CannotCreatePastAppointmentException();
    const appointment = new Appointment();
    // ... inicializar campos
    appointment.apply(
      new AppointmentCreated(id, businessId, customerId, offeringId, dateTime),
    );
    appointment.incrementVersion();
    return appointment;
  }

  cancel(): void {
    if (!this.status.canBeCancelled())
      throw new AppointmentCannotBeCancelledException();
    if (this.dateTime.isWithinHours(2))
      throw new CannotCancelWithinTwoHoursException();
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion();
    this.apply(new AppointmentCancelled(this.id));
  }

  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime,
    status: AppointmentStatus,
    version: number,
  ): Appointment {
    const appointment = new Appointment();
    // ... asignar campos
    appointment.setVersion(version);
    return appointment;
  }
}
```

## Value Objects

**Definición:** Objetos inmutables sin identidad conceptual. **Reglas:** ✅ Inmutables (readonly), validación en constructor, factory methods, métodos de negocio, implementar equals() | ❌ Mutables, identidad (no ID), referencias a entities, lógica de persistencia

```typescript
export class AppointmentStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!["CONFIRMED", "CANCELLED", "COMPLETED"].includes(value))
      throw new InvalidAppointmentStatusException(value);
  }

  static confirmed(): AppointmentStatus {
    return new AppointmentStatus("CONFIRMED");
  }
  static cancelled(): AppointmentStatus {
    return new AppointmentStatus("CANCELLED");
  }
  static fromString(value: string): AppointmentStatus {
    return new AppointmentStatus(value);
  }

  canBeCancelled(): boolean {
    return this.value === "CONFIRMED";
  }
  getValue(): string {
    return this.value;
  }
  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

## Domain Events

**Definición:** Eventos que representan hechos del pasado. **Reglas:** ✅ Nombres en pasado, inmutables, incluir timestamp, datos necesarios, publicar desde aggregates | ❌ Nombres en presente, lógica de negocio, referencias complejas, mutables

```typescript
export class AppointmentCreated {
  constructor(
    public readonly appointmentId: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

## Entities

**Definición:** Objetos con identidad que persiste a través del tiempo.

```typescript
export class Customer {
  private id: UUID;
  private whatsappPhone: WhatsAppPhone;
  private name: string | null;

  constructor(
    id: UUID,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null = null,
  ) {
    this.id = id;
    this.whatsappPhone = whatsappPhone;
    this.name = name;
  }

  updateName(name: string): void {
    this.name = name;
  }
}
```

## Domain Services

**Definición:** Lógica de dominio que no pertenece a un aggregate o value object. **Reglas:** ✅ Lógica multi-aggregate, sin estado, inyección de repositories, nombres descriptivos | ❌ Lógica que pertenece a aggregate, estado mutable, lógica de aplicación, acceso directo a BD

```typescript
@Injectable()
export class AvailabilityChecker {
  constructor(
    private readonly capacityRepo: ICapacityRepository,
    private readonly scheduleRepo: IScheduleRepository,
    private readonly blockoutRepo: IBlockoutRepository,
  ) {}

  async isAvailable(
    offeringId: UUID,
    dateTime: DateTime,
    businessId: UUID,
  ): Promise<boolean> {
    const schedule = await this.scheduleRepo.findByBusinessAndDay(
      businessId,
      dateTime.getDayOfWeek(),
    );
    if (!schedule || !schedule.includes(dateTime.getTime())) return false;

    const blockout = await this.blockoutRepo.findByBusinessAndDate(
      businessId,
      dateTime.getDate(),
    );
    if (blockout) return false;

    const capacity = await this.capacityRepo.findByOfferingAndDate(
      offeringId,
      dateTime.getDate(),
    );
    return capacity && capacity.hasAvailableSlots();
  }
}
```

## Repositories

**Reglas:** ✅ Interfaz en domain, implementación en infrastructure, Write Repository solo escritura (`save`, `delete`), Read Repository solo lectura (retorna DTOs), usar mappers, transacciones | ❌ Lógica de negocio, mezclar lectura/escritura en write repository, queries complejas en write repository, exponer detalles de persistencia

```typescript
// Domain interface
export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  // ❌ NO incluir findById() - usar IAppointmentFactory
}

// Infrastructure implementation
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
      const result = await this.repository
        .createQueryBuilder()
        .update(AppointmentModel)
        .set({ ...model, version: appointment.getVersion().getValue() + 1 })
        .where("id = :id AND version = :version", {
          id: appointment.getId().getValue(),
          version: appointment.getVersion().getValue(),
        })
        .execute();
      if (result.affected === 0)
        throw new ConcurrencyException(
          `Appointment ${appointment.getId()} was modified`,
        );
    });
  }
}
```

## Factories (Aggregate Loaders)

**Propósito:** Cargar aggregates desde persistencia para modificación (mantener CQRS estricto).

| Aspecto       | Factory                          | Read Repository            | Write Repository     |
| ------------- | -------------------------------- | -------------------------- | -------------------- |
| **Propósito** | Cargar aggregates para modificar | Obtener datos para mostrar | Persistir aggregates |
| **Retorna**   | Domain Aggregate (con lógica)    | Read Model (DTO)           | void                 |
| **Usado en**  | Command Handlers                 | Query Handlers             | Command Handlers     |

**Reglas:** ✅ Interfaz en domain, implementación en infrastructure, retornar aggregates con lógica, preservar versión, usar `Aggregate.fromPersistence()`, registrar con token | ❌ Métodos de lectura en write repository, usar read repository para cargar aggregates, usar factory en query handlers, retornar aggregates sin versión

```typescript
// Domain interface
export interface IAppointmentFactory {
  loadById(id: string): Promise<Appointment | null>;
}

// Infrastructure implementation
@Injectable()
export class AppointmentFactory implements IAppointmentFactory {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async loadById(id: string): Promise<Appointment | null> {
    const model = await this.repository.findOne({ where: { id } });
    if (!model) return null;
    return Appointment.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      UUID.fromString(model.offeringId),
      model.dateTime,
      AppointmentStatus.fromString(model.status),
      model.version,
    );
  }
}

// Uso en Command Handler
@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler implements ICommandHandler<CancelAppointmentCommand> {
  constructor(
    @Inject("IAppointmentFactory")
    private readonly factory: IAppointmentFactory,
    @Inject("IAppointmentWriteRepository")
    private readonly writeRepo: IAppointmentWriteRepository,
  ) {}

  async execute(command: CancelAppointmentCommand): Promise<void> {
    const appointment = await this.factory.loadById(command.appointmentId);
    if (!appointment)
      throw new AppointmentNotFoundException(command.appointmentId);
    appointment.cancel();
    await this.writeRepo.save(appointment);
  }
}
```

## Specifications

**Definición:** Encapsulan reglas de negocio reutilizables.

```typescript
export class AppointmentCanBeCancelledSpecification {
  isSatisfiedBy(appointment: Appointment): boolean {
    return (
      appointment.getStatus().canBeCancelled() &&
      !appointment.getDateTime().isWithinHours(2)
    );
  }
}
```

## Ubiquitous Language

**Booking:** Appointment (no "Reservation"), Offering (no "Service"), Slot (no "Time"), Capacity (no "Availability"), Confirm (no "Accept"), Cancel (no "Delete")  
**Conversation:** Conversation (no "Chat"), Message (no "Text"), Interactive Button (no "Button")

**Usar consistentemente en:** Código, tests, documentación, conversaciones, commits

## Anti-Patterns

| Anti-Pattern            | ❌ Mal                                              | ✅ Bien                                                                                    |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Anemic Domain Model** | `class Appointment { id: string; status: string; }` | `class Appointment { private status: AppointmentStatus; cancel(): void { /* lógica */ } }` |
| **Transaction Script**  | Lógica en service                                   | Lógica en aggregate                                                                        |
