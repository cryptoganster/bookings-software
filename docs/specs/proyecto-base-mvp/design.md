# Design Document

## Overview

Este diseño establece las bases arquitectónicas del Sistema de Reservas Multi-Tenant usando NestJS con CQRS, DDD y Clean Architecture. El enfoque es crear una estructura funcional y escalable implementando el bounded context de Booking completo como referencia, junto con el Shared Kernel y la integración básica con WhatsApp.

### Objetivos del Diseño

1. **Estructura escalable**: Arquitectura modular que permita agregar bounded contexts sin refactorizar
2. **CQRS nativo**: Aprovechar @nestjs/cqrs para separación de comandos y queries
3. **Concurrencia robusta**: Implementar Optimistic Locking desde el inicio
4. **Referencia clara**: Un BC completo que sirva de template
5. **Funcionalidad inmediata**: Sistema operativo para crear citas vía WhatsApp

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  REST Controllers │         │ Webhook Handler  │         │
│  │   (Panel Web)    │         │   (WhatsApp)     │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Commands │  │ Queries  │  │  Events  │  │  Sagas   │   │
│  │ Handlers │  │ Handlers │  │ Handlers │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │            │             │             │          │
│         ▼            ▼             ▼             ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     CommandBus    QueryBus      EventBus             │  │
│  │            (@nestjs/cqrs)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Aggregates  │  │    Events    │  │    Value     │     │
│  │              │  │              │  │   Objects    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Repositories │  │   TypeORM    │  │  WhatsApp    │     │
│  │  (Write/Read)│  │   Entities   │  │    Client    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

El proyecto seguirá una estructura modular por bounded context:

```
src/
├── main.ts
├── app.module.ts
├── shared/
│   ├── kernel/
│   ├── infra/
│   └── vo/
├── booking/
│   ├── booking.module.ts
│   ├── domain/
│   ├── app/
│   ├── infra/
│   └── presentation/
├── messaging/
│   └── messaging.module.ts
└── auth/
    └── auth.module.ts
```


## Components and Interfaces

### Shared Kernel Components

#### VersionedAggregateRoot

Clase base para todos los aggregates que requieren control de concurrencia:

```typescript
// src/shared/kernel/versioned-aggregate-root.base.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { AggregateVersion } from '@shared/vo/aggregate-version.vo';

export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;
  
  constructor() {
    super();
    this.version = new AggregateVersion(0);
    this.autoCommit = true; // Auto-publicar eventos
  }
  
  getVersion(): AggregateVersion {
    return this.version;
  }
  
  protected incrementVersion(): void {
    this.version = this.version.increment();
  }
  
  protected setVersion(version: number): void {
    this.version = new AggregateVersion(version);
  }
}
```

**Responsabilidades:**
- Extender AggregateRoot de @nestjs/cqrs
- Gestionar versioning para Optimistic Locking
- Proveer métodos para incrementar y establecer versión
- Configurar autoCommit para publicación automática de eventos

#### IUnitOfWork

Interfaz para gestión de transacciones:

```typescript
// src/shared/kernel/uow.interface.ts
export interface IUnitOfWork {
  transaction<T>(
    work: () => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  
  getQueryRunner(): any;
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 
                   'REPEATABLE READ' | 'SERIALIZABLE';
}
```

**Implementación:**

```typescript
// src/shared/infra/uow.ts
@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}
  
  async transaction<T>(
    work: () => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
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
}
```

#### Value Objects Base

```typescript
// src/shared/kernel/value-object.base.ts
export abstract class ValueObject {
  protected abstract getEqualityComponents(): any[];
  
  equals(other: ValueObject): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;
    
    const components = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();
    
    if (components.length !== otherComponents.length) return false;
    
    return components.every((component, index) => 
      component === otherComponents[index]
    );
  }
}
```

### Booking Bounded Context

#### Appointment Aggregate

