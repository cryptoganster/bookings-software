# TODO Resolution - Frontend Executive Summary

**Date:** December 23, 2024  
**Status:** Planning Complete  
**Total Items:** 25+ markers found

## Quick Overview

Comprehensive audit of `apps/frontend` found **25+ TODO, console statements, and placeholder markers**. All have been documented, categorized, and prioritized with implementation plans.

## Critical Findings

### No P0 (Critical) Items ✅

Frontend has no critical blockers. All issues are P1 (High) or P2 (Medium) priority.

---

## High Priority (P1)

### 1. Temporary Types in Frontend

**Impact:** Type duplication, risk of drift

**Issue:** 4 types defined in frontend waiting for backend:

- `ScheduleReadModel` - Waiting for Availability BC
- `BlockoutReadModel` - Waiting for Availability BC
- `ConversationReadModel` - Waiting for Conversation BC
- `MessageReadModel` - Waiting for Conversation BC

**Location:** `apps/frontend/src/shared/api/types.ts`

**Effort:** 1-2 days (depends on backend)

**Action:** Wait for backend BCs, then move to `@packages/shared-types`

**Note:** ⚠️ Backend Availability BC is now complete! Schedule and Blockout types can be moved immediately.

### 2. WebSocket businessId Missing

**Impact:** Multi-tenancy broken, security risk

**Issue:** WebSocket uses `userId` as fallback instead of real `businessId`

```typescript
// TODO: WebSocket needs businessId but UserDto no longer has it
console.warn("[WebSocket] Using userId as businessId (temporary)");
```

**Location:** `apps/frontend/src/shared/api/websocket.ts`

**Risk:**

- Events sent to wrong business
- Cross-tenant data leak
- WebSocket rooms not isolated

**Effort:** 4 hours

**Action:**

1. Fetch business data after login
2. Store businessId in auth store
3. Use real businessId in WebSocket

---

## Medium Priority (P2)

### 3. Console Logging in Production

**Impact:** Poor observability, no structured logging

**Issue:** 21 console statements in 6 production files:

- CustomerDetailPage.tsx (4)
- client.ts (3)
- websocket.ts (7)
- useWebSocketEvents.ts (4)
- ErrorBoundary.tsx (1)
- App.tsx (2)

**Effort:** 2-3 hours

**Action:** Create logger utility, replace all console statements

### 4. Placeholder Actions

**Impact:** Non-functional UI buttons, poor UX

**Issue:** 4 customer actions not implemented:

- Edit customer
- Merge customers
- Delete customer
- Export customer data

**Location:** `apps/frontend/src/pages/CustomerDetailPage/ui/CustomerDetailPage.tsx`

**Effort:** 2-3 days

**Action:** Implement each action with proper UI/UX

---

## Low Priority (P3)

### 5. Mock Data (No Action Needed)

**Status:** ✅ Acceptable

**Issue:** Test files use mocks (MSW, vi.mock)

**Action:** None - mocks are correct for testing

### 6. Documentation Notes (No Action Needed)

**Status:** ✅ Acceptable

**Issue:** 3 explanatory comments in code

**Action:** None - documentation is helpful

---

## Sprint Plan

### Sprint 1 (Week 1) - Quick Wins

- ✅ WebSocket businessId (P1, 4h)
- ✅ Console Logging (P2, 2-3h)

**Total:** ~1 day

### Sprint 2 (Week 2) - Customer Actions

- ✅ Edit customer (P2, 1d)
- ✅ Merge customers (P2, 1d)

**Total:** ~2 days

### Sprint 3 (Week 3) - Complete Remaining

- ✅ Delete customer (P2, 4h)
- ✅ Export customer (P2, 4h)

**Total:** ~1 day

### Future (Post-MVP) - Backend Dependent

- ✅ Move Schedule/Blockout types to shared-types (P1, 4h) - **Can do now!**
- ⏳ Move Conversation/Message types (P1, 4h) - Wait for backend

**Total:** ~1 day (when backend ready)

---

## Risk Assessment

| Risk                              | Severity  | Mitigation                               |
| --------------------------------- | --------- | ---------------------------------------- |
| WebSocket multi-tenancy broken    | 🟡 Medium | Fix businessId integration (4h)          |
| Type drift (Schedule/Blockout)    | 🟡 Medium | Move to shared-types now (backend ready) |
| Type drift (Conversation/Message) | 🟡 Medium | Wait for backend, then move              |
| Console logging                   | 🟢 Low    | Works but poor observability             |
| Placeholder actions               | 🟢 Low    | Buttons visible but non-functional       |

---

## Recommendations

### Immediate Actions (This Week)

1. **Fix WebSocket businessId** (P1) - Security/multi-tenancy issue
2. **Move Schedule/Blockout types** (P1) - Backend is ready!
3. **Fix Console Logging** (P2) - Quick win, 2-3 hours

### Next Week

4. **Implement Customer Actions** (P2) - Edit and Merge

### Following Week

5. **Complete Customer Actions** (P2) - Delete and Export

### Future (When Backend Ready)

6. **Move Conversation/Message types** (P1) - Wait for backend

---

## Success Metrics

- [ ] Zero P1 items remaining (except backend-dependent)
- [ ] All production code uses Logger (no console statements)
- [ ] WebSocket uses real businessId
- [ ] Schedule/Blockout types moved to shared-types
- [ ] All customer actions implemented
- [ ] Tests pass
- [ ] No type duplication

---

## Comparison: Backend vs Frontend

| Aspect                 | Backend                      | Frontend                |
| ---------------------- | ---------------------------- | ----------------------- |
| **Total Markers**      | 60+                          | 25+                     |
| **Critical (P0)**      | 1 (Conversation persistence) | 0                       |
| **High (P1)**          | 2                            | 2                       |
| **Medium (P2)**        | 2                            | 2                       |
| **Console Statements** | 4 files                      | 6 files (21 statements) |
| **Effort**             | ~9 days                      | ~4 days                 |

**Frontend is in better shape than backend!** ✅

---

## Files Created

All documentation in `.kiro/specs/todo-resolution-frontend/`:

1. **README.md** - Overview and summary
2. **console-logging.md** - Logger implementation
3. **temporary-types.md** - Type migration plan
4. **websocket-businessid.md** - WebSocket fix
5. **placeholder-actions.md** - Customer actions
6. **tasks.md** - Detailed task tracking
7. **EXECUTIVE-SUMMARY.md** - This document

---

## Next Steps

1. **Review** this summary with team
2. **Prioritize** P1 items for immediate work
3. **Coordinate** with backend team on Conversation/Message BC
4. **Assign** tasks to developers
5. **Track** progress in tasks.md
6. **Start** with Sprint 1 (WebSocket + Console Logging)

---

## Questions?

See individual spec files for detailed implementation plans, code examples, and acceptance criteria.

**Contact:** Development Team  
**Last Updated:** December 23, 2024
