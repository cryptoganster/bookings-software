---
inclusion: always
---

# Bounded Contexts

Este documento define los Bounded Contexts del sistema y sus responsabilidades según Domain-Driven Design.

## ¿Qué es un Bounded Context?

Un Bounded Context es un límite explícito dentro del cual un modelo de dominio es definido y aplicable. Cada BC tiene:

- Su propio lenguaje ubicuo
- Sus propios aggregates y entities
- Sus propias reglas de negocio
- Comunicación con otros BCs solo vía eventos

## Bounded Contexts del Sistema

### BC1: Account (Gestión de Cuentas)

**Responsabilidad:** Gestión de cuentas de dueños de negocios (nuestros clientes)

**Aggregates:**

- `BusinessOwner` - Dueño del negocio que usa nuestra plataforma

**Value Objects:**

- `Email` - Email validado
- `Password` - Password hasheado
- `OwnerName` - Nombre del dueño

**Domain Events:**

- `BusinessOwnerRegistered`
- `BusinessOwnerVerified`
- `BusinessOwnerProfileUpdated`

**Reglas de Negocio:**

- Email debe ser único
- Password debe cumplir requisitos de seguridad
- Verificación por email obligatoria

**Ubicación:** `src/account/`

---

### BC2: Business (Configuración de Negocio)

**Responsabilidad:** Configuración y datos del negocio

**Aggregates:**

- `Business` - Información del negocio

**Value Objects:**

- `WhatsAppNumber` - Número de WhatsApp validado
- `Timezone` - Zona horaria
- `BusinessAddress` - Dirección completa
- `BusinessName` - Nombre comercial

**Domain Events:**

- `BusinessCreated`
- `BusinessWhatsAppConfigured`
- `BusinessInfoUpdated`

**Reglas de Negocio:**

- Un BusinessOwner puede tener múltiples Business
- WhatsApp number debe ser único por Business
- Timezone debe ser válida (IANA timezone)

**Ubicación:** `src/business/`

---

### BC3: Offering (Servicios Ofrecidos)

**Responsabilidad:** Gestión de servicios ofrecidos por el negocio

**Aggregates:**

- `Offering` - Servicio que ofrece el negocio

**Value Objects:**

- `OfferingDuration` - Duración en minutos
- `OfferingCapacity` - Capacidad máxima
- `OfferingName` - Nombre del servicio

**Domain Events:**

- `OfferingCreated`
- `OfferingUpdated`
- `OfferingDeactivated`

**Reglas de Negocio:**

- Duración mínima: 15 minutos
- Capacidad mínima: 1
- Nombre único por Business
- Solo offerings activos pueden ser reservados

**Ubicación:** `src/offering/`

---

### BC4: Availability (Disponibilidad)

**Responsabilidad:** Gestión de horarios, bloqueos y límites de capacidad

**Aggregates:**

- `Schedule` - Horarios de atención del negocio
- `Blockout` - Bloqueos de fechas específicas
- `Capacity` - Límites de capacidad por servicio y fecha

**Value Objects:**

- `TimeSlot` - Rango de tiempo (start, end)
- `DateRange` - Rango de fechas
- `DayOfWeek` - Día de la semana (0-6)

**Domain Events:**

- `ScheduleConfigured`
- `BlockoutCreated`
- `BlockoutRemoved`
- `CapacityUpdated`

**Reglas de Negocio:**

- Schedule debe tener start < end
- No overlapping de schedules para mismo día
- Blockouts tienen prioridad sobre schedules
- Capacity se decrementa con cada reserva
- Capacity usa Optimistic Locking (campo version)

**Ubicación:** `src/availability/`

---

### BC5: Booking (Reservaciones) ⭐

**Responsabilidad:** Gestión de reservaciones y citas

**Aggregates:**

- `Appointment` - Cita/reservación individual

**Value Objects:**

