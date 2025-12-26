# TODO Resolution - Task Tracking

**Status:** Planning  
**Last Updated:** December 23, 2024

## Task Overview

| Task                                                  | Priority | Effort | Status           | Assignee |
| ----------------------------------------------------- | -------- | ------ | ---------------- | -------- |
| [Deprecated Code](#deprecated-code)                   | P1       | 2h     | ✅ **COMPLETED** | Kiro     |
| [Console Logging](#console-logging)                   | P2       | 2-3h   | ✅ **COMPLETED** | Kiro     |
| [Conversation Persistence](#conversation-persistence) | P0       | 2-3d   | 🔴 Not Started   | -        |
| [Cross-BC Integration](#cross-bc-integration)         | P1       | 3-4d   | 🔴 Not Started   | -        |
| [Test Fixes](#test-fixes)                             | P2       | 1-2d   | 🔴 Not Started   | -        |

## Deprecated Code

**Priority:** P1 | **Effort:** 2 hours | **Status:** ✅ **COMPLETED**

### Subtasks

- [x] Find all usages of deprecated WhatsApp Phone VO
- [x] Update imports to use @shared/vo/whatsapp-phone
- [x] Find all usages of deprecated InvalidWhatsAppPhoneException
- [x] Update imports to use @shared/kernel/exceptions/invalid-whatsapp-phone
- [x] Delete deprecated files
- [x] Run tests and verify

**Completion Date:** December 23, 2024

**Files Updated:** 15 files
**Files Deleted:** 2 files (deprecated barrel exports)

**Verification:**

- ✅ TypeScript compilation successful
- ✅ ESLint passed (0 errors, 10 pre-existing warnings)
- ✅ All imports updated to use @shared paths
- ✅ Deprecated files removed

**Spec:** [deprecated-code.md](./deprecated-code.md)

---

## Conversation Persistence

**Priority:** P0 | **Effort:** 2-3 days | **Status:** 🔴 Not Started

### Subtasks

#### Phase 1: Database Schema

- [ ] Create CreateConversationsTable migration
- [ ] Create CreateMessagesTable migration
- [ ] Run migrations
- [ ] Verify tables created

#### Phase 2: TypeORM Models

- [ ] Create ConversationModel
- [ ] Create MessageModel
- [ ] Add relationships
- [ ] Verify models

#### Phase 3: Mappers

- [ ] Create ConversationWriteMapper
- [ ] Create MessageWriteMapper
- [ ] Add tests for mappers

#### Phase 4: Real Repository

- [ ] Implement ConversationWriteRepository
- [ ] Add optimistic locking
- [ ] Add integration tests

#### Phase 5: Update Factory

- [ ] Update ConversationFactory to use TypeORM
- [ ] Implement loadById
- [ ] Implement loadByCustomerIdAndBusinessId
- [ ] Add tests

#### Phase 6: Update Handler

- [ ] Update ProcessIncomingMessageHandler to use factory
- [ ] Remove direct repository usage
- [ ] Update tests

#### Phase 7: Update Module

- [ ] Remove mock repository
- [ ] Register real implementations
- [ ] Verify DI works

#### Phase 8: Testing

- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Verify no CQRS violations

**Spec:** [conversation-persistence.md](./conversation-persistence.md)

---

## Cross-BC Integration

**Priority:** P1 | **Effort:** 3-4 days | **Status:** 🔴 Not Started

### Subtasks

#### Phase 1: Notification BC Commands

- [ ] Create ScheduleReminderCommand
- [ ] Create ScheduleReminderHandler
- [ ] Create CancelReminderCommand
- [ ] Create CancelReminderHandler
- [ ] Add tests

#### Phase 2: Conversation BC Commands

- [ ] Create SendWhatsAppMessageCommand
- [ ] Create SendWhatsAppMessageHandler
- [ ] Add tests

#### Phase 3: Update Booking Event Handlers

- [ ] Update OnAppointmentCreatedHandler
- [ ] Update OnAppointmentCancelledHandler
- [ ] Update AppointmentNotificationSaga
- [ ] Add customer phone lookup
- [ ] Add tests

#### Phase 4: Availability Integration

- [ ] Integrate GetAvailableDatesQuery in conversation handler
- [ ] Integrate GetAvailableTimeSlotsQuery in conversation handler
- [ ] Add date/time formatting helpers
- [ ] Add tests

#### Phase 5: Customer Enhancements

- [ ] Add appointment count joins in customer read repository
- [ ] Implement customer data export with cross-BC queries
- [ ] Add WhatsApp profile name extraction
- [ ] Add tests

**Spec:** [cross-bc-integration.md](./cross-bc-integration.md)

---

## Test Fixes

**Priority:** P2 | **Effort:** 1-2 days | **Status:** 🔴 Not Started

### Subtasks

#### Conversation Flow Test

- [ ] Update ProcessIncomingMessageHandler to send confirmation
- [ ] Add CONFIRMING_MODIFICATION state
- [ ] Uncomment and complete test
- [ ] Verify test passes

#### Event Publishing Tests

- [ ] Create customer.integration.spec.ts
- [ ] Add event publishing tests
- [ ] Verify events are published correctly

#### Custom Validators (Optional)

- [ ] Create IsDifferentFrom validator
- [ ] Apply to MergeCustomersDto
- [ ] Update tests

**Spec:** [test-fixes.md](./test-fixes.md)

---

## Console Logging

**Priority:** P2 | **Effort:** 2-3 hours | **Status:** ✅ **COMPLETED**

### Subtasks

#### Production Code

- [x] Replace console.error in webhook controller with Logger
- [x] Replace console.error in OnAppointmentCreatedHandler with Logger
- [x] Replace console.error in OnAppointmentCancelledHandler with Logger
- [x] Replace console.log/error in database config with Logger

#### Test Code (Optional)

- [ ] Add [E2E Test] prefix to console statements in test utilities
- [ ] Update tests that spy on console to spy on Logger

#### Seed Scripts (Optional)

- [ ] Replace console.log with Logger in seed scripts
- [ ] Keep emojis for better CLI experience

**Completion Date:** December 23, 2024

**Files Updated:** 4 production files

- `apps/backend/src/conversation/presentation/controllers/webhook.ts`
- `apps/backend/src/booking/app/event-handlers/on-appointment-created.ts`
- `apps/backend/src/booking/app/event-handlers/on-appointment-cancelled.ts`
- `apps/backend/src/config/database.ts`

**Verification:**

- ✅ TypeScript compilation successful
- ✅ ESLint passed (0 errors, 10 pre-existing warnings)
- ✅ All production code uses NestJS Logger
- ✅ Structured logging with context added

**Note:** Test utilities and seed scripts still use console statements (acceptable for CLI tools)

**Spec:** [console-logging.md](./console-logging.md)

---

## Sprint Planning

### Sprint 1 (Week 1)

- **Focus:** Critical P0 items + Quick wins
- **Tasks:**
  - Conversation Persistence (P0, 2-3d)
  - Deprecated Code (P1, 2h) - Quick win
  - Console Logging (P2, 2-3h) - Quick win

### Sprint 2 (Week 2)

- **Focus:** High priority P1 items
- **Tasks:**
  - Cross-BC Integration - Phases 1-3 (Notification & WhatsApp commands)
  - Cross-BC Integration - Phase 4 (Availability queries)

### Sprint 3 (Week 3)

- **Focus:** Complete P1 and P2 items
- **Tasks:**
  - Cross-BC Integration - Phase 5 (Customer enhancements)
  - Test Fixes (P2, 1-2d)

---

## Progress Tracking

### Completed Tasks

- ✅ **Deprecated Code** (P1, 2h) - December 23, 2024
  - Updated 15 files to use @shared imports
  - Deleted 2 deprecated barrel export files
  - All tests passing, TypeScript clean
- ✅ **Console Logging** (P2, 2-3h) - December 23, 2024
  - Replaced console statements with NestJS Logger in 4 production files
  - Added structured logging with context
  - TypeScript and ESLint clean

### In Progress

_None yet_

### Blocked

_None yet_

---

## Notes

- P0 tasks must be completed before production
- P1 tasks should be completed for MVP
- P2 tasks can be deferred if needed
- Update this file as tasks progress
- Link to implementation PRs when available

---

## Related Documents

- [README.md](./README.md) - Overview
- [deprecated-code.md](./deprecated-code.md)
- [conversation-persistence.md](./conversation-persistence.md)
- [cross-bc-integration.md](./cross-bc-integration.md)
- [test-fixes.md](./test-fixes.md)
