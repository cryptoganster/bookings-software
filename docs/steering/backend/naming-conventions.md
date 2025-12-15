---
inclusion: always
---

# Nomenclatura y Convenciones

Este documento define las convenciones de nomenclatura y estructura de archivos para el proyecto.

## Convenciones Generales

### 📌 Idioma

- **Código:** Inglés
- **Comentarios:** Español
- **Variables temporales locales:** Inglés

```typescript
// ❌ Mal
const usuarioService = new UserService();

// ✅ Bien
const userService = new UserService();

// ✅ Comentarios en español
// Crear una nueva cita para el cliente
const appointment = Appointment.create(...);
```

## Convenciones de Archivos y Carpetas

### Archivos: kebab-case

```
✅ Correcto:
appointment.ts
create-appointment.ts
appointment-created.ts
business-owner.ts
whatsapp-client.ts

❌ Incorrecto:
Appointment.ts
CreateAppointment.ts
appointmentCreated.ts
BusinessOwner.ts
```

### Carpetas: kebab-case

```
✅ Correcto:
src/
├── bounded-contexts/
├── shared-kernel/
├── event-handlers/
├── value-objects/
└── read-models/

❌ Incorrecto:
src/
├── BoundedContexts/
├── sharedKernel/
├── eventHandlers/
├── valueObjects/
└── readModels/
```

## Convenciones de Código

### Clases: PascalCase

```typescript
✅ Correcto:
class CreateAppointmentHandler { }
class AppointmentStatus { }
class BusinessOwner { }
class WhatsAppClient { }

❌ Incorrecto:
class createAppointmentHandler { }
class appointmentStatus { }
class businessOwner { }
class whatsappClient { }
```

### Variables: camelCase

```typescript
✅ Correcto:
const appointmentId = UUID.generate();
const businessOwner = new BusinessOwner();
const whatsappNumber = '+1234567890';
let isAppointmentCancellable = false;

❌ Incorrecto:
const AppointmentId = UUID.generate();
const business_owner = new BusinessOwner();
const WhatsappNumber = '+1234567890';
let IsAppointmentCancellable = false;
```

### Funciones: camelCase

```typescript
✅ Correcto:
function createAppointment() { }
async function sendWhatsAppMessage() { }
function calculateAvailableSlots() { }
function validateBusinessHours() { }

❌ Incorrecto:
function CreateAppointment() { }
function send_whatsapp_message() { }
function CalculateAvailableSlots() { }
function validate_business_hours() { }
```

### Constantes: UPPER_SNAKE_CASE

```typescript
✅ Correcto:
const MAX_APPOINTMENTS_PER_CUSTOMER = 3;
const DEFAULT_REMINDER_HOURS = 24;
const WHATSAPP_API_VERSION = 'v18.0';
const MINIMUM_CANCELLATION_NOTICE_HOURS = 2;

❌ Incorrecto:
const maxAppointmentsPerCustomer = 3;
const defaultReminderHours = 24;
const whatsappApiVersion = 'v18.0';
const minimumCancellationNoticeHours = 2;
```

### Enums: PascalCase

```typescript
✅ Correcto:
enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

❌ Incorrecto:
enum appointmentStatus {
  confirmed = 'confirmed',
  cancelled = 'cancelled',
  completed = 'completed',
}
```

### Decoradores: PascalCase

```typescript
✅ Correcto:
@Controller('appointments')
@Injectable()
@CommandHandler(CreateAppointmentCommand)
@EventsHandler(AppointmentCreated)

❌ Incorrecto:
@controller('appointments')
@injectable()
@commandHandler(CreateAppointmentCommand)
```

## ORM y Base de Datos

### Código TypeScript: camelCase/PascalCase

```typescript
✅ Correcto:
@Entity('appointments')
export class AppointmentModel {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column('uuid')
  businessId: string;
  
  @Column('uuid')
  customerId: string;
  
  @Column('timestamp')
  dateTime: Date;
  
  @CreateDateColumn()
  createdAt: Date;
}
```

### Base de Datos: snake_case

```sql
-- ✅ Correcto
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  offering_id UUID NOT NULL,
  date_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ❌ Incorrecto
CREATE TABLE Appointments (
  Id UUID PRIMARY KEY,
  BusinessId UUID NOT NULL,
  CustomerId UUID NOT NULL,
  OfferingId UUID NOT NULL,
  DateTime TIMESTAMP NOT NULL
);
```

## Evitar Redundancia en Nombres

### Regla General

