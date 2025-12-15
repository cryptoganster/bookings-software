# Product Requirements Document (PRD)
## Sistema de Reservas Multi-Tenant vía WhatsApp

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Tipo:** MVP (Minimum Viable Product)

---

## 1. Visión General

### 1.1 Propósito
Desarrollar una plataforma SaaS multi-tenant que permita a negocios basados en citas (médicos, peluquerías, abogados, etc.) gestionar sus reservaciones de manera automatizada a través de WhatsApp Business API, proporcionando una experiencia conversacional fluida para sus clientes finales.

### 1.2 Objetivos del MVP
- Permitir a dueños de negocios registrarse y configurar su sistema de citas
- Automatizar el proceso de reservación vía WhatsApp
- Gestionar múltiples servicios con límites y restricciones configurables
- Proporcionar panel web de administración para dueños de negocios
- Notificaciones automáticas de recordatorio

### 1.3 Stack Tecnológico
- **Backend:** NestJS + Node.js + TypeScript
- **Base de Datos:** PostgreSQL
- **Mensajería:** WhatsApp Business API (Oficial)
- **Arquitectura:** Clean Architecture + DDD + CQRS + Event Sourcing

---

## 2. Arquitectura del Sistema

### 2.1 Principios Arquitectónicos
- Clean Architecture con capas: Domain, Application, Infrastructure, Presentation
- Domain-Driven Design (DDD) con Bounded Contexts
- CQRS estricto (Command Query Responsibility Segregation)
- Event-Driven Architecture con Domain Events
- Process Managers para orquestación de comandos basados en eventos
- Lenguaje Ubicuo por Bounded Context

### 2.2 Bounded Contexts Propuestos

#### BC1: `account`
**Responsabilidad:** Gestión de cuentas de dueños de negocios (nuestros clientes)
**Aggregates:**
- `BusinessOwner` - Dueño del negocio que usa nuestra plataforma

#### BC2: `business`
**Responsabilidad:** Configuración y datos del negocio
**Aggregates:**
- `Business` - Información del negocio (nombre, dirección, zona horaria, número WhatsApp)

#### BC3: `offering`
**Responsabilidad:** Gestión de servicios ofrecidos por el negocio
**Aggregates:**
- `Offering` - Servicios que ofrece el negocio (ej: "Corte de pelo", "Lavado")

#### BC4: `availability`
**Responsabilidad:** Gestión de horarios, bloqueos y límites
**Aggregates:**
- `Schedule` - Horarios de atención del negocio
- `Blockout` - Bloqueos de fechas específicas
- `Capacity` - Límites de capacidad por servicio y fecha

#### BC5: `booking`
**Responsabilidad:** Gestión de reservaciones
**Aggregates:**
- `Appointment` - Cita/reservación individual

#### BC6: `customer`
**Responsabilidad:** Gestión de clientes finales
**Aggregates:**
- `Customer` - Cliente final del negocio (identificado por número WhatsApp)

#### BC7: `messaging`
**Responsabilidad:** Integración con WhatsApp Business API
**Aggregates:**
- `Conversation` - Conversación con un cliente
- `Message` - Mensaje individual (para tracking y consultas al admin)

#### BC8: `notification`
**Responsabilidad:** Envío de notificaciones y recordatorios
**Aggregates:**
- `Reminder` - Recordatorio programado de cita

### 2.3 Shared Kernel

El sistema contará con un **Shared Kernel** que contiene abstracciones y utilidades compartidas entre todos los Bounded Contexts:

```
src/
├── shared/
│   ├── kernel/
│   │   ├── versioned-aggregate-root.base.ts  # Extiende AggregateRoot de @nestjs/cqrs
│   │   ├── value-object.base.ts
│   │   ├── uow.interface.ts (IUnitOfWork)
│   │   ├── repository.interface.ts
│   │   └── exceptions/
│   │       ├── concurrency.exception.ts
│   │       └── domain.exception.ts
│   ├── infra/
│   │   ├── uow.ts (TypeOrmUnitOfWork)
│   │   └── base-repository.ts
│   └── vo/
│       ├── aggregate-version.vo.ts
│       └── uuid.vo.ts
```

**Propósito del Shared Kernel:**
- Extensión de `AggregateRoot` de NestJS CQRS con versioning
- Clases base y abstracciones comunes
- Patrones reutilizables (UoW, Repository base)
- Value Objects genéricos
- Excepciones compartidas

