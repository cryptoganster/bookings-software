# Database Seeds

This document provides a comprehensive overview of all database seeds in the project.

## Seed Files

### Execution Order

Seeds must be executed in the following order to respect foreign key dependencies:

| #   | File                   | BC           | Dependencies                     | Description                                 |
| --- | ---------------------- | ------------ | -------------------------------- | ------------------------------------------- |
| 1   | `auth.seed.ts`         | Auth         | None                             | Create users with various roles             |
| 2   | `account.seed.ts`      | Account      | users                            | Create business_owners linked to users      |
| 3   | `business.seed.ts`     | Business     | users                            | Create businesses owned by users            |
| 4   | `customer.seed.ts`     | Customer     | users, businesses                | Create customers (anonymous and registered) |
| 5   | `offering.seed.ts`     | Offering     | businesses                       | Create offerings for businesses             |
| 6   | `availability.seed.ts` | Availability | businesses, offerings            | Create schedules, blockouts, and capacities |
| 7   | `booking.seed.ts`      | Booking      | businesses, customers, offerings | Create appointments                         |
| 8   | `conversation.seed.ts` | Conversation | businesses, customers            | Create conversations and messages           |

## Seed Data Structure

### 1. Auth BC (`auth.seed.ts`)

**Purpose**: Create users with different role combinations

**Data Created**:

- User 1: BUSINESS_OWNER role only
- User 2: CUSTOMER role only
- User 3: Both BUSINESS_OWNER and CUSTOMER roles
- User 4: ADMIN role
- User 5: BUSINESS_OWNER role (for testing)

**Returns**: `{ userId, businessId }`

**Example**:

```typescript
{
  id: 'uuid-1',
  email: 'owner@example.com',
  password: 'hashed-password',
  name: 'John Doe',
  roles: ['BUSINESS_OWNER'],
  is_active: true,
  email_verified: true
}
```

### 2. Account BC (`account.seed.ts`)

**Purpose**: Create business_owners with different subscription plans

**Data Created**:

- BusinessOwner 1: FREE plan, onboarding completed
- BusinessOwner 2: BASIC plan, onboarding completed
- BusinessOwner 3: PRO plan, onboarding completed
- BusinessOwner 4: FREE plan, onboarding NOT completed

**Returns**: `void`

**Example**:

```typescript
{
  id: 'uuid-1',
  user_id: 'user-uuid-1',
  subscription_plan: 'FREE',
  subscription_status: 'ACTIVE',
  onboarding_completed: true,
  version: 0
}
```

### 3. Business BC (`business.seed.ts`)

**Purpose**: Create businesses with varied configurations

**Data Created**:

- Business 1: Active, timezone America/New_York
- Business 2: Active, timezone America/Los_Angeles
- Business 3: Inactive, timezone Europe/London

**Returns**: `{ businessId }`

**Example**:

```typescript
{
  id: 'uuid-1',
  owner_id: 'user-uuid-1',
  name: 'Peluquería Central',
  whatsapp_number: '+18095551234',
  address: '123 Main St, New York, NY 10001',
  timezone: 'America/New_York',
  is_active: true,
  version: 0
}
```

### 4. Customer BC (`customer.seed.ts`)

**Purpose**: Create customers (anonymous and registered)

**Data Created**:

- Customer 1: Anonymous (user_id = null)
- Customer 2: Anonymous (user_id = null)
- Customer 3: Registered (user_id != null)
- Customer 4: Anonymous without name
- Customer 5: Registered with merged_into field

**Returns**: `{ customerId1, customerId2, customerId3 }`

**Example**:

```typescript
// Anonymous
{
  id: 'uuid-1',
  user_id: null,
  business_id: 'business-uuid-1',
  whatsapp_phone: '+18095551111',
  name: 'María García'
}

// Registered
{
  id: 'uuid-2',
  user_id: 'user-uuid-2',
  business_id: 'business-uuid-1',
  whatsapp_phone: '+18095552222',
  name: 'Carlos López'
}
```

### 5. Offering BC (`offering.seed.ts`)

**Purpose**: Create offerings with different configurations

**Data Created**:

- Offering 1: Active, 30 min duration, 8 slots/day
- Offering 2: Active, 20 min duration, 12 slots/day
- Offering 3: Active, 90 min duration, 4 slots/day
- Offering 4: Inactive, 45 min duration

**Returns**: `{ offering1Id, offering2Id, offering3Id }`

**Example**:

```typescript
{
  id: 'uuid-1',
  business_id: 'business-uuid-1',
  name: 'Corte de Pelo',
  duration: 30,
  max_capacity_per_slot: 1,
  max_daily_capacity: 8,
  is_active: true
}
```

### 6. Availability BC (`availability.seed.ts`)

**Purpose**: Create schedules, blockouts, and capacities

**Data Created**:

#### Schedules

- Monday-Friday: 9:00 AM - 6:00 PM
- Saturday: 10:00 AM - 4:00 PM
- Sunday: Closed

#### Blockouts

- Christmas: Dec 24-26
- New Year: Dec 31 - Jan 1
- Summer Vacation: Jul 15-30

#### Capacities

- 30 days of capacity data for each offering
- Offering 1: 8 slots/day
- Offering 2: 12 slots/day
- Offering 3: 4 slots/day

**Returns**: `void`

**Example**:

```typescript
// Schedule
{
  id: 'uuid-1',
  business_id: 'business-uuid-1',
  day_of_week: 1, // Monday
  start_time: '09:00:00',
  end_time: '18:00:00',
  is_active: true
}

// Blockout
{
  id: 'uuid-1',
  business_id: 'business-uuid-1',
  start_date: '2024-12-24',
  end_date: '2024-12-26',
  reason: 'Christmas Holiday'
}

// Capacity
{
  id: 'uuid-1',
  offering_id: 'offering-uuid-1',
  date: '2024-12-20',
  total_slots: 8,
  available_slots: 8,
  version: 0
}
```

### 7. Booking BC (`booking.seed.ts`)

**Purpose**: Create appointments with different states

**Data Created**:

- Appointment 1: CONFIRMED, future date
- Appointment 2: CONFIRMED, today
- Appointment 3: CONFIRMED, future date
- Appointment 4: CANCELLED, past date
- Appointment 5: COMPLETED, past date

**Returns**: `void`

**Example**:

```typescript
{
  id: 'uuid-1',
  business_id: 'business-uuid-1',
  customer_id: 'customer-uuid-1',
  offering_id: 'offering-uuid-1',
  date_time: '2024-12-25T10:00:00Z',
  status: 'CONFIRMED',
  cancelled_at: null,
  version: 0
}
```

### 8. Conversation BC (`conversation.seed.ts`)

**Purpose**: Create conversations and messages

**Data Created**:

#### Conversations

- Conversation 1: ACTIVE
- Conversation 2: AWAITING_ADMIN
- Conversation 3: RESOLVED

#### Messages

- TEXT messages (INBOUND and OUTBOUND)
- BUTTON messages (interactive)
- LOCATION messages
- Messages from admin and customer

**Returns**: `void`

**Example**:

```typescript
// Conversation
{
  id: 'uuid-1',
  business_id: 'business-uuid-1',
  customer_id: 'customer-uuid-1',
  status: 'ACTIVE',
  last_message_at: '2024-12-20T10:00:00Z',
  version: 0
}

// Message
{
  id: 'uuid-1',
  conversation_id: 'conversation-uuid-1',
  direction: 'INBOUND',
  content: 'Hola, quiero agendar una cita',
  message_type: 'TEXT',
  sent_at: '2024-12-20T10:00:00Z',
  is_from_admin: false
}
```

## Running Seeds

### Development

```bash
# Run all seeds
npm run seed
```

### Production

Seeds are typically only run in development/staging environments. For production, use migrations to manage schema and manual data entry for initial data.

## Seed Best Practices

1. **Idempotency**: Seeds should be safe to run multiple times
2. **Cleanup**: Clear existing data before seeding (use TRUNCATE CASCADE)
3. **Dependencies**: Respect foreign key order
4. **Realistic Data**: Use varied, realistic data for testing
5. **Error Handling**: Wrap each seed in try-catch
6. **Logging**: Log progress and summary
7. **Returns**: Return IDs needed by dependent seeds

## Data Coverage

### Bounded Context Coverage

| BC           | Seed File               | Tables Covered                   | Status   |
| ------------ | ----------------------- | -------------------------------- | -------- |
| Auth         | ✅ auth.seed.ts         | users                            | Complete |
| Account      | ✅ account.seed.ts      | business_owners                  | Complete |
| Business     | ✅ business.seed.ts     | businesses                       | Complete |
| Customer     | ✅ customer.seed.ts     | customers                        | Complete |
| Offering     | ✅ offering.seed.ts     | offerings                        | Complete |
| Availability | ✅ availability.seed.ts | schedules, blockouts, capacities | Complete |
| Booking      | ✅ booking.seed.ts      | appointments                     | Complete |
| Conversation | ✅ conversation.seed.ts | conversations, messages          | Complete |

### Table Coverage

| Table           | Seed File            | Records | Status |
| --------------- | -------------------- | ------- | ------ |
| users           | auth.seed.ts         | 5       | ✅     |
| business_owners | account.seed.ts      | 4       | ✅     |
| businesses      | business.seed.ts     | 3       | ✅     |
| customers       | customer.seed.ts     | 5       | ✅     |
| offerings       | offering.seed.ts     | 4       | ✅     |
| schedules       | availability.seed.ts | 7       | ✅     |
| blockouts       | availability.seed.ts | 3       | ✅     |
| capacities      | availability.seed.ts | 90      | ✅     |
| appointments    | booking.seed.ts      | 5       | ✅     |
| conversations   | conversation.seed.ts | 3       | ✅     |
| messages        | conversation.seed.ts | 10+     | ✅     |

## Verification

After running seeds, verify data:

```bash
# Connect to database
docker exec -it <container-id> psql -U postgres -d bookings-software

# Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'business_owners', COUNT(*) FROM business_owners
UNION ALL
SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'offerings', COUNT(*) FROM offerings
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'blockouts', COUNT(*) FROM blockouts
UNION ALL
SELECT 'capacities', COUNT(*) FROM capacities
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;
```

Expected output:

```
table_name       | count
-----------------+-------
users            |     5
business_owners  |     4
businesses       |     3
customers        |     5
offerings        |     4
schedules        |     7
blockouts        |     3
capacities       |    90
appointments     |     5
conversations    |     3
messages         |    10+
```

## Troubleshooting

### Foreign Key Violations

If you encounter foreign key violations:

1. Check seed execution order
2. Verify parent records exist before creating child records
3. Check for typos in foreign key values

### Duplicate Key Violations

If you encounter duplicate key violations:

1. Run cleanup (TRUNCATE CASCADE) before seeding
2. Ensure UUIDs are unique
3. Check for hardcoded IDs

### Missing Data

If expected data is missing:

1. Check seed file execution order
2. Verify no errors in seed logs
3. Check database connection