No incluir el tipo de archivo en el nombre a menos que sea una convención específica de NestJS.

### ✅ Correcto (Sin redundancia)

```
src/
├── booking/
│   ├── booking.module.ts              # ✅ Convención NestJS
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── appointment.ts         # ✅ No "appointment.aggregate.ts"
│   │   ├── events/
│   │   │   └── appointment-created.ts # ✅ No "appointment-created.event.ts"
│   │   ├── vo/
│   │   │   └── appointment-status.ts  # ✅ No "appointment-status.vo.ts"
│   │   └── exceptions/
│   │       └── appointment-not-found.ts # ✅ No "appointment-not-found.exception.ts"
│   ├── app/
│   │   ├── commands/
│   │   │   └── create-appointment/
│   │   │       ├── command.ts         # ✅ CreateAppointmentCommand
│   │   │       ├── handler.ts         # ✅ CreateAppointmentHandler
│   │   │       └── dto.ts             # ✅ CreateAppointmentDto
│   │   └── queries/
│   │       └── get-appointment/
│   │           ├── query.ts           # ✅ GetAppointmentQuery
│   │           └── handler.ts         # ✅ GetAppointmentHandler
│   ├── infra/
│   │   └── persistence/
│   │       ├── models/
│   │       │   └── appointment.ts     # ✅ No "appointment.model.ts"
│   │       └── repositories/
│   │           └── appointment-write.ts # ✅ No "appointment-write.repository.ts"
│   └── presentation/
│       └── controllers/
│           └── appointment.controller.ts # ✅ Convención NestJS
```

### ❌ Incorrecto (Con redundancia)

```
src/
├── booking/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── appointment.aggregate.ts    # ❌ Redundante
│   │   ├── events/
│   │   │   └── appointment-created.event.ts # ❌ Redundante
│   │   └── vo/
│   │       └── appointment-status.vo.ts    # ❌ Redundante
│   └── app/
│       └── commands/
│           ├── create-appointment.command.ts # ❌ Redundante
│           └── create-appointment.handler.ts # ❌ Redundante
```

## Excepciones: Convenciones de NestJS

Las siguientes convenciones son específicas del framework NestJS y DEBEN incluir el sufijo:

### Módulos

```
✅ Correcto (Convención NestJS):
src/
├── booking/
│   └── booking.module.ts        # ✅ Correcto - convención del framework
├── messaging/
│   └── messaging.module.ts      # ✅ Correcto - convención del framework
└── auth/
    └── auth.module.ts           # ✅ Correcto - convención del framework
```

### Controllers

```
✅ Correcto (Convención NestJS):
src/
├── booking/
│   └── presentation/
│       └── controllers/
│           └── appointment.controller.ts  # ✅ Correcto - convención del framework
└── messaging/
    └── presentation/
        └── controllers/
            └── webhook.controller.ts      # ✅ Correcto - convención del framework
```

### Guards, Filters, Interceptors, Strategies

```
✅ Correcto (Convención NestJS):
src/
├── auth/
│   ├── guards/
│   │   └── jwt-auth.guard.ts           # ✅ Correcto - convención del framework
│   └── strategies/
│       └── jwt.strategy.ts             # ✅ Correcto - convención del framework
└── shared/
    ├── filters/
    │   └── domain-exception.filter.ts  # ✅ Correcto - convención del framework
    └── interceptors/
        └── logging.interceptor.ts      # ✅ Correcto - convención del framework
```

## Estructura de Commands y Queries (SRP)

### Commands: Un directorio por comando

Cada comando tiene su propio directorio con archivos separados siguiendo Single Responsibility Principle:

```
src/
└── booking/
    └── app/
        └── commands/
            ├── create-appointment/
            │   ├── command.ts         # CreateAppointmentCommand
            │   ├── handler.ts         # CreateAppointmentHandler
            │   ├── dto.ts             # CreateAppointmentDto (si aplica)
            │   └── index.ts           # Exports
            ├── cancel-appointment/
            │   ├── command.ts         # CancelAppointmentCommand
            │   ├── handler.ts         # CancelAppointmentHandler
            │   └── index.ts
            └── modify-appointment/
                ├── command.ts         # ModifyAppointmentCommand
                ├── handler.ts         # ModifyAppointmentHandler
                ├── dto.ts             # ModifyAppointmentDto
                └── index.ts
```

### Queries: Un directorio por query

