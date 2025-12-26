# TODO Resolution Spec - Frontend

**Status:** Draft  
**Created:** December 23, 2024  
**Priority:** Medium

## Overview

This spec documents all TODO, FIXME, MOCK, PLACEHOLDER, console statements, and similar markers found in `apps/frontend` and provides a structured plan to resolve them.

## Summary Statistics

- **Total Markers Found:** ~25+
- **Critical (P0):** 0 tasks
- **High (P1):** 2 tasks (Temporary types, WebSocket businessId)
- **Medium (P2):** 3 tasks (Console logging, Placeholder actions, Mock data)
- **Low (P3):** 1 task (Documentation notes)

### Breakdown by Type

- **Temporary Types:** 4 types (Schedule, Blockout, Conversation, Message)
- **Console Statements:** 15+ occurrences (production code)
- **Placeholder Actions:** 4 actions (Edit, Merge, Delete, Export customer)
- **WebSocket TODO:** 1 critical issue (businessId missing)
- **Mock Data:** Test mocks (acceptable)
- **Documentation Notes:** 3 notes (correct as-is)

## Categories

The markers are organized into the following categories:

1. **Temporary Types** - Types defined in frontend waiting for backend implementation
2. **Console Logging** - Production code using console instead of proper logging
3. **Placeholder Actions** - UI actions not yet implemented
4. **WebSocket Issues** - Missing businessId integration
5. **Mock Data** - Test mocks (no action needed)
6. **Documentation Notes** - Explanatory comments (no action needed)

## Priority Levels

- **P0 (Critical):** Blocks core functionality or violates architecture
- **P1 (High):** Important for production readiness
- **P2 (Medium):** Nice to have, improves quality
- **P3 (Low):** Documentation or minor improvements

## Resolution Tasks

See individual task files:

- [temporary-types.md](./temporary-types.md) - P1, 1-2d
- [websocket-businessid.md](./websocket-businessid.md) - P1, 4h
- [console-logging.md](./console-logging.md) - P2, 2-3h
- [placeholder-actions.md](./placeholder-actions.md) - P2, 2-3d
- [mock-data.md](./mock-data.md) - P3, 0h (no action needed)

## Task Overview