**Integración con @nestjs/cqrs:**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    CqrsModule.forRoot(), // Registra CommandBus, QueryBus, EventBus
    // ... otros módulos
  ],
})
export class AppModule {}
```

### 2.4 Estructura de Carpetas por Bounded Context

```
src/
├── account/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── business-owner.aggregate.ts
│   │   ├── read_models/
│   │   │   └── business-owner.read-model.ts
│   │   ├── events/
│   │   │   ├── business-owner-registered.event.ts
│   │   │   └── business-owner-verified.event.ts
│   │   ├── exceptions/
│   │   │   └── business-owner-already-exists.exception.ts
│   │   ├── interfaces/
│   │   │   ├── repositories/
│   │   │   │   ├── business-owner-write.repository.interface.ts
│   │   │   │   └── business-owner-read.repository.interface.ts
│   │   │   └── services/
│   │   ├── services/
│   │   └── vo/
│   │       ├── email.vo.ts
│   │       └── password.vo.ts
│   ├── app/
│   │   ├── commands/
│   │   │   ├── register-business-owner.command.ts
│   │   │   └── register-business-owner.handler.ts
│   │   ├── queries/
│   │   │   ├── get-business-owner.query.ts
│   │   │   └── get-business-owner.handler.ts
│   │   ├── event_handlers/
│   │   └── sagas/
│   ├── infra/
│   │   ├── persistence/
│   │   │   ├── models/
│   │   │   │   └── business-owner.model.ts
│   │   │   ├── mappers/
│   │   │   │   ├── business-owner-write.mapper.ts
│   │   │   │   └── business-owner-read.mapper.ts
│   │   │   └── repositories/
│   │   │       ├── business-owner-write.repository.ts
│   │   │       └── business-owner-read.repository.ts
│   │   └── external/
│   └── presentation/
│       └── controllers/
│           └── account.controller.ts
│
├── business/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── business.aggregate.ts
│   │   ├── read_models/
│   │   ├── events/
│   │   │   ├── business-created.event.ts
│   │   │   └── business-whatsapp-configured.event.ts
│   │   ├── exceptions/
│   │   ├── interfaces/
│   │   ├── services/
│   │   └── vo/
│   │       ├── whatsapp-number.vo.ts
│   │       ├── timezone.vo.ts
│   │       └── business-address.vo.ts
│   ├── app/
│   ├── infra/
│   └── presentation/
│
├── offering/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── offering.aggregate.ts
│   │   ├── events/
│   │   │   ├── offering-created.event.ts
│   │   │   └── offering-updated.event.ts
│   │   └── vo/
│   │       ├── offering-duration.vo.ts
│   │       └── offering-capacity.vo.ts
│   ├── app/
│   ├── infra/
│   └── presentation/
│
├── availability/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── schedule.aggregate.ts
│   │   │   ├── blockout.aggregate.ts
│   │   │   └── capacity.aggregate.ts
│   │   ├── events/
│   │   └── vo/
│   │       ├── time-slot.vo.ts
│   │       └── date-range.vo.ts
│   ├── app/
│   ├── infra/
│   └── presentation/
│
├── booking/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── appointment.aggregate.ts
│   │   ├── events/
│   │   │   ├── appointment-created.event.ts
│   │   │   ├── appointment-cancelled.event.ts
│   │   │   └── appointment-modified.event.ts
│   │   ├── exceptions/
│   │   └── vo/
│   │       ├── appointment-status.vo.ts
│   │       └── appointment-date-time.vo.ts
│   ├── app/
│   │   ├── commands/
│   │   │   ├── create-appointment.handler.ts
│   │   │   ├── cancel-appointment.handler.ts
│   │   │   └── modify-appointment.handler.ts
│   │   ├── queries/
│   │   ├── event_handlers/
│   │   │   └── on-appointment-created.handler.ts
│   │   └── sagas/
│   │       └── appointment-notification.saga.ts
│   ├── infra/
│   └── presentation/
│
├── customer/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── customer.aggregate.ts
│   │   ├── events/
│   │   └── vo/
│   │       └── whatsapp-phone.vo.ts
│   ├── app/
│   ├── infra/
│   └── presentation/
│
├── messaging/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── conversation.aggregate.ts
│   │   │   └── message.aggregate.ts
│   │   ├── events/
│   │   │   ├── message-received.event.ts
│   │   │   ├── admin-query-requested.event.ts
│   │   │   └── admin-response-sent.event.ts
│   │   ├── interfaces/
│   │   │   └── external/
│   │   │       └── whatsapp-client.interface.ts
│   │   └── vo/
│   │       ├── message-type.vo.ts
│   │       └── interactive-button.vo.ts
│   ├── app/
│   │   ├── commands/
│   │   │   ├── send-whatsapp-message.handler.ts
│   │   │   └── process-incoming-message.handler.ts
│   │   └── event_handlers/
│   ├── infra/
│   │   └── external/
│   │       └── whatsapp-business-api.client.ts
│   └── presentation/
│       └── controllers/
│           └── webhook.controller.ts
│
└── notification/
    ├── domain/
    │   ├── aggregates/
    │   │   └── reminder.aggregate.ts
    │   ├── events/
    │   │   └── reminder-scheduled.event.ts
    │   └── vo/
    │       └── reminder-time.vo.ts
    ├── app/
    │   ├── commands/
    │   │   └── schedule-reminder.handler.ts
    │   └── event_handlers/
    │       └── on-appointment-created.handler.ts
    ├── infra/
    └── presentation/
```

---

## 3. Gestión de Concurrencia y Transacciones

### 3.1 Estrategia: UoW + Optimistic Locking + Aggregate Version

Para mitigar **race conditions** en operaciones concurrentes (ej: múltiples usuarios reservando el mismo slot), el sistema implementará:

#### Unit of Work (UoW)
**Propósito:** Gestionar transacciones de base de datos y garantizar atomicidad

**Interfaz:** `src/shared/kernel/uow.interface.ts`
```typescript
export interface IUnitOfWork {
  /**
   * Inicia una transacción y ejecuta la función dentro de ella
   * @param work Función a ejecutar dentro de la transacción
   * @param options Opciones de transacción (isolation level, etc.)
   */
  transaction<T>(
    work: () => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  
  /**
   * Obtiene el query runner actual (para uso avanzado)
   */
  getQueryRunner(): any;
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}
```

**Implementación:** `src/shared/infra/uow.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { IUnitOfWork, TransactionOptions } from '@shared/kernel/uow.interface';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}
  
  async transaction<T>(
    work: () => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Iniciar transacción con isolation level si se especifica
    await queryRunner.startTransaction(options?.isolationLevel);
    
    try {
      const result = await work();
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  
  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
```

#### Optimistic Locking con Versioning

**AggregateVersion Value Object:** `src/shared/vo/aggregate-version.vo.ts`
```typescript
import { ValueObject } from '@shared/kernel/value-object.base';

export class AggregateVersion extends ValueObject {
  constructor(private readonly value: number) {
    super();
    if (value < 0) {
      throw new Error('Version cannot be negative');
    }
  }
  
  increment(): AggregateVersion {
    return new AggregateVersion(this.value + 1);
  }
  
  getValue(): number {
    return this.value;
  }
  
  equals(other: AggregateVersion): boolean {
    return this.value === other.getValue();
  }
  
  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

**VersionedAggregateRoot Base:** `src/shared/kernel/versioned-aggregate-root.base.ts`
```typescript
import { AggregateRoot } from '@nestjs/cqrs';
import { AggregateVersion } from '@shared/vo/aggregate-version.vo';

/**
 * Extiende AggregateRoot de NestJS CQRS agregando versioning para Optimistic Locking
 */
export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;
  
  constructor() {
    super();
    this.version = new AggregateVersion(0);
    // autoCommit = true para publicar eventos automáticamente
    this.autoCommit = true;
  }
  
  getVersion(): AggregateVersion {
    return this.version;
  }
  
  protected incrementVersion(): void {
    this.version = this.version.increment();
  }
  
  /**
   * Reconstruye el aggregate con una versión específica (útil para hidratar desde BD)
   */
  protected setVersion(version: number): void {
    this.version = new AggregateVersion(version);
  }
}
```

**Nota:** La clase `AggregateRoot` de `@nestjs/cqrs` ya incluye:
- `apply(event)` - Agrega evento al stream interno
- `commit()` - Publica todos los eventos pendientes (si autoCommit=false)
- `uncommit()` - Limpia eventos pendientes sin publicarlos
- `getUncommittedEvents()` - Obtiene eventos pendientes
- `autoCommit` - Flag para auto-publicar eventos

**Ejemplo de Aggregate con Versioning:** `src/booking/domain/aggregates/appointment.aggregate.ts`
```typescript
import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root.base';
import { AppointmentStatus } from '../vo/appointment-status.vo';
import { AppointmentCancelled } from '../events/appointment-cancelled.event';
import { AppointmentCreated } from '../events/appointment-created.event';

export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private offeringId: UUID;
  private status: AppointmentStatus;
  private dateTime: DateTime;
  
  // Constructor para crear nueva cita
  static create(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime
  ): Appointment {
    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = AppointmentStatus.confirmed();
    
    // apply() agrega el evento al stream (de AggregateRoot)
    appointment.apply(
      new AppointmentCreated(id, businessId, customerId, offeringId, dateTime)
    );
    appointment.incrementVersion(); // ← Incrementa versión
    
    return appointment;
  }
  
  public cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
    
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion(); // ← Incrementa versión en cada cambio
    this.apply(new AppointmentCancelled(this.id)); // ← Agrega evento
    // Si autoCommit=true, el evento se publica automáticamente
  }
  
  public modify(newDateTime: DateTime): void {
    // validaciones...
    this.dateTime = newDateTime;
    this.incrementVersion(); // ← Incrementa versión
    this.apply(new AppointmentModified(this.id, newDateTime));
  }
  
  // Métodos para hidratar desde BD
  public getId(): UUID {
    return this.id;
  }
  
  // Factory method para reconstruir desde persistencia
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
    appointment.setVersion(version); // ← Establece versión desde BD
    return appointment;
  }
}
```

#### Manejo de Concurrencia en Repositories

**Write Repository con Optimistic Locking:** `src/booking/infra/persistence/repositories/appointment-write.repository.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write.repository.interface';
import { Appointment } from '@booking/domain/aggregates/appointment.aggregate';
import { AppointmentModel } from '../models/appointment.model';
import { AppointmentWriteMapper } from '../mappers/appointment-write.mapper';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency.exception';
import { IUnitOfWork } from '@shared/kernel/uow.interface';

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
      
      // Intenta actualizar solo si la versión coincide
      const result = await this.repository
        .createQueryBuilder()
        .update(AppointmentModel)
        .set({
          ...model,
          version: appointment.getVersion().getValue() + 1, // Nueva versión
        })
        .where('id = :id', { id: appointment.getId() })
        .andWhere('version = :version', { 
          version: appointment.getVersion().getValue() // Versión actual
        })
        .execute();
      
      // Si no se actualizó ninguna fila, significa que la versión cambió
      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Appointment ${appointment.getId()} was modified by another transaction`
        );
      }
      
      // Nota: Los eventos ya fueron publicados automáticamente por autoCommit=true
      // Si autoCommit=false, aquí deberías llamar a appointment.commit()
    });
  }
  
  async findById(id: UUID): Promise<Appointment | null> {
    const model = await this.repository.findOne({ where: { id } });
    if (!model) return null;
    
    return AppointmentWriteMapper.toDomain(model);
  }
}
```

**ConcurrencyException:** `src/shared/kernel/exceptions/concurrency.exception.ts`
```typescript
export class ConcurrencyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyException';
  }
}
```

#### Manejo en Application Layer

**Command Definition:** `src/booking/app/commands/cancel-appointment.command.ts`
```typescript
import { Command } from '@nestjs/cqrs';

