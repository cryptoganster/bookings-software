# Frontend Enhancements - Tasks

**Date:** December 22, 2024  
**Status:** Planning  
**Branch:** `feat/frontend-enhancements`

---

## Task Breakdown

### Phase 1: Backend Controllers & APIs (Days 1-3)

#### Task 1.1: Offering BC Controllers

**Priority:** HIGH  
**Estimated Time:** 4 hours

- [ ] Create `OfferingCrudController`
  - [ ] GET `/api/offerings` - List all offerings
  - [ ] GET `/api/offerings/active` - List active offerings
  - [ ] GET `/api/offerings/:id` - Get offering by ID
  - [ ] POST `/api/offerings` - Create offering
  - [ ] PUT `/api/offerings/:id` - Update offering
  - [ ] DELETE `/api/offerings/:id` - Deactivate offering
  - [ ] PATCH `/api/offerings/:id/active` - Toggle active status

- [ ] Create DTOs
  - [ ] `CreateOfferingDto`
  - [ ] `UpdateOfferingDto`
  - [ ] `ToggleActiveDto`

- [ ] Add to `OfferingModule`
  - [ ] Register controller
  - [ ] Export necessary providers

- [ ] Create E2E tests
  - [ ] Test all CRUD operations
  - [ ] Test authorization
  - [ ] Test validation

**Files to Create:**

```
apps/backend/src/offering/presentation/controllers/
├── offering-crud.controller.ts
└── dtos/
    ├── create-offering.dto.ts
    ├── update-offering.dto.ts
    └── toggle-active.dto.ts

apps/backend/src/offering/app/__tests__/
└── offering-crud.e2e.spec.ts
```

---

#### Task 1.2: Availability BC Controllers

**Priority:** HIGH  
**Estimated Time:** 6 hours

- [ ] Create `ScheduleCrudController`
  - [ ] GET `/api/schedules` - List schedules
  - [ ] POST `/api/schedules` - Create schedule
  - [ ] PUT `/api/schedules/:id` - Update schedule
  - [ ] DELETE `/api/schedules/:id` - Delete schedule

- [ ] Create `BlockoutCrudController`
  - [ ] GET `/api/blockouts` - List blockouts
  - [ ] POST `/api/blockouts` - Create blockout
  - [ ] DELETE `/api/blockouts/:id` - Delete blockout

- [ ] Create `AvailabilityQueryController`
  - [ ] GET `/api/availability/dates` - Get available dates
  - [ ] GET `/api/availability/slots` - Get available time slots

- [ ] Create DTOs
  - [ ] `CreateScheduleDto`
  - [ ] `UpdateScheduleDto`
  - [ ] `CreateBlockoutDto`
  - [ ] `GetAvailableDatesDto`
  - [ ] `GetAvailableSlotsDto`

- [ ] Add to `AvailabilityModule`
  - [ ] Register controllers
  - [ ] Export necessary providers

- [ ] Create E2E tests
  - [ ] Test schedule CRUD
  - [ ] Test blockout CRUD
  - [ ] Test availability queries

**Files to Create:**

```
apps/backend/src/availability/presentation/controllers/
├── schedule-crud.controller.ts
├── blockout-crud.controller.ts
├── availability-query.controller.ts
└── dtos/
    ├── create-schedule.dto.ts
    ├── update-schedule.dto.ts
    ├── create-blockout.dto.ts
    ├── get-available-dates.dto.ts
    └── get-available-slots.dto.ts

apps/backend/src/availability/app/__tests__/
├── schedule-crud.e2e.spec.ts
├── blockout-crud.e2e.spec.ts
└── availability-query.e2e.spec.ts
```

---

#### Task 1.3: Booking BC Controllers (Extend)

**Priority:** HIGH  
**Estimated Time:** 3 hours

- [ ] Extend `AppointmentManagementController`
  - [ ] GET `/api/appointments/:id` - Get appointment details
  - [ ] PUT `/api/appointments/:id/cancel` - Cancel appointment
  - [ ] GET `/api/appointments/today` - Get today's appointments
  - [ ] GET `/api/appointments/upcoming` - Get upcoming appointments

- [ ] Create missing queries
  - [ ] `GetAppointmentQuery` (if not exists)
  - [ ] `GetTodayAppointmentsQuery`
  - [ ] `GetUpcomingAppointmentsQuery`

