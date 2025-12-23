# Issues Found During Manual Testing

**Date:** December 22, 2024  
**Tester:** AI Assistant (Playwright MCP)  
**Environment:** Local Development (Backend: http://127.0.0.1:3000, Frontend: http://localhost:5173)

---

## Summary

Three critical issues were identified during manual end-to-end testing:

1. ❌ **CRITICAL**: 403 Forbidden error on Customers page
2. ⚠️ **WARNING**: WebSocket "Invalid namespace" error in console
3. ⚠️ **DATA**: "No hay datos" (No data) displayed on Dashboard and Appointments pages

---

## Issue 1: 403 Forbidden - Customers Page ❌

### Severity: CRITICAL

### Description

When navigating to the Customers page (`/customers`), the application returns a 403 Forbidden error with the message "User does not have a business".

### Root Cause Analysis

**Database Investigation:**

```sql
-- User exists with BUSINESS_OWNER role
SELECT id, email, roles FROM users WHERE email = 'test@example.com';
-- Result: 923228f3-34ee-49ca-a211-4a5ee8ce068d | test@example.com | {BUSINESS_OWNER}

-- But businesses table does NOT exist
SELECT * FROM businesses;
-- ERROR: relation "businesses" does not exist
```

**Code Analysis:**

1. **Login Handler** (`apps/backend/src/auth/app/commands/login/handler.ts`):
   - Attempts to fetch businesses for BUSINESS_OWNER users
   - Adds `businessId` to JWT payload if business exists
   - Logs warning if business query fails but doesn't fail login

2. **Customer Controllers** require `businessId` in JWT:

   ```typescript
   const businessId = user.businessId;
   if (!businessId) {
     throw new ForbiddenException("User does not have a business");
   }
   ```

3. **JWT Payload** for `test@example.com` does NOT include `businessId`:
   ```typescript
   {
     sub: "923228f3-34ee-49ca-a211-4a5ee8ce068d",
     email: "test@example.com",
     roles: ["BUSINESS_OWNER"]
     // businessId: MISSING!
   }
   ```

### Backend Logs

```
[2025-12-22 20:51:01.829 -0400] WARN: User does not have a business
    context: "CustomerSearchController"
    action: "search_customers_forbidden"
    userId: "923228f3-34ee-49ca-a211-4a5ee8ce068d"
    reason: "no_business_id"

[2025-12-22 20:51:01.829 -0400] ERROR: Customer search failed
    stack: "ForbiddenException: User does not have a business"
```

### Impact

- **Customers page** is completely inaccessible
- **Dashboard stats** may be affected (if they query customers)
- **Any endpoint requiring businessId** will fail with 403

### Solution Options

#### Option 1: Create Business Table and Seed Data (RECOMMENDED)

```sql
-- Create businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Santo_Domingo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create index
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- Seed test business for test@example.com
INSERT INTO businesses (id, owner_id, name, whatsapp_number, timezone)
VALUES (
  '95163c50-2b1f-4760-8a02-278eb531363a',
  '923228f3-34ee-49ca-a211-4a5ee8ce068d',
  'Test Business',
  '+18095551234',
  'America/Santo_Domingo'
);
```

#### Option 2: Implement Business BC (Long-term)

- Implement complete Business Bounded Context
- Add migrations
- Add CRUD endpoints
- Add onboarding flow

#### Option 3: Mock businessId in JWT (TEMPORARY - NOT RECOMMENDED)

- Hardcode businessId in login handler
- Only for testing purposes
- Must be removed before production

### Recommended Action

**Implement Option 1** immediately to unblock testing, then plan Option 2 for proper implementation.

---

## Issue 2: WebSocket "Invalid namespace" Error ⚠️

### Severity: WARNING

### Description

Console shows WebSocket connection error: "Invalid namespace"

### Root Cause

- Frontend is attempting to establish WebSocket connection
- Backend does NOT have WebSocket/Socket.IO configured
- No WebSocket gateway or namespace defined in backend

### Backend Configuration

- `main.ts` only configures HTTP/REST with Fastify
- No `@nestjs/websockets` or `@nestjs/platform-socket.io` imports
- No WebSocket gateway modules

### Impact

- Console error (cosmetic)
- Real-time features won't work (if implemented in frontend)
- No functional impact on REST API

### Solution Options

#### Option 1: Remove WebSocket from Frontend (RECOMMENDED for MVP)

- Remove WebSocket client initialization
- Remove socket.io-client dependency
- Use polling or manual refresh for updates

#### Option 2: Implement WebSocket in Backend

```typescript
// Install dependencies
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

// Create gateway
@WebSocketGateway({ cors: true })
export class AppointmentsGateway {
  @WebSocketServer()
  server: Server;

  // Emit events when appointments change
}
```

### Recommended Action

**Implement Option 1** for MVP - WebSocket is not required for core functionality.

---

## Issue 3: "No hay datos" on Dashboard and Appointments ⚠️

### Severity: WARNING (Data Issue)

### Description

- Dashboard shows "0 appointments today" and "0 this week"
- Appointments page shows "No hay datos" (No data)
- Database actually contains 1 appointment

### Database Investigation

```sql
-- Appointments table has 1 record
SELECT COUNT(*) FROM appointments;
-- Result: 1

SELECT * FROM appointments;
-- Result: 1 appointment for business 95163c50-2b1f-4760-8a02-278eb531363a
```

### Root Cause Analysis

**Possible causes:**

1. **Missing businessId in JWT** (same as Issue 1)
   - Queries filter by `businessId` from JWT
   - If `businessId` is null, queries return empty results

2. **Business ID mismatch**
   - Appointment has `business_id = 95163c50-2b1f-4760-8a02-278eb531363a`
   - User's business (if created) might have different ID

3. **Query filters**
   - Dashboard queries "today" and "this week"
   - Appointment date: `2025-12-22 05:00:00` (UTC)
   - Might be filtered out by date range

### Impact

- Dashboard appears empty
- User thinks system has no data
- Poor user experience

### Solution

**Same as Issue 1** - Create business table and ensure JWT includes correct `businessId`.

---

## Testing Environment Details

### Database

- **Container ID:** `d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0`
- **Database:** `bookings-software`
- **User:** `postgres`

### Existing Tables

```
appointments
capacities
customers
migrations
offerings
users
```

### Missing Tables

```
businesses (CRITICAL)
business_owners
schedules
blockouts
conversations
messages
reminders
```

### Test User

```
Email: test@example.com
Password: Test123!
User ID: 923228f3-34ee-49ca-a211-4a5ee8ce068d
Roles: [BUSINESS_OWNER]
Business ID: NONE (missing)
```

---

## Next Steps

### Immediate Actions (Priority 1)

1. ✅ Create `businesses` table with migration
2. ✅ Seed test business for `test@example.com`
3. ✅ Re-login to get JWT with `businessId`
4. ✅ Verify Customers page loads
5. ✅ Verify Dashboard shows data

### Short-term Actions (Priority 2)

6. Remove WebSocket from frontend or implement in backend
7. Create remaining tables (business_owners, schedules, etc.)
8. Add proper onboarding flow for new users
9. Add business creation endpoint

### Long-term Actions (Priority 3)

10. Implement complete Business BC
11. Implement Account BC integration
12. Add proper error handling for missing business
13. Add user onboarding wizard

---

## Screenshots

1. `01-login-page.png` - Login page loads correctly ✅
2. `02-login-filled.png` - Login form with credentials ✅
3. `03-dashboard-logged-in.png` - Dashboard after login (shows 0 data) ⚠️
4. `04-appointments-page.png` - Appointments page (shows "No hay datos") ⚠️
5. `05-customers-error-403.png` - Customers page with 403 error ❌

---

## Conclusion

The main blocker is the **missing `businesses` table** which prevents:

- JWT from including `businessId`
- Customers page from loading (403 error)
- Dashboard from showing data
- Appointments page from showing data

**Recommended immediate fix:** Create `businesses` table and seed test data.

**Estimated time:** 15 minutes

**Risk:** Low - only affects test environment