// Extiende Command para tipado del resultado
export class CancelAppointmentCommand extends Command<void> {
  constructor(
    public readonly appointmentId: string,
    public readonly cancelledBy: string,
  ) {
    super();
  }
}
```

**Command Handler con manejo de concurrencia:** `src/booking/app/commands/cancel-appointment.handler.ts`
```typescript
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CancelAppointmentCommand } from './cancel-appointment.command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write.repository.interface';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency.exception';
import { AppointmentNotFoundException } from '@booking/domain/exceptions/appointment-not-found.exception';

@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler implements ICommandHandler<CancelAppointmentCommand> {
  constructor(
    private readonly appointmentRepository: IAppointmentWriteRepository,
    private readonly publisher: EventPublisher, // ← Para fusionar EventBus en aggregate
  ) {}
  
  async execute(command: CancelAppointmentCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const appointment = await this.appointmentRepository.findById(command.appointmentId);
        
        if (!appointment) {
          throw new AppointmentNotFoundException(command.appointmentId);
        }
        
        // mergeObjectContext fusiona el EventPublisher en el aggregate
        // Esto permite que apply() publique eventos al EventBus
        const appointmentWithContext = this.publisher.mergeObjectContext(appointment);
        
        appointmentWithContext.cancel(); // ← Incrementa version + apply(event)
        
        // Si autoCommit=true, los eventos ya fueron publicados
        // Si autoCommit=false, llamar: appointmentWithContext.commit()
        
        await this.appointmentRepository.save(appointmentWithContext);
        
        return; // Éxito
        
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error('Unable to cancel appointment after multiple attempts. Please try again.');
          }
          // Espera breve antes de reintentar (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          throw error; // Otros errores se propagan inmediatamente
        }
      }
    }
  }
}
```

**Alternativa sin EventPublisher (si autoCommit=true):**
```typescript
@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler implements ICommandHandler<CancelAppointmentCommand> {
  constructor(
    private readonly appointmentRepository: IAppointmentWriteRepository,
  ) {}
  
  async execute(command: CancelAppointmentCommand): Promise<void> {
    // ... retry logic igual
    
    const appointment = await this.appointmentRepository.findById(command.appointmentId);
    
    appointment.cancel(); // Con autoCommit=true, eventos se publican automáticamente
    
    await this.appointmentRepository.save(appointment);
  }
}
```

**Nota:** Si `autoCommit=true` en el Aggregate, no es necesario usar `EventPublisher.mergeObjectContext()`. Los eventos se publicarán automáticamente cuando se llame a `apply()`. Sin embargo, `EventPublisher` es útil cuando quieres control explícito o cuando `autoCommit=false`.

### 3.2 Casos de Uso de Optimistic Locking

#### Caso 1: Reservación Simultánea del Mismo Slot
**Escenario:**
- Usuario A y Usuario B seleccionan el mismo horario simultáneamente
- Ambos intentan confirmar al mismo tiempo

**Flujo:**
1. Usuario A lee `Capacity` (version=5, availableSlots=1)
2. Usuario B lee `Capacity` (version=5, availableSlots=1)
3. Usuario A ejecuta `CreateAppointmentCommand` → decrementa slot → version=6 ✅
4. Usuario B ejecuta `CreateAppointmentCommand` → intenta actualizar version=5 → **ConcurrencyException** ❌
5. Sistema reintenta automáticamente para Usuario B
6. Usuario B lee `Capacity` (version=6, availableSlots=0)
7. Sistema responde: "Lo sentimos, este horario ya no está disponible"

#### Caso 2: Modificación Concurrente de Cita
**Escenario:**
- Cliente intenta cancelar cita vía WhatsApp
- Admin intenta modificar la misma cita desde panel web

**Flujo:**
1. Cliente lee `Appointment` (version=2)
2. Admin lee `Appointment` (version=2)
3. Cliente ejecuta `CancelAppointmentCommand` → version=3 ✅
4. Admin ejecuta `ModifyAppointmentCommand` → intenta actualizar version=2 → **ConcurrencyException** ❌
5. Sistema muestra mensaje al Admin: "Esta cita fue modificada recientemente. Por favor recarga."

### 3.3 Beneficios de esta Estrategia

✅ **Sin bloqueos de lectura:** Alto throughput, múltiples usuarios pueden leer simultáneamente  
✅ **Detección automática de conflictos:** El sistema sabe cuándo hubo concurrencia  
✅ **Reintentos inteligentes:** Manejo automático con backoff exponencial  
✅ **Mensajes claros al usuario:** "Este horario ya no está disponible" en lugar de error genérico  
✅ **Integridad de datos:** Garantizada por version checking  
✅ **Escalabilidad:** Funciona bien con alta concurrencia

---

## 4. Flujos de Usuario

### 4.1 Flujo: Dueño de Negocio - Registro e Configuración

**Actor:** Dueño de Negocio  
**Canal:** Panel Web

1. Dueño accede al panel web
2. Se registra (email, password, nombre del negocio)
3. Configura información del negocio:
   - Nombre comercial
   - Dirección
   - Zona horaria
   - Número de WhatsApp Business
4. Define horarios de atención (días y horas)
5. Crea offerings (servicios):
   - Nombre del servicio
   - Duración
   - Capacidad máxima por slot
   - Límite diario/semanal
6. Configura bloqueos de fechas (vacaciones, días festivos)
7. Sistema genera webhook URL para WhatsApp Business API

**Eventos de Dominio:**
- `BusinessOwnerRegistered`
- `BusinessCreated`
- `BusinessWhatsAppConfigured`
- `OfferingCreated`
- `ScheduleConfigured`
- `BlockoutCreated`

### 4.2 Flujo: Cliente Final - Reservación de Cita vía WhatsApp

**Actor:** Cliente Final  
**Canal:** WhatsApp

1. Cliente envía mensaje al número de WhatsApp del negocio
2. Bot saluda y presenta opciones mediante botones interactivos:
   ```
   ¡Hola! 👋 Bienvenido a [Nombre del Negocio]
   
   ¿Qué servicio deseas agendar?
   [Corte de Pelo] [Lavado] [Tinte] [Consulta al Admin]
   ```
3. Cliente selecciona un servicio (ej: "Corte de Pelo")
4. Sistema verifica disponibilidad y presenta fechas disponibles:
   ```
   Selecciona una fecha:
   [Lunes 18/12] [Martes 19/12] [Miércoles 20/12]
   ```
5. Cliente selecciona fecha
6. Sistema presenta horarios disponibles:
   ```
   Horarios disponibles para Lunes 18/12:
   [9:00 AM] [10:30 AM] [2:00 PM] [4:00 PM]
   ```
7. Cliente selecciona horario
8. Sistema confirma los datos:
   ```
   Confirma tu cita:
   📅 Lunes 18 de Diciembre
   🕐 10:30 AM
   ✂️ Corte de Pelo
   
   [Confirmar] [Cambiar]
   ```
9. Cliente confirma
10. Sistema crea la cita y envía confirmación con datos de ubicación

**Eventos de Dominio:**
- `CustomerIdentified` (o `CustomerCreated` si es nuevo)
- `ConversationStarted`
- `MessageReceived`
- `AppointmentCreated`
- `ReminderScheduled`
- `MessageSent`

### 4.3 Flujo: Cliente Final - Modificar/Cancelar Cita

**Actor:** Cliente Final  
**Canal:** WhatsApp

1. Cliente envía mensaje
2. Bot detecta que tiene citas activas y muestra menú:
   ```
   ¡Hola de nuevo! Tienes una cita:
   📅 Lunes 18/12 - 10:30 AM
   ✂️ Corte de Pelo
   
   ¿Qué deseas hacer?
   [Nueva Cita] [Modificar Cita] [Cancelar Cita] [Ver Ubicación]
   ```
3. Cliente selecciona "Modificar Cita" o "Cancelar Cita"
4. Si modifica: repite flujo de selección de fecha/hora
5. Si cancela: solicita confirmación y cancela

**Eventos de Dominio:**
- `AppointmentCancelled`
- `AppointmentModified`
- `ReminderCancelled`

### 4.4 Flujo: Cliente Final - Consulta al Administrador

**Actor:** Cliente Final, Dueño de Negocio  
**Canal:** WhatsApp (Cliente), Panel Web (Admin)

1. Cliente selecciona "Consulta al Admin"
2. Bot solicita que escriba su consulta
3. Cliente escribe su mensaje
4. Sistema marca la conversación como "Pendiente de Admin"
5. Administrador ve notificación en panel web
6. Administrador responde desde panel
7. Sistema envía respuesta al cliente vía WhatsApp

**Eventos de Dominio:**
- `AdminQueryRequested`
- `AdminResponseSent`

### 4.5 Flujo: Sistema - Envío de Recordatorios

**Actor:** Sistema (automatizado)  
**Canal:** WhatsApp

1. Cron job verifica recordatorios programados
2. Para citas próximas (24 horas antes):
   ```
   🔔 Recordatorio de Cita
   
   Tienes una cita mañana:
   📅 Lunes 18/12
   🕐 10:30 AM
   ✂️ Corte de Pelo
   📍 [Ubicación del Negocio]
   
   [Confirmar Asistencia] [Cancelar Cita]
   ```
3. Sistema registra envío del recordatorio

**Eventos de Dominio:**
- `ReminderSent`

---

## 5. Integraciones Externas

### 5.1 WhatsApp Business API

**Tipo:** API REST + Webhooks  
**Propósito:** Envío y recepción de mensajes

**Funcionalidades Requeridas:**
- Envío de mensajes de texto
- Envío de botones interactivos
- Envío de mensajes con ubicación
- Recepción de mensajes vía webhook (tiempo real)
- Gestión de estado de conversaciones

**Implementación:**
- Interfaz: `src/messaging/domain/interfaces/external/whatsapp-client.interface.ts`
- Implementación: `src/messaging/infra/external/whatsapp-business-api.client.ts`

**Webhook Endpoint:**
```
POST /api/webhooks/whatsapp
```

**Estrategia de Recepción:**
- Webhooks en tiempo real (streaming)
- Evita polling para reducir latencia y recursos
- Validación de firma de webhook para seguridad

---

## 6. Modelo de Datos (High-Level)

### 6.1 Entidades Principales

#### BusinessOwner (account)
```typescript
- id: UUID
- email: Email (VO)
- password: Password (VO, hasheado)
- name: string
- createdAt: Date
- verifiedAt: Date | null
```

#### Business (business)
```typescript
- id: UUID
- ownerId: UUID
- name: string
- whatsappNumber: WhatsAppNumber (VO)
- address: BusinessAddress (VO)
- timezone: Timezone (VO)
- createdAt: Date
```

#### Offering (offering)
```typescript
- id: UUID
- businessId: UUID
- name: string
- duration: OfferingDuration (VO) // en minutos
- maxCapacityPerSlot: number
- maxDailyCapacity: number | null
- isActive: boolean
```

#### Schedule (availability)
```typescript
- id: UUID
- businessId: UUID
- dayOfWeek: number (0-6)
- startTime: Time
- endTime: Time
- isActive: boolean
```

#### Blockout (availability)
```typescript
- id: UUID
- businessId: UUID
- dateRange: DateRange (VO)
- reason: string
```

#### Capacity (availability)
```typescript
- id: UUID
- offeringId: UUID
- date: Date
- availableSlots: number
- bookedSlots: number
- version: number // ← Campo para Optimistic Locking
```

#### Appointment (booking)
```typescript
- id: UUID
- businessId: UUID
- customerId: UUID
- serviceId: UUID
- dateTime: AppointmentDateTime (VO)
- status: AppointmentStatus (VO) // CONFIRMED, CANCELLED, COMPLETED
- createdAt: Date
- cancelledAt: Date | null
```

#### Customer (customer)
```typescript
- id: UUID
- businessId: UUID
- whatsappPhone: WhatsAppPhone (VO)
- name: string | null // Obtenido de WhatsApp o conversación
- createdAt: Date
```

#### Conversation (messaging)
```typescript
- id: UUID
- businessId: UUID
- customerId: UUID
- status: ConversationStatus // ACTIVE, AWAITING_ADMIN, RESOLVED
- lastMessageAt: Date
```

#### Message (messaging)
```typescript
- id: UUID
- conversationId: UUID
- direction: MessageDirection // INBOUND, OUTBOUND
- content: string
- messageType: MessageType (VO) // TEXT, BUTTON, LOCATION
- sentAt: Date
- isFromAdmin: boolean
```

#### Reminder (notification)
```typescript
- id: UUID
- appointmentId: UUID
- scheduledFor: Date
- sentAt: Date | null
- status: ReminderStatus // PENDING, SENT, CANCELLED
```

---

## 7. Reglas de Negocio

### 7.1 Reservaciones
1. No se pueden crear citas en fechas/horarios bloqueados
2. No se pueden crear citas fuera del horario de atención
3. No se pueden exceder los límites de capacidad por offering
4. No se pueden crear citas en el pasado
5. Cada cliente puede tener máximo 3 citas activas simultáneamente
6. Las citas deben respetar la duración mínima del offering
7. Debe haber al menos 15 minutos entre el momento actual y la hora de la cita

### 7.2 Cancelaciones
1. Las citas solo pueden cancelarse hasta 2 horas antes
2. Al cancelar, se libera la capacidad del slot
3. Se debe notificar al cliente de la cancelación exitosa

### 7.3 Modificaciones
1. Solo se pueden modificar citas futuras
2. Modificar = Cancelar anterior + Crear nueva
3. Debe validarse disponibilidad en nuevo slot

### 7.4 Multi-tenancy
1. Cada negocio se identifica por su número de WhatsApp único
2. Los datos de un negocio no son visibles para otros
3. Cada webhook debe validar el origen del mensaje

### 7.5 Zona Horaria
1. Todas las citas se almacenan en UTC
2. Se muestran al cliente en la zona horaria del negocio
3. Los recordatorios respetan la zona horaria del negocio

---

## 8. Casos de Uso (Application Layer)

### 8.1 Commands (Escritura)

**Definición de Commands:**
Los Commands deben extender la clase `Command<TResult>` de `@nestjs/cqrs` para inferencia de tipos del resultado.

**Ejemplo de Command:**
```typescript
import { Command } from '@nestjs/cqrs';

