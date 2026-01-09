---
inclusion: fileMatch
fileMatchPattern: "**/domain/**/*.ts,**/entities/**/*.ts,**/features/**/*.ts"
---

# Business Rules

**Domain business rules and validation logic**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [05-user-flows.md](./05-user-flows.md) - User interaction flows
> - [06-data-model.md](./06-data-model.md) - Data model

---

# Reglas de Negocio

Este documento define las reglas de negocio del sistema que deben ser validadas en la capa de dominio.

---

## 1. Reservaciones (Booking BC)

### 1.1 Validaciones de Creación

1. ✅ No se pueden crear citas en fechas/horarios bloqueados
2. ✅ No se pueden crear citas fuera del horario de atención
3. ✅ No se pueden exceder los límites de capacidad por offering
4. ✅ No se pueden crear citas en el pasado
5. ✅ Cada cliente puede tener máximo 3 citas activas simultáneamente
6. ✅ Las citas deben respetar la duración mínima del offering
7. ✅ Debe haber al menos 15 minutos entre el momento actual y la hora de la cita

### 1.2 Validaciones de Estado

```typescript
// Ejemplo de implementación en Aggregate
export class Appointment extends VersionedAggregateRoot {
  cancel(): void {
    // Regla: Solo citas CONFIRMED pueden cancelarse
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException(this.id);
    }

    // Regla: No cancelar dentro de las 2 horas previas
    if (this.dateTime.isWithinHours(2)) {
      throw new CannotCancelWithinTwoHoursException(this.id);
    }

    this.status = AppointmentStatus.cancelled();
    this.incrementVersion();
    this.apply(new AppointmentCancelled(this.id));
  }
}
```

---

## 2. Cancelaciones (Booking BC)

### 2.1 Reglas de Cancelación

1. ✅ Las citas solo pueden cancelarse hasta 2 horas antes
2. ✅ Al cancelar, se libera la capacidad del slot
3. ✅ Se debe notificar al cliente de la cancelación exitosa
4. ✅ Solo citas con estado CONFIRMED pueden cancelarse
5. ✅ Las citas CANCELLED o COMPLETED no pueden cancelarse

### 2.2 Efectos de Cancelación

- **Capacity:** Se incrementa `availableSlots` en 1
- **Reminder:** Se cancela el recordatorio programado
- **Notification:** Se envía mensaje de confirmación al cliente

---

## 3. Modificaciones (Booking BC)

### 3.1 Reglas de Modificación

1. ✅ Solo se pueden modificar citas futuras
2. ✅ Modificar = Cancelar anterior + Crear nueva
3. ✅ Debe validarse disponibilidad en nuevo slot
4. ✅ Se aplican todas las reglas de creación al nuevo slot
5. ✅ Se aplican todas las reglas de cancelación al slot anterior

### 3.2 Proceso de Modificación

```
1. Validar que cita actual es modificable
2. Validar disponibilidad en nuevo slot
3. Cancelar cita actual (libera capacity)
4. Crear nueva cita (decrementa capacity)
5. Cancelar reminder anterior
6. Crear nuevo reminder
7. Notificar al cliente
```

---

## 4. Multi-tenancy (Business BC)

### 4.1 Aislamiento de Datos

1. ✅ Cada negocio se identifica por su número de WhatsApp único
2. ✅ Los datos de un negocio no son visibles para otros
3. ✅ Cada webhook debe validar el origen del mensaje
4. ✅ Todas las queries deben filtrar por `businessId`

### 4.2 Validaciones de Negocio

```typescript
// Ejemplo de validación en Repository
export class AppointmentReadRepository {
  async findByBusiness(businessId: string): Promise<AppointmentReadModel[]> {
    // SIEMPRE filtrar por businessId
    return this.repository.find({
      where: { businessId },
    });
  }
}
```

---

## 5. Zona Horaria (Business BC)

### 5.1 Reglas de Manejo

1. ✅ Todas las citas se almacenan en UTC
2. ✅ Se muestran al cliente en la zona horaria del negocio
3. ✅ Los recordatorios respetan la zona horaria del negocio
4. ✅ La conversión se hace en la capa de presentación

### 5.2 Ejemplo de Conversión

```typescript
// Almacenamiento (UTC)
const appointmentDateTime = new Date("2024-12-18T15:30:00Z"); // UTC

// Presentación (Timezone del negocio)
const businessTimezone = "America/Mexico_City";
const localDateTime = formatInTimeZone(
  appointmentDateTime,
  businessTimezone,
  "PPpp",
); // "Dec 18, 2024, 9:30 AM"
```

---

## 6. Capacidad (Availability BC)

### 6.1 Reglas de Capacidad

1. ✅ `availableSlots` nunca puede ser negativo
2. ✅ `bookedSlots` nunca puede exceder `maxCapacityPerSlot`
3. ✅ Al crear cita: `availableSlots--`, `bookedSlots++`
4. ✅ Al cancelar cita: `availableSlots++`, `bookedSlots--`
5. ✅ Usar Optimistic Locking para prevenir race conditions

### 6.2 Validación de Disponibilidad

```typescript
export class Capacity extends VersionedAggregateRoot {
  decrementSlot(): void {
    if (this.availableSlots <= 0) {
      throw new NoAvailableCapacityException(this.offeringId, this.date);
    }

    this.availableSlots--;
    this.bookedSlots++;
    this.incrementVersion();
    this.apply(new CapacityDecremented(this.id));
  }
}
```

