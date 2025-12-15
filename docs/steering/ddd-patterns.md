# Domain-Driven Design (DDD) Patterns

Este documento define los patrones tácticos de DDD aplicados en el proyecto.

## Aggregates

### Definición

Un Aggregate es un cluster de objetos de dominio que se tratan como una unidad para cambios de datos.

### Características

- **Raíz del Aggregate**: Única entrada para modificaciones
- **Consistencia**: Invariantes garantizadas dentro del aggregate
- **Identidad**: Identificado por ID único
- **Transacciones**: Límite de transacción
- **Eventos**: Publica eventos de dominio

### Implementación

```typescript
import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root.base';

export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private offeringId: UUID;
  private status: AppointmentStatus;  // Value Object
  private dateTime: DateTime;         // Value Object
  
  // Factory method para creación
  static create(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime
  ): Appointment {
    // Validaciones
    if (dateTime.isInPast()) {
      throw new CannotCreatePastAppointmentException();
    }
    
    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = AppointmentStatus.confirmed();
    
    // Publicar evento
    appointment.apply(
      new AppointmentCreated(id, businessId, customerId, offeringId, dateTime)
    );
    appointment.incrementVersion();
    
    return appointment;
  }
  
  // Métodos de negocio
  cancel(): void {
    // Validar reglas de negocio
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
    
    if (this.dateTime.isWithinHours(2)) {
      throw new CannotCancelWithinTwoHoursException();
    }
    
    // Cambiar estado
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion();
    
    // Publicar evento
    this.apply(new AppointmentCancelled(this.id));
  }
  
  modify(newDateTime: DateTime): void {
    // Validaciones
    if (this.status.isCancelled()) {
      throw new CannotModifyCancelledAppointmentException();
    }
    
    if (newDateTime.isInPast()) {
      throw new CannotModifyToPastException();
    }
    
    // Cambiar estado
    this.dateTime = newDateTime;
    this.incrementVersion();
    
    // Publicar evento
    this.apply(new AppointmentModified(this.id, newDateTime));
  }
  
  // Factory method para reconstrucción
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime,
    status: AppointmentStatus,
    version: number
  ): Appointment {
    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = status;
    appointment.setVersion(version);
    return appointment;
  }
  
  // Getters (no setters públicos)
  getId(): UUID { return this.id; }
  getBusinessId(): UUID { return this.businessId; }
  getStatus(): AppointmentStatus { return this.status; }
  getDateTime(): DateTime { return this.dateTime; }
}
```

### Reglas de Aggregates

✅ **Hacer:**
- Mantener aggregates pequeños
- Validar invariantes en métodos
- Publicar eventos de dominio
- Usar factory methods
- Encapsular estado (private fields)

❌ **No hacer:**
- Referencias a otros aggregates (solo IDs)
- Transacciones que cruzan aggregates
- Setters públicos
- Lógica de persistencia en aggregate
- Aggregates anémicos (solo getters/setters)

## Value Objects

### Definición

Objetos inmutables que describen características del dominio sin identidad conceptual.

### Implementación

```typescript
import { ValueObject } from '@shared/kernel/value-object.base';

export class AppointmentStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(value)) {
      throw new InvalidAppointmentStatusException(value);
    }
  }
  
  // Factory methods
  static confirmed(): AppointmentStatus {
    return new AppointmentStatus('CONFIRMED');
  }
  
  static cancelled(): AppointmentStatus {
    return new AppointmentStatus('CANCELLED');
  }
  
  static completed(): AppointmentStatus {
    return new AppointmentStatus('COMPLETED');
  }
  
  static fromString(value: string): AppointmentStatus {
    return new AppointmentStatus(value);
  }
  
  // Métodos de negocio
  canBeCancelled(): boolean {
    return this.value === 'CONFIRMED';
  }
  
  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }
  
  isConfirmed(): boolean {
    return this.value === 'CONFIRMED';
  }
  
  // Getters
  getValue(): string {
    return this.value;
  }
  
  // Equality
  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

### Reglas de Value Objects

✅ **Hacer:**
- Inmutables (readonly, no setters)
- Validación en constructor
- Factory methods para creación
- Métodos de negocio
- Implementar equals()

❌ **No hacer:**
- Mutables
- Identidad (no ID)
- Referencias a entities
- Lógica de persistencia

## Domain Events

### Definición

Eventos que representan algo que ha ocurrido en el dominio.

### Implementación

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

export class AppointmentCancelled {
  constructor(
    public readonly appointmentId: string,
    public readonly cancelledAt: Date = new Date(),
  ) {}
}
```

### Reglas de Domain Events

✅ **Hacer:**
- Nombres en pasado (Created, Cancelled)
- Inmutables
- Incluir timestamp
- Datos necesarios para handlers
- Publicar desde aggregates

❌ **No hacer:**
- Nombres en presente
- Lógica de negocio en eventos
- Referencias a objetos complejos
- Eventos mutables

## Entities

### Definición

Objetos con identidad que persiste a través del tiempo.

### Implementación

```typescript
export class Customer {
  private id: UUID;
  private businessId: UUID;
  private whatsappPhone: WhatsAppPhone;  // Value Object
  private name: string | null;
  private createdAt: Date;
  
  constructor(
    id: UUID,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null = null
  ) {
    this.id = id;
    this.businessId = businessId;
    this.whatsappPhone = whatsappPhone;
    this.name = name;
    this.createdAt = new Date();
  }
  
  updateName(name: string): void {
    this.name = name;
  }
  
  getId(): UUID { return this.id; }
  getWhatsAppPhone(): WhatsAppPhone { return this.whatsappPhone; }
  getName(): string | null { return this.name; }
}
```