export class CreateAppointmentCommand extends Command<{ appointmentId: string }> {
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

**Command Handlers:**
Deben decorarse con `@CommandHandler(CommandClass)` e implementar `ICommandHandler<TCommand>`.

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    // Lógica de negocio
    return { appointmentId: 'uuid' };
  }
}
```

**Dispatching Commands:**
```typescript
import { CommandBus } from '@nestjs/cqrs';

@Injectable()
export class BookingService {
  constructor(private commandBus: CommandBus) {}
  
  async createAppointment(dto: CreateAppointmentDto) {
    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(dto.businessId, dto.customerId, dto.offeringId, dto.dateTime)
    );
    // result es tipado como { appointmentId: string }
    return result;
  }
}
```

**Lista de Commands por BC:**

#### Account
- `RegisterBusinessOwnerCommand extends Command<{ ownerId: string }>`
- `VerifyBusinessOwnerCommand extends Command<void>`
- `UpdateBusinessOwnerProfileCommand extends Command<void>`

#### Business
- `CreateBusinessCommand extends Command<{ businessId: string }>`
- `ConfigureWhatsAppCommand extends Command<void>`
- `UpdateBusinessInfoCommand extends Command<void>`

#### Offering
- `CreateOfferingCommand extends Command<{ offeringId: string }>`
- `UpdateOfferingCommand extends Command<void>`
- `DeactivateOfferingCommand extends Command<void>`

#### Availability
- `ConfigureScheduleCommand extends Command<{ scheduleId: string }>`
- `CreateBlockoutCommand extends Command<{ blockoutId: string }>`
- `RemoveBlockoutCommand extends Command<void>`
- `UpdateCapacityCommand extends Command<void>`

#### Booking
- `CreateAppointmentCommand extends Command<{ appointmentId: string }>` ⭐
- `CancelAppointmentCommand extends Command<void>` ⭐
- `ModifyAppointmentCommand extends Command<{ appointmentId: string }>` ⭐
- `ConfirmAppointmentCommand extends Command<void>`

#### Customer
- `RegisterCustomerCommand extends Command<{ customerId: string }>`
- `UpdateCustomerInfoCommand extends Command<void>`

#### Messaging
- `SendWhatsAppMessageCommand extends Command<{ messageId: string }>` ⭐
- `ProcessIncomingMessageCommand extends Command<void>` ⭐
- `SendAdminResponseCommand extends Command<void>`

#### Notification
- `ScheduleReminderCommand extends Command<{ reminderId: string }>`
- `SendReminderCommand extends Command<void>`
- `CancelReminderCommand extends Command<void>`

### 8.2 Queries (Lectura)

**Definición de Queries:**
Las Queries deben extender la clase `Query<TResult>` de `@nestjs/cqrs` para inferencia de tipos del resultado.

**Ejemplo de Query:**
```typescript
import { Query } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read_models/appointment.read-model';

