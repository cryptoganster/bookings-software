# Console Logging - Frontend

**Priority:** P2 (Medium)  
**Effort:** 2-3 hours  
**Status:** Not Started

## Problem

Production code uses `console.log`, `console.error`, `console.warn` instead of proper logging utility.

**Total:** 21 console statements in 6 production files

## Impact

- ❌ Poor observability in production
- ❌ No structured logging
- ❌ Can't filter/search logs effectively
- ❌ No log levels or context
- ❌ Performance impact (console is slow)
- ❌ Can't disable logs in production

## Files Affected

### 1. CustomerDetailPage.tsx (4 occurrences)

**Location:** `apps/frontend/src/pages/CustomerDetailPage/ui/CustomerDetailPage.tsx`

```typescript
const handleEdit = () => {
  // TODO: Implement edit functionality
  console.log("Edit customer:", id); // ← Line 62
};

const handleMerge = () => {
  // TODO: Implement merge functionality
  console.log("Merge customer:", id); // ← Line 67
};

const handleDelete = () => {
  // TODO: Implement delete functionality
  console.log("Delete customer:", id); // ← Line 72
};

const handleExport = () => {
  // TODO: Implement export functionality
  console.log("Export customer data:", id); // ← Line 77
};
```

### 2. client.ts (3 occurrences)

**Location:** `apps/frontend/src/shared/api/client.ts`

```typescript
// Line 33
console.error("Error parsing auth storage:", error);

// Line 61
console.error("Resource not found:", error.config?.url);

// Line 66
console.error("Server error:", error.message);
```

### 3. websocket.ts (7 occurrences)

**Location:** `apps/frontend/src/shared/api/websocket.ts`

```typescript
// Line 79
console.warn("[WebSocket] Cannot connect: no user");

// Line 86
console.warn("[WebSocket] Using userId as businessId (temporary)");

// Line 90
console.log("[WebSocket] Already connected");

// Line 109
console.log("[WebSocket] ✅ Connected");

// Line 113
console.log("[WebSocket] ❌ Disconnected:", reason);

// Line 117
console.error("[WebSocket] Connection error:", error);

// Line 135
console.log("[WebSocket] Disconnecting...");
```

### 4. useWebSocketEvents.ts (4 occurrences)

**Location:** `apps/frontend/src/shared/hooks/useWebSocketEvents.ts`

```typescript
// Line 61
console.warn("[useWebSocketEvents] No WebSocket connection available");

// Line 65
console.log("[useWebSocketEvents] Subscribing to WebSocket events");

// Line 76
console.log("[WebSocket] 📨 Appointment created:", data);

// Line 97
console.log("[WebSocket] 📨 Appointment cancelled:", data);

// Line 120
console.log("[WebSocket] 📨 Appointment modified:", data);

// Line 137
console.log("[useWebSocketEvents] Unsubscribing from WebSocket events");
```

### 5. ErrorBoundary.tsx (1 occurrence)

**Location:** `apps/frontend/src/shared/ui/ErrorBoundary/ErrorBoundary.tsx`

```typescript
// Line 28
console.error("Error Boundary caught:", error, errorInfo);
```

### 6. App.tsx (2 occurrences)

**Location:** `apps/frontend/src/App.tsx`

```typescript
// Line 40
console.log("[App] User authenticated, connecting WebSocket...");

// Line 43
console.log("[App] User not authenticated, disconnecting WebSocket...");
```

---

## Solution

### Step 1: Create Logger Utility

Create `apps/frontend/src/shared/lib/logger.ts`:

````typescript
/**
 * Frontend Logger Utility
 *
 * Provides structured logging with log levels and context.
 * Automatically disabled in production (except errors).
 *
 * Usage:
 * ```ts
 * import { logger } from '@shared/lib/logger';
 *
 * logger.debug('Debug message', { userId: '123' });
 * logger.info('Info message', { action: 'login' });
 * logger.warn('Warning message', { reason: 'timeout' });
 * logger.error('Error message', { error: err });
 * ```
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Debug level - Only in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Info level - Only in development
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || "");
    }
  }

  /**
   * Warning level - Always logged
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Error level - Always logged
   * Use for error events
   */
  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, context || "");
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End log group (development only)
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
````

### Step 2: Replace Console Statements

#### 2.1 CustomerDetailPage.tsx

**Before:**

```typescript
const handleEdit = () => {
  console.log("Edit customer:", id);
};
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

const handleEdit = () => {
  logger.debug("Edit customer action triggered", { customerId: id });
};
```

