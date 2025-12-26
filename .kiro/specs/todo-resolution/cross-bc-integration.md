# Cross-BC Integration TODOs

**Priority:** P1 (High)  
**Estimated Effort:** 3-4 days

## Overview

Implement proper integration between Bounded Contexts using queries and events instead of placeholders.

## Issues

### 1. Booking → Availability Integration

#### 1.1 Get Available Dates in Conversation Handler

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Current Code:**

```typescript
private async sendDateSelectionButtons(customerPhone: string): Promise<void> {
  // TODO: Obtener fechas disponibles desde GetAvailableDatesQuery
  const today = new Date();
  const buttons: Button[] = [];
  // ... hardcoded dates
}
```

**Solution:**

```typescript
private async sendDateSelectionButtons(
  customerPhone: string,
  businessId: UUID,
  offeringId: UUID,
): Promise<void> {
  // Query Availability BC for available dates
  const availableDates = await this.queryBus.execute(
    new GetAvailableDatesQuery(
      businessId.getValue(),
      offeringId.getValue(),
      30, // next 30 days
    ),
  );

  const buttons: Button[] = availableDates.slice(0, 3).map((date, index) => ({
    id: `date-${date.toISOString().split('T')[0]}`,
    title: this.formatDate(date),
  }));

  await this.whatsappClient.sendInteractiveButtons(
    customerPhone,
    'Selecciona una fecha:',
    buttons,
  );
}

private formatDate(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}
```

#### 1.2 Get Available Time Slots in Conversation Handler

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Current Code:**

```typescript
private async sendTimeSelectionButtons(
  customerPhone: string,
  date: Date,
): Promise<void> {
  // TODO: Obtener horarios disponibles desde GetAvailableTimeSlotsQuery
  const buttons: Button[] = [
    { id: 'time-09:00', title: '9:00 AM' },
    // ... hardcoded times
  ];
}
```

**Solution:**

```typescript
private async sendTimeSelectionButtons(
  customerPhone: string,
  businessId: UUID,
  offeringId: UUID,
  date: Date,
): Promise<void> {
  // Query Availability BC for available time slots
  const availableSlots = await this.queryBus.execute(
    new GetAvailableTimeSlotsQuery(
      businessId.getValue(),
      offeringId.getValue(),
      date,
    ),
  );

  const buttons: Button[] = availableSlots.slice(0, 6).map((slot) => ({
    id: `time-${slot.startTime}`,
    title: this.formatTime(slot.startTime),
  }));

  await this.whatsappClient.sendInteractiveButtons(
    customerPhone,
    `Horarios disponibles para ${this.formatDate(date)}:`,
    buttons,
  );
}

private formatTime(time: string): string {
  // Convert "09:00" to "9:00 AM"
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

### 2. Booking → Notification Integration

#### 2.1 Replace Placeholder Commands

**Files:**

- `apps/backend/src/booking/app/event-handlers/on-appointment-created.ts`
- `apps/backend/src/booking/app/event-handlers/on-appointment-cancelled.ts`
- `apps/backend/src/booking/app/sagas/appointment-notification.ts`

**Current Code:**

```typescript
// Placeholder commands - these will be implemented in future bounded contexts
class ScheduleReminderCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly dateTime: Date,
  ) {}
}

class CancelReminderCommand {
  constructor(public readonly appointmentId: string) {}
}

class SendWhatsAppMessageCommand {
  constructor(
    public readonly customerId: string,
    public readonly message: string,
  ) {}
}
```

**Solution:**

Create real commands in their respective BCs:

**File:** `apps/backend/src/notification/app/commands/schedule-reminder/command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

export class ScheduleReminderCommand extends Command<{ reminderId: string }> {
  constructor(
    public readonly appointmentId: string,
    public readonly dateTime: Date,
  ) {
    super();
  }
}
```

**File:** `apps/backend/src/notification/app/commands/cancel-reminder/command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

export class CancelReminderCommand extends Command<void> {
  constructor(public readonly appointmentId: string) {
    super();
  }
}
```

**File:** `apps/backend/src/conversation/app/commands/send-whatsapp-message/command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