---

## 7. Horarios (Availability BC)

### 7.1 Reglas de Schedule

1. ✅ `startTime` debe ser menor que `endTime`
2. ✅ No puede haber overlapping de schedules para el mismo día
3. ✅ Los horarios deben estar en intervalos de 15 minutos
4. ✅ Un negocio puede tener múltiples schedules por día (ej: mañana y tarde)

### 7.2 Validación de Overlapping

```typescript
export class Schedule extends ValueObject {
  overlaps(other: Schedule): boolean {
    if (this.dayOfWeek !== other.dayOfWeek) {
      return false;
    }

    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
}
```

---

## 8. Bloqueos (Availability BC)

### 8.1 Reglas de Blockout

1. ✅ Blockouts tienen prioridad sobre schedules
2. ✅ No se pueden crear citas en fechas bloqueadas
3. ✅ `startDate` debe ser menor o igual que `endDate`
4. ✅ Blockouts pueden ser de un solo día o rango de días

### 8.2 Validación de Fecha Bloqueada

```typescript
export class BlockoutService {
  isDateBlocked(businessId: string, date: Date): boolean {
    const blockouts = this.blockoutRepository.findByBusiness(businessId);

    return blockouts.some((blockout) => blockout.dateRange.contains(date));
  }
}
```

---

## 9. Clientes (Customer BC)

### 9.1 Reglas de Customer

1. ✅ WhatsApp phone único por Business
2. ✅ Nombre puede ser null inicialmente
3. ✅ Identificación automática por número de WhatsApp
4. ✅ Customer anónimo (userId=null) no puede acceder al panel web
5. ✅ Customer registrado (userId!=null) puede acceder al panel web

### 9.2 Límite de Citas Activas

```typescript
export class CustomerService {
  async canCreateAppointment(customerId: string): Promise<boolean> {
    const activeAppointments =
      await this.appointmentRepository.findActiveByCustomer(customerId);

    // Máximo 3 citas activas
    return activeAppointments.length < 3;
  }
}
```

---

## 10. Conversaciones (Conversation BC)

### 10.1 Reglas de Conversation

1. ✅ Conversation usa Optimistic Locking
2. ✅ Mensajes inmutables una vez enviados
3. ✅ Validación de firma de webhooks obligatoria
4. ✅ Retry logic para envío de mensajes (3 intentos)
5. ✅ Estado AWAITING_ADMIN requiere respuesta de admin

### 10.2 Validación de Webhook

```typescript
export class WhatsAppWebhookService {
  validateSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
```

---

## 11. Recordatorios (Notification BC)

### 11.1 Reglas de Reminder

1. ✅ Recordatorio 24 horas antes de la cita
2. ✅ Solo para citas CONFIRMED
3. ✅ Cancelar recordatorio si cita se cancela
4. ✅ Marcar como SENT después de enviar
5. ✅ No enviar recordatorios duplicados

### 11.2 Programación de Recordatorio

```typescript
export class ReminderService {
  scheduleReminder(appointment: Appointment): Reminder {
    // Calcular 24 horas antes
    const scheduledFor = subHours(appointment.dateTime, 24);

    // Validar que la cita es CONFIRMED
    if (!appointment.status.isConfirmed()) {
      throw new CannotScheduleReminderException(appointment.id);
    }

    return Reminder.create(appointment.id, scheduledFor);
  }
}
```

---

## 12. Suscripciones (Account BC)

### 12.1 Reglas de Subscription

1. ✅ Plan FREE: Máximo 1 business
2. ✅ Plan BASIC: Máximo 3 businesses
3. ✅ Plan PRO: Máximo 10 businesses
4. ✅ Plan ENTERPRISE: Ilimitado
5. ✅ No se puede crear business si se excede el límite del plan

### 12.2 Validación de Límite

```typescript
export class BusinessOwner extends VersionedAggregateRoot {
  canCreateBusiness(currentBusinessCount: number): boolean {
    return currentBusinessCount < this.subscriptionPlan.maxBusinesses;
  }
}
```

---

## Resumen de Validaciones por BC

| BC               | Validaciones Principales                                   |
| ---------------- | ---------------------------------------------------------- |
| **Booking**      | Capacidad, horarios, bloqueos, límite de citas por cliente |
| **Availability** | Overlapping schedules, capacidad, bloqueos prioritarios    |
| **Customer**     | WhatsApp único, límite de citas activas                    |
| **Conversation** | Firma de webhook, mensajes inmutables, retry logic         |
| **Notification** | Solo citas CONFIRMED, 24h antes, no duplicados             |
| **Account**      | Límite de businesses por plan                              |
| **Business**     | WhatsApp único, timezone válida, multi-tenancy             |

---

## Excepciones de Dominio

Todas las reglas de negocio violadas deben lanzar excepciones específicas:

```typescript
// Ejemplos de excepciones
export class AppointmentCannotBeCancelledException extends DomainException {}
export class CannotCancelWithinTwoHoursException extends DomainException {}
export class NoAvailableCapacityException extends DomainException {}
export class CustomerExceedsActiveLimitException extends DomainException {}
export class InvalidScheduleOverlapException extends DomainException {}
export class DateIsBlockedException extends DomainException {}
```

> **📖 Implementación:** Ver [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) para patrones de implementación