#### 2.2 client.ts

**Before:**

```typescript
console.error("Error parsing auth storage:", error);
console.error("Resource not found:", error.config?.url);
console.error("Server error:", error.message);
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

logger.error("Error parsing auth storage", { error });
logger.error("Resource not found", { url: error.config?.url });
logger.error("Server error", {
  message: error.message,
  status: error.response?.status,
});
```

#### 2.3 websocket.ts

**Before:**

```typescript
console.warn("[WebSocket] Cannot connect: no user");
console.log("[WebSocket] ✅ Connected");
console.error("[WebSocket] Connection error:", error);
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

logger.warn("WebSocket: Cannot connect - no user authenticated");
logger.info("WebSocket: Connected successfully");
logger.error("WebSocket: Connection error", { error });
```

#### 2.4 useWebSocketEvents.ts

**Before:**

```typescript
console.log("[WebSocket] 📨 Appointment created:", data);
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

logger.info("WebSocket: Appointment created event received", {
  appointmentId: data.appointmentId,
  customerId: data.customerId,
});
```

#### 2.5 ErrorBoundary.tsx

**Before:**

```typescript
console.error("Error Boundary caught:", error, errorInfo);
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

logger.error("Error Boundary caught error", {
  error: error.message,
  stack: error.stack,
  componentStack: errorInfo.componentStack,
});
```

#### 2.6 App.tsx

**Before:**

```typescript
console.log("[App] User authenticated, connecting WebSocket...");
```

**After:**

```typescript
import { logger } from "@shared/lib/logger";

logger.info("App: User authenticated, connecting WebSocket", {
  userId: user?.id,
});
```

---

## Implementation Steps

### Phase 1: Create Logger (30 min)

- [ ] Create `apps/frontend/src/shared/lib/logger.ts`
- [ ] Add TypeScript types
- [ ] Add JSDoc documentation
- [ ] Export logger instance

### Phase 2: Replace Console Statements (1.5 hours)

- [ ] Replace in CustomerDetailPage.tsx (4 statements)
- [ ] Replace in client.ts (3 statements)
- [ ] Replace in websocket.ts (7 statements)
- [ ] Replace in useWebSocketEvents.ts (4 statements)
- [ ] Replace in ErrorBoundary.tsx (1 statement)
- [ ] Replace in App.tsx (2 statements)

### Phase 3: Testing (30 min)

- [ ] Test logger in development mode
- [ ] Test logger in production build
- [ ] Verify debug/info logs hidden in production
- [ ] Verify warn/error logs always visible
- [ ] Test structured context logging

### Phase 4: Documentation (30 min)

- [ ] Add logger usage to frontend conventions
- [ ] Update component documentation
- [ ] Add examples to README

---

## Testing

### Manual Testing

```bash
# Development mode (all logs visible)
pnpm dev:frontend

# Production build (only warn/error visible)
pnpm build:frontend
pnpm preview
```

### Expected Behavior

**Development:**

- ✅ All log levels visible (debug, info, warn, error)
- ✅ Structured context displayed
- ✅ Prefixes visible ([DEBUG], [INFO], etc.)

**Production:**

- ❌ Debug logs hidden
- ❌ Info logs hidden
- ✅ Warning logs visible
- ✅ Error logs visible

---

## Acceptance Criteria

- [ ] Logger utility created with all log levels
- [ ] All 21 console statements replaced
- [ ] Structured context added to all logs
- [ ] Debug/info logs hidden in production
- [ ] Warn/error logs always visible
- [ ] No console.\* statements in production code
- [ ] Tests pass
- [ ] Documentation updated

---

## Benefits

✅ **Structured Logging:** Context objects instead of string concatenation  
✅ **Log Levels:** Filter by severity (debug, info, warn, error)  
✅ **Production Ready:** Auto-disable verbose logs in production  
✅ **Performance:** Conditional logging reduces overhead  
✅ **Searchable:** Structured context makes logs searchable  
✅ **Consistent:** Same logging pattern across frontend

---

## Future Enhancements (Post-MVP)

1. **Remote Logging:** Send errors to Sentry/LogRocket
2. **Log Aggregation:** Collect logs in centralized service
3. **User Context:** Automatically add userId to all logs
4. **Performance Metrics:** Log component render times
5. **Network Logs:** Log all API requests/responses

---

## Related Tasks

- [Placeholder Actions](./placeholder-actions.md) - Will use logger for action tracking
- [WebSocket businessId](./websocket-businessid.md) - Will use logger for WebSocket events
