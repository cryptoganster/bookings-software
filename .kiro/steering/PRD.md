---
inclusion: always
---

# Product Requirements Document (PRD)

## Sistema de Reservas Multi-Tenant vía WhatsApp

**Versión:** 1.0 | **Fecha:** Diciembre 2024 | **Tipo:** MVP

## 1. Visión General

**Propósito:** Plataforma SaaS multi-tenant para gestión automatizada de citas vía WhatsApp Business API.

**Objetivos MVP:**

- Registro y configuración de negocios
- Reservación automatizada vía WhatsApp
- Gestión de servicios con límites configurables
- Panel web de administración
- Notificaciones automáticas

**Stack:** NestJS + TypeScript + PostgreSQL + WhatsApp Business API  
**Arquitectura:** Clean Architecture + DDD + CQRS + Event-Driven

## 2. Arquitectura

**Principios:**

- Clean Architecture (Domain → Application → Infrastructure → Presentation)
- DDD con Bounded Contexts
- CQRS estricto (separación lectura/escritura)
- Event-Driven con Domain Events
- Process Managers (Sagas) para orquestación

> **📖 Arquitectura de Identidades:** `.kiro/steering/user-customer-businessowner-architecture.md`

### 2.1 Bounded Contexts

| BC               | Responsabilidad             | Aggregates Principales                                        |
| ---------------- | --------------------------- | ------------------------------------------------------------- |
| **auth**         | Autenticación e identidades | `User` (roles múltiples: BUSINESS_OWNER, CUSTOMER, ADMIN)     |
| **account**      | Perfiles y suscripciones    | `BusinessOwner` (vinculado a User, subscription plan)         |
| **business**     | Configuración de negocios   | `Business` (ownerId → User.id, WhatsApp, timezone)            |
| **offering**     | Servicios ofrecidos         | `Offering` (nombre, duración, capacidad)                      |
| **availability** | Horarios y límites          | `Schedule`, `Blockout`, `Capacity` (versioned)                |
| **booking**      | Reservaciones               | `Appointment` (versioned, customerId, businessId)             |
| **customer**     | Perfiles de clientes        | `Customer` (anónimo: userId=null, registrado: userId→User.id) |
| **conversation** | WhatsApp integration        | `Conversation`, `Message` (versioned)                         |
| **notification** | Recordatorios               | `Reminder` (scheduled, sent, cancelled)                       |

**Arquitectura de Identidades:**

- **User (Auth):** Identidad universal con autenticación JWT
- **BusinessOwner (Account):** Perfil de cuenta (siempre vinculado a User)
- **Business (Business):** Negocio específico (ownerId → User.id)
- **Customer (Customer):** Perfil de cliente (opcional vinculado a User)
  - Anónimo: Solo WhatsApp, sin panel web
  - Registrado: Acceso a panel web, historial completo

### 2.2 Separación de Concerns: User vs BusinessOwner vs Business

| Aspecto             | User                  | BusinessOwner      | Business             |
| ------------------- | --------------------- | ------------------ | -------------------- |
| **Responsabilidad** | ¿Quién eres?          | ¿Qué plan tienes?  | ¿Cuál es tu negocio? |
| **BC**              | Auth                  | Account            | Business             |
| **Autenticación**   | ✅ Email/password     | ❌ Usa User        | ❌ Usa User          |
| **Vinculación**     | Independiente         | Obligatoria a User | Obligatoria a User   |
| **Cardinalidad**    | 1:1 con BusinessOwner | 1:N con Business   | N:1 con User         |

**Ejemplo:** Juan (abogado) con plan PRO y 3 negocios

- 1 User (autenticación)
- 1 BusinessOwner (plan PRO: max 3 businesses)
- 3 Business (Bufete Centro, Bufete Norte, Consultoría)

**Flujo de Registro:**

```
RegisterUser → UserRegistered → CreateBusinessOwner → CompleteOnboarding → CreateBusiness
```

### 2.3 Shared Kernel

**Contenido:** `src/shared/`

- `kernel/` - VersionedAggregateRoot (extiende @nestjs/cqrs), ValueObject, IUnitOfWork, excepciones
- `infra/` - TypeOrmUnitOfWork, base repositories
- `vo/` - AggregateVersion, UUID

**Integración @nestjs/cqrs:**