```typescript
// src/booking/domain/aggregates/appointment.ts
export class Appointment extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private offeringId: UUID;
  private status: AppointmentStatus;
  private dateTime: DateTime;
  
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
    
    appointment.apply(
      new AppointmentCreated(id, businessId, customerId, offeringId, dateTime)
    );
    appointment.incrementVersion();
    
    return appointment;
  }
  
  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
    
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion();
    this.apply(new AppointmentCancelled(this.id));
  }
  
  modify(newDateTime: DateTime): void {
    if (this.status.isCancelled()) {
      throw new AppointmentCannotBeModifiedException();
    }
    
    this.dateTime = newDateTime;
    this.incrementVersion();
    this.apply(new AppointmentModified(this.id, newDateTime));
  }
  
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
  
  getId(): UUID { return this.id; }
  getBusinessId(): UUID { return this.businessId; }
  getCustomerId(): UUID { return this.customerId; }
  getOfferingId(): UUID { return this.offeringId; }
  getDateTime(): DateTime { return this.dateTime; }
  getStatus(): AppointmentStatus { return this.status; }
}
```

#### Repository Interfaces

```typescript
// src/booking/domain/interfaces/repositories/appointment-write.ts
export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}

// src/booking/domain/interfaces/repositories/appointment-read.ts
export interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(businessId: string): Promise<AppointmentReadModel[]>;
  findUpcoming(businessId: string): Promise<AppointmentReadModel[]>;
}
```


### Application Layer Components

#### Commands

```typescript
// src/booking/app/commands/create-appointment/command.ts
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

// src/booking/app/commands/cancel-appointment/command.ts
export class CancelAppointmentCommand extends Command<void> {
  constructor(
    public readonly appointmentId: string,
    public readonly cancelledBy: string,
  ) {
    super();
  }
}
```

#### Command Handlers

```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAppointmentCommand } from './command';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler 
  implements ICommandHandler<CreateAppointmentCommand> {
  
  constructor(
    private readonly appointmentRepository: IAppointmentWriteRepository,
    private readonly capacityRepository: ICapacityWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}
  
  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    const appointmentId = UUID.generate();
    
    await this.uow.transaction(async () => {
      // Verificar y decrementar capacidad
      const capacity = await this.capacityRepository.findByOfferingAndDate(
        command.offeringId,
        command.dateTime
      );
      
      if (!capacity || !capacity.hasAvailableSlots()) {
        throw new NoAvailableSlotsException();
      }
      
      capacity.decrementSlot();
      await this.capacityRepository.save(capacity);
      
      // Crear cita
      const appointment = Appointment.create(
        appointmentId,
        command.businessId,
        command.customerId,
        command.offeringId,
        DateTime.fromDate(command.dateTime)
      );
      
      await this.appointmentRepository.save(appointment);
    });
    
    return { appointmentId: appointmentId.getValue() };
  }
}

// src/booking/app/commands/cancel-appointment/handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelAppointmentCommand } from './command';

@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler 
  implements ICommandHandler<CancelAppointmentCommand> {
  
  constructor(
    private readonly appointmentRepository: IAppointmentWriteRepository,
  ) {}
  
  async execute(command: CancelAppointmentCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const appointment = await this.appointmentRepository.findById(
          UUID.fromString(command.appointmentId)
        );
        
        if (!appointment) {
          throw new AppointmentNotFoundException(command.appointmentId);
        }
        
        appointment.cancel();
        await this.appointmentRepository.save(appointment);
        
        return;
        
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error('Unable to cancel appointment after multiple attempts');
          }
          await new Promise(resolve => 
            setTimeout(resolve, 100 * Math.pow(2, attempt))
          );
        } else {
          throw error;
        }
      }
    }
  }
}
```

#### Queries

```typescript
// src/booking/app/queries/get-customer-appointments/query.ts
import { Query } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read_models/appointment';

export class GetCustomerAppointmentsQuery extends Query<AppointmentReadModel[]> {
  constructor(public readonly customerId: string) {
    super();
  }
}

// src/booking/app/queries/get-customer-appointments/handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCustomerAppointmentsQuery } from './query';

@QueryHandler(GetCustomerAppointmentsQuery)
export class GetCustomerAppointmentsHandler 
  implements IQueryHandler<GetCustomerAppointmentsQuery> {
  
  constructor(
    private readonly appointmentReadRepository: IAppointmentReadRepository
  ) {}
  
  async execute(query: GetCustomerAppointmentsQuery): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepository.findByCustomerId(query.customerId);
  }
}
```

#### Event Handlers