export class GetAppointmentQuery extends Query<AppointmentReadModel> {
  constructor(public readonly appointmentId: string) {
    super();
  }
}
```

**Query Handlers:**
Deben decorarse con `@QueryHandler(QueryClass)` e implementar `IQueryHandler<TQuery>`.

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler implements IQueryHandler<GetAppointmentQuery> {
  constructor(
    private readonly appointmentReadRepository: IAppointmentReadRepository
  ) {}
  
  async execute(query: GetAppointmentQuery): Promise<AppointmentReadModel> {
    return this.appointmentReadRepository.findById(query.appointmentId);
  }
}
```

**Dispatching Queries:**
```typescript
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class BookingService {
  constructor(private queryBus: QueryBus) {}
  
  async getAppointment(id: string) {
    const appointment = await this.queryBus.execute(
      new GetAppointmentQuery(id)
    );
    // appointment es tipado como AppointmentReadModel
    return appointment;
  }
}
```

**Lista de Queries por BC:**

#### Account
- `GetBusinessOwnerQuery extends Query<BusinessOwnerReadModel>`
- `GetBusinessOwnerByEmailQuery extends Query<BusinessOwnerReadModel | null>`

#### Business
- `GetBusinessQuery extends Query<BusinessReadModel>`
- `GetBusinessByWhatsAppNumberQuery extends Query<BusinessReadModel | null>`