```typescript
@Module({
  imports: [CqrsModule.forRoot()], // CommandBus, QueryBus, EventBus
})
export class AppModule {}
```

### 2.4 Estructura por BC

```
src/{bc}/
├── domain/          # Aggregates, Events, VOs, Interfaces, Exceptions
├── app/             # Commands, Queries, Event Handlers, Sagas
├── infra/           # Repositories, Models, Mappers, External clients
└── presentation/    # Controllers, DTOs
```

## 3. Gestión de Concurrencia

**Estrategia:** Unit of Work + Optimistic Locking + Versioning

### 3.1 Unit of Work (UoW)

**Propósito:** Transacciones atómicas en BD

```typescript
interface IUnitOfWork {
  transaction<T>(
    work: () => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
}

// Uso
await uow.transaction(async () => {
  await repo1.save(entity1);
  await repo2.save(entity2);
  // Commit automático o rollback en error
});
```

### 3.2 Optimistic Locking

**VersionedAggregateRoot:** Extiende `AggregateRoot` de @nestjs/cqrs con campo `version`

```typescript
export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;

  constructor() {
    super();
    this.version = new AggregateVersion(0);
    this.autoCommit = true; // Auto-publica eventos
  }

  protected incrementVersion(): void {
    this.version = this.version.increment();
  }
}

// Aggregate ejemplo
export class Appointment extends VersionedAggregateRoot {
  static create(...): Appointment {
    const appointment = new Appointment();
    // ... inicializar campos
    appointment.apply(new AppointmentCreated(...));
    appointment.incrementVersion(); // ← Versión 1
    return appointment;
  }

  cancel(): void {
    // ... validaciones
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion(); // ← Versión N+1
    this.apply(new AppointmentCancelled(this.id));
  }
}
```

### 3.3 Repository con Optimistic Locking

```typescript
async save(appointment: Appointment): Promise<void> {
  await this.uow.transaction(async () => {
    const result = await this.repository
      .update(AppointmentModel)
      .set({ ...model, version: version + 1 })
      .where('id = :id AND version = :version', { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConcurrencyException('Modified by another transaction');
    }
  });
}
```

#### Manejo en Application Layer

**Command Definition:** `src/booking/app/commands/cancel-appointment.command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

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
import { CommandHandler, ICommandHandler, EventPublisher } from "@nestjs/cqrs";
import { CancelAppointmentCommand } from "./cancel-appointment.command";
import { IAppointmentWriteRepository } from "@booking/domain/interfaces/repositories/appointment-write.repository.interface";
import { ConcurrencyException } from "@shared/kernel/exceptions/concurrency.exception";
import { AppointmentNotFoundException } from "@booking/domain/exceptions/appointment-not-found.exception";

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
        const appointment = await this.appointmentRepository.findById(
          command.appointmentId,
        );

        if (!appointment) {
          throw new AppointmentNotFoundException(command.appointmentId);
        }

        // mergeObjectContext fusiona el EventPublisher en el aggregate
        // Esto permite que apply() publique eventos al EventBus
        const appointmentWithContext =
          this.publisher.mergeObjectContext(appointment);

        appointmentWithContext.cancel(); // ← Incrementa version + apply(event)

        // Si autoCommit=true, los eventos ya fueron publicados
        // Si autoCommit=false, llamar: appointmentWithContext.commit()

        await this.appointmentRepository.save(appointmentWithContext);

        return; // Éxito
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(
              "Unable to cancel appointment after multiple attempts. Please try again.",
            );
          }
          // Espera breve antes de reintentar (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt)),
          );
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

    const appointment = await this.appointmentRepository.findById(
      command.appointmentId,
    );

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

## 4. Arquitectura de Identidades: User, Customer y BusinessOwner

> **📖 Documento Completo:** `.kiro/steering/user-customer-businessowner-architecture.md`

### 4.1 Visión General

El sistema maneja tres conceptos de identidad relacionados pero distintos:

1. **User (Auth BC)** - Identidad universal con autenticación
2. **Customer (Customer BC)** - Perfil de cliente (anónimo o vinculado a User)
3. **BusinessOwner (Account BC)** - Perfil de dueño de negocio (siempre vinculado a User)

### 4.2 Arquitectura Conceptual

```
┌─────────────────────────────────────────────────────────┐
│                    User (Auth BC)                       │
│  - Identidad universal del sistema                      │
│  - Autenticación (email/password)                       │
│  - Roles: ['BUSINESS_OWNER', 'CUSTOMER', 'ADMIN']      │
│  - Un User puede tener múltiples roles simultáneamente  │
└─────────────────────────────────────────────────────────┘
                    ↓                           ↓
        ┌───────────────────────┐    ┌──────────────────────┐
        │  BusinessOwner (BC)   │    │  Customer (BC)       │
        │  - userId (required)  │    │  - userId (optional) │
        │  - businessProfile    │    │  - whatsappPhone     │
        │  - subscriptionPlan   │    │  - businessId        │
        └───────────────────────┘    └──────────────────────┘
                    ↓                           ↓
        ┌───────────────────────┐    ┌──────────────────────┐
        │  Business (BC)        │    │  Appointment (BC)    │
        │  - ownerId (userId)   │    │  - customerId        │
        │  - businessInfo       │    │  - businessId        │
        │  - whatsappNumber     │    │  - offeringId        │
        └───────────────────────┘    └──────────────────────┘