```typescript
// src/booking/app/event-handlers/on-appointment-created.ts
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler 
  implements IEventHandler<AppointmentCreated> {
  
  constructor(private readonly commandBus: CommandBus) {}
  
  async handle(event: AppointmentCreated) {
    try {
      // Programar recordatorio
      await this.commandBus.execute(
        new ScheduleReminderCommand(
          event.appointmentId,
          event.dateTime
        )
      );
      
      // Enviar confirmación por WhatsApp
      await this.commandBus.execute(
        new SendWhatsAppMessageCommand(
          event.customerId,
          `Tu cita ha sido confirmada para ${event.dateTime}`
        )
      );
    } catch (error) {
      // Log error pero no propagar
      console.error('Error handling AppointmentCreated:', error);
    }
  }
}
```

#### Sagas

```typescript
// src/booking/app/sagas/appointment-notification.ts
@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map((event) => new ScheduleReminderCommand(
        event.appointmentId,
        event.dateTime
      ))
    );
  };
  
  @Saga()
  appointmentCancelled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCancelled),
      mergeMap((event) => [
        new CancelReminderCommand(event.appointmentId),
        new SendWhatsAppMessageCommand(
          event.customerId,
          'Tu cita ha sido cancelada'
        )
      ])
    );
  };
}
```

### Infrastructure Layer

#### Repository Implementation

```typescript
// src/booking/infra/persistence/repositories/appointment-write.ts
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
          `Appointment ${appointment.getId()} was modified by another transaction`
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

### Messaging Integration

#### WhatsApp Client Interface

```typescript
// src/messaging/domain/interfaces/external/whatsapp-client.ts
export interface IWhatsAppClient {
  sendMessage(to: string, message: string): Promise<void>;
  sendInteractiveButtons(
    to: string, 
    message: string, 
    buttons: Button[]
  ): Promise<void>;
  sendLocation(to: string, location: Location): Promise<void>;
}

export interface Button {
  id: string;
  title: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}
```

#### WhatsApp Client Implementation

```typescript
// src/messaging/infra/external/whatsapp-business-api.ts
@Injectable()
export class WhatsAppBusinessApiClient implements IWhatsAppClient {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  
  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get('WHATSAPP_API_URL');
    this.accessToken = configService.get('WHATSAPP_ACCESS_TOKEN');
  }
  
  async sendMessage(to: string, message: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        await axios.post(
          `${this.apiUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new WhatsAppSendException('Failed to send message', error);
        }
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }
  
  async sendInteractiveButtons(
    to: string,
    message: string,
    buttons: Button[]
  ): Promise<void> {
    await axios.post(
      `${this.apiUrl}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: message },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
```


## Data Models

### TypeORM Entities

#### AppointmentModel (Write Model)

```typescript
// src/booking/infra/persistence/models/appointment.ts
@Entity('appointments')
export class AppointmentModel {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column('uuid')
  businessId: string;
  
  @Column('uuid')
  customerId: string;
  
  @Column('uuid')
  offeringId: string;
  
  @Column('timestamp')
  dateTime: Date;
  
  @Column('varchar')
  status: string;
  
  @Column('int', { default: 0 })
  version: number;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column('timestamp', { nullable: true })
  cancelledAt: Date | null;
}
```

#### AppointmentReadModel

```typescript
// src/booking/domain/read-models/appointment.ts
export class AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: Date;
  status: string;
  createdAt: Date;
  cancelledAt: Date | null;
}
```

#### CapacityModel

```typescript
// src/booking/infra/persistence/models/capacity.ts
@Entity('capacities')
export class CapacityModel {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column('uuid')
  offeringId: string;
  
  @Column('date')
  date: Date;
  
  @Column('int')
  totalSlots: number;
  
  @Column('int')
  availableSlots: number;
  
  @Column('int', { default: 0 })
  version: number;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Index(['offeringId', 'date'], { unique: true })
  offeringDateIndex: void;
}
```

### Mappers

```typescript
// src/booking/infra/persistence/mappers/appointment-write.ts
export class AppointmentWriteMapper {
  static toModel(appointment: Appointment): Partial<AppointmentModel> {
    return {
      id: appointment.getId().getValue(),
      businessId: appointment.getBusinessId().getValue(),
      customerId: appointment.getCustomerId().getValue(),
      offeringId: appointment.getOfferingId().getValue(),
      dateTime: appointment.getDateTime().toDate(),
      status: appointment.getStatus().getValue(),
      version: appointment.getVersion().getValue(),
    };
  }
  
  static toDomain(model: AppointmentModel): Appointment {
    return Appointment.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      UUID.fromString(model.offeringId),
      DateTime.fromDate(model.dateTime),
      AppointmentStatus.fromString(model.status),
      model.version
    );
  }
}