#### Offering
- `GetOfferingsByBusinessQuery extends Query<OfferingReadModel[]>`
- `GetActiveOfferingsQuery extends Query<OfferingReadModel[]>`

#### Availability
- `GetAvailableDatesQuery extends Query<Date[]>` ⭐
- `GetAvailableTimeSlotsQuery extends Query<TimeSlot[]>` ⭐
- `GetScheduleByBusinessQuery extends Query<ScheduleReadModel[]>`
- `GetBlockoutsByBusinessQuery extends Query<BlockoutReadModel[]>`

#### Booking
- `GetAppointmentQuery extends Query<AppointmentReadModel>`
- `GetCustomerAppointmentsQuery extends Query<AppointmentReadModel[]>` ⭐
- `GetBusinessAppointmentsQuery extends Query<AppointmentReadModel[]>`
- `GetUpcomingAppointmentsQuery extends Query<AppointmentReadModel[]>`

#### Customer
- `GetCustomerQuery extends Query<CustomerReadModel>`
- `GetCustomerByPhoneQuery extends Query<CustomerReadModel | null>` ⭐

#### Messaging
- `GetConversationQuery extends Query<ConversationReadModel>`
- `GetPendingAdminQueriesQuery extends Query<ConversationReadModel[]>`
- `GetConversationHistoryQuery extends Query<MessageReadModel[]>`

#### Notification
- `GetPendingRemindersQuery extends Query<ReminderReadModel[]>`

---

## 9. Event Handlers y Process Managers

### 9.1 Event Handlers

**Propósito:** Ejecutar lógica después de un evento de dominio

**Definición de Event:**
```typescript
// src/booking/domain/events/appointment-created.event.ts
export class AppointmentCreated {
  constructor(
    public readonly appointmentId: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
  ) {}
}
```

**Event Handler:**
Deben decorarse con `@EventsHandler(EventClass)` e implementar `IEventHandler<TEvent>`.

```typescript
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created.event';
import { ScheduleReminderCommand } from '@notification/app/commands/schedule-reminder.command';

@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  constructor(private readonly commandBus: CommandBus) {}
  
  async handle(event: AppointmentCreated) {
    // Dispara comando para programar recordatorio
    await this.commandBus.execute(
      new ScheduleReminderCommand(event.appointmentId, event.dateTime)
    );
  }
}
```

**Nota Importante sobre Event Handlers:**
- Se ejecutan **asíncronamente**
- No pueden ser capturados por Exception Filters
- Deben manejar errores con try/catch
- No pueden enviar respuestas HTTP directamente
- Son ideales para side-effects y orquestación de comandos

**Event Handlers en el sistema:**

#### En `booking/app/event_handlers/`
- `OnAppointmentCreatedHandler`
  - Escucha: `AppointmentCreated`
  - Efecto: Dispara `ScheduleReminderCommand` + `SendWhatsAppMessageCommand`

- `OnAppointmentCancelledHandler`
  - Escucha: `AppointmentCancelled`
  - Efecto: Dispara `CancelReminderCommand` + `SendWhatsAppMessageCommand`

- `OnAppointmentModifiedHandler`
  - Escucha: `AppointmentModified`
  - Efecto: Dispara `CancelReminderCommand` + `ScheduleReminderCommand`

#### En `notification/app/event_handlers/`
- `OnAppointmentCreatedHandler`
  - Escucha: `AppointmentCreated`
  - Efecto: Crea recordatorio en BD

**Subscribiendo al EventBus:**
Si necesitas procesar todos los eventos (ej: para event store):

```typescript
import { EventBus } from '@nestjs/cqrs';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subject, takeUntil } from 'rxjs';

@Injectable()
export class EventLogger implements OnModuleInit, OnModuleDestroy {
  private destroy$ = new Subject<void>();
  
  constructor(private eventBus: EventBus) {}
  
  onModuleInit() {
    this.eventBus
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        console.log('Event published:', event.constructor.name);
        // Guardar en event store, logs, etc.
      });
  }
  
  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 9.2 Sagas (Process Managers)

**Propósito:** Orquestar flujos complejos escuchando múltiples eventos y disparando comandos

Las **Sagas** en NestJS CQRS son equivalentes a **Process Managers** en DDD. Escuchan eventos y retornan Observables que producen comandos.

**Ejemplo de Saga:**
```typescript
import { Injectable } from '@nestjs/common';
import { Saga, ofType } from '@nestjs/cqrs';
import { Observable, map } from 'rxjs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created.event';
import { ScheduleReminderCommand } from '@notification/app/commands/schedule-reminder.command';
import { SendWhatsAppMessageCommand } from '@messaging/app/commands/send-whatsapp-message.command';
import { ICommand } from '@nestjs/cqrs';

@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map((event) => {
        // Retorna comando que será auto-despachado por CommandBus
        return new ScheduleReminderCommand(
          event.appointmentId,
          event.dateTime
        );
      })
    );
  };
  
  @Saga()
  sendConfirmation = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map((event) => {
        return new SendWhatsAppMessageCommand(
          event.customerId,
          `Tu cita ha sido confirmada para ${event.dateTime}`
        );
      })
    );
  };
}
```

**Saga con Múltiples Eventos:**
```typescript
import { merge } from 'rxjs';

