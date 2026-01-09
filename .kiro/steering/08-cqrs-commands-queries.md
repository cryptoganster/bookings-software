---
inclusion: fileMatch
fileMatchPattern: "**/app/**/*.ts,**/features/**/*.ts,**/shared/api/**/*.ts"
---

# CQRS: Commands, Queries, Events & Sagas

**Application layer patterns using NestJS CQRS**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [04-system-architecture.md](./04-system-architecture.md) - CQRS architecture
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - NestJS patterns

---

# CQRS: Commands, Queries, Events & Sagas

Este documento define los casos de uso de la capa de aplicación usando patrones CQRS con NestJS.

---

## Patrones CQRS con NestJS

### Commands (Escritura)

**Patrón:** Commands extienden `Command<TResult>` de `@nestjs/cqrs` para tipado fuerte del resultado.

**Estructura:**

- Command: Clase con datos inmutables + tipo de retorno
- Handler: `@CommandHandler(CommandClass)` + `ICommandHandler<TCommand>`
- Dispatch: `CommandBus.execute(command)` retorna resultado tipado

### Queries (Lectura)

**Patrón:** Queries extienden `Query<TResult>` de `@nestjs/cqrs` para tipado fuerte del resultado.

**Estructura:**

- Query: Clase con parámetros de búsqueda + tipo de retorno (ReadModel)
- Handler: `@QueryHandler(QueryClass)` + `IQueryHandler<TQuery>`
- Dispatch: `QueryBus.execute(query)` retorna ReadModel tipado

---

## Commands por Bounded Context

### Auth BC

```typescript
// Registrar usuario con rol inicial
RegisterUserCommand extends Command<{ userId: string }>

// Autenticar usuario
LoginCommand extends Command<{ token: string, user: UserDto }>

// Verificar email
VerifyEmailCommand extends Command<void>

// Agregar rol a usuario
AddUserRoleCommand extends Command<void>

// Remover rol de usuario
RemoveUserRoleCommand extends Command<void>

// Cambiar contraseña
ChangePasswordCommand extends Command<void>
```

### Account BC

```typescript
// Crear perfil de business owner
CreateBusinessOwnerCommand extends Command<{ businessOwnerId: string }>

// Completar onboarding
CompleteOnboardingCommand extends Command<void>

// Mejorar plan de suscripción
UpgradeSubscriptionCommand extends Command<void>

// Suspender suscripción
SuspendSubscriptionCommand extends Command<void>
```

### Business BC

```typescript
// Crear negocio (ownerId = userId)
CreateBusinessCommand extends Command<{ businessId: string }>

// Configurar WhatsApp
ConfigureWhatsAppCommand extends Command<void>

// Actualizar información
UpdateBusinessInfoCommand extends Command<void>
```

### Offering BC

```typescript
// Crear servicio
CreateOfferingCommand extends Command<{ offeringId: string }>

// Actualizar servicio
UpdateOfferingCommand extends Command<void>

// Desactivar servicio
DeactivateOfferingCommand extends Command<void>
```

### Availability BC

```typescript
// Configurar horario
ConfigureScheduleCommand extends Command<{ scheduleId: string }>

// Crear bloqueo
CreateBlockoutCommand extends Command<{ blockoutId: string }>

// Remover bloqueo
RemoveBlockoutCommand extends Command<void>

// Actualizar capacidad
UpdateCapacityCommand extends Command<void>
```

### Booking BC ⭐

```typescript
// Crear cita
CreateAppointmentCommand extends Command<{ appointmentId: string }>

// Cancelar cita
CancelAppointmentCommand extends Command<void>

// Modificar cita
ModifyAppointmentCommand extends Command<{ appointmentId: string }>

// Confirmar cita
ConfirmAppointmentCommand extends Command<void>
```

### Customer BC

```typescript
// Identificar/crear customer anónimo
IdentifyCustomerCommand extends Command<{ customerId: string }>

// Vincular customer anónimo a User
LinkCustomerToUserCommand extends Command<void>

// Desvincular customer de User
UnlinkCustomerFromUserCommand extends Command<void>

// Actualizar información
UpdateCustomerInfoCommand extends Command<void>
```

### Conversation BC ⭐