// src/booking/infra/persistence/mappers/appointment-read.ts
export class AppointmentReadMapper {
  static toReadModel(model: any): AppointmentReadModel {
    return {
      id: model.id,
      businessId: model.businessId,
      customerId: model.customerId,
      customerName: model.customerName,
      customerPhone: model.customerPhone,
      offeringId: model.offeringId,
      offeringName: model.offeringName,
      dateTime: model.dateTime,
      status: model.status,
      createdAt: model.createdAt,
      cancelledAt: model.cancelledAt,
    };
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Aggregate version increments on state changes

*For any* Appointment aggregate, when a state-changing method (create, cancel, modify) is called, the version should increment by exactly 1.

**Validates: Requirements 2.2**

### Property 2: Optimistic locking prevents concurrent modifications

*For any* Appointment aggregate, when two concurrent save operations attempt to update the same aggregate with the same initial version, exactly one should succeed and the other should throw ConcurrencyException.

**Validates: Requirements 3.5, 8.3**

### Property 3: Capacity decrements atomically with appointment creation

*For any* valid CreateAppointmentCommand, when executed successfully, the corresponding Capacity's availableSlots should decrease by exactly 1 within the same transaction.

**Validates: Requirements 8.2**

### Property 4: Commands produce expected events

*For any* Appointment aggregate, when create() is called, it should apply exactly one AppointmentCreated event; when cancel() is called, it should apply exactly one AppointmentCancelled event.

**Validates: Requirements 3.4**

### Property 5: Events are published automatically

*For any* Appointment aggregate with autoCommit=true, when apply() is called with an event, the event should be published to EventBus without requiring explicit commit().

**Validates: Requirements 3.4**

### Property 6: Repository save detects version conflicts

*For any* Appointment aggregate, when save() is called and the database version differs from the aggregate version, a ConcurrencyException should be thrown.

**Validates: Requirements 4.4**

### Property 7: Command handlers retry on concurrency exceptions

*For any* CancelAppointmentCommand, when a ConcurrencyException occurs, the handler should retry up to 3 times with exponential backoff before failing.

**Validates: Requirements 8.3**

### Property 8: Queries return read models without side effects

*For any* Query execution, the database state should remain unchanged before and after the query.

**Validates: Requirements 4.2**

### Property 9: WhatsApp message sending retries on failure

*For any* message send operation, when the API call fails, the client should retry up to 3 times with exponential backoff.

**Validates: Requirements 6.5**

### Property 10: Event handlers handle errors gracefully

*For any* EventHandler, when an exception occurs during event processing, the exception should be caught and logged without propagating to other handlers.

**Validates: Requirements 5.2**

### Property 11: Sagas emit commands for matching events

*For any* Saga decorated with @Saga(), when an event matching ofType() is published, the saga should emit the corresponding command to CommandBus.

**Validates: Requirements 5.4**

### Property 12: Transactions rollback on errors

*For any* UnitOfWork transaction, when an exception is thrown within the work function, all database changes should be rolled back.

**Validates: Requirements 2.3**

### Property 13: JWT tokens contain valid user data

*For any* successful login, the generated JWT token should contain the user's id and email, and should be verifiable with the configured secret.

**Validates: Requirements 9.3**

### Property 14: Protected endpoints reject invalid tokens

*For any* request to a protected endpoint with an invalid or expired JWT token, the system should return 401 Unauthorized.

**Validates: Requirements 9.4**

### Property 15: Validation errors return 400 with details

*For any* request with invalid data according to class-validator decorators, the system should return 400 Bad Request with detailed validation errors.

**Validates: Requirements 10.4**


## Error Handling

### Exception Hierarchy

```typescript
// src/shared/kernel/exceptions/domain.exception.ts
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// src/shared/kernel/exceptions/concurrency.exception.ts
export class ConcurrencyException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

// src/booking/domain/exceptions/appointment-not-found.exception.ts
export class AppointmentNotFoundException extends DomainException {
  constructor(appointmentId: string) {
    super(`Appointment with id ${appointmentId} not found`);
  }
}

// src/booking/domain/exceptions/no-available-slots.exception.ts
export class NoAvailableSlotsException extends DomainException {
  constructor() {
    super('No available slots for the selected date and time');
  }
}
```

### Global Exception Filter

```typescript
// src/shared/infra/filters/domain-exception.filter.ts
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const statusCode = this.getStatusCode(exception);
    
    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
  
  private getStatusCode(exception: DomainException): number {
    if (exception instanceof AppointmentNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof NoAvailableSlotsException) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ConcurrencyException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
```

### Validation Pipe

```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

## Testing Strategy

### Unit Testing

**Scope:** Aggregates, Value Objects, Domain Services

**Framework:** Jest (incluido con NestJS)

**Approach:**
- Test aggregate behavior in isolation
- Test value object equality and validation
- Test domain logic without infrastructure dependencies
- Mock repositories and external services

**Example:**

```typescript
// src/booking/domain/aggregates/__tests__/appointment.spec.ts
describe('Appointment Aggregate', () => {
  it('should create appointment with version 1', () => {
    const appointment = Appointment.create(
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.now()
    );
    
    expect(appointment.getVersion().getValue()).toBe(1);
  });
  
  it('should increment version when cancelled', () => {
    const appointment = Appointment.create(/* ... */);
    const initialVersion = appointment.getVersion().getValue();
    
    appointment.cancel();
    
    expect(appointment.getVersion().getValue()).toBe(initialVersion + 1);
  });
  
  it('should apply AppointmentCreated event on creation', () => {
    const appointment = Appointment.create(/* ... */);
    const events = appointment.getUncommittedEvents();
    
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AppointmentCreated);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (para TypeScript/JavaScript)

**Installation:**
```bash
npm install --save-dev fast-check
```

**Configuration:** Minimum 100 iterations per property test

**Approach:**
- Generate random valid inputs
- Verify universal properties hold across all inputs
- Test invariants and round-trip properties
- Focus on core business logic

**Tag Format:** `// Property {number}: {description} - Validates: Requirements {X.Y}`

**Example:**

```typescript
// src/booking/domain/aggregates/__tests__/appointment.pbt.spec.ts
import * as fc from 'fast-check';

describe('Appointment Aggregate - Property Tests', () => {
  // Property 1: Aggregate version increments on state changes - Validates: Requirements 2.2
  it('should always increment version on state changes', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.date(),
        (id, businessId, customerId, offeringId, date) => {
          const appointment = Appointment.create(
            UUID.fromString(id),
            UUID.fromString(businessId),
            UUID.fromString(customerId),
            UUID.fromString(offeringId),
            DateTime.fromDate(date)
          );
          
          const versionAfterCreate = appointment.getVersion().getValue();
          appointment.cancel();
          const versionAfterCancel = appointment.getVersion().getValue();
          
          return versionAfterCancel === versionAfterCreate + 1;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 4: Commands produce expected events - Validates: Requirements 3.4
  it('should always apply exactly one event per state change', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.date(),
        (id, businessId, customerId, offeringId, date) => {
          const appointment = Appointment.create(
            UUID.fromString(id),
            UUID.fromString(businessId),
            UUID.fromString(customerId),
            UUID.fromString(offeringId),
            DateTime.fromDate(date)
          );
          
          const eventsAfterCreate = appointment.getUncommittedEvents();
          
          return eventsAfterCreate.length === 1 &&
                 eventsAfterCreate[0] instanceof AppointmentCreated;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Scope:** Command/Query Handlers, Repositories, Event Handlers, Sagas

**Approach:**
- Test with real database (test container or in-memory)
- Test CommandBus/QueryBus/EventBus integration
- Test transaction behavior
- Test concurrency scenarios

**Example:**

```typescript
// src/booking/app/commands/create-appointment/__tests__/handler.integration.spec.ts
describe('CreateAppointmentHandler Integration', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let dataSource: DataSource;
  
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          database: 'test',
          synchronize: true,
          entities: [AppointmentModel, CapacityModel],
        }),
        CqrsModule,
        BookingModule,
      ],
    }).compile();
    