export class SendWhatsAppMessageCommand extends Command<{ messageId: string }> {
  constructor(
    public readonly customerId: string,
    public readonly message: string,
  ) {
    super();
  }
}
```

Then update imports in event handlers and sagas:

```typescript
import { ScheduleReminderCommand } from "@notification/app/commands/schedule-reminder/command";
import { CancelReminderCommand } from "@notification/app/commands/cancel-reminder/command";
import { SendWhatsAppMessageCommand } from "@conversation/app/commands/send-whatsapp-message/command";
```

#### 2.2 Get Customer Phone for Notifications

**File:** `apps/backend/src/booking/app/event-handlers/on-appointment-cancelled.ts`

**Current Code:**

```typescript
// Nota: En un escenario real, necesitaríamos obtener el customerId del appointment
// Por ahora, esto es un placeholder
await this.commandBus.execute(
  new SendWhatsAppMessageCommand(
    "customer-id-placeholder",
    "Tu cita ha sido cancelada",
  ),
);
```

**Solution:**

```typescript
@EventsHandler(AppointmentCancelled)
export class OnAppointmentCancelledHandler implements IEventHandler<AppointmentCancelled> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus, // ← Add QueryBus
  ) {}

  async handle(event: AppointmentCancelled): Promise<void> {
    try {
      // 1. Get appointment details to get customerId
      const appointment = await this.queryBus.execute(
        new GetAppointmentQuery(event.appointmentId),
      );

      // 2. Get customer details to get phone
      const customer = await this.queryBus.execute(
        new GetCustomerQuery(appointment.customerId),
      );

      // 3. Cancel reminder
      await this.commandBus.execute(
        new CancelReminderCommand(event.appointmentId),
      );

      // 4. Send WhatsApp notification with real customer phone
      await this.commandBus.execute(
        new SendWhatsAppMessageCommand(
          customer.whatsappPhone,
          `Tu cita del ${this.formatDate(appointment.dateTime)} ha sido cancelada.`,
        ),
      );
    } catch (error) {
      console.error("Error handling AppointmentCancelled:", error);
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
```

### 3. Customer → Appointment Count

#### 3.1 Customer Read Repository

**File:** `apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts`

**Current Code:**

```typescript
appointmentCount: 0, // TODO: Join with appointments table
```

**Solution:**

```typescript
async findByBusinessId(businessId: string): Promise<CustomerReadModel[]> {
  const queryBuilder = this.repository
    .createQueryBuilder('customer')
    .leftJoin(
      'appointments',
      'appointment',
      'appointment.customer_id = customer.id AND appointment.status != :cancelledStatus',
      { cancelledStatus: 'CANCELLED' },
    )
    .select([
      'customer.id',
      'customer.business_id',
      'customer.user_id',
      'customer.whatsapp_phone',
      'customer.name',
      'customer.created_at',
      'COUNT(appointment.id) as appointment_count',
    ])
    .where('customer.business_id = :businessId', { businessId })
    .groupBy('customer.id');

  const results = await queryBuilder.getRawMany();

  return results.map((row) => ({
    id: row.customer_id,
    businessId: row.customer_business_id,
    userId: row.customer_user_id,
    whatsappPhone: row.customer_whatsapp_phone,
    name: row.customer_name,
    createdAt: row.customer_created_at,
    appointmentCount: parseInt(row.appointment_count, 10),
  }));
}
```

#### 3.2 Customer Data Export

**File:** `apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts`

**Current Code:**

```typescript
// TODO: This requires cross-BC query - for now return empty array
// In production, this should query the appointments table
const appointments: CustomerDataExport["appointments"] = [];

// TODO: This requires cross-BC query - for now return empty array
// In production, this should query the conversations and messages tables
const conversations: CustomerDataExport["conversations"] = [];
```

**Solution:**

```typescript
async exportCustomerData(customerId: string): Promise<CustomerDataExport> {
  // 1. Load customer
  const customer = await this.repository.findOne({
    where: { id: customerId },
  });

  if (!customer) {
    throw new CustomerNotFoundException(customerId);
  }

  // 2. Load appointments (cross-BC query)
  const appointmentRows = await this.repository.manager.query(
    `
    SELECT
      a.id,
      a.date_time,
      a.status,
      o.name as offering_name,
      b.name as business_name
    FROM appointments a
    LEFT JOIN offerings o ON o.id = a.offering_id
    LEFT JOIN businesses b ON b.id = a.business_id
    WHERE a.customer_id = $1
    ORDER BY a.date_time DESC
    `,
    [customerId],
  );

  const appointments = appointmentRows.map((row: any) => ({
    id: row.id,
    dateTime: row.date_time,
    status: row.status,
    offeringName: row.offering_name,
    businessName: row.business_name,
  }));

  // 3. Load conversations (cross-BC query)
  const conversationRows = await this.repository.manager.query(
    `
    SELECT
      c.id,
      c.created_at,
      COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.customer_id = $1
    GROUP BY c.id
    ORDER BY c.created_at DESC
    `,
    [customerId],
  );

  const conversations = conversationRows.map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    messageCount: parseInt(row.message_count, 10),
  }));

  return {
    customer: {
      id: customer.id,
      businessId: customer.business_id,
      userId: customer.user_id,
      whatsappPhone: customer.whatsapp_phone,
      name: customer.name,
      createdAt: customer.created_at,
    },
    appointments,
    conversations,
  };
}
```

### 4. Customer Name from WhatsApp Profile

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Current Code:**

```typescript
/**
 * TODO (Task 7.3): Update customer name when obtained from WhatsApp profile
 *
 * When WhatsApp Business API provides customer name from profile:
 * 1. Extract name from webhook payload
 * 2. Execute UpdateCustomerInfoCommand
 * 3. Update Customer aggregate with new name
 */