```

### 4.3 Tipos de Customer

#### Customer Anónimo (userId = null)

- ✅ Puede agendar citas vía WhatsApp
- ✅ Recibe notificaciones por WhatsApp
- ❌ NO puede acceder al panel web
- ❌ NO tiene email ni password

#### Customer Registrado (userId != null)

- ✅ Puede agendar citas vía WhatsApp
- ✅ Recibe notificaciones por WhatsApp
- ✅ Puede acceder al panel web (autenticado como User)
- ✅ Puede ver historial de citas
- ✅ Recibe notificaciones por email

### 4.4 Separación de Concerns: User vs BusinessOwner vs Business

| Aspecto             | User                  | BusinessOwner      | Business                |
| ------------------- | --------------------- | ------------------ | ----------------------- |
| **BC**              | Auth                  | Account            | Business                |
| **Propósito**       | Identidad universal   | Perfil de cuenta   | Información del negocio |
| **Responsabilidad** | ¿Quién eres?          | ¿Qué plan tienes?  | ¿Cuál es tu negocio?    |
| **Autenticación**   | ✅ Email/password     | ❌ No (usa User)   | ❌ No (usa User)        |
| **Roles**           | Múltiples             | N/A                | N/A                     |
| **Vinculación**     | Independiente         | Obligatoria a User | Obligatoria a User      |
| **Alcance**         | Global                | Global             | Por negocio             |
| **Tabla**           | `users`               | `business_owners`  | `businesses`            |
| **Relación**        | 1:1 con BusinessOwner | 1:N con Business   | N:1 con User            |

### 4.5 Escenarios de Usuario

#### Escenario 1: Solo Business Owner

Juan se registra como Business Owner:

- User creado con role=['BUSINESS_OWNER']
- BusinessOwner creado vinculado a User
- Business creado (su peluquería)

Juan puede:

- ✅ Administrar su negocio
- ✅ Ver citas de su negocio
- ✅ Configurar offerings, horarios
- ❌ No tiene perfil de Customer (no ha agendado citas como cliente)

#### Escenario 2: Solo Customer Anónimo

María envía mensaje a WhatsApp de peluquería:

- Customer creado con userId=null (anónimo)
- Appointment creado

María puede:

- ✅ Agendar citas vía WhatsApp
- ✅ Recibir notificaciones por WhatsApp
- ❌ No puede acceder al panel web
- ❌ No tiene User (no está registrada)

#### Escenario 3: Customer Registrado (Futuro)

María decide registrarse en plataforma:

- User creado con role=['CUSTOMER']
- Customer existente vinculado a User (userId actualizado)

María ahora puede:

- ✅ Agendar citas vía WhatsApp
- ✅ Recibir notificaciones por WhatsApp
- ✅ Acceder al panel web
- ✅ Ver historial de citas
- ✅ Gestionar perfil

#### Escenario 4: User con Ambos Roles (Futuro - Marketplace)

Juan (Business Owner de peluquería) agenda cita con dentista:

- Customer creado con userId=Juan.id
- User.roles actualizado a ['BUSINESS_OWNER', 'CUSTOMER']
- Appointment creado

Juan ahora puede:

- ✅ Administrar su peluquería (como BUSINESS_OWNER)
- ✅ Ver citas de su peluquería
- ✅ Ver sus citas como cliente del dentista (como CUSTOMER)
- ✅ Panel web con switch de contexto:
  - Vista "Mi Negocio" (BUSINESS_OWNER)
  - Vista "Mis Citas" (CUSTOMER)

### 4.6 Visión Marketplace (Futuro)

**Escenario Objetivo:**

```
Juan (Abogado) se registra:
1. RegisterUserCommand(email, password, name, role=BUSINESS_OWNER)
   → User creado con role=['BUSINESS_OWNER']
   → BusinessOwner creado automáticamente
   → Business creado (su bufete de abogados)