- [ ] Create query handlers
  - [ ] `GetAppointmentHandler`
  - [ ] `GetTodayAppointmentsHandler`
  - [ ] `GetUpcomingAppointmentsHandler`

- [ ] Add E2E tests
  - [ ] Test appointment details
  - [ ] Test cancellation
  - [ ] Test today/upcoming queries

**Files to Modify/Create:**

```
apps/backend/src/booking/presentation/controllers/
└── appointment-management.controller.ts (extend)

apps/backend/src/booking/app/queries/
├── get-appointment/
│   ├── query.ts
│   └── handler.ts
├── get-today-appointments/
│   ├── query.ts
│   └── handler.ts
└── get-upcoming-appointments/
    ├── query.ts
    └── handler.ts

apps/backend/src/booking/app/__tests__/
└── appointment-management.e2e.spec.ts (extend)
```

---

#### Task 1.4: Account BC Controllers

**Priority:** MEDIUM  
**Estimated Time:** 4 hours

- [ ] Create `BusinessOwnerProfileController`
  - [ ] GET `/api/account/profile` - Get profile
  - [ ] GET `/api/account/subscription` - Get subscription
  - [ ] PUT `/api/account/subscription/upgrade` - Upgrade subscription
  - [ ] POST `/api/account/onboarding/complete` - Complete onboarding

- [ ] Create DTOs
  - [ ] `UpgradeSubscriptionDto`
  - [ ] `SubscriptionReadModel`

- [ ] Add to `AccountModule`
  - [ ] Register controller
  - [ ] Export necessary providers

- [ ] Create E2E tests
  - [ ] Test profile retrieval
  - [ ] Test subscription management
  - [ ] Test onboarding completion

**Files to Create:**

```
apps/backend/src/account/presentation/controllers/
├── business-owner-profile.controller.ts
└── dtos/
    ├── upgrade-subscription.dto.ts
    └── subscription-read.model.ts

apps/backend/src/account/app/__tests__/
└── business-owner-profile.e2e.spec.ts
```

---

#### Task 1.5: Business BC Controllers (Extend)

**Priority:** MEDIUM  
**Estimated Time:** 2 hours

- [ ] Extend `BusinessManagementController`
  - [ ] PUT `/api/business` - Update business info
  - [ ] POST `/api/business/whatsapp` - Configure WhatsApp
  - [ ] GET `/api/business/settings` - Get settings

- [ ] Create DTOs
  - [ ] `UpdateBusinessDto`
  - [ ] `ConfigureWhatsAppDto`

- [ ] Add E2E tests
  - [ ] Test business update
  - [ ] Test WhatsApp configuration

**Files to Modify/Create:**

```
apps/backend/src/business/presentation/controllers/
└── business-management.controller.ts (extend)

apps/backend/src/business/presentation/dtos/
├── update-business.dto.ts
└── configure-whatsapp.dto.ts

apps/backend/src/business/app/__tests__/
└── business-management.e2e.spec.ts (extend)
```

---

#### Task 1.6: Conversation BC Controllers

**Priority:** LOW  
**Estimated Time:** 3 hours

- [ ] Create `AdminQueryController`
  - [ ] GET `/api/admin-queries/pending` - Get pending queries
  - [ ] GET `/api/admin-queries/:id` - Get conversation
  - [ ] POST `/api/admin-queries/:id/respond` - Respond to query

- [ ] Create DTOs
  - [ ] `RespondToQueryDto`

- [ ] Add to `ConversationModule`
  - [ ] Register controller
  - [ ] Export necessary providers

- [ ] Create E2E tests
  - [ ] Test pending queries
  - [ ] Test conversation retrieval
  - [ ] Test admin response

**Files to Create:**

```
apps/backend/src/conversation/presentation/controllers/
├── admin-query.controller.ts
└── dtos/
    └── respond-to-query.dto.ts

apps/backend/src/conversation/app/__tests__/
└── admin-query.e2e.spec.ts
```

---

### Phase 2: Frontend Integration (Days 4-5)

#### Task 2.1: Remove WebSocket

**Priority:** HIGH  
**Estimated Time:** 1 hour

- [ ] Delete WebSocket files
  - [ ] `apps/frontend/src/shared/api/websocket.ts`
  - [ ] `apps/frontend/src/shared/hooks/useWebSocketEvents.tsx`
  - [ ] `apps/frontend/src/shared/hooks/__tests__/useWebSocketEvents.test.tsx`