## Domain Services

### Definición

Lógica de dominio que no pertenece naturalmente a un aggregate o value object.

### Implementación

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
    businessId: UUID
  ): Promise<boolean> {
    // 1. Verificar si está en horario de atención
    const schedule = await this.scheduleRepo.findByBusinessAndDay(
      businessId,
      dateTime.getDayOfWeek()
    );
    
    if (!schedule || !schedule.includes(dateTime.getTime())) {
      return false;
    }
    
    // 2. Verificar si está bloqueado
    const blockout = await this.blockoutRepo.findByBusinessAndDate(
      businessId,
      dateTime.getDate()
    );
    
    if (blockout) {
      return false;
    }
    
    // 3. Verificar capacidad
    const capacity = await this.capacityRepo.findByOfferingAndDate(
      offeringId,
      dateTime.getDate()
    );
    
    return capacity && capacity.hasAvailableSlots();
  }
}
```

### Reglas de Domain Services

✅ **Hacer:**
- Lógica que involucra múltiples aggregates
- Operaciones sin estado
- Inyección de repositories
- Nombres descriptivos

❌ **No hacer:**
- Lógica que pertenece a un aggregate
- Estado mutable
- Lógica de aplicación
- Acceso directo a BD

## Repositories

### Definición

Abstracción para acceso a aggregates.

### Interfaz (Domain)

```typescript
// src/booking/domain/interfaces/repositories/appointment-write.repository.interface.ts
export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}
```

### Implementación (Infrastructure)

```typescript
// src/booking/infra/persistence/repositories/appointment-write.repository.ts
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
        .set({
          ...model,
          version: appointment.getVersion().getValue() + 1,
        })
        .where('id = :id', { id: appointment.getId().getValue() })
        .andWhere('version = :version', { 
          version: appointment.getVersion().getValue()
        })
        .execute();
      
      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Appointment ${appointment.getId()} was modified`
        );
      }
    });
  }
  
  async findById(id: UUID): Promise<Appointment | null> {
    const model = await this.repository.findOne({ 
      where: { id: id.getValue() } 
    });
    
    if (!model) return null;
    
    return AppointmentWriteMapper.toDomain(model);
  }
}
```

### Reglas de Repositories

✅ **Hacer:**
- Interfaz en domain
- Implementación en infrastructure
- Trabajar con aggregates completos
- Usar mappers
- Transacciones cuando sea necesario

❌ **No hacer:**
- Lógica de negocio en repositories
- Queries complejas en write repository
- Exponer detalles de persistencia
- Retornar modelos de BD

## Factories

### Definición

Encapsulan lógica compleja de creación de objetos.

### Implementación

```typescript
export class AppointmentFactory {
  static create(
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime
  ): Appointment {
    const id = UUID.generate();
    
    // Validaciones complejas
    if (dateTime.isInPast()) {
      throw new CannotCreatePastAppointmentException();
    }
    
    if (dateTime.isWithinMinutes(15)) {
      throw new MinimumAdvanceNoticeException();
    }
    
    return Appointment.create(id, businessId, customerId, offeringId, dateTime);
  }
}
```

## Specifications

### Definición

Encapsulan reglas de negocio reutilizables.

### Implementación

```typescript
export class AppointmentCanBeCancelledSpecification {
  isSatisfiedBy(appointment: Appointment): boolean {
    return appointment.getStatus().canBeCancelled() &&
           !appointment.getDateTime().isWithinHours(2);
  }
}

// Uso
const spec = new AppointmentCanBeCancelledSpecification();
if (!spec.isSatisfiedBy(appointment)) {
  throw new CannotCancelAppointmentException();
}
```

## Ubiquitous Language

### Booking Context

- **Appointment** (no "Reservation" o "Booking")
- **Offering** (no "Service")
- **Slot** (no "Time")
- **Capacity** (no "Availability")
- **Confirm** (no "Accept")
- **Cancel** (no "Delete")

### Messaging Context

- **Conversation** (no "Chat")
- **Message** (no "Text")
- **Interactive Button** (no "Button")

### Usar consistentemente en:
- Código
- Tests
- Documentación
- Conversaciones
- Commits

## Anti-Patterns

❌ **Anemic Domain Model**
```typescript
// MAL
class Appointment {
  id: string;
  status: string;
  // Solo getters/setters, sin lógica
}
```

✅ **Rich Domain Model**
```typescript
// BIEN
class Appointment {
  private status: AppointmentStatus;
  
  cancel(): void {
    // Validaciones y lógica de negocio
  }
}
```

❌ **Transaction Script**
```typescript
// MAL - Lógica en service
class AppointmentService {
  cancel(id: string) {
    const appointment = repo.find(id);
    if (appointment.status !== 'CONFIRMED') throw error;
    appointment.status = 'CANCELLED';
    repo.save(appointment);
  }
}
```

✅ **Domain Logic in Aggregate**
```typescript
// BIEN - Lógica en aggregate
class Appointment {
  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new CannotCancelException();
    }
    this.status = AppointmentStatus.cancelled();
  }
}
```