- `AppointmentStatus` - Estado (CONFIRMED, CANCELLED, COMPLETED)
- `AppointmentDateTime` - Fecha y hora de la cita

**Domain Events:**

- `AppointmentCreated`
- `AppointmentCancelled`
- `AppointmentModified`
- `AppointmentCompleted`

**Reglas de Negocio:**

- No crear citas en el pasado
- No crear citas fuera de horario de atención
- No crear citas en fechas bloqueadas
- No exceder capacidad disponible
- Cliente máximo 3 citas activas simultáneas
- Cancelación hasta 2 horas antes
- Appointment usa Optimistic Locking (campo version)

**Ubicación:** `src/booking/`

**Nota:** Este es el BC de referencia implementado completamente en el MVP.

---

### BC6: Customer (Clientes Finales)

**Responsabilidad:** Gestión de clientes finales del negocio

**Aggregates:**

- `Customer` - Cliente final del negocio

**Value Objects:**

- `WhatsAppPhone` - Número de WhatsApp del cliente
- `CustomerName` - Nombre del cliente

**Domain Events:**

- `CustomerCreated`
- `CustomerIdentified`
- `CustomerInfoUpdated`

**Reglas de Negocio:**

- WhatsApp phone único por Business
- Nombre puede ser null inicialmente
- Identificación automática por número de WhatsApp

**Ubicación:** `src/customer/`

---

### BC7: Conversation (Conversaciones)

**Responsabilidad:** Integración con WhatsApp Business API y gestión de conversaciones

**Aggregates:**

- `Conversation` - Conversación con un cliente
- `Message` - Mensaje individual

**Value Objects:**

- `MessageType` - Tipo de mensaje (TEXT, BUTTON, LOCATION)
- `MessageDirection` - Dirección (INBOUND, OUTBOUND)
- `ConversationStatus` - Estado (ACTIVE, AWAITING_ADMIN, RESOLVED)
- `InteractiveButton` - Botón interactivo

**Domain Events:**

- `MessageReceived`
- `MessageSent`
- `ConversationStarted`
- `AdminQueryRequested`
- `AdminResponseSent`

**Reglas de Negocio:**

- Conversation usa Optimistic Locking
- Mensajes inmutables una vez enviados
- Validación de firma de webhooks obligatoria
- Retry logic para envío de mensajes (3 intentos)

**Interfaces Externas:**

- `IWhatsAppClient` - Cliente de WhatsApp Business API

**Ubicación:** `src/conversation/`

---

### BC8: Notification (Notificaciones)

**Responsabilidad:** Envío de notificaciones y recordatorios

**Aggregates:**

- `Reminder` - Recordatorio programado de cita

**Value Objects:**

- `ReminderTime` - Tiempo del recordatorio
- `ReminderStatus` - Estado (PENDING, SENT, CANCELLED)

**Domain Events:**

- `ReminderScheduled`
- `ReminderSent`
- `ReminderCancelled`

**Reglas de Negocio:**

- Recordatorio 24 horas antes de la cita
- Solo para citas CONFIRMED
- Cancelar recordatorio si cita se cancela
- Marcar como SENT después de enviar

**Ubicación:** `src/notification/`

---

## Comunicación entre Bounded Contexts

### Reglas de Comunicación

1. **No llamadas directas** - BCs no se llaman entre sí
2. **Solo vía eventos** - Comunicación asíncrona
3. **Eventual consistency** - Aceptable entre BCs
4. **Eventos como contratos** - Versionados y estables

### Mapa de Eventos

```
Booking → AppointmentCreated
    ↓
    ├→ Notification: Crea Reminder
    ├→ Conversation: Envía confirmación
    └→ Availability: Actualiza Capacity

Booking → AppointmentCancelled
    ↓
    ├→ Notification: Cancela Reminder
    ├→ Conversation: Envía notificación
    └→ Availability: Libera Capacity

Conversation → MessageReceived
    ↓
    └→ Booking: Procesa intención de reserva

Account → BusinessOwnerRegistered
    ↓
    └→ Business: Puede crear Business
```