- [ ] Remove WebSocket initialization from `App.tsx`
  - [ ] Remove imports
  - [ ] Remove useEffect with connectWebSocket
  - [ ] Remove disconnectWebSocket

- [ ] Remove socket.io-client dependency
  - [ ] Update `package.json`
  - [ ] Run `pnpm install`

- [ ] Search for remaining WebSocket references
  - [ ] `grep -r "websocket" apps/frontend/src/`
  - [ ] `grep -r "socket.io" apps/frontend/src/`
  - [ ] Remove any found references

**Files to Delete:**

```
apps/frontend/src/shared/api/websocket.ts
apps/frontend/src/shared/hooks/useWebSocketEvents.tsx
apps/frontend/src/shared/hooks/__tests__/useWebSocketEvents.test.tsx
```

**Files to Modify:**

```
apps/frontend/src/App.tsx
apps/frontend/package.json
```

---

#### Task 2.2: Create API Services

**Priority:** HIGH  
**Estimated Time:** 4 hours

- [ ] Create `offerings.service.ts`
  - [ ] getAll()
  - [ ] getActive()
  - [ ] getById()
  - [ ] create()
  - [ ] update()
  - [ ] delete()
  - [ ] toggleActive()

- [ ] Create `schedules.service.ts`
  - [ ] getAll()
  - [ ] create()
  - [ ] update()
  - [ ] delete()

- [ ] Create `blockouts.service.ts`
  - [ ] getAll()
  - [ ] create()
  - [ ] delete()

- [ ] Extend `appointments.service.ts`
  - [ ] getById()
  - [ ] cancel()
  - [ ] getToday()
  - [ ] getUpcoming()

- [ ] Create `account.service.ts`
  - [ ] getProfile()
  - [ ] getSubscription()
  - [ ] upgradeSubscription()
  - [ ] completeOnboarding()

- [ ] Extend `business.service.ts`
  - [ ] update()
  - [ ] configureWhatsApp()
  - [ ] getSettings()

- [ ] Create `conversations.service.ts`
  - [ ] getPending()
  - [ ] getById()
  - [ ] respond()

**Files to Create:**

```
apps/frontend/src/shared/api/services/
├── offerings.service.ts
├── schedules.service.ts
├── blockouts.service.ts
├── account.service.ts
└── conversations.service.ts
```

**Files to Modify:**

```
apps/frontend/src/shared/api/services/
├── appointments.service.ts (extend)
└── business.service.ts (extend)
```

---

#### Task 2.3: Update Endpoints

**Priority:** HIGH  
**Estimated Time:** 1 hour

- [ ] Add missing endpoints to `endpoints.ts`
  - [ ] Account endpoints
  - [ ] Availability endpoints (dates, slots)
  - [ ] Conversation endpoints

- [ ] Verify all endpoints match backend routes

**Files to Modify:**

```
apps/frontend/src/shared/api/endpoints.ts
```

---

#### Task 2.4: Create React Query Hooks

**Priority:** HIGH  
**Estimated Time:** 6 hours

- [ ] Create `useOfferings` hooks
  - [ ] useOfferings()
  - [ ] useActiveOfferings()
  - [ ] useOffering(id)
  - [ ] useCreateOffering()
  - [ ] useUpdateOffering()
  - [ ] useDeleteOffering()
  - [ ] useToggleOfferingActive()

- [ ] Create `useSchedules` hooks
  - [ ] useSchedules()
  - [ ] useCreateSchedule()
  - [ ] useUpdateSchedule()
  - [ ] useDeleteSchedule()

- [ ] Create `useBlockouts` hooks
  - [ ] useBlockouts()
  - [ ] useCreateBlockout()
  - [ ] useDeleteBlockout()

- [ ] Extend `useAppointments` hooks
  - [ ] useAppointment(id)
  - [ ] useCancelAppointment()
  - [ ] useTodayAppointments()
  - [ ] useUpcomingAppointments()

- [ ] Create `useAccount` hooks
  - [ ] useProfile()
  - [ ] useSubscription()
  - [ ] useUpgradeSubscription()
  - [ ] useCompleteOnboarding()

