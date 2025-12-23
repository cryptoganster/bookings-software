# Console Logging Cleanup

**Priority:** P2 (Medium)  
**Estimated Effort:** 2-3 hours

## Overview

Replace `console.log`, `console.error`, and `console.warn` statements with proper NestJS Logger throughout the codebase.

## Why This Matters

- **Production Issues:** Console statements don't respect log levels
- **No Context:** Missing request IDs, timestamps, and context
- **Not Structured:** Can't be parsed by log aggregators
- **Performance:** Console is synchronous and blocks event loop

## Issues Found

### 1. Webhook Controller

**File:** `apps/backend/src/conversation/presentation/controllers/webhook.ts`

**Current:**

```typescript
} catch (error) {
  // Loggear el error pero responder con 200 para evitar reintentos de WhatsApp
  console.error('Error processing WhatsApp webhook:', error);
  return { status: 'error', message: 'Internal error' };
}
```

**Fix:**

```typescript
import { Logger } from '@nestjs/common';

export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  // ...

  } catch (error) {
    // Log error but respond with 200 to avoid WhatsApp retries
    this.logger.error('Error processing WhatsApp webhook', error.stack, {
      error: error.message,
      businessWhatsAppNumber: command.businessWhatsAppNumber,
      senderPhone: command.senderPhone,
    });
    return { status: 'error', message: 'Internal error' };
  }
}
```

### 2. Event Handlers

**Files:**

- `apps/backend/src/booking/app/event-handlers/on-appointment-created.ts`
- `apps/backend/src/booking/app/event-handlers/on-appointment-cancelled.ts`

**Current:**

```typescript
} catch (error) {
  // Log error pero no propagar - los event handlers no deben propagar errores
  console.error('Error handling AppointmentCreated:', error);
}
```

**Fix:**

```typescript
import { Logger } from "@nestjs/common";

@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  private readonly logger = new Logger(OnAppointmentCreatedHandler.name);

  // ...

  async handle(event: AppointmentCreated): Promise<void> {
    try {
      // ... logic
    } catch (error) {
      // Log error but don't propagate - event handlers should not throw
      this.logger.error("Error handling AppointmentCreated", error.stack, {
        appointmentId: event.appointmentId,
        businessId: event.businessId,
        error: error.message,
      });
    }
  }
}
```

### 3. Database Configuration

**File:** `apps/backend/src/config/database.ts`

**Current:**

```typescript
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
```

**Fix:**

```typescript
import { Logger } from "@nestjs/common";

const logger = new Logger("DatabaseConfig");

AppDataSource.initialize()
  .then(() => {
    logger.log("Data Source has been initialized!");
  })
  .catch((err) => {
    logger.error("Error during Data Source initialization", err.stack);
    process.exit(1); // Exit on database connection failure
  });
```

### 4. E2E Test Helpers

**File:** `apps/backend/src/test-utils/e2e-helpers/auth.ts`

**Current:**

```typescript
if (!body.token || !body.userId) {
  console.error(
    "Invalid registration response:",
    JSON.stringify(body, null, 2),
  );
  throw new Error(
    `Registration failed: Invalid response format. Got: ${JSON.stringify(body)}`,
  );
}
```

**Fix:**

For test utilities, `console.error` is acceptable for debugging, but we can improve it:

```typescript
if (!body.token || !body.userId) {
  const errorDetails = JSON.stringify(body, null, 2);
  // In tests, console is acceptable for debugging
  // But we can make it more structured
  console.error("[E2E Test] Invalid registration response:", {
    timestamp: new Date().toISOString(),
    body: errorDetails,
  });
  throw new Error(
    `Registration failed: Invalid response format. Got: ${JSON.stringify(body)}`,
  );
}
```

**Note:** For test utilities, `console` statements are acceptable as they're only used during testing.

### 5. Database Cleanup Helper

**File:** `apps/backend/src/test-utils/e2e-helpers/database.ts`

**Current:**

```typescript
if (error instanceof Error && error.message?.includes("does not exist")) {
  console.warn(`⚠️  Table ${entity.tableName} does not exist, skipping...`);
  continue;
}
```

**Fix:**

```typescript
if (error instanceof Error && error.message?.includes("does not exist")) {
  // In test utilities, console is acceptable
  console.warn(
    `[E2E Test] ⚠️  Table ${entity.tableName} does not exist, skipping...`,
  );
  continue;
}
```

### 6. Database Seeds

**Files:**

- `apps/backend/src/database/seeds/seed.ts`
- `apps/backend/src/database/seeds/account.seed.ts`
- `apps/backend/src/database/seeds/availability.seed.ts`
- `apps/backend/src/database/seeds/booking.seed.ts`