## Shared Kernel

**Ubicación:** `src/shared/`

**Contenido:**

- `kernel/` - Clases base (VersionedAggregateRoot, ValueObject, IUnitOfWork)
- `vo/` - Value Objects genéricos (UUID, AggregateVersion)
- `infra/` - Implementaciones compartidas (TypeOrmUnitOfWork)
- `exceptions/` - Excepciones comunes (DomainException, ConcurrencyException)

**Regla:** Solo abstracciones y utilidades genéricas, no lógica de negocio.

## Estructura de Carpetas por BC

```
src/
├── {bounded-context}/
│   ├── {bc}.module.ts           # NestJS Module
│   ├── domain/
│   │   ├── aggregates/          # Aggregates
│   │   ├── entities/            # Entities (si aplica)
│   │   ├── vo/                  # Value Objects
│   │   ├── events/              # Domain Events
│   │   ├── exceptions/          # Domain Exceptions
│   │   ├── interfaces/          # Interfaces (repositories, services)
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   ├── services/            # Domain Services
│   │   └── read_models/         # Read Models (CQRS)
│   ├── app/
│   │   ├── commands/            # Commands y Handlers
│   │   ├── queries/             # Queries y Handlers
│   │   ├── event_handlers/      # Event Handlers
│   │   └── sagas/               # Sagas (Process Managers)
│   ├── infra/
│   │   ├── persistence/         # Repositories, Models, Mappers
│   │   │   ├── models/
│   │   │   ├── mappers/
│   │   │   └── repositories/
│   │   └── external/            # Clientes externos (si aplica)
│   └── presentation/
│       └── controllers/         # REST Controllers
```

## Lenguaje Ubicuo por BC

### Booking

- **Appointment** (no "Reservation" o "Booking")
- **Offering** (no "Service")
- **Slot** (no "Time")
- **Capacity** (no "Availability")

### Conversation

- **Conversation** (no "Chat")
- **Message** (no "Text")
- **Interactive Button** (no "Button")

### Notification

- **Reminder** (no "Notification" o "Alert")

### Availability

- **Schedule** (no "Hours")
- **Blockout** (no "Block" o "Closure")
- **TimeSlot** (no "Period")

## Agregación de Bounded Contexts

### Fase MVP (Actual)

- ✅ Shared Kernel
- ✅ Booking (completo)
- ✅ Conversation (básico)
- ✅ Auth (JWT)

### Fase 2 (Post-MVP)

- Account
- Business
- Offering
- Availability
- Customer
- Notification

## Reglas de Implementación

1. **Un BC = Un Módulo NestJS**

   ```typescript
   @Module({
     imports: [CqrsModule, TypeOrmModule.forFeature([...])],
     controllers: [...],
     providers: [...],
     exports: [...]
   })
   export class BookingModule {}
   ```

2. **Separación de Modelos**
   - Write Model: Para comandos
   - Read Model: Para queries
   - No compartir entre BCs

3. **Eventos Públicos**
   - Eventos que cruzan BCs deben ser estables
   - Versionados si cambian
   - Documentados

4. **Repositories por BC**
   - Cada BC tiene sus propios repositories
   - No acceso directo a repositories de otros BCs

5. **Testing por BC**
   - Tests unitarios aislados
   - Tests de integración con BD
   - Tests E2E por flujo completo

## Anti-Patterns a Evitar

❌ **No hacer:**

- Llamadas directas entre BCs
- Compartir aggregates entre BCs
- Transacciones que cruzan BCs
- Queries que joinean tablas de múltiples BCs
- Lógica de negocio en event handlers

✅ **Hacer:**

- Comunicación vía eventos
- Duplicar datos si es necesario (eventual consistency)
- Transacciones dentro de un BC
- Queries optimizadas por BC
- Event handlers solo orquestan comandos
