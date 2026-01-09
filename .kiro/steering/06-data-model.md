---
inclusion: manual
---

# Data Model

**Entity definitions and database schema for the booking system**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [03-identity-architecture.md](./03-identity-architecture.md) - User/Customer/BusinessOwner architecture
> - [04-system-architecture.md](./04-system-architecture.md) - Concurrency and versioning

---

# Modelo de Datos

Este documento define las entidades principales del sistema y su estructura.

> **📖 Referencia Completa:** Ver [03-identity-architecture.md](./03-identity-architecture.md) para detalles de arquitectura de identidades.

---

## Entidades Principales

### User (auth) - Identidad Universal

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

**Tabla:** `users`

---

### BusinessOwner (account) - Perfil de Dueño

```typescript
- id: UUID
- userId: UUID // ← Siempre vinculado a User
- subscriptionPlan: SubscriptionPlan (VO) // FREE, BASIC, PRO, ENTERPRISE
- subscriptionStatus: SubscriptionStatus (VO) // ACTIVE, SUSPENDED, CANCELLED
- onboardingCompleted: boolean
- createdAt: Date
- version: number // Optimistic Locking
```

**Relación:** 1:1 con User (obligatoria)

**Tabla:** `business_owners`

---

### Business (business) - Información del Negocio

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

**Relación:** N:1 con User (un User puede tener múltiples Business)

**Tabla:** `businesses`

---

### Offering (offering)

```typescript
- id: UUID
- businessId: UUID
- name: string
- duration: OfferingDuration (VO) // en minutos
- maxCapacityPerSlot: number
- maxDailyCapacity: number | null
- isActive: boolean
```

**Relación:** N:1 con Business

**Tabla:** `offerings`

---

### Schedule (availability)

```typescript
- id: UUID
- businessId: UUID
- dayOfWeek: number (0-6)
- startTime: Time
- endTime: Time
- isActive: boolean
```

**Relación:** N:1 con Business

**Tabla:** `schedules`

---

### Blockout (availability)

```typescript
- id: UUID
- businessId: UUID
- dateRange: DateRange (VO)
- reason: string
```

**Relación:** N:1 con Business

**Tabla:** `blockouts`

---

### Capacity (availability)

```typescript
- id: UUID
- offeringId: UUID
- date: Date
- availableSlots: number
- bookedSlots: number
- version: number // ← Campo para Optimistic Locking
```

**Relación:** N:1 con Offering

**Tabla:** `capacities`

**Nota:** Esta entidad usa Optimistic Locking para prevenir race conditions en reservaciones simultáneas.

---

### Appointment (booking)

```typescript
- id: UUID
- businessId: UUID
- customerId: UUID
- serviceId: UUID
- dateTime: AppointmentDateTime (VO)
- status: AppointmentStatus (VO) // CONFIRMED, CANCELLED, COMPLETED
- createdAt: Date
- cancelledAt: Date | null
- version: number // ← Campo para Optimistic Locking
```

**Relación:**

- N:1 con Business
- N:1 con Customer
- N:1 con Offering (serviceId)

**Tabla:** `appointments`

**Nota:** Esta entidad usa Optimistic Locking para prevenir modificaciones concurrentes.

---

### Customer (customer) - Perfil de Cliente

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

**Relación:**

- N:1 con Business
- 0..1:1 con User (opcional)

**Tabla:** `customers`

---

### Conversation (conversation)

```typescript
- id: UUID
- businessId: UUID
- customerId: UUID
- status: ConversationStatus // ACTIVE, AWAITING_ADMIN, RESOLVED
- lastMessageAt: Date
- version: number // ← Campo para Optimistic Locking
```

**Relación:**

- N:1 con Business
- N:1 con Customer

**Tabla:** `conversations`

**Nota:** Esta entidad usa Optimistic Locking para gestión de estado concurrente.

---

### Message (conversation)

```typescript
- id: UUID
- conversationId: UUID
- direction: MessageDirection // INBOUND, OUTBOUND
- content: string
- messageType: MessageType (VO) // TEXT, BUTTON, LOCATION
- sentAt: Date
- isFromAdmin: boolean
```