    commandBus = module.get(CommandBus);
    dataSource = module.get(DataSource);
  });
  
  it('should create appointment and decrement capacity', async () => {
    // Arrange
    const capacity = await createTestCapacity(dataSource, {
      availableSlots: 5
    });
    
    // Act
    const result = await commandBus.execute(
      new CreateAppointmentCommand(
        capacity.businessId,
        'customer-id',
        capacity.offeringId,
        capacity.date
      )
    );
    
    // Assert
    expect(result.appointmentId).toBeDefined();
    
    const updatedCapacity = await dataSource
      .getRepository(CapacityModel)
      .findOne({ where: { id: capacity.id } });
    
    expect(updatedCapacity.availableSlots).toBe(4);
  });
});
```

### Concurrency Testing

**Approach:**
- Simulate race conditions with Promise.all
- Test Optimistic Locking behavior
- Verify retry logic
- Test transaction isolation

**Example:**

```typescript
// src/booking/app/commands/create-appointment/__tests__/handler.concurrency.spec.ts
describe('CreateAppointmentHandler Concurrency', () => {
  it('should handle concurrent bookings with optimistic locking', async () => {
    // Arrange
    const capacity = await createTestCapacity(dataSource, {
      availableSlots: 1 // Only 1 slot available
    });
    
    // Act - Two users try to book simultaneously
    const results = await Promise.allSettled([
      commandBus.execute(new CreateAppointmentCommand(
        capacity.businessId,
        'customer-1',
        capacity.offeringId,
        capacity.date
      )),
      commandBus.execute(new CreateAppointmentCommand(
        capacity.businessId,
        'customer-2',
        capacity.offeringId,
        capacity.date
      )),
    ]);
    
    // Assert - One should succeed, one should fail
    const succeeded = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBeInstanceOf(NoAvailableSlotsException);
  });
});
```

### E2E Testing

**Scope:** Complete user flows through HTTP endpoints

**Approach:**
- Test full request/response cycle
- Test authentication flow
- Test webhook processing
- Use supertest for HTTP requests

**Example:**

```typescript
// test/booking.e2e-spec.ts
describe('Booking E2E', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    
    authToken = loginResponse.body.accessToken;
  });
  
  it('should create appointment via API', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 'customer-id',
        offeringId: 'offering-id',
        dateTime: new Date().toISOString(),
      })
      .expect(201);
    
    expect(response.body.appointmentId).toBeDefined();
  });
});
```

### Test Coverage Goals

- **Unit Tests:** > 80% coverage for domain layer
- **Integration Tests:** All command/query handlers
- **Property Tests:** All critical business logic
- **E2E Tests:** All major user flows
- **Concurrency Tests:** All operations with Optimistic Locking


## Module Configuration

### App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { BookingModule } from './booking/booking.module';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
    CqrsModule.forRoot(), // ← Registra CommandBus, QueryBus, EventBus
    SharedModule,
    BookingModule,
    MessagingModule,
    AuthModule,
  ],
})
export class AppModule {}
```

