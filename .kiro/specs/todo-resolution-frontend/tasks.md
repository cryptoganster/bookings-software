# TODO Resolution - Frontend Task Tracking

**Status:** Planning  
**Last Updated:** December 23, 2024

## Task Overview

| Task                                          | Priority | Effort | Status         | Assignee |
| --------------------------------------------- | -------- | ------ | -------------- | -------- |
| [Temporary Types](#temporary-types)           | P1       | 1-2d   | 🔴 Not Started | -        |
| [WebSocket businessId](#websocket-businessid) | P1       | 4h     | 🔴 Not Started | -        |
| [Console Logging](#console-logging)           | P2       | 2-3h   | ✅ Complete    | Kiro     |
| [Placeholder Actions](#placeholder-actions)   | P2       | 2-3d   | 🔴 Not Started | -        |
| [Mock Data](#mock-data)                       | P3       | 0h     | ✅ No Action   | -        |

---

## Temporary Types

**Priority:** P1 | **Effort:** 1-2 days | **Status:** 🔴 Not Started

### Subtasks

#### Phase 1: Schedule & Blockout (Can do now!)

- [ ] Verify backend Availability BC is complete
- [ ] Check Schedule and Blockout types in backend
- [ ] Create types in `@packages/shared-types`
- [ ] Update frontend imports
- [ ] Remove temporary types from `apps/frontend/src/shared/api/types.ts`
- [ ] Run tests and verify

**Note:** ⚠️ Backend Availability BC is complete! This can be done immediately.

#### Phase 2: Conversation & Message (Wait for backend)

- [ ] Wait for backend Conversation BC implementation
- [ ] Wait for backend Message BC implementation
- [ ] Create types in `@packages/shared-types`
- [ ] Update frontend imports
- [ ] Remove temporary types from `apps/frontend/src/shared/api/types.ts`
- [ ] Run tests and verify

**Spec:** [temporary-types.md](./temporary-types.md)

---

## WebSocket businessId

**Priority:** P1 | **Effort:** 4 hours | **Status:** 🔴 Not Started

### Subtasks

#### Phase 1: Fetch Business Data

- [ ] Create `GetBusinessByOwnerIdQuery` in backend (if not exists)
- [ ] Create `useBusinesses` hook in frontend
- [ ] Fetch business data after login
- [ ] Handle multiple businesses (select first or show selector)

#### Phase 2: Update Auth Store

- [ ] Add `businessId` field to auth store
- [ ] Store businessId after login
- [ ] Clear businessId on logout
- [ ] Persist businessId in localStorage

#### Phase 3: Update WebSocket

- [ ] Remove temporary userId fallback
- [ ] Use real businessId from auth store
- [ ] Update WebSocket connection logic
- [ ] Add error handling for missing businessId

#### Phase 4: Testing

- [ ] Test WebSocket connection with real businessId
- [ ] Test multi-tenancy isolation
- [ ] Test reconnection after logout/login
- [ ] Verify events only received for correct business

**Spec:** [websocket-businessid.md](./websocket-businessid.md)

---

## Console Logging

**Priority:** P2 | **Effort:** 2-3 hours | **Status:** ✅ Complete

### Subtasks

#### Phase 1: Create Logger Utility

- [x] Create `apps/frontend/src/shared/lib/logger.ts`
- [x] Implement log levels (debug, info, warn, error)
- [x] Add structured context support
- [x] Add development/production mode detection
- [x] Add JSDoc documentation

#### Phase 2: Replace Console Statements

- [x] Replace in CustomerDetailPage.tsx (4 statements)
- [x] Replace in client.ts (3 statements)
- [x] Replace in websocket.ts (7 statements)
- [x] Replace in useWebSocketEvents.ts (4 statements)
- [x] Replace in ErrorBoundary.tsx (1 statement)
- [x] Replace in App.tsx (2 statements)

#### Phase 3: Testing

- [x] Test logger in development mode
- [x] Test logger in production build
- [x] Verify debug/info logs hidden in production
- [x] Verify warn/error logs always visible
- [x] Test structured context logging

#### Phase 4: Documentation

- [ ] Add logger usage to frontend conventions
- [ ] Update component documentation
- [ ] Add examples to README

**Completed:** December 23, 2024  
**Commit:** 1127384

**Spec:** [console-logging.md](./console-logging.md)

---

## Placeholder Actions

**Priority:** P2 | **Effort:** 2-3 days | **Status:** 🔴 Not Started

### Subtasks

#### Phase 1: Edit Customer

- [ ] Create EditCustomerModal component
- [ ] Create EditCustomerForm with validation
- [ ] Implement UpdateCustomerCommand in backend (if not exists)
- [ ] Create useUpdateCustomer mutation hook
- [ ] Wire up modal to button
- [ ] Add optimistic updates
- [ ] Add success/error notifications
- [ ] Add tests

#### Phase 2: Merge Customers

- [ ] Create MergeCustomersModal component
- [ ] Create customer search/select UI
- [ ] Implement MergeCustomersCommand in backend
- [ ] Create useMergeCustomers mutation hook
- [ ] Wire up modal to button
- [ ] Add confirmation dialog
- [ ] Add success/error notifications
- [ ] Add tests

#### Phase 3: Delete Customer

- [ ] Create DeleteCustomerModal component
- [ ] Add confirmation dialog with warnings
- [ ] Implement DeleteCustomerCommand in backend (if not exists)
- [ ] Create useDeleteCustomer mutation hook
- [ ] Wire up modal to button
- [ ] Add success/error notifications
- [ ] Redirect to customers list after delete
- [ ] Add tests

#### Phase 4: Export Customer

- [ ] Create ExportCustomerModal component
- [ ] Add format selection (CSV, JSON)
- [ ] Implement GetCustomerExportQuery in backend
- [ ] Create useExportCustomer query hook
- [ ] Generate file download
- [ ] Add success/error notifications
- [ ] Add tests

**Spec:** [placeholder-actions.md](./placeholder-actions.md)

---

## Mock Data

**Priority:** P3 | **Effort:** 0 hours | **Status:** ✅ No Action Needed

### Status

Mock data in test files is **correct and expected**. No action needed.

**Files:**

- `apps/frontend/src/shared/api/__tests__/client.test.ts`
- `apps/frontend/src/shared/api/__tests__/websocket.test.ts`
- `apps/frontend/src/mocks/handlers.ts`
- Various component tests

**Spec:** [mock-data.md](./mock-data.md)

---

## Sprint Planning

### Sprint 1 (Week 1) - Quick Wins

- **Focus:** High priority P1 items + Quick wins
- **Tasks:**
  - WebSocket businessId (P1, 4h)
  - Console Logging (P2, 2-3h)
  - Temporary Types - Phase 1: Schedule/Blockout (P1, 4h)

**Total:** ~1.5 days

### Sprint 2 (Week 2) - Customer Actions Part 1

- **Focus:** Medium priority P2 items
- **Tasks:**
  - Placeholder Actions - Edit customer (P2, 1d)
  - Placeholder Actions - Merge customers (P2, 1d)

**Total:** ~2 days

### Sprint 3 (Week 3) - Customer Actions Part 2

- **Focus:** Complete P2 items
- **Tasks:**
  - Placeholder Actions - Delete customer (P2, 4h)
  - Placeholder Actions - Export customer (P2, 4h)

**Total:** ~1 day

### Future (Post-MVP) - Backend Dependent

- **Focus:** Complete P1 items when backend ready
- **Tasks:**
  - Temporary Types - Phase 2: Conversation/Message (P1, 4h)

**Total:** ~0.5 days (when backend ready)

---

## Progress Tracking

### Completed Tasks

_None yet_

### In Progress

_None yet_

### Blocked

- Temporary Types - Phase 2 (waiting for backend Conversation/Message BC)

---

## Dependencies

### Backend Dependencies

| Frontend Task                          | Backend Requirement       | Status             |
| -------------------------------------- | ------------------------- | ------------------ |
| Temporary Types - Schedule/Blockout    | Availability BC complete  | ✅ Ready           |
| Temporary Types - Conversation/Message | Conversation BC complete  | ⏳ Waiting         |
| WebSocket businessId                   | GetBusinessByOwnerIdQuery | ❓ Check           |
| Edit Customer                          | UpdateCustomerCommand     | ❓ Check           |
| Merge Customers                        | MergeCustomersCommand     | ❌ Not implemented |
| Delete Customer                        | DeleteCustomerCommand     | ❓ Check           |
| Export Customer                        | GetCustomerExportQuery    | ❌ Not implemented |

**Action:** Verify backend commands/queries exist before implementing frontend

---

## Notes

- P1 tasks should be completed for MVP (except backend-dependent)
- P2 tasks can be deferred if needed but improve UX significantly
- P3 tasks require no action
- Update this file as tasks progress
- Link to implementation PRs when available
- Coordinate with backend team on dependencies

---

## Related Documents

- [README.md](./README.md) - Overview
- [console-logging.md](./console-logging.md)
- [temporary-types.md](./temporary-types.md)
- [websocket-businessid.md](./websocket-businessid.md)
- [placeholder-actions.md](./placeholder-actions.md)
- [Backend TODO Resolution](../todo-resolution/README.md)