**Relación:** N:1 con Conversation

**Tabla:** `messages`

---

### Reminder (notification)

```typescript
- id: UUID
- appointmentId: UUID
- scheduledFor: Date
- sentAt: Date | null
- status: ReminderStatus // PENDING, SENT, CANCELLED
```

**Relación:** 1:1 con Appointment

**Tabla:** `reminders`

---

## Diagrama de Relaciones

```
User (auth)
  ├─ 1:1 → BusinessOwner (account)
  │         └─ 1:N → Business (business)
  │                   ├─ 1:N → Offering
  │                   ├─ 1:N → Schedule
  │                   ├─ 1:N → Blockout
  │                   ├─ 1:N → Appointment
  │                   ├─ 1:N → Customer
  │                   └─ 1:N → Conversation
  │
  └─ 1:N → Customer (customer) [opcional]
            ├─ 1:N → Appointment
            └─ 1:N → Conversation

Offering
  ├─ 1:N → Capacity
  └─ 1:N → Appointment

Appointment
  └─ 1:1 → Reminder

Conversation
  └─ 1:N → Message
```

---

## Índices Recomendados

### Performance Crítico

```sql
-- Búsqueda de usuarios por email (login)
CREATE INDEX idx_users_email ON users(email);

-- Búsqueda de business por owner
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- Búsqueda de business por WhatsApp
CREATE UNIQUE INDEX idx_businesses_whatsapp ON businesses(whatsapp_number);

-- Búsqueda de customer por WhatsApp y business
CREATE UNIQUE INDEX idx_customers_whatsapp_business ON customers(whatsapp_phone, business_id);

-- Búsqueda de appointments por business y fecha
CREATE INDEX idx_appointments_business_date ON appointments(business_id, date_time);

-- Búsqueda de appointments por customer
CREATE INDEX idx_appointments_customer ON appointments(customer_id);

-- Búsqueda de capacity por offering y fecha
CREATE UNIQUE INDEX idx_capacity_offering_date ON capacities(offering_id, date);

-- Búsqueda de conversations por business y status
CREATE INDEX idx_conversations_business_status ON conversations(business_id, status);

-- Búsqueda de reminders pendientes
CREATE INDEX idx_reminders_status_scheduled ON reminders(status, scheduled_for);
```

---

## Convenciones de Nomenclatura

### Base de Datos

- **Tablas:** snake_case plural (ej: `appointments`, `business_owners`)
- **Columnas:** snake_case (ej: `business_id`, `created_at`)
- **Foreign Keys:** `{tabla_singular}_id` (ej: `business_id`, `customer_id`)

### TypeScript/TypeORM

- **Entities:** PascalCase (ej: `AppointmentModel`, `BusinessOwnerModel`)
- **Propiedades:** camelCase (ej: `businessId`, `createdAt`)
- **Decoradores:** `@Column('uuid')`, `@CreateDateColumn()`

### Ejemplo de Mapeo

```typescript
@Entity("appointments")
export class AppointmentModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  businessId: string;

  @Column("uuid")
  customerId: string;

  @Column("timestamp")
  dateTime: Date;

  @Column("int")
  version: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## Optimistic Locking

### Entidades Versionadas

Las siguientes entidades usan Optimistic Locking (campo `version`):

- ✅ **Appointment** - Alta concurrencia en modificaciones
- ✅ **Capacity** - Race conditions en reservaciones simultáneas
- ✅ **Conversation** - Cambios de estado concurrentes
- ✅ **BusinessOwner** - Actualizaciones de suscripción
- ✅ **Business** - Configuración concurrente

### Entidades Sin Versionar

- ❌ **Customer** - Baja concurrencia
- ❌ **Offering** - Modificaciones infrecuentes
- ❌ **Schedule** - Configuración estática
- ❌ **Message** - Inmutable después de creación
- ❌ **Reminder** - Proceso secuencial

> **📖 Detalles de Implementación:** Ver [04-system-architecture.md](./04-system-architecture.md) sección "Gestión de Concurrencia"