### Booking Module

```typescript
// src/booking/booking.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { AppointmentModel } from './infra/persistence/models/appointment';
import { CapacityModel } from './infra/persistence/models/capacity';

// Repositories
import { AppointmentWriteRepository } from './infra/persistence/repositories/appointment-write';
import { AppointmentReadRepository } from './infra/persistence/repositories/appointment-read';
import { CapacityWriteRepository } from './infra/persistence/repositories/capacity-write';

// Command Handlers
import { CreateAppointmentHandler } from './app/commands/create-appointment/handler';
import { CancelAppointmentHandler } from './app/commands/cancel-appointment/handler';
import { ModifyAppointmentHandler } from './app/commands/modify-appointment/handler';

// Query Handlers
import { GetCustomerAppointmentsHandler } from './app/queries/get-customer-appointments/handler';
import { GetAppointmentHandler } from './app/queries/get-appointment/handler';

// Event Handlers
import { OnAppointmentCreatedHandler } from './app/event-handlers/on-appointment-created';
import { OnAppointmentCancelledHandler } from './app/event-handlers/on-appointment-cancelled';

// Sagas
import { AppointmentNotificationSaga } from './app/sagas/appointment-notification';

// Controllers
import { AppointmentController } from './presentation/controllers/appointment.controller';

const CommandHandlers = [
  CreateAppointmentHandler,
  CancelAppointmentHandler,
  ModifyAppointmentHandler,
];

const QueryHandlers = [
  GetCustomerAppointmentsHandler,
  GetAppointmentHandler,
];

const EventHandlers = [
  OnAppointmentCreatedHandler,
  OnAppointmentCancelledHandler,
];

const Sagas = [
  AppointmentNotificationSaga,
];

const Repositories = [
  {
    provide: 'IAppointmentWriteRepository',
    useClass: AppointmentWriteRepository,
  },
  {
    provide: 'IAppointmentReadRepository',
    useClass: AppointmentReadRepository,
  },
  {
    provide: 'ICapacityWriteRepository',
    useClass: CapacityWriteRepository,
  },
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AppointmentModel, CapacityModel]),
  ],
  controllers: [AppointmentController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    ...Sagas,
    ...Repositories,
  ],
  exports: [
    'IAppointmentWriteRepository',
    'IAppointmentReadRepository',
  ],
})
export class BookingModule {}
```

