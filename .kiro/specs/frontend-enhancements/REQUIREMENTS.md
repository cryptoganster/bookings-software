# Frontend Enhancements - Requirements

**Date:** December 22, 2024  
**Status:** Planning  
**Priority:** HIGH

---

## Overview

This spec defines the requirements for integrating all Backend Bounded Contexts (BCs) with the Frontend, removing mocks, and implementing real API connections.

---

## Objectives

1. ✅ **Complete Backend API Integration**
   - Connect all frontend pages to real backend APIs
   - Remove all mock data and mock services
   - Implement proper error handling and loading states

2. ✅ **Create Missing Backend Controllers**
   - Implement missing REST endpoints for each BC
   - Ensure all CRUD operations are available
   - Add proper validation and authorization

3. ✅ **Remove WebSocket Initialization**
   - Remove WebSocket client from frontend (non-functional)
   - Clean up WebSocket-related code
   - Remove socket.io-client dependency

4. ✅ **Fix Test Data Dates**
   - Create appointments for current week (not 2025)
   - Ensure Dashboard shows real data
   - Add seed script for test appointments

---

## Bounded Contexts to Integrate

### 1. Auth BC ✅ (Already Integrated)

- [x] Login
- [x] Register
- [x] Logout
- [x] JWT authentication

### 2. Account BC ⚠️ (Partially Integrated)

- [ ] Get BusinessOwner profile
- [ ] Update subscription plan
- [ ] Complete onboarding flow
- [ ] Get subscription status

### 3. Business BC ⚠️ (Partially Integrated)

- [x] Get business info
- [ ] Update business info
- [ ] Configure WhatsApp
- [ ] Get business settings

### 4. Offering BC ❌ (Not Integrated)

- [ ] List offerings
- [ ] Create offering
- [ ] Update offering
- [ ] Delete offering
- [ ] Toggle offering active status

### 5. Availability BC ❌ (Not Integrated)

- [ ] List schedules
- [ ] Create schedule
- [ ] Update schedule
- [ ] Delete schedule
- [ ] List blockouts
- [ ] Create blockout
- [ ] Delete blockout

### 6. Booking BC ⚠️ (Partially Integrated)

- [x] List appointments
- [ ] Get appointment details
- [ ] Cancel appointment
- [ ] Get today's appointments
- [ ] Get upcoming appointments
- [ ] Get appointments by date range

### 7. Customer BC ✅ (Already Integrated)

- [x] List customers
- [x] Search customers
- [x] Get customer details
- [x] Get customer stats

### 8. Conversation BC ❌ (Not Integrated)

- [ ] List pending admin queries
- [ ] Get conversation history
- [ ] Send admin response

### 9. Notification BC ❌ (Not Integrated)

- [ ] List pending reminders
- [ ] Get reminder status

---

## Missing Backend Controllers

### Offering BC Controllers

```typescript
// apps/backend/src/offering/presentation/controllers/

1. offering-crud.controller.ts
   - GET    /api/offerings
   - POST   /api/offerings
   - GET    /api/offerings/:id
   - PUT    /api/offerings/:id
   - DELETE /api/offerings/:id

2. offering-management.controller.ts
   - PATCH  /api/offerings/:id/active
   - GET    /api/offerings/active
```

### Availability BC Controllers

```typescript
// apps/backend/src/availability/presentation/controllers/

1. schedule-crud.controller.ts
   - GET    /api/schedules
   - POST   /api/schedules
   - GET    /api/schedules/:id
   - PUT    /api/schedules/:id
   - DELETE /api/schedules/:id

2. blockout-crud.controller.ts
   - GET    /api/blockouts
   - POST   /api/blockouts
   - GET    /api/blockouts/:id
   - DELETE /api/blockouts/:id

3. availability-query.controller.ts
   - GET    /api/availability/dates
   - GET    /api/availability/slots
```

### Booking BC Controllers

```typescript
// apps/backend/src/booking/presentation/controllers/

1. appointment-management.controller.ts (EXTEND EXISTING)
   - GET    /api/appointments/:id
   - PUT    /api/appointments/:id/cancel
   - GET    /api/appointments/today
   - GET    /api/appointments/upcoming
   - GET    /api/appointments/date-range
```

### Account BC Controllers

```typescript
// apps/backend/src/account/presentation/controllers/

1. business-owner-profile.controller.ts
   - GET    /api/account/profile
   - PUT    /api/account/profile

2. subscription-management.controller.ts
   - GET    /api/account/subscription
   - PUT    /api/account/subscription/upgrade
   - PUT    /api/account/subscription/suspend

3. onboarding.controller.ts
   - POST   /api/account/onboarding/complete
   - GET    /api/account/onboarding/status
```

### Business BC Controllers

```typescript
// apps/backend/src/business/presentation/controllers/

1. business-management.controller.ts (EXTEND EXISTING)
   - PUT    /api/business
   - POST   /api/business/whatsapp
   - GET    /api/business/settings
```

### Conversation BC Controllers

```typescript
// apps/backend/src/conversation/presentation/controllers/

1. admin-query.controller.ts
   - GET    /api/admin-queries/pending
   - GET    /api/admin-queries/:id
   - POST   /api/admin-queries/:id/respond

2. conversation-history.controller.ts
   - GET    /api/conversations/:id/messages
```

---

## Frontend Changes Required

### 1. Remove WebSocket

```typescript
// Files to modify:
- apps/frontend/src/shared/api/websocket.ts (DELETE)
- apps/frontend/src/shared/hooks/useWebSocketEvents.tsx (DELETE)
- apps/frontend/src/shared/hooks/__tests__/useWebSocketEvents.test.tsx (DELETE)
- apps/frontend/src/App.tsx (remove WebSocket initialization)
- apps/frontend/package.json (remove socket.io-client dependency)
```