- [ ] Create `useConversations` hooks
  - [ ] usePendingQueries()
  - [ ] useConversation(id)
  - [ ] useRespondToQuery()

**Files to Create:**

```
apps/frontend/src/entities/offering/model/
├── useOfferings.ts
└── __tests__/
    └── useOfferings.test.ts

apps/frontend/src/entities/schedule/model/
├── useSchedules.ts
└── __tests__/
    └── useSchedules.test.ts

apps/frontend/src/entities/blockout/model/
├── useBlockouts.ts
└── __tests__/
    └── useBlockouts.test.ts

apps/frontend/src/entities/account/model/
├── useAccount.ts
└── __tests__/
    └── useAccount.test.ts

apps/frontend/src/entities/conversation/model/
├── useConversations.ts
└── __tests__/
    └── useConversations.test.ts
```

**Files to Modify:**

```
apps/frontend/src/entities/appointment/model/
└── useAppointments.ts (extend)
```

---

#### Task 2.5: Connect Pages to Real APIs

**Priority:** HIGH  
**Estimated Time:** 4 hours

- [ ] Update `OfferingsPage`
  - [ ] Remove mock data
  - [ ] Use `useOfferings()` hook
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update `SchedulesPage`
  - [ ] Remove mock data
  - [ ] Use `useSchedules()` hook
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update `BlockoutsPage`
  - [ ] Remove mock data
  - [ ] Use `useBlockouts()` hook
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update `AppointmentsPage`
  - [ ] Remove mock data
  - [ ] Use real appointment hooks
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update `DashboardPage`
  - [ ] Remove mock data
  - [ ] Use `useTodayAppointments()` hook
  - [ ] Use `useUpcomingAppointments()` hook
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update `ConversationsPage`
  - [ ] Remove mock data
  - [ ] Use `usePendingQueries()` hook
  - [ ] Add loading states
  - [ ] Add error handling

**Files to Modify:**

```
apps/frontend/src/pages/
├── OfferingsPage/
├── SchedulesPage/
├── BlockoutsPage/
├── AppointmentsPage/
├── DashboardPage/
└── ConversationsPage/
```

---

### Phase 3: Test Data & Polish (Days 6-7)

#### Task 3.1: Create Seed Script for Current Week Appointments

**Priority:** HIGH  
**Estimated Time:** 1 hour

- [ ] Create SQL seed script
  - [ ] Delete future appointments (2025)
  - [ ] Create 7 appointments for next 7 days
  - [ ] Verify appointments created

- [ ] Run seed script
  - [ ] Execute in Docker container
  - [ ] Verify data in database

- [ ] Test Dashboard
  - [ ] Verify "citas hoy" shows data
  - [ ] Verify "citas esta semana" shows data

**Files to Create:**

```
apps/backend/src/database/seeds/
└── 002-appointments-current-week.sql
```

**Commands to Run:**

```bash
# Copy seed script to container
docker cp apps/backend/src/database/seeds/002-appointments-current-week.sql d34910175f02:/tmp/

# Execute seed script
docker exec d34910175f02 psql -U postgres -d bookings-software -f /tmp/002-appointments-current-week.sql

# Verify
docker exec d34910175f02 psql -U postgres -d bookings-software -c "SELECT id, date_time, status FROM appointments ORDER BY date_time;"
```

---

#### Task 3.2: Manual Testing with Playwright

**Priority:** HIGH  
**Estimated Time:** 3 hours

- [ ] Test all pages
  - [ ] Login/logout
  - [ ] Dashboard (verify data shows)
  - [ ] Appointments (list, details, cancel)
  - [ ] Offerings (list, create, update, delete)
  - [ ] Schedules (list, create, update, delete)
  - [ ] Blockouts (list, create, delete)
  - [ ] Customers (already tested)
  - [ ] Conversations (list, respond)

- [ ] Capture screenshots
  - [ ] All pages with data
  - [ ] All CRUD operations
  - [ ] Error states

- [ ] Document issues
  - [ ] Create ISSUES_FOUND.md
  - [ ] Document resolutions
  - [ ] Update TESTING_COMPLETE.md

**Files to Create:**

```
.kiro/specs/frontend-enhancements/
├── MANUAL_TESTING.md
└── screenshots/
    ├── 01-dashboard-with-data.png
    ├── 02-appointments-list.png
    ├── 03-offerings-crud.png
    └── ...
```