```typescript
// Enviar mensaje de WhatsApp
SendWhatsAppMessageCommand extends Command<{ messageId: string }>

// Procesar mensaje entrante
ProcessIncomingMessageCommand extends Command<void>

// Enviar respuesta de admin
SendAdminResponseCommand extends Command<void>
```

### Notification BC

```typescript
// Programar recordatorio
ScheduleReminderCommand extends Command<{ reminderId: string }>

// Enviar recordatorio
SendReminderCommand extends Command<void>

// Cancelar recordatorio
CancelReminderCommand extends Command<void>
```

---

## Queries por Bounded Context

### Auth BC

```typescript
// Obtener usuario por ID
GetUserQuery extends Query<UserReadModel>

// Buscar usuario por email
GetUserByEmailQuery extends Query<UserReadModel | null>

// Obtener roles de usuario
GetUserRolesQuery extends Query<UserRole[]>
```

### Account BC

```typescript
// Obtener business owner por ID
GetBusinessOwnerQuery extends Query<BusinessOwnerReadModel>

// Buscar por userId
GetBusinessOwnerByUserIdQuery extends Query<BusinessOwnerReadModel | null>
```

### Business BC

```typescript
// Obtener negocio por ID
GetBusinessQuery extends Query<BusinessReadModel>

// Negocios de un User
GetBusinessesByOwnerIdQuery extends Query<BusinessReadModel[]>

// Buscar por WhatsApp
GetBusinessByWhatsAppNumberQuery extends Query<BusinessReadModel | null>
```

### Offering BC

```typescript
// Obtener servicios de un negocio
GetOfferingsByBusinessQuery extends Query<OfferingReadModel[]>

// Obtener servicios activos
GetActiveOfferingsQuery extends Query<OfferingReadModel[]>
```

### Availability BC ⭐

```typescript
// Obtener fechas disponibles
GetAvailableDatesQuery extends Query<Date[]>

// Obtener horarios disponibles
GetAvailableTimeSlotsQuery extends Query<TimeSlot[]>

// Obtener horarios de un negocio
GetScheduleByBusinessQuery extends Query<ScheduleReadModel[]>

// Obtener bloqueos de un negocio
GetBlockoutsByBusinessQuery extends Query<BlockoutReadModel[]>
```

### Booking BC ⭐

```typescript
// Obtener cita por ID
GetAppointmentQuery extends Query<AppointmentReadModel>

// Obtener citas de un cliente
GetCustomerAppointmentsQuery extends Query<AppointmentReadModel[]>

// Obtener citas de un negocio
GetBusinessAppointmentsQuery extends Query<AppointmentReadModel[]>

// Obtener citas próximas
GetUpcomingAppointmentsQuery extends Query<AppointmentReadModel[]>
```

### Customer BC ⭐

```typescript
// Obtener customer por ID
GetCustomerQuery extends Query<CustomerReadModel>

// Buscar por WhatsApp
GetCustomerByPhoneQuery extends Query<CustomerReadModel | null>

// Customers de un User registrado
GetCustomersByUserIdQuery extends Query<CustomerReadModel[]>

// Customers anónimos de un business
GetAnonymousCustomersQuery extends Query<CustomerReadModel[]>
```

### Conversation BC

```typescript
// Obtener conversación
GetConversationQuery extends Query<ConversationReadModel>

// Obtener consultas pendientes de admin
GetPendingAdminQueriesQuery extends Query<ConversationReadModel[]>

// Obtener historial de conversación
GetConversationHistoryQuery extends Query<MessageReadModel[]>
```

### Notification BC

```typescript
// Obtener recordatorios pendientes
GetPendingRemindersQuery extends Query<ReminderReadModel[]>
```

---

## Event Handlers

**Propósito:** Ejecutar lógica después de un evento de dominio (asíncronamente)

**Patrón:**

- Event: POJO con datos del evento
- Handler: `@EventsHandler(EventClass)` + `IEventHandler<TEvent>`
- Ejecución: Asíncrona, no capturada por Exception Filters, ideal para side-effects

### Event Handlers Principales

#### OnAppointmentCreatedHandler