**Current:**

```typescript
console.log("📅 Seeding Availability BC...");
// ... seeding logic
console.log("✅ Availability BC seeded");
```

**Fix:**

For seed scripts, `console.log` is acceptable as they're CLI tools. However, we can improve structure:

```typescript
import { Logger } from "@nestjs/common";

const logger = new Logger("AvailabilitySeed");

export async function seedAvailability(/* ... */): Promise<void> {
  logger.log("📅 Seeding Availability BC...");

  // ... seeding logic

  logger.log(
    `✅ Availability BC seeded: ${capacities.length} capacity records (30 days)`,
  );
}
```

## Implementation Plan

### Phase 1: Production Code (Priority)

1. **Webhook Controller** - Replace console.error with Logger
2. **Event Handlers** - Replace console.error with Logger
3. **Database Config** - Replace console.log/error with Logger

### Phase 2: Test Utilities (Optional)

1. Add `[E2E Test]` prefix to console statements for clarity
2. Consider using Logger for consistency

### Phase 3: Seed Scripts (Optional)

1. Replace console.log with Logger for consistency
2. Keep colorful emojis for better CLI experience

## Logger Best Practices

### 1. Create Logger Instance

```typescript
import { Logger } from "@nestjs/common";

export class MyService {
  private readonly logger = new Logger(MyService.name);

  // Use this.logger.log(), this.logger.error(), etc.
}
```

### 2. Log Levels

```typescript
this.logger.log("Info message"); // General information
this.logger.error("Error message", stack); // Errors with stack trace
this.logger.warn("Warning message"); // Warnings
this.logger.debug("Debug message"); // Debug info (disabled in prod)
this.logger.verbose("Verbose message"); // Verbose info (disabled in prod)
```

### 3. Structured Logging

```typescript
this.logger.error("Error processing webhook", error.stack, {
  context: "WebhookController",
  businessId: event.businessId,
  customerId: event.customerId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

### 4. Context in Logs

```typescript
// ✅ Good - includes context
this.logger.error("Failed to create appointment", error.stack, {
  appointmentId: command.appointmentId,
  businessId: command.businessId,
  customerId: command.customerId,
});

// ❌ Bad - no context
this.logger.error("Failed to create appointment", error.stack);
```

## Testing

### Update Tests

Tests that spy on `console.error` need to be updated:

**Before:**

```typescript
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});
```

**After:**

```typescript
const loggerErrorSpy = jest
  .spyOn(Logger.prototype, "error")
  .mockImplementation(() => {});
```

## Acceptance Criteria

- [ ] All production code uses NestJS Logger
- [ ] No `console.log` in src/ (except test-utils and seeds)
- [ ] No `console.error` in src/ (except test-utils)
- [ ] No `console.warn` in src/ (except test-utils)
- [ ] All tests updated to spy on Logger instead of console
- [ ] All tests pass
- [ ] Logs include proper context

## Files to Update

### Production Code (Must Fix)

1. `apps/backend/src/conversation/presentation/controllers/webhook.ts`
2. `apps/backend/src/booking/app/event-handlers/on-appointment-created.ts`
3. `apps/backend/src/booking/app/event-handlers/on-appointment-cancelled.ts`
4. `apps/backend/src/config/database.ts`

### Test Code (Optional - Add Prefix)

1. `apps/backend/src/test-utils/e2e-helpers/auth.ts`
2. `apps/backend/src/test-utils/e2e-helpers/database.ts`
3. `apps/backend/src/business/presentation/controllers/__tests__/business.e2e.spec.ts`

### Seed Scripts (Optional - Use Logger)

1. `apps/backend/src/database/seeds/seed.ts`
2. `apps/backend/src/database/seeds/account.seed.ts`
3. `apps/backend/src/database/seeds/availability.seed.ts`
4. `apps/backend/src/database/seeds/booking.seed.ts`

### Tests to Update

1. `apps/backend/src/booking/app/event-handlers/__tests__/on-appointment-created.spec.ts`
2. `apps/backend/src/booking/app/event-handlers/__tests__/on-appointment-cancelled.spec.ts`
3. `apps/backend/src/booking/app/event-handlers/__tests__/on-appointment-created.pbt.spec.ts`

## Notes

- Test utilities can keep `console` statements (they're CLI tools)
- Seed scripts can keep `console` statements (they're CLI tools)
- Production code MUST use Logger
- Event handlers should log errors but not throw
- Webhook handlers should log errors but return 200 to avoid retries