### 2. Remove Mock Services

```typescript
// Files to check and remove mocks:
- apps/frontend/src/shared/api/mocks/ (if exists)
- apps/frontend/src/features/*/api/mocks/ (if exists)
- MSW handlers (if any)
```

### 3. Update API Client

```typescript
// apps/frontend/src/shared/api/client.ts
- Ensure proper error handling
- Add request/response interceptors
- Add retry logic for failed requests
- Add proper TypeScript types from @packages/shared-types
```

### 4. Update Endpoints

```typescript
// apps/frontend/src/shared/api/endpoints.ts
- Add missing endpoints for all BCs
- Ensure consistency with backend routes
- Add proper TypeScript types
```

### 5. Create API Services

```typescript
// apps/frontend/src/shared/api/services/
-offerings.service.ts -
  schedules.service.ts -
  blockouts.service.ts -
  appointments.service.ts(extend) -
  account.service.ts -
  business.service.ts(extend) -
  conversations.service.ts;
```

### 6. Update React Query Hooks

```typescript
// apps/frontend/src/entities/*/model/
- Update all useQuery hooks to use real APIs
- Remove mock data
- Add proper error handling
- Add loading states
- Add optimistic updates where appropriate
```

---

## Test Data Requirements

### Create Appointments for Current Week

**Problem:** Existing appointment is dated 2025-12-22 (future), so Dashboard shows "No hay datos"

**Solution:** Create seed script to generate appointments for current week

```sql
-- apps/backend/src/database/seeds/appointments-current-week.seed.sql

-- Create appointments for next 7 days
INSERT INTO appointments (
  id,
  business_id,
  customer_id,
  offering_id,
  date_time,
  status,
  version,
  created_at,
  updated_at
) VALUES
  -- Today + 2 hours
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', NOW() + INTERVAL '2 hours', 'CONFIRMED', 1, NOW(), NOW()),

  -- Tomorrow + 10 AM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '1 day')::date + TIME '10:00:00', 'CONFIRMED', 1, NOW(), NOW()),

  -- Day after tomorrow + 2 PM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '2 days')::date + TIME '14:00:00', 'CONFIRMED', 1, NOW(), NOW()),

  -- 3 days from now + 9 AM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '3 days')::date + TIME '09:00:00', 'CONFIRMED', 1, NOW(), NOW()),

  -- 4 days from now + 3 PM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '4 days')::date + TIME '15:00:00', 'CONFIRMED', 1, NOW(), NOW()),

  -- 5 days from now + 11 AM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '5 days')::date + TIME '11:00:00', 'CONFIRMED', 1, NOW(), NOW()),

  -- 6 days from now + 4 PM
  (gen_random_uuid(), '95163c50-2b1f-4760-8a02-278eb531363a', 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820', '026d1b90-3996-4865-91d1-2a4fcd278e7d', (NOW() + INTERVAL '6 days')::date + TIME '16:00:00', 'CONFIRMED', 1, NOW(), NOW());
```

**Command to run:**

```bash
docker exec d34910175f02 psql -U postgres -d bookings-software -f /path/to/seed.sql
```

---

## Success Criteria

### Backend

- [ ] All missing controllers implemented
- [ ] All endpoints tested with Postman/Insomnia
- [ ] All endpoints return proper DTOs from @packages/shared-types
- [ ] All endpoints have proper error handling
- [ ] All endpoints have proper authorization guards

### Frontend

- [ ] WebSocket code removed
- [ ] All mock services removed
- [ ] All pages connected to real APIs
- [ ] All API calls use proper TypeScript types
- [ ] All API calls have error handling
- [ ] All API calls have loading states
- [ ] Dashboard shows real data (appointments for current week)

### Testing

- [ ] All backend endpoints have E2E tests
- [ ] All frontend API services have unit tests
- [ ] Manual testing with Playwright shows all features working
- [ ] No console errors (except expected validation errors)

---

## Timeline

### Phase 1: Backend Controllers (2-3 days)

- Day 1: Offering BC + Availability BC controllers
- Day 2: Booking BC + Account BC controllers (extend)
- Day 3: Conversation BC controllers + testing

### Phase 2: Frontend Integration (2-3 days)

- Day 1: Remove WebSocket + Remove mocks
- Day 2: Create API services + Update hooks
- Day 3: Connect all pages + testing

### Phase 3: Test Data & Polish (1 day)

- Create seed script for current week appointments
- Manual testing with Playwright
- Fix any issues found
- Documentation

**Total Estimated Time:** 5-7 days

---

## Dependencies

- ✅ Account BC implemented
- ✅ Business BC implemented
- ✅ Booking BC implemented
- ✅ Customer BC implemented
- ⚠️ Offering BC (domain implemented, controllers missing)
- ⚠️ Availability BC (domain implemented, controllers missing)
- ⚠️ Conversation BC (domain implemented, controllers missing)

---

## Risks

1. **Breaking Changes:** Removing WebSocket might break existing code
   - **Mitigation:** Search for all WebSocket usage before removing

2. **API Inconsistencies:** Backend DTOs might not match frontend expectations
   - **Mitigation:** Use @packages/shared-types for consistency

3. **Missing Backend Logic:** Some queries/commands might not be implemented
   - **Mitigation:** Implement missing handlers as needed

4. **Test Data Issues:** Seed script might conflict with existing data
   - **Mitigation:** Use ON CONFLICT DO NOTHING or clear test data first

---

## References

- `.kiro/steering/PRD.md` - Product requirements
- `.kiro/steering/frontend-PRD.md` - Frontend architecture
- `.kiro/specs/manual-testing-playwright/` - Manual testing results
- `apps/backend/src/*/presentation/controllers/` - Existing controllers

---

**End of Requirements**