| Task                                          | Priority | Effort | Status         | Files Affected |
| --------------------------------------------- | -------- | ------ | -------------- | -------------- |
| [Temporary Types](#temporary-types)           | P1       | 1-2d   | 🔴 Not Started | 1 file         |
| [WebSocket businessId](#websocket-businessid) | P1       | 4h     | 🔴 Not Started | 2 files        |
| [Console Logging](#console-logging)           | P2       | 2-3h   | 🔴 Not Started | 6 files        |
| [Placeholder Actions](#placeholder-actions)   | P2       | 2-3d   | 🔴 Not Started | 1 file         |
| [Mock Data](#mock-data)                       | P3       | 0h     | ✅ No Action   | Test files     |

## Detailed Findings

### 1. Temporary Types (P1)

**Location:** `apps/frontend/src/shared/api/types.ts`

**Issue:** 4 types defined in frontend waiting for backend implementation:

- `ScheduleReadModel` - TODO: Move to shared-types when backend implements schedules
- `BlockoutReadModel` - TODO: Move to shared-types when backend implements blockouts
- `ConversationReadModel` - TODO: Move to shared-types when backend implements conversations
- `MessageReadModel` - TODO: Move to shared-types when backend implements messages

**Impact:**

- Types duplicated between frontend and backend
- Risk of type drift
- Violates single source of truth principle

**Effort:** 1-2 days (depends on backend implementation)

**Action:** Wait for backend to implement these BCs, then move types to `@packages/shared-types`

---

### 2. WebSocket businessId (P1)

**Location:** `apps/frontend/src/shared/api/websocket.ts`

**Issue:**

```typescript
// TODO: WebSocket needs businessId but UserDto no longer has it
// Need to fetch business data first or pass businessId separately
// For now, using userId as fallback
console.warn("[WebSocket] Using userId as businessId (temporary)");
```

**Impact:**

- WebSocket multi-tenancy broken
- Events may be sent to wrong business
- Security risk (cross-tenant data leak)

**Effort:** 4 hours

**Action:**

1. Fetch business data after login
2. Store businessId in auth store
3. Use real businessId in WebSocket connection

---

### 3. Console Logging (P2)

**Locations:** 6 production files

**Files:**

1. `apps/frontend/src/pages/CustomerDetailPage/ui/CustomerDetailPage.tsx` (4 occurrences)
2. `apps/frontend/src/shared/api/client.ts` (3 occurrences)
3. `apps/frontend/src/shared/api/websocket.ts` (7 occurrences)
4. `apps/frontend/src/shared/hooks/useWebSocketEvents.ts` (4 occurrences)
5. `apps/frontend/src/shared/ui/ErrorBoundary/ErrorBoundary.tsx` (1 occurrence)
6. `apps/frontend/src/App.tsx` (2 occurrences)

**Total:** 21 console statements in production code

**Impact:**

- Poor observability
- No structured logging
- Can't filter/search logs effectively
- Performance impact in production

**Effort:** 2-3 hours

**Action:**

- Create logger utility (similar to backend)
- Replace all console statements
- Add log levels (debug, info, warn, error)
- Add context to logs

---

### 4. Placeholder Actions (P2)

**Location:** `apps/frontend/src/pages/CustomerDetailPage/ui/CustomerDetailPage.tsx`

**Issue:** 4 action handlers not implemented:

```typescript
const handleEdit = () => {
  // TODO: Implement edit functionality
  console.log("Edit customer:", id);
};

const handleMerge = () => {
  // TODO: Implement merge functionality
  console.log("Merge customer:", id);
};

const handleDelete = () => {
  // TODO: Implement delete functionality
  console.log("Delete customer:", id);
};

const handleExport = () => {
  // TODO: Implement export functionality
  console.log("Export customer data:", id);
};
```

**Impact:**

- Buttons visible but non-functional
- Poor UX (buttons do nothing)
- Misleading UI

**Effort:** 2-3 days

**Action:**

1. Implement edit customer modal/form
2. Implement merge customers flow
3. Implement delete customer with confirmation
4. Implement export customer data (CSV/JSON)

---

### 5. Mock Data (P3)

**Locations:** Test files only

**Files:**

- `apps/frontend/src/shared/api/__tests__/client.test.ts`
- `apps/frontend/src/shared/api/__tests__/websocket.test.ts`
- `apps/frontend/src/mocks/handlers.ts`
- Various component tests

**Impact:** None (test mocks are expected)

**Action:** No action needed - mocks are correct for testing

---

### 6. Documentation Notes (P3)

**Locations:** 3 files

**Notes:**

1. `apps/frontend/src/app/store/auth.store.ts` - Explains isAuthenticated computation
2. `apps/frontend/src/shared/hooks/useWebSocketEvents.ts` - Notes about future StatsCards queries (2 occurrences)

**Impact:** None (documentation is helpful)

**Action:** No action needed - keep as documentation

---

## Hardcoded Values

### API URLs (Acceptable)

**Locations:**

- `apps/frontend/src/shared/api/__tests__/client.test.ts` - Test expects `http://localhost:3000/api`
- `apps/frontend/src/mocks/handlers.ts` - MSW mock uses `http://localhost:3000/api`

**Status:** ✅ Acceptable - These are test/mock values, not production hardcoding

**Note:** Production uses `env.apiUrl` from environment variables

---

## Sprint Planning

### Sprint 1 (Week 1) - High Priority

- **Focus:** P1 items
- **Tasks:**
  - WebSocket businessId fix (P1, 4h)
  - Console Logging (P2, 2-3h) - Quick win

**Total:** ~1 day

### Sprint 2 (Week 2) - Medium Priority

- **Focus:** P2 items
- **Tasks:**
  - Placeholder Actions - Edit customer (P2, 1d)
  - Placeholder Actions - Merge customers (P2, 1d)

**Total:** ~2 days

### Sprint 3 (Week 3) - Complete Remaining

- **Focus:** Complete P2 items
- **Tasks:**
  - Placeholder Actions - Delete customer (P2, 4h)
  - Placeholder Actions - Export customer (P2, 4h)

**Total:** ~1 day

### Future (Post-MVP)

- **Focus:** P1 items dependent on backend
- **Tasks:**
  - Temporary Types - Move to shared-types (P1, 1-2d)
  - Requires backend to implement Schedule, Blockout, Conversation, Message BCs

**Total:** ~2 days (when backend ready)

---

## Next Steps

1. Review and prioritize each task file
2. Create implementation specs for P1 items
3. Schedule work in sprints
4. Track progress in tasks.md files
5. Update backend TODO resolution for Schedule/Blockout/Conversation/Message BCs

---

## Related Documents

- [Backend TODO Resolution](../todo-resolution/README.md)
- [Frontend Testing Conventions](../../steering/frontend-testing-conventions.md)
- [Import Conventions](../../steering/import-conventions.md)