### Shared Module

```typescript
// src/shared/shared.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmUnitOfWork } from './infra/uow';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './infra/filters/domain-exception.filter';

@Global()
@Module({
  providers: [
    {
      provide: 'IUnitOfWork',
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
  exports: ['IUnitOfWork'],
})
export class SharedModule {}
```

## Deployment Configuration

### Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=bookings_dev

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Logging
LOG_LEVEL=debug
```

### Database Migrations

```typescript
// src/database/migrations/1234567890-CreateAppointments.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointments1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'businessId',
            type: 'uuid',
          },
          {
            name: 'customerId',
            type: 'uuid',
          },
          {
            name: 'offeringId',
            type: 'uuid',
          },
          {
            name: 'dateTime',
            type: 'timestamp',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'cancelledAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );
    
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_BUSINESS_ID',
        columnNames: ['businessId'],
      })
    );
    
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_CUSTOMER_ID',
        columnNames: ['customerId'],
      })
    );
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('appointments');
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migration:generate": "typeorm migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/database/data-source.ts",
    "seed": "ts-node src/database/seeds/seed.ts",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  }
}
```

## Logging and Monitoring

### Winston Configuration

```typescript
// src/shared/infra/logging/winston.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});
```

### Health Check

```typescript
// src/shared/presentation/controllers/health.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}
  
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

## Security Considerations

### JWT Authentication

```typescript
// src/auth/strategies/jwt.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }
  
  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email 
    };
  }
}
```

### Rate Limiting

```typescript
// src/main.ts
import { ThrottlerModule } from '@nestjs/throttler';

// In AppModule imports:
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
}),
```

### Webhook Signature Verification

```typescript
// src/messaging/infra/guards/whatsapp-signature.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  constructor(private configService: ConfigService) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'];
    const body = JSON.stringify(request.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN'))
      .update(body)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}
```

## Performance Optimizations

### Database Indexes

```typescript
// Key indexes for performance:
// - appointments(businessId, dateTime) - For business appointment queries
// - appointments(customerId, status) - For customer active appointments
// - capacities(offeringId, date) - For availability checks (UNIQUE)
// - conversations(businessId, status) - For pending admin queries
```

### Query Optimization

```typescript
// Use QueryBuilder for complex queries with joins
const appointments = await this.repository
  .createQueryBuilder('appointment')
  .leftJoinAndSelect('appointment.customer', 'customer')
  .leftJoinAndSelect('appointment.offering', 'offering')
  .where('appointment.businessId = :businessId', { businessId })
  .andWhere('appointment.dateTime >= :startDate', { startDate })
  .orderBy('appointment.dateTime', 'ASC')
  .getMany();
```

### Caching Strategy (Future Enhancement)

```typescript
// Consider caching for:
// - Available dates/times (short TTL)
// - Business configuration (longer TTL)
// - Offering details (longer TTL)
// Use Redis with @nestjs/cache-manager
```

## Next Steps After MVP

1. **Additional Bounded Contexts:**
   - Implement `account`, `business`, `offering`, `availability`, `customer`, `notification` BCs
   - Follow the same pattern as Booking BC

2. **Advanced Features:**
   - Event Sourcing for critical aggregates
   - CQRS read model projections with separate database
   - Saga compensation for failed transactions
   - Circuit breakers for external services

3. **Scalability:**
   - Message queue for async processing (RabbitMQ/SQS)
   - Redis for caching and session management
   - Horizontal scaling with load balancer
   - Database read replicas

4. **Observability:**
   - Distributed tracing (Jaeger/OpenTelemetry)
   - Metrics collection (Prometheus)
   - APM integration (New Relic/DataDog)
   - Structured logging with correlation IDs

5. **DevOps:**
   - Docker containerization
   - CI/CD pipeline
   - Infrastructure as Code (Terraform)
   - Kubernetes deployment