---

#### Task 3.3: Remove Mock Data

**Priority:** MEDIUM  
**Estimated Time:** 2 hours

- [ ] Search for mock data
  - [ ] `grep -r "mock" apps/frontend/src/`
  - [ ] `grep -r "Mock" apps/frontend/src/`
  - [ ] `grep -r "MOCK" apps/frontend/src/`

- [ ] Remove mock files
  - [ ] Delete mock services
  - [ ] Delete mock data files
  - [ ] Delete MSW handlers (if any)

- [ ] Update tests
  - [ ] Remove mock imports
  - [ ] Use real API mocking (MSW or vitest mocks)

**Files to Check:**

```
apps/frontend/src/shared/api/mocks/ (if exists)
apps/frontend/src/features/*/api/mocks/ (if exists)
apps/frontend/src/**/*.mock.ts
```

---

#### Task 3.4: Update Documentation

**Priority:** MEDIUM  
**Estimated Time:** 2 hours

- [ ] Update README.md
  - [ ] Document new endpoints
  - [ ] Document API services
  - [ ] Document React Query hooks

- [ ] Update API documentation
  - [ ] Document all endpoints
  - [ ] Add request/response examples
  - [ ] Add error codes

- [ ] Create migration guide
  - [ ] Document breaking changes
  - [ ] Document new features
  - [ ] Document how to test

**Files to Create/Modify:**

```
.kiro/specs/frontend-enhancements/
├── API_DOCUMENTATION.md
└── MIGRATION_GUIDE.md

apps/frontend/README.md (update)
apps/backend/README.md (update)
```

---

#### Task 3.5: Final Testing & Cleanup

**Priority:** HIGH  
**Estimated Time:** 2 hours

- [ ] Run all tests
  - [ ] Backend unit tests: `pnpm --filter backend test`
  - [ ] Backend E2E tests: `pnpm --filter backend test:e2e`
  - [ ] Frontend unit tests: `pnpm --filter frontend test`
  - [ ] Frontend E2E tests (manual with Playwright)

- [ ] Check code quality
  - [ ] Run linter: `pnpm lint`
  - [ ] Run formatter: `pnpm format`
  - [ ] Run type check: `pnpm typecheck`

- [ ] Clean up
  - [ ] Remove unused imports
  - [ ] Remove commented code
  - [ ] Remove console.logs
  - [ ] Remove TODO comments

- [ ] Commit and push
  - [ ] Create comprehensive commit message
  - [ ] Push to `feat/frontend-enhancements`
  - [ ] Create PR to `feature/account-business-owner-bc`

---

## Summary

### Total Tasks: 25

- **Phase 1 (Backend):** 6 tasks
- **Phase 2 (Frontend):** 5 tasks
- **Phase 3 (Testing & Polish):** 5 tasks

### Total Estimated Time: 5-7 days

- **Phase 1:** 2-3 days
- **Phase 2:** 2-3 days
- **Phase 3:** 1 day

### Priority Breakdown

- **HIGH:** 15 tasks
- **MEDIUM:** 4 tasks
- **LOW:** 1 task

---

## Progress Tracking

### Phase 1: Backend Controllers & APIs

- [ ] Task 1.1: Offering BC Controllers (0/8)
- [ ] Task 1.2: Availability BC Controllers (0/12)
- [ ] Task 1.3: Booking BC Controllers (0/7)
- [ ] Task 1.4: Account BC Controllers (0/6)
- [ ] Task 1.5: Business BC Controllers (0/5)
- [ ] Task 1.6: Conversation BC Controllers (0/6)

### Phase 2: Frontend Integration

- [ ] Task 2.1: Remove WebSocket (0/4)
- [ ] Task 2.2: Create API Services (0/7)
- [ ] Task 2.3: Update Endpoints (0/2)
- [ ] Task 2.4: Create React Query Hooks (0/6)
- [ ] Task 2.5: Connect Pages to Real APIs (0/6)

### Phase 3: Test Data & Polish

- [ ] Task 3.1: Create Seed Script (0/3)
- [ ] Task 3.2: Manual Testing (0/3)
- [ ] Task 3.3: Remove Mock Data (0/3)
- [ ] Task 3.4: Update Documentation (0/3)
- [ ] Task 3.5: Final Testing & Cleanup (0/4)

---

**End of Tasks Document**