@Injectable()
export class ConversationFlowSaga {
  @Saga()
  handleConversation = (events$: Observable<any>): Observable<ICommand> => {
    const messageReceived$ = events$.pipe(
      ofType(MessageReceived),
      map((event) => new ProcessIncomingMessageCommand(event.messageId))
    );
    
    const appointmentCreated$ = events$.pipe(
      ofType(AppointmentCreated),
      map((event) => new SendWhatsAppMessageCommand(
        event.customerId,
        'Confirmación de cita...'
      ))
    );
    
    // Merge múltiples streams
    return merge(messageReceived$, appointmentCreated$);
  };
}
```

**Sagas en el Sistema:**

#### En `booking/app/sagas/`
- `AppointmentNotificationSaga`
  - Escucha: `AppointmentCreated`
  - Emite: `ScheduleReminderCommand`, `SendWhatsAppMessageCommand`
  
- `AppointmentCancellationSaga`
  - Escucha: `AppointmentCancelled`
  - Emite: `CancelReminderCommand`, `SendWhatsAppMessageCommand`

#### En `messaging/app/sagas/`
- `ConversationFlowSaga`
  - Escucha: `MessageReceived`, `AppointmentCreated`, `AppointmentCancelled`
  - Emite: `ProcessIncomingMessageCommand`, `SendWhatsAppMessageCommand`

**Nota:** Las Sagas son siempre **singleton** porque gestionan procesos de larga duración.

**Registro de Sagas:**
```typescript
// booking.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    // Command Handlers
    CreateAppointmentHandler,
    // Event Handlers
    OnAppointmentCreatedHandler,
    // Sagas
    AppointmentNotificationSaga,
  ],
})
export class BookingModule {}
```

---

## 10. API Endpoints (Presentation Layer)

### 10.1 Panel Web - Business Owner

#### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

#### Business Management
```
GET    /api/business
PUT    /api/business
POST   /api/business/whatsapp
```

#### Offerings
```
GET    /api/offerings
POST   /api/offerings
PUT    /api/offerings/:id
DELETE /api/offerings/:id
```

#### Schedules
```
GET    /api/schedules
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

#### Blockouts
```
GET    /api/blockouts
POST   /api/blockouts
DELETE /api/blockouts/:id
```

#### Appointments
```
GET    /api/appointments
GET    /api/appointments/:id
GET    /api/appointments/today
GET    /api/appointments/upcoming
```

#### Admin Queries
```
GET    /api/admin-queries/pending
POST   /api/admin-queries/:id/respond
```

#### Analytics (opcional para MVP)
```
GET    /api/analytics/appointments
GET    /api/analytics/offerings
```

### 10.2 Webhooks

```
POST   /api/webhooks/whatsapp
```

---

## 11. Componentes del Panel Web

### 11.1 Páginas Principales

#### 1. Dashboard
- Resumen de citas del día
- Citas próximas
- Consultas pendientes de admin
- Métricas rápidas (total citas semana, tasa de cancelación)

#### 2. Calendario
- Vista mensual/semanal/diaria de citas
- Filtro por offering
- Crear bloqueo manual

#### 3. Servicios Ofrecidos
- Lista de servicios (offerings)
- Crear/editar/desactivar servicio
- Configurar duración y capacidad

#### 4. Horarios
- Configurar horarios de atención por día
- Crear excepciones (días festivos)

#### 5. Consultas de Clientes
- Lista de consultas pendientes
- Responder a clientes
- Ver historial de conversación

#### 6. Configuración
- Datos del negocio
- Configuración de WhatsApp
- Zona horaria
- Preferencias de notificaciones

---

## 12. Requisitos No Funcionales

### 12.1 Performance
- Respuesta de webhook de WhatsApp < 1 segundo
- Carga de página del panel < 2 segundos
- Consultas a base de datos optimizadas con índices

### 12.2 Escalabilidad
- Soportar hasta 100 negocios en MVP
- Cada negocio puede manejar hasta 500 citas/mes
- Mensajes de WhatsApp procesados de forma asíncrona

### 12.3 Seguridad
- Autenticación JWT para panel web
- Passwords hasheados con bcrypt
- Validación de firma de webhooks de WhatsApp
- Aislamiento de datos entre tenants (Row Level Security opcional)
- Rate limiting en endpoints públicos

### 12.4 Disponibilidad
- Uptime objetivo: 99%
- Manejo de errores con circuit breakers
- Reintentos automáticos para mensajes fallidos

### 12.5 Observabilidad
- Logging estructurado (Winston o Pino)
- Tracking de eventos de dominio
- Health checks para monitoreo

---

## 13. Dependencias y Librerías

### 13.1 Core
```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/common": "^10.x",
  "@nestjs/cqrs": "^10.x",
  "typeorm": "^0.3.x",
  "pg": "^8.x",
  "typescript": "^5.x",
  "rxjs": "^7.x"
}
```

### 13.2 Autenticación
```json
{
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "passport-jwt": "^4.x",
  "bcrypt": "^5.x"
}
```