```typescript
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentCreated) {
    // Programar recordatorio
    await this.commandBus.execute(
      new ScheduleReminderCommand(event.appointmentId),
    );

    // Enviar confirmación por WhatsApp
    await this.commandBus.execute(
      new SendWhatsAppMessageCommand(
        event.customerId,
        "Tu cita ha sido confirmada...",
      ),
    );
  }
}
```

#### OnAppointmentCancelledHandler

```typescript
@EventsHandler(AppointmentCancelled)
export class OnAppointmentCancelledHandler implements IEventHandler<AppointmentCancelled> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentCancelled) {
    // Cancelar recordatorio
    await this.commandBus.execute(
      new CancelReminderCommand(event.appointmentId),
    );

    // Notificar cancelación
    await this.commandBus.execute(
      new SendWhatsAppMessageCommand(
        event.customerId,
        "Tu cita ha sido cancelada...",
      ),
    );
  }
}
```

#### OnAppointmentModifiedHandler

```typescript
@EventsHandler(AppointmentModified)
export class OnAppointmentModifiedHandler implements IEventHandler<AppointmentModified> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentModified) {
    // Cancelar recordatorio anterior
    await this.commandBus.execute(
      new CancelReminderCommand(event.oldAppointmentId),
    );

    // Programar nuevo recordatorio
    await this.commandBus.execute(
      new ScheduleReminderCommand(event.newAppointmentId),
    );

    // Notificar modificación
    await this.commandBus.execute(
      new SendWhatsAppMessageCommand(
        event.customerId,
        "Tu cita ha sido modificada...",
      ),
    );
  }
}
```

#### OnUserRegisteredHandler

```typescript
@EventsHandler(UserRegistered)
export class OnUserRegisteredHandler implements IEventHandler<UserRegistered> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: UserRegistered) {
    if (event.initialRole === UserRole.BUSINESS_OWNER) {
      // Crear BusinessOwner automáticamente
      await this.commandBus.execute(
        new CreateBusinessOwnerCommand(event.userId, SubscriptionPlan.free()),
      );
    }
  }
}
```

#### OnCustomerLinkedToUserHandler

```typescript
@EventsHandler(CustomerLinkedToUser)
export class OnCustomerLinkedToUserHandler implements IEventHandler<CustomerLinkedToUser> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: CustomerLinkedToUser) {
    // Agregar role CUSTOMER al User si no lo tiene
    await this.commandBus.execute(
      new AddUserRoleCommand(event.userId, UserRole.CUSTOMER),
    );
  }
}
```

---

## Sagas (Process Managers)

**Propósito:** Orquestar flujos complejos escuchando múltiples eventos y disparando comandos

**Patrón:**

- Método decorado con `@Saga()`
- Retorna `Observable<ICommand>` usando RxJS
- Filtra eventos con `ofType()` y mapea a comandos
- Comandos auto-despachados por CommandBus
- Siempre **singleton** (procesos de larga duración)

### AppointmentNotificationSaga

```typescript
@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      mergeMap((event: AppointmentCreated) => {
        return [
          new ScheduleReminderCommand(event.appointmentId),
          new SendWhatsAppMessageCommand(
            event.customerId,
            `Tu cita ha sido confirmada para ${event.dateTime}`,
          ),
        ];
      }),
    );
  };
}
```

### AppointmentCancellationSaga

```typescript
@Injectable()
export class AppointmentCancellationSaga {
  @Saga()
  appointmentCancelled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCancelled),
      mergeMap((event: AppointmentCancelled) => {
        return [
          new CancelReminderCommand(event.appointmentId),
          new SendWhatsAppMessageCommand(
            event.customerId,
            "Tu cita ha sido cancelada",
          ),
        ];
      }),
    );
  };
}
```

### ConversationFlowSaga

```typescript
@Injectable()
export class ConversationFlowSaga {
  @Saga()
  conversationFlow = (events$: Observable<any>): Observable<ICommand> => {
    return merge(
      // Cuando se recibe un mensaje
      events$.pipe(
        ofType(MessageReceived),
        map(
          (event: MessageReceived) =>
            new ProcessIncomingMessageCommand(event.messageId),
        ),
      ),

      // Cuando admin responde
      events$.pipe(
        ofType(AdminResponseSent),
        map(
          (event: AdminResponseSent) =>
            new SendWhatsAppMessageCommand(
              event.customerId,
              event.responseText,
            ),
        ),
      ),
    );
  };
}
```