```
src/
└── booking/
    └── app/
        └── queries/
            ├── get-appointment/
            │   ├── query.ts           # GetAppointmentQuery
            │   ├── handler.ts         # GetAppointmentHandler
            │   └── index.ts
            ├── get-customer-appointments/
            │   ├── query.ts           # GetCustomerAppointmentsQuery
            │   ├── handler.ts         # GetCustomerAppointmentsHandler
            │   └── index.ts
            └── get-available-slots/
                ├── query.ts           # GetAvailableSlotsQuery
                ├── handler.ts         # GetAvailableSlotsHandler
                └── index.ts
```

### Ejemplo de Implementación

```typescript
// src/booking/app/commands/create-appointment/command.ts
export class CreateAppointmentCommand {
  constructor(
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
  ) {}
}

// src/booking/app/commands/create-appointment/handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAppointmentCommand } from './command';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler 
  implements ICommandHandler<CreateAppointmentCommand> {
  
  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    // Implementación
  }
}

// src/booking/app/commands/create-appointment/dto.ts
import { IsUUID, IsDate } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;
  
  @IsUUID()
  offeringId: string;
  
  @IsDate()
  dateTime: Date;
}

// src/booking/app/commands/create-appointment/index.ts
export * from './command';
export * from './handler';
export * from './dto';
```

## Interfaces

### Prefijo "I" para Interfaces de Dominio

```typescript
✅ Correcto:
interface IAppointmentWriteRepository { }
interface IAppointmentReadRepository { }
interface IWhatsAppClient { }
interface IUnitOfWork { }

❌ Incorrecto:
interface AppointmentWriteRepository { }
interface AppointmentReadRepository { }
interface WhatsAppClient { }
interface UnitOfWork { }
```

## Variables Temporales y Locales

### Usar nombres en inglés, concisos pero descriptivos

```typescript
✅ Correcto:
// Variables temporales
const temp = appointments.filter(a => a.isActive());
const result = await this.repository.save(appointment);
const items = appointments.map(a => a.toReadModel());

// Loops
for (const appointment of appointments) { }
appointments.forEach(appointment => { });
appointments.map(appointment => appointment.getId());

// Callbacks
.then(result => result.data)
.catch(error => this.handleError(error))

❌ Incorrecto:
// Variables temporales muy largas
const temporaryAppointmentListFilteredByActiveStatus = appointments.filter(a => a.isActive());

// Variables en español
const citas = appointments.filter(a => a.isActive());
const resultado = await this.repository.save(appointment);
```

## Comentarios

### Usar español para explicaciones de negocio

```typescript
✅ Correcto:
export class Appointment {
  cancel(): void {
    // Verificar que la cita se pueda cancelar según las reglas de negocio
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
    
    // No permitir cancelación dentro de las 2 horas previas
    if (this.dateTime.isWithinHours(2)) {
      throw new CannotCancelWithinTwoHoursException();
    }
    
    this.status = AppointmentStatus.cancelled();
    this.apply(new AppointmentCancelled(this.id));
  }
}

❌ Incorrecto:
export class Appointment {
  cancel(): void {
    // Check if appointment can be cancelled
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
  }
}
```

## Resumen de Convenciones

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Archivos** | kebab-case | `appointment-created.ts` |
| **Carpetas** | kebab-case | `event-handlers/` |
| **Clases** | PascalCase | `CreateAppointmentHandler` |
| **Variables** | camelCase | `appointmentId` |
| **Funciones** | camelCase | `createAppointment()` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| **Enums** | PascalCase | `AppointmentStatus` |
| **Interfaces** | PascalCase + I | `IAppointmentRepository` |
| **BD Tablas** | snake_case | `appointments` |
| **BD Columnas** | snake_case | `business_id` |
| **Módulos NestJS** | kebab-case.module.ts | `booking.module.ts` |
| **Controllers NestJS** | kebab-case.controller.ts | `appointment.controller.ts` |
| **Guards NestJS** | kebab-case.guard.ts | `jwt-auth.guard.ts` |

## Herramientas de Validación

### ESLint Rules

```json
{
  "@typescript-eslint/naming-convention": [
    "error",
    {
      "selector": "class",
      "format": ["PascalCase"]
    },
    {
      "selector": "interface",
      "format": ["PascalCase"],
      "prefix": ["I"]
    },
    {
      "selector": "variable",
      "format": ["camelCase", "UPPER_CASE"]
    },
    {
      "selector": "function",
      "format": ["camelCase"]
    }
  ]
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

Estas convenciones aseguran consistencia en todo el proyecto y facilitan la colaboración entre desarrolladores.