### 13.3 Validación
```json
{
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

### 13.4 WhatsApp
```json
{
  "axios": "^1.x" // Para llamadas a WhatsApp Business API
}
```

### 13.5 Utilidades
```json
{
  "date-fns": "^2.x", // Manejo de fechas y zonas horarias
  "date-fns-tz": "^2.x",
  "uuid": "^9.x"
}
```

### 13.6 Logging
```json
{
  "winston": "^3.x"
}
```

---

## 14. Fases de Implementación del MVP

### Fase 1: Fundamentos (Semanas 1-2)
- Setup del proyecto NestJS
- Instalación y configuración de `@nestjs/cqrs` con `CqrsModule.forRoot()`
- Configuración de TypeORM + PostgreSQL
- Estructura de carpetas por Bounded Contexts
- Shared Kernel: VersionedAggregateRoot (extiende AggregateRoot de NestJS), ValueObject base, IUnitOfWork
- Implementación de Unit of Work con TypeORM
- Configuración de CommandBus, QueryBus, EventBus

### Fase 2: Core Domain (Semanas 3-4)
- Implementar Aggregates principales extendiendo VersionedAggregateRoot
- Value Objects (incluyendo AggregateVersion)
- Domain Events (clases simples, sin decoradores)
- Repositories (interfaces e implementaciones con Optimistic Locking)
- ConcurrencyException y manejo de errores

### Fase 3: Application Layer (Semanas 5-6)
- Commands extendiendo `Command<TResult>` de @nestjs/cqrs
- Command Handlers con `@CommandHandler` decorator y retry logic
- Queries extendiendo `Query<TResult>` de @nestjs/cqrs
- Query Handlers con `@QueryHandler` decorator
- Event Handlers con `@EventsHandler` decorator
- Sagas con `@Saga()` decorator (Process Managers)
- Registro de todos los handlers en módulos

### Fase 4: Integración WhatsApp (Semanas 7-8)
- Cliente de WhatsApp Business API
- Webhook endpoint
- Lógica conversacional básica
- Botones interactivos

### Fase 5: Panel Web (Semanas 9-10)
- APIs REST para panel
- Autenticación y autorización
- CRUD de offerings y horarios
- Vista de citas

### Fase 6: Notificaciones (Semana 11)
- Sistema de recordatorios
- Cron jobs
- Envío automático

### Fase 7: Testing y Refinamiento (Semana 12)
- Tests unitarios (Aggregates, Value Objects)
- Tests de integración (Command/Query Handlers)
- Tests de concurrencia (simular race conditions)
- Tests E2E (flujos completos)
- Documentación

---

## 15. Métricas de Éxito del MVP

### 15.1 Técnicas
- Cobertura de tests > 70%
- Tiempo de respuesta API < 200ms (p95)
- Webhook processing < 1s
- Zero downtime en despliegues

### 15.2 Producto
- 10 negocios onboarded
- 100+ citas creadas exitosamente
- Tasa de cancelación < 10%
- Tasa de error en conversaciones < 5%
- Zero errores de concurrencia reportados por usuarios

### 15.3 Experiencia de Usuario
- Tiempo promedio de reservación < 2 minutos
- NPS de dueños de negocios > 8
- < 3 clics para agendar cita

---

## 16. Riesgos y Mitigaciones

### Riesgo 1: Límites de WhatsApp Business API
**Mitigación:** Implementar rate limiting y queue system para mensajes

### Riesgo 2: Complejidad de zonas horarias
**Mitigación:** Usar date-fns-tz, almacenar todo en UTC, convertir solo en presentación

### Riesgo 3: Race conditions en capacidad ✅ MITIGADO
**Mitigación:** 
- Unit of Work para transacciones atómicas
- Optimistic Locking con campo `version` en Aggregates críticos
- Retry logic con exponential backoff en Command Handlers
- Mensajes claros al usuario cuando hay conflictos
- Tests específicos de concurrencia

### Riesgo 4: Escalabilidad de multi-tenancy
**Mitigación:** Particionar BD por tenant si es necesario, usar índices compuestos

### Riesgo 5: Conversaciones ambiguas
**Mitigación:** Diseñar flujo conversacional muy estructurado con botones, minimizar texto libre

---

## 17. Próximos Pasos Post-MVP

1. Pagos integrados (Stripe, PayPal)
2. Recordatorios múltiples (24h, 2h antes)
3. Lista de espera para citas
4. Reportes y analytics avanzados
5. Integración con Google Calendar
6. App móvil para dueños de negocios
7. Webhooks para integraciones externas
8. IA para respuestas automáticas mejoradas
9. Sistema de valoraciones de clientes
10. Multi-idioma

---

## 18. Notas Adicionales

### 18.1 CQRS Estricto con NestJS
- **Escritura:** Aggregates + Commands (extendiendo `Command<TResult>`)
- **Lectura:** Read Models + Queries (extendiendo `Query<TResult>`)
- **Sin compartir:** Los Aggregates NO se usan en Queries
- **Sincronización:** Via Domain Events + Event Handlers + Sagas
- **Infraestructura:** `@nestjs/cqrs` provee CommandBus, QueryBus, EventBus
- **Tipado fuerte:** Commands y Queries con inferencia de tipos del resultado
- **Eventos:** Publicados automáticamente con `autoCommit=true` o manualmente con `commit()`

### 18.2 Event Sourcing (Opcional en MVP)
- No implementar Event Sourcing completo en MVP
- Solo usar Domain Events para orquestación
- Considerar para post-MVP en Aggregates críticos (Appointment)

### 18.3 Testing Strategy
- **Unit Tests:** Aggregates, Value Objects, Domain Services
- **Integration Tests:** Command/Query Handlers, Repositories, Sagas (testeando streams de RxJS)
- **Concurrency Tests:** Simular race conditions con múltiples threads/procesos
- **E2E Tests:** Flujos completos de usuario con CommandBus/QueryBus/EventBus
- **Contract Tests:** Integración WhatsApp API
- **Event Tests:** Verificar que eventos se publiquen correctamente desde Aggregates
- **Saga Tests:** Verificar que eventos disparen comandos correctos usando marble testing de RxJS

### 18.4 Optimistic Locking Best Practices
- **Aggregates a versionar:** Appointment, Capacity, Conversation
- **Aggregates sin versioning:** BusinessOwner, Customer, Offering (baja concurrencia esperada)
- **Retry attempts:** Máximo 3 reintentos con exponential backoff
- **User feedback:** Mensajes claros cuando hay conflicto ("Este horario ya fue reservado")
- **Monitoring:** Trackear frecuencia de ConcurrencyExceptions para ajustar estrategia

### 18.5 Integración NestJS CQRS + DDD

**Resumen de la integración:**

1. **Aggregates:**
   - Extienden `VersionedAggregateRoot` que extiende `AggregateRoot` de `@nestjs/cqrs`
   - Usan `apply(event)` para agregar eventos
   - `autoCommit=true` para auto-publicar eventos al EventBus
   - Campo `version` para Optimistic Locking

2. **Commands:**
   - Extienden `Command<TResult>` para tipado fuerte
   - Ejecutados por `CommandBus.execute()`
   - Manejados por `@CommandHandler` decorados

3. **Queries:**
   - Extienden `Query<TResult>` para tipado fuerte
   - Ejecutados por `QueryBus.execute()`
   - Manejados por `@QueryHandler` decorados

4. **Events:**
   - Clases simples (POJOs) con datos del evento
   - Publicados automáticamente desde Aggregates con `apply()`
   - Manejados por `@EventsHandler` decorados
   - Stream disponible en `EventBus` para suscripciones

5. **Sagas:**
   - Métodos decorados con `@Saga()`
   - Retornan `Observable<ICommand>` usando RxJS
   - Filtran eventos con `ofType()`
   - Mapean eventos a comandos automáticamente despachados

6. **EventPublisher:**
   - Fusiona EventBus en Aggregates con `mergeObjectContext()`
   - Opcional si `autoCommit=true`
   - Necesario para control manual o `autoCommit=false`

**Flujo completo ejemplo:**
```
1. Controller → CommandBus.execute(CreateAppointmentCommand)
2. CreateAppointmentHandler → Appointment.create() → apply(AppointmentCreated)
3. EventBus publica AppointmentCreated (autoCommit=true)
4. OnAppointmentCreatedHandler recibe evento → CommandBus.execute(ScheduleReminderCommand)
5. AppointmentNotificationSaga recibe evento → emite SendWhatsAppMessageCommand
6. CommandBus ejecuta ambos comandos automáticamente
```

**Ventajas de usar @nestjs/cqrs:**
- ✅ Infraestructura probada y mantenida
- ✅ Tipado fuerte en toda la aplicación
- ✅ Integración nativa con Dependency Injection
- ✅ Testing facilitado con mocks de buses
- ✅ Observables de RxJS para flujos complejos
- ✅ Menor código boilerplate

---

**Fin del PRD v1.0**