### BusinessOwnerOnboardingSaga

```typescript
@Injectable()
export class BusinessOwnerOnboardingSaga {
  @Saga()
  onboardingFlow = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(UserRegistered),
      filter(
        (event: UserRegistered) =>
          event.initialRole === UserRole.BUSINESS_OWNER,
      ),
      map(
        (event: UserRegistered) =>
          new CreateBusinessOwnerCommand(event.userId, SubscriptionPlan.free()),
      ),
    );
  };
}
```

---

## Ejemplo Completo: CreateAppointmentCommand

### Command Definition

```typescript
// src/booking/app/commands/create-appointment/command.ts
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

### Command Handler

```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from "@nestjs/cqrs";
import { CreateAppointmentCommand } from "./command";
import { IAppointmentWriteRepository } from "@booking/domain/interfaces/repositories/appointment-write";
import { ICapacityWriteRepository } from "@availability/domain/interfaces/repositories/capacity-write";
import { IUnitOfWork } from "@shared/kernel/uow";

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<
  CreateAppointmentCommand,
  { appointmentId: string }
> {
  constructor(
    private readonly appointmentRepo: IAppointmentWriteRepository,
    private readonly capacityRepo: ICapacityWriteRepository,
    private readonly uow: IUnitOfWork,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(
    command: CreateAppointmentCommand,
  ): Promise<{ appointmentId: string }> {
    return this.uow.transaction(async () => {
      // 1. Validar disponibilidad
      const capacity = await this.capacityRepo.findByOfferingAndDate(
        command.offeringId,
        command.dateTime,
      );

      if (!capacity || capacity.availableSlots <= 0) {
        throw new NoAvailableCapacityException();
      }

      // 2. Crear cita
      const appointment = Appointment.create(
        command.businessId,
        command.customerId,
        command.offeringId,
        command.dateTime,
      );

      // 3. Decrementar capacidad
      capacity.decrementSlot();

      // 4. Guardar con eventos
      const appointmentWithContext =
        this.publisher.mergeObjectContext(appointment);
      await this.appointmentRepo.save(appointmentWithContext);
      await this.capacityRepo.save(capacity);

      // 5. Eventos se publican automáticamente (autoCommit=true)
      return { appointmentId: appointment.getId() };
    });
  }
}
```

---

## Registro de Handlers en Módulos

```typescript
// src/booking/booking.module.ts
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

// Commands
import { CreateAppointmentHandler } from "./app/commands/create-appointment/handler";
import { CancelAppointmentHandler } from "./app/commands/cancel-appointment/handler";

// Queries
import { GetAppointmentHandler } from "./app/queries/get-appointment/handler";
import { GetCustomerAppointmentsHandler } from "./app/queries/get-customer-appointments/handler";

// Event Handlers
import { OnAppointmentCreatedHandler } from "./app/event-handlers/on-appointment-created";
import { OnAppointmentCancelledHandler } from "./app/event-handlers/on-appointment-cancelled";

// Sagas
import { AppointmentNotificationSaga } from "./app/sagas/appointment-notification.saga";

const CommandHandlers = [CreateAppointmentHandler, CancelAppointmentHandler];

const QueryHandlers = [GetAppointmentHandler, GetCustomerAppointmentsHandler];

const EventHandlers = [
  OnAppointmentCreatedHandler,
  OnAppointmentCancelledHandler,
];

const Sagas = [AppointmentNotificationSaga];

@Module({
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, ...Sagas],
})
export class BookingModule {}
```

---

## Beneficios de CQRS con NestJS

1. ✅ **Tipado fuerte:** Commands y Queries tipados con resultados
2. ✅ **Separación clara:** Escritura vs Lectura
3. ✅ **Testeable:** Handlers fáciles de testear
4. ✅ **Escalable:** Sagas para flujos complejos
5. ✅ **DI nativo:** Inyección de dependencias de NestJS
6. ✅ **RxJS:** Streams reactivos para eventos
7. ✅ **Menos boilerplate:** Infraestructura provista por framework

> **📖 Detalles de Implementación:** Ver [20-nestjs-implementation.md](./20-nestjs-implementation.md) para patrones de NestJS