```

**Solution:**

```typescript
async execute(command: ProcessIncomingMessageCommand): Promise<void> {
  // ... existing code

  // Extract customer name from WhatsApp profile if available
  const customerName = command.senderProfile?.name || null;

  // Identify or create customer
  const { customerId } = await this.commandBus.execute(
    new IdentifyCustomerCommand(
      businessId.getValue(),
      customerPhone,
      customerName, // ← Pass name from WhatsApp profile
    ),
  );

  // If customer already exists and name is different, update it
  if (customerName) {
    const existingCustomer = await this.queryBus.execute(
      new GetCustomerQuery(customerId),
    );

    if (existingCustomer && existingCustomer.name !== customerName) {
      await this.commandBus.execute(
        new UpdateCustomerInfoCommand(customerId, customerName),
      );
    }
  }

  // ... rest of the logic
}
```

Update command DTO to include profile:

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/command.ts`

```typescript
export class ProcessIncomingMessageCommand extends Command<void> {
  constructor(
    public readonly businessWhatsAppNumber: string,
    public readonly senderPhone: string,
    public readonly messageContent: string,
    public readonly senderProfile?: { name?: string }, // ← Add profile
  ) {
    super();
  }
}
```

## Implementation Order

1. **Phase 1:** Implement real Notification BC commands (ScheduleReminder, CancelReminder)
2. **Phase 2:** Implement SendWhatsAppMessage command in Conversation BC
3. **Phase 3:** Update Booking event handlers to use real commands
4. **Phase 4:** Integrate GetAvailableDates and GetAvailableTimeSlots in Conversation handler
5. **Phase 5:** Add appointment count joins in Customer read repository
6. **Phase 6:** Implement customer data export with cross-BC queries
7. **Phase 7:** Add WhatsApp profile name extraction and update

## Testing

### Integration Tests

- Test event handlers with real commands
- Test cross-BC queries
- Test customer data export

### E2E Tests

- Test full conversation flow with real availability queries
- Test appointment creation → notification flow
- Test appointment cancellation → notification flow

## Acceptance Criteria

- [ ] All placeholder commands replaced with real implementations
- [ ] Conversation handler uses real availability queries
- [ ] Event handlers use real customer data for notifications
- [ ] Customer read repository includes appointment counts
- [ ] Customer data export includes appointments and conversations
- [ ] WhatsApp profile name extraction works
- [ ] All tests pass
- [ ] No hardcoded data in handlers

## Notes

- Cross-BC queries are acceptable in read repositories (CQRS read side)
- Event handlers should use QueryBus to get data from other BCs
- Commands should be in their respective BCs
- Use proper error handling for cross-BC operations