2. Juan publica sus servicios:
   → CreateOfferingCommand("Consulta Legal", 60min, ...)
   → Offering creado en su Business

3. Juan necesita ir al dentista:
   → Busca "Dentista" en marketplace
   → Selecciona servicio del Dr. López
   → Sistema ejecuta IdentifyCustomerCommand(businessId=Dr.López, userId=Juan.id)
   → Customer creado con userId=Juan.id (vinculado)
   → User.roles actualizado a ['BUSINESS_OWNER', 'CUSTOMER']
   → CreateAppointmentCommand(customerId=Juan.customer.id, ...)
   → Appointment creado

4. Juan ahora tiene:
   ✅ Vista "Mi Negocio" (BUSINESS_OWNER): Administra su bufete
   ✅ Vista "Mis Citas" (CUSTOMER): Ve cita con dentista
   ✅ Switch de contexto en panel web
```

**Beneficios de esta arquitectura:**

1. ✅ **Escalabilidad:** Preparado para marketplace desde el diseño
2. ✅ **Flexibilidad:** Un User puede ser proveedor Y consumidor
3. ✅ **Simplicidad:** Una sola autenticación (User), múltiples perfiles
4. ✅ **Experiencia:** Customer anónimo (WhatsApp) → Customer registrado (panel web) es fluido
5. ✅ **Futuro:** Valoraciones, búsqueda, categorías, todo basado en User universal

### 4.7 Comunicación entre BCs

#### UserRegistered → Account BC

```typescript
@EventsHandler(UserRegistered)
export class OnUserRegisteredHandler {
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

#### CustomerLinkedToUser → Auth BC

```typescript
@EventsHandler(CustomerLinkedToUser)
export class OnCustomerLinkedToUserHandler {
  async handle(event: CustomerLinkedToUser) {
    // Agregar role CUSTOMER al User si no lo tiene
    await this.commandBus.execute(
      new AddUserRoleCommand(event.userId, UserRole.CUSTOMER),
    );
  }
}
```

---

## 5. Flujos de Usuario

### 5.1 Flujo: Dueño de Negocio - Registro e Configuración

**Actor:** Dueño de Negocio  
**Canal:** Panel Web

> **📖 Referencia:** Ver `.kiro/steering/user-customer-businessowner-architecture.md` sección "Flujo: Registro de Business Owner"

1. Dueño accede al panel web
2. Se registra (email, password, nombre)
   - `RegisterUserCommand(email, password, name, role=BUSINESS_OWNER)`
   - User creado con role=['BUSINESS_OWNER']
3. Event Handler escucha `UserRegistered` con role=BUSINESS_OWNER
   - `CreateBusinessOwnerCommand(userId, subscriptionPlan=FREE)`
   - BusinessOwner creado automáticamente
4. Dueño completa onboarding
   - `CompleteOnboardingCommand(businessOwnerId)`
5. Dueño crea su primer negocio
   - `CreateBusinessCommand(ownerId=userId, businessName, whatsapp, ...)`
   - Business creado vinculado a User
6. Configura información del negocio:
   - Nombre comercial, dirección, zona horaria
   - Número de WhatsApp Business
7. Define horarios de atención (días y horas)
8. Crea offerings (servicios):
   - Nombre del servicio, duración, capacidad
9. Configura bloqueos de fechas (vacaciones, días festivos)
10. Sistema genera webhook URL para WhatsApp Business API

**Eventos de Dominio:**

- `UserRegistered` (Auth BC)
- `BusinessOwnerCreated` (Account BC)
- `BusinessOwnerOnboardingCompleted` (Account BC)
- `BusinessCreated` (Business BC)
- `BusinessWhatsAppConfigured` (Business BC)
- `OfferingCreated` (Offering BC)
- `ScheduleConfigured` (Availability BC)
- `BlockoutCreated` (Availability BC)

### 5.2 Flujo: Cliente Final - Reservación de Cita vía WhatsApp

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

- `CustomerIdentified` (Customer BC - customer anónimo creado/identificado)
- `ConversationStarted` (Conversation BC)
- `MessageReceived` (Conversation BC)
- `AppointmentCreated` (Booking BC)
- `ReminderScheduled` (Notification BC)
- `MessageSent` (Conversation BC)

**Nota:** El Customer creado es anónimo (userId = null). No tiene acceso al panel web.

### 5.3 Flujo: Cliente Final - Modificar/Cancelar Cita

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

### 5.4 Flujo: Cliente Final - Consulta al Administrador

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

### 5.5 Flujo: Sistema - Envío de Recordatorios

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

## 6. Integraciones Externas

### 6.1 WhatsApp Business API

**Tipo:** API REST + Webhooks  
**Propósito:** Envío y recepción de mensajes

**Funcionalidades Requeridas:**

- Envío de mensajes de texto
- Envío de botones interactivos
- Envío de mensajes con ubicación
- Recepción de mensajes vía webhook (tiempo real)
- Gestión de estado de conversaciones

**Implementación:**

- Interfaz: `src/conversation/domain/interfaces/external/whatsapp-client.interface.ts`
- Implementación: `src/conversation/infra/external/whatsapp-business-api.client.ts`

**Webhook Endpoint:**

```
POST /api/webhooks/whatsapp
```

**Estrategia de Recepción:**

- Webhooks en tiempo real (streaming)
- Evita polling para reducir latencia y recursos
- Validación de firma de webhook para seguridad

---

## 7. Modelo de Datos (High-Level)

### 7.1 Entidades Principales

> **📖 Referencia:** Ver `.kiro/steering/user-customer-businessowner-architecture.md` para detalles completos.

#### User (auth) - Identidad Universal

```typescript
- id: UUID
- email: Email (VO)
- password: Password (VO, hasheado)
- name: string
- roles: UserRole[] // ['BUSINESS_OWNER', 'CUSTOMER', 'ADMIN']
- isActive: boolean
- emailVerified: boolean
- createdAt: Date
```

**Nota:** User es la única entidad con autenticación. BusinessOwner y Customer son perfiles vinculados.

#### BusinessOwner (account) - Perfil de Dueño

```typescript
- id: UUID
- userId: UUID // ← Siempre vinculado a User
- subscriptionPlan: SubscriptionPlan (VO) // FREE, BASIC, PRO, ENTERPRISE
- subscriptionStatus: SubscriptionStatus (VO) // ACTIVE, SUSPENDED, CANCELLED
- onboardingCompleted: boolean
- createdAt: Date
- version: number // Optimistic Locking
```

#### Business (business) - Información del Negocio

```typescript
- id: UUID
- ownerId: UUID // ← Referencia a User.id
- name: string
- whatsappNumber: WhatsAppNumber (VO)
- address: BusinessAddress (VO)
- timezone: Timezone (VO)
- isActive: boolean
- createdAt: Date
- version: number // Optimistic Locking
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

#### Customer (customer) - Perfil de Cliente

```typescript
- id: UUID
- userId: UUID | null // ← Opcional: null = anónimo, UUID = registrado
- businessId: UUID
- whatsappPhone: WhatsAppPhone (VO)
- name: string | null // Obtenido de WhatsApp o conversación
- createdAt: Date
```

**Tipos de Customer:**

- **Anónimo (userId = null):** Solo WhatsApp, no acceso a panel web
- **Registrado (userId != null):** Vinculado a User, acceso a panel web

#### Conversation (conversation)

```typescript
- id: UUID
- businessId: UUID
- customerId: UUID
- status: ConversationStatus // ACTIVE, AWAITING_ADMIN, RESOLVED
- lastMessageAt: Date
```

#### Message (conversation)

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

## 8. Reglas de Negocio

### 8.1 Reservaciones

1. No se pueden crear citas en fechas/horarios bloqueados
2. No se pueden crear citas fuera del horario de atención
3. No se pueden exceder los límites de capacidad por offering
4. No se pueden crear citas en el pasado
5. Cada cliente puede tener máximo 3 citas activas simultáneamente
6. Las citas deben respetar la duración mínima del offering
7. Debe haber al menos 15 minutos entre el momento actual y la hora de la cita

### 8.2 Cancelaciones

1. Las citas solo pueden cancelarse hasta 2 horas antes
2. Al cancelar, se libera la capacidad del slot
3. Se debe notificar al cliente de la cancelación exitosa

### 8.3 Modificaciones

1. Solo se pueden modificar citas futuras
2. Modificar = Cancelar anterior + Crear nueva
3. Debe validarse disponibilidad en nuevo slot

### 8.4 Multi-tenancy

1. Cada negocio se identifica por su número de WhatsApp único
2. Los datos de un negocio no son visibles para otros
3. Cada webhook debe validar el origen del mensaje

### 8.5 Zona Horaria

1. Todas las citas se almacenan en UTC
2. Se muestran al cliente en la zona horaria del negocio
3. Los recordatorios respetan la zona horaria del negocio

---

## 9. Casos de Uso (Application Layer)

### 9.1 Commands (Escritura)

**Patrón:** Commands extienden `Command<TResult>` de `@nestjs/cqrs` para tipado fuerte del resultado.

**Estructura:**

- Command: Clase con datos inmutables + tipo de retorno
- Handler: `@CommandHandler(CommandClass)` + `ICommandHandler<TCommand>`
- Dispatch: `CommandBus.execute(command)` retorna resultado tipado

**Lista de Commands por BC:**

#### Auth

- `RegisterUserCommand extends Command<{ userId: string }>` - Registrar usuario con rol inicial
- `LoginCommand extends Command<{ token: string, user: UserDto }>` - Autenticar usuario
- `VerifyEmailCommand extends Command<void>` - Verificar email
- `AddUserRoleCommand extends Command<void>` - Agregar rol a usuario
- `RemoveUserRoleCommand extends Command<void>` - Remover rol de usuario
- `ChangePasswordCommand extends Command<void>` - Cambiar contraseña

#### Account

- `CreateBusinessOwnerCommand extends Command<{ businessOwnerId: string }>` - Crear perfil de business owner
- `CompleteOnboardingCommand extends Command<void>` - Completar onboarding
- `UpgradeSubscriptionCommand extends Command<void>` - Mejorar plan de suscripción
- `SuspendSubscriptionCommand extends Command<void>` - Suspender suscripción

#### Business

- `CreateBusinessCommand extends Command<{ businessId: string }>` - Crear negocio (ownerId = userId)
- `ConfigureWhatsAppCommand extends Command<void>` - Configurar WhatsApp
- `UpdateBusinessInfoCommand extends Command<void>` - Actualizar información

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

- `IdentifyCustomerCommand extends Command<{ customerId: string }>` - Identificar/crear customer anónimo
- `LinkCustomerToUserCommand extends Command<void>` - Vincular customer anónimo a User
- `UnlinkCustomerFromUserCommand extends Command<void>` - Desvincular customer de User
- `UpdateCustomerInfoCommand extends Command<void>` - Actualizar información

#### Conversation

- `SendWhatsAppMessageCommand extends Command<{ messageId: string }>` ⭐
- `ProcessIncomingMessageCommand extends Command<void>` ⭐
- `SendAdminResponseCommand extends Command<void>`

#### Notification

- `ScheduleReminderCommand extends Command<{ reminderId: string }>`
- `SendReminderCommand extends Command<void>`
- `CancelReminderCommand extends Command<void>`

### 9.2 Queries (Lectura)

**Patrón:** Queries extienden `Query<TResult>` de `@nestjs/cqrs` para tipado fuerte del resultado.

**Estructura:**

- Query: Clase con parámetros de búsqueda + tipo de retorno (ReadModel)
- Handler: `@QueryHandler(QueryClass)` + `IQueryHandler<TQuery>`
- Dispatch: `QueryBus.execute(query)` retorna ReadModel tipado

**Lista de Queries por BC:**

#### Auth

- `GetUserQuery extends Query<UserReadModel>` - Obtener usuario por ID
- `GetUserByEmailQuery extends Query<UserReadModel | null>` - Buscar usuario por email
- `GetUserRolesQuery extends Query<UserRole[]>` - Obtener roles de usuario

#### Account

- `GetBusinessOwnerQuery extends Query<BusinessOwnerReadModel>` - Obtener business owner por ID
- `GetBusinessOwnerByUserIdQuery extends Query<BusinessOwnerReadModel | null>` - Buscar por userId

#### Business

- `GetBusinessQuery extends Query<BusinessReadModel>` - Obtener negocio por ID
- `GetBusinessesByOwnerIdQuery extends Query<BusinessReadModel[]>` - Negocios de un User
- `GetBusinessByWhatsAppNumberQuery extends Query<BusinessReadModel | null>` - Buscar por WhatsApp

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

- `GetCustomerQuery extends Query<CustomerReadModel>` - Obtener customer por ID
- `GetCustomerByPhoneQuery extends Query<CustomerReadModel | null>` ⭐ - Buscar por WhatsApp
- `GetCustomersByUserIdQuery extends Query<CustomerReadModel[]>` - Customers de un User registrado
- `GetAnonymousCustomersQuery extends Query<CustomerReadModel[]>` - Customers anónimos de un business

#### Conversation

- `GetConversationQuery extends Query<ConversationReadModel>`
- `GetPendingAdminQueriesQuery extends Query<ConversationReadModel[]>`
- `GetConversationHistoryQuery extends Query<MessageReadModel[]>`

#### Notification

- `GetPendingRemindersQuery extends Query<ReminderReadModel[]>`

---

## 10. Event Handlers y Process Managers

### 10.1 Event Handlers

**Propósito:** Ejecutar lógica después de un evento de dominio (asíncronamente)

**Patrón:**

- Event: POJO con datos del evento
- Handler: `@EventsHandler(EventClass)` + `IEventHandler<TEvent>`
- Ejecución: Asíncrona, no capturada por Exception Filters, ideal para side-effects

**Event Handlers Principales:**

- `OnAppointmentCreatedHandler` → `ScheduleReminderCommand` + `SendWhatsAppMessageCommand`
- `OnAppointmentCancelledHandler` → `CancelReminderCommand` + `SendWhatsAppMessageCommand`
- `OnAppointmentModifiedHandler` → `CancelReminderCommand` + `ScheduleReminderCommand`

**Nota:** Para procesar todos los eventos (event store), subscribirse al `EventBus` con RxJS.

### 10.2 Sagas (Process Managers)

**Propósito:** Orquestar flujos complejos escuchando múltiples eventos y disparando comandos

**Patrón:**

- Método decorado con `@Saga()`
- Retorna `Observable<ICommand>` usando RxJS
- Filtra eventos con `ofType()` y mapea a comandos
- Comandos auto-despachados por CommandBus
- Siempre **singleton** (procesos de larga duración)

**Sagas Principales:**

- `AppointmentNotificationSaga` → Escucha `AppointmentCreated` → Emite `ScheduleReminderCommand`, `SendWhatsAppMessageCommand`
- `AppointmentCancellationSaga` → Escucha `AppointmentCancelled` → Emite `CancelReminderCommand`, `SendWhatsAppMessageCommand`
- `ConversationFlowSaga` → Escucha múltiples eventos → Emite comandos de conversación

**Nota:** Usar `merge()` de RxJS para combinar múltiples streams de eventos.

---

## 11. API Endpoints (Presentation Layer)

### 11.1 Panel Web - Business Owner

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

### 11.2 Webhooks

```
POST   /api/webhooks/whatsapp
```

---

## 12. Componentes del Panel Web

### 12.1 Páginas Principales

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

## 13. Requisitos No Funcionales

| Categoría          | Requisitos                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| **Performance**    | Webhook WhatsApp < 1s, Panel < 2s, Queries optimizadas con índices        |
| **Escalabilidad**  | 100 negocios MVP, 500 citas/mes por negocio, Mensajes asíncronos          |
| **Seguridad**      | JWT, bcrypt, Validación webhooks, Aislamiento multi-tenant, Rate limiting |
| **Disponibilidad** | 99% uptime, Circuit breakers, Reintentos automáticos                      |
| **Observabilidad** | Logging estructurado (Winston/Pino), Event tracking, Health checks        |

---

## 14. Dependencias y Librerías

| Categoría         | Librerías                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **Core**          | @nestjs/core, @nestjs/common, @nestjs/cqrs (^10.x), typeorm (^0.3.x), pg (^8.x), typescript (^5.x), rxjs (^7.x) |
| **Autenticación** | @nestjs/jwt, @nestjs/passport (^10.x), passport-jwt (^4.x), bcrypt (^5.x)                                       |
| **Validación**    | class-validator (^0.14.x), class-transformer (^0.5.x)                                                           |
| **WhatsApp**      | axios (^1.x)                                                                                                    |
| **Utilidades**    | date-fns, date-fns-tz (^2.x), uuid (^9.x)                                                                       |
| **Logging**       | winston (^3.x)                                                                                                  |

---

## 15. Fases de Implementación del MVP

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

## 16. Métricas de Éxito del MVP

| Categoría    | Métricas                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **Técnicas** | Tests > 70%, API < 200ms (p95), Webhook < 1s, Zero downtime                                      |
| **Producto** | 10 negocios, 100+ citas, Cancelación < 10%, Errores conversación < 5%, Zero errores concurrencia |
| **UX**       | Reservación < 2min, NPS > 8, < 3 clics para agendar                                              |

---

## 17. Riesgos y Mitigaciones

| Riesgo                         | Mitigación                                                  |
| ------------------------------ | ----------------------------------------------------------- |
| **Límites WhatsApp API**       | Rate limiting + queue system                                |
| **Zonas horarias**             | date-fns-tz, almacenar UTC, convertir en presentación       |
| **Race conditions** ✅         | UoW + Optimistic Locking + Retry logic + Tests concurrencia |
| **Escalabilidad multi-tenant** | Particionar BD por tenant, índices compuestos               |
| **Conversaciones ambiguas**    | Flujo estructurado con botones, minimizar texto libre       |

---

## 18. Próximos Pasos Post-MVP

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

## 19. Notas Adicionales

### 19.1 CQRS Estricto con NestJS

- **Escritura:** Aggregates + Commands (`Command<TResult>`)
- **Lectura:** Read Models + Queries (`Query<TResult>`)
- **Sincronización:** Domain Events + Event Handlers + Sagas
- **Infraestructura:** `@nestjs/cqrs` provee CommandBus, QueryBus, EventBus
- **Eventos:** Auto-publicados con `autoCommit=true`

### 19.2 Testing Strategy

- **Unit:** Aggregates, Value Objects, Domain Services
- **Integration:** Command/Query Handlers, Repositories, Sagas (RxJS streams)
- **Concurrency:** Race conditions con múltiples threads
- **E2E:** Flujos completos con CommandBus/QueryBus/EventBus
- **Contract:** Integración WhatsApp API
- **Saga:** Marble testing de RxJS

### 19.3 Optimistic Locking Best Practices

- **Versionar:** Appointment, Capacity, Conversation
- **Sin versionar:** BusinessOwner, Customer, Offering (baja concurrencia)
- **Retry:** Máximo 3 intentos con exponential backoff
- **Feedback:** Mensajes claros al usuario en conflictos
- **Monitoring:** Trackear ConcurrencyExceptions

### 19.4 Integración NestJS CQRS + DDD

**Componentes:**

1. **Aggregates:** Extienden `VersionedAggregateRoot` → `AggregateRoot` de @nestjs/cqrs, usan `apply(event)`, `autoCommit=true`
2. **Commands:** Extienden `Command<TResult>`, ejecutados por `CommandBus`, manejados por `@CommandHandler`
3. **Queries:** Extienden `Query<TResult>`, ejecutados por `QueryBus`, manejados por `@QueryHandler`
4. **Events:** POJOs publicados con `apply()`, manejados por `@EventsHandler`
5. **Sagas:** `@Saga()` retorna `Observable<ICommand>`, filtran con `ofType()`, mapean a comandos
6. **EventPublisher:** `mergeObjectContext()` opcional si `autoCommit=true`

**Flujo:** Controller → CommandBus → Handler → Aggregate.apply(event) → EventBus → EventHandlers/Sagas → CommandBus

**Ventajas:** Infraestructura probada, tipado fuerte, DI nativo, testing facilitado, RxJS, menos boilerplate

---

**Fin del PRD v1.0**
