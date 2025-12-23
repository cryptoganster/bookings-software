# Test Fixes and Improvements

**Priority:** P2 (Medium)  
**Estimated Effort:** 1-2 days

## Overview

Fix incomplete or broken tests across the codebase.

## Issues

### 1. Conversation Flow E2E Test

**File:** `apps/backend/src/conversation/presentation/controllers/__tests__/conversation-flow.e2e.spec.ts`

**Issue:**

```typescript
// TODO: Fix this test - the handler is not sending confirmation after selecting a new time
// expect(confirmMessage).toBeDefined();

// TODO: Complete this test once the handler is fixed
// Cliente confirma con el nuevo horario
```

**Current State:**

- Test is incomplete
- Handler doesn't send confirmation message after time selection
- Test is commented out

**Root Cause:**
The `ProcessIncomingMessageHandler` needs to send a confirmation message after the user selects a new time in the modification flow.

**Solution:**

#### Step 1: Update Handler Logic

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

Add confirmation message after time selection in modification flow:

```typescript
private async handleModifyingAppointmentState(
  conversation: Conversation,
  messageContent: string,
  customerPhone: string,
): Promise<void> {
  const context = conversation.getContext();

  if (messageContent.startsWith('date-')) {
    // User selected new date
    const dateStr = messageContent.replace('date-', '');
    context.selectedDate = dateStr;
    conversation.updateContext(context);
    await this.sendTimeSelectionButtons(customerPhone, new Date(dateStr));
  } else if (messageContent.startsWith('time-')) {
    // User selected new time
    const timeStr = messageContent.replace('time-', '');
    context.selectedTime = timeStr;
    conversation.updateContext(context);

    // ✅ Send confirmation message
    const selectedDate = new Date(context.selectedDate);
    const confirmationMessage = this.buildConfirmationMessage(
      selectedDate,
      timeStr,
      context.selectedOffering,
    );

    await this.whatsappClient.sendInteractiveButtons(
      customerPhone,
      confirmationMessage,
      [
        { id: 'confirm-modify', title: 'Confirmar Cambio' },
        { id: 'cancel-modify', title: 'Cancelar' },
      ],
    );

    conversation.transitionToConfirmingModification();
  } else if (messageContent === 'confirm-modify') {
    // User confirmed modification
    await this.modifyAppointment(conversation, context);
    await this.whatsappClient.sendMessage(
      customerPhone,
      '✅ Tu cita ha sido modificada exitosamente.',
    );
    conversation.transitionToIdle();
  } else if (messageContent === 'cancel-modify') {
    // User cancelled modification
    await this.whatsappClient.sendMessage(
      customerPhone,
      'Modificación cancelada. Tu cita original se mantiene.',
    );
    conversation.transitionToIdle();
  }
}

private buildConfirmationMessage(
  date: Date,
  time: string,
  offeringName: string,
): string {
  const formattedDate = this.formatDate(date);
  return `
Confirma tu nueva cita:
📅 ${formattedDate}
🕐 ${time}
✂️ ${offeringName}

¿Deseas confirmar este cambio?
  `.trim();
}
```

#### Step 2: Add Conversation State

**File:** `apps/backend/src/conversation/domain/vo/conversation-state.ts`

Add new state for confirming modification:

```typescript
export class ConversationState extends ValueObject {
  private static readonly VALID_STATES = [
    "IDLE",
    "SELECTING_SERVICE",
    "SELECTING_DATE",
    "SELECTING_TIME",
    "CONFIRMING_APPOINTMENT",
    "MODIFYING_APPOINTMENT",
    "CONFIRMING_MODIFICATION", // ← Add this
    "AWAITING_ADMIN",
  ] as const;

  // ... rest of the implementation
}
```

#### Step 3: Update Test

**File:** `apps/backend/src/conversation/presentation/controllers/__tests__/conversation-flow.e2e.spec.ts`

Uncomment and complete the test:

```typescript
it("should allow customer to modify appointment", async () => {
  // ... existing setup code

  // Cliente selecciona nuevo horario
  sentMessages = [];
  await request(app.getHttpServer())
    .post("/api/webhooks/whatsapp")
    .send({
      from: customerPhone,
      body: "time-14:00",
    })
    .expect(200);

  // Verificar que se envió mensaje de confirmación
  expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalled();
  const confirmMessage = sentMessages.find((m) =>
    m.message.includes("Confirma tu nueva cita"),
  );
  expect(confirmMessage).toBeDefined();
  expect(confirmMessage?.message).toContain("14:00");

  // Cliente confirma el cambio
  sentMessages = [];
  await request(app.getHttpServer())
    .post("/api/webhooks/whatsapp")
    .send({
      from: customerPhone,
      body: "confirm-modify",
    })
    .expect(200);

  // Verificar que se envió confirmación de modificación
  expect(mockWhatsAppClient.sendMessage).toHaveBeenCalled();
  const successMessage = sentMessages.find((m) =>
    m.message.includes("modificada exitosamente"),
  );
  expect(successMessage).toBeDefined();

  // Verificar que se ejecutó ModifyAppointmentCommand
  expect(mockCommandBus.execute).toHaveBeenCalledWith(
    expect.objectContaining({
      constructor: { name: "ModifyAppointmentCommand" },
    }),
  );
});
```

### 2. Event Auto-Publishing Notes in Tests

**Files:**

- `apps/backend/src/customer/domain/aggregates/__tests__/customer.spec.ts`
- Multiple aggregate tests

**Issue:**

```typescript
// Note: Events are auto-published with autoCommit=true, so getUncommittedEvents() returns empty
// The event was published, but we can't check it in unit tests without EventBus integration
// We verify the aggregate state instead
```

**Current State:**

- Tests have notes explaining why events can't be verified
- Tests only verify aggregate state, not events

**Solution:**

This is actually **correct behavior** and doesn't need fixing. The notes are documentation.

However, we can improve the tests by adding integration tests that verify events:

**File:** `apps/backend/src/customer/domain/aggregates/__tests__/customer.integration.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { Customer } from "../customer";
import { UUID } from "@shared/vo/uuid";
import { WhatsAppPhone } from "@shared/vo/whatsapp-phone";
import { CustomerCreated } from "@customer/domain/events/customer-created";
import { CustomerNameUpdated } from "@customer/domain/events/customer-name-updated";

describe("Customer Aggregate - Event Publishing (Integration)", () => {
  let eventBus: EventBus;
  let publishedEvents: any[];

  beforeEach(async () => {
    publishedEvents = [];

    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
    }).compile();

    eventBus = module.get<EventBus>(EventBus);

    // Subscribe to all events
    eventBus.subscribe((event) => {
      publishedEvents.push(event);
    });
  });

  it("should publish CustomerCreated event when customer is created", () => {
    // Arrange
    const id = UUID.generate();
    const businessId = UUID.generate();
    const phone = WhatsAppPhone.create("+18095551234");

    // Act
    const customer = Customer.create(id, businessId, phone, "Juan Pérez");

    // Assert
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toBeInstanceOf(CustomerCreated);
    expect(publishedEvents[0].customerId).toBe(id.getValue());
  });

  it("should publish CustomerNameUpdated event when name is updated", () => {
    // Arrange
    const customer = Customer.create(
      UUID.generate(),
      UUID.generate(),
      WhatsAppPhone.create("+18095551234"),
      "Juan Pérez",
    );
    publishedEvents = []; // Clear creation event

    // Act
    customer.updateName("María García");

    // Assert
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toBeInstanceOf(CustomerNameUpdated);
    expect(publishedEvents[0].newName).toBe("María García");
  });
});
```

**Action:** Add integration tests for event publishing, keep unit tests as-is with notes.

### 3. Property-Based Test Documentation

**File:** `apps/backend/src/customer/presentation/controllers/__tests__/customer-merge.pbt.spec.ts`

**Issue:**

```typescript
/**
 * Property: Same UUID for source and target should fail validation
 * Note: This test documents expected behavior. If no custom validator exists yet,
 * this test will pass (no errors) but documents the business rule.
 */
```

**Current State:**

- Test documents expected behavior
- No custom validator implemented yet

**Solution:**

#### Option 1: Implement Custom Validator (Recommended)

**File:** `apps/backend/src/customer/presentation/dtos/validators/different-uuid.validator.ts`

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsDifferentFrom(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDifferentFrom",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value !== relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be different from ${relatedPropertyName}`;
        },
      },
    });
  };
}
```

**File:** `apps/backend/src/customer/presentation/dtos/merge-customer.ts`

```typescript
import { IsDifferentFrom } from "./validators/different-uuid.validator";

export class MergeCustomersDto {
  @IsUUID()
  @IsNotEmpty()
  sourceCustomerId!: string;

  @IsUUID()
  @IsNotEmpty()
  @IsDifferentFrom("sourceCustomerId", {
    message: "Target customer must be different from source customer",
  })
  targetCustomerId!: string;
}
```

#### Option 2: Keep as Documentation (If business logic handles it)

If the business logic in the command handler already validates this, keep the test as documentation and update the note:

```typescript
/**
 * Property: Same UUID for source and target should fail in business logic
 * Note: DTO validation allows same UUID (both are valid UUIDs).
 * The MergeCustomersHandler will reject this with CannotMergeSameCustomerException.
 */
```

**Recommendation:** Implement Option 1 (custom validator) for fail-fast validation.

### 4. DTO Validation Notes

**File:** `apps/backend/src/customer/presentation/dtos/__tests__/detect-duplicates.spec.ts`

**Issue:**

```typescript
// Note: class-transformer converts true to 1
// This passes validation as 1 is within range [0, 1]
expect(dto.threshold).toBe(1);
```

**Current State:**

- Test documents class-transformer behavior
- Boolean `true` is converted to number `1`

**Solution:**

This is **expected behavior** and doesn't need fixing. The note is documentation.

However, if we want stricter validation, we can add a custom validator:

**File:** `apps/backend/src/customer/presentation/dtos/detect-duplicates.dto.ts`

```typescript
import { IsNumber, Min, Max, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class DetectDuplicatesDto {
  @IsOptional()
  @Type(() => Number) // Explicit type conversion
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  threshold?: number = 0.8;
}
```

**Action:** Keep as-is with documentation note. The behavior is correct.

## Implementation Order

1. Fix conversation flow test (highest priority)
2. Add event publishing integration tests
3. Implement custom validator for merge customers (if desired)
4. Review and update other test documentation

## Testing

- Run all tests after fixes
- Verify E2E tests pass
- Verify integration tests pass
- Check test coverage

## Acceptance Criteria

- [ ] Conversation flow test passes completely
- [ ] Event publishing integration tests added
- [ ] Custom validator implemented (optional)
- [ ] All test documentation is accurate
- [ ] Test coverage maintained or improved

## Notes

- Some "TODOs" in tests are actually documentation notes
- Not all notes require code changes
- Focus on fixing broken/incomplete tests first
- Documentation notes can stay if behavior is correct
