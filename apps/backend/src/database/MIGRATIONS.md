# Database Migrations

This document provides a comprehensive overview of all database migrations in the project.

## Migration History

### Chronological Order

| #   | Timestamp          | Migration                       | BC           | Description                               |
| --- | ------------------ | ------------------------------- | ------------ | ----------------------------------------- |
| 1   | 1702550000000      | EnableUuidExtension             | Shared       | Enable UUID extension for PostgreSQL      |
| 2   | 1702551000000      | CreateAppointmentsTable         | Booking      | Create appointments table                 |
| 3   | 1702551100000      | CreateCapacitiesTable           | Availability | Create capacities table                   |
| 4   | 1702552000000      | CreateUsersTable                | Auth         | Create users table                        |
| 5   | 1702553000000      | CreateOfferingsTable            | Offering     | Create offerings table                    |
| 6   | 1734480000000      | RefactorUserRoles               | Auth         | Refactor user roles to array              |
| 7   | ~~1734480001000~~  | ~~CreateBusinessesTableOld~~    | ~~Business~~ | **DUPLICATE - TO BE DELETED**             |
| 8   | 1734481000000      | StandardizeUsersTableNaming     | Auth         | Standardize users table column naming     |
| 9   | 1734482000000      | CreateCustomersTable            | Customer     | Create customers table                    |
| 10  | 1734650000000      | CreateSchedulesTable            | Availability | Create schedules table                    |
| 11  | 1734650100000      | CreateBlockoutsTable            | Availability | Create blockouts table                    |
| 12  | 1734999000000      | CreateConversationsTable        | Conversation | Create conversations table                |
| 13  | 1735000000000      | CreateMessagesTable             | Conversation | Create messages table                     |
| 14  | 1766128110000      | AddMergedIntoToCustomers        | Customer     | Add merged_into column to customers       |
| 15  | 1766334699000      | CreateBusinessesTable           | Business     | Create businesses table (correct version) |
| 16  | 1766345898000      | CreateBusinessOwnersTable       | Account      | Create business_owners table              |
| 17  | ~~20251219020859~~ | ~~AddSearchIndexesToCustomers~~ | ~~Customer~~ | **INVALID TIMESTAMP - TO BE FIXED**       |

### Migration Order by Bounded Context

#### 1. Shared Kernel

- `1702550000000-EnableUuidExtension.ts` - Enable UUID extension

#### 2. Auth BC

- `1702552000000-CreateUsersTable.ts` - Create users table
- `1734480000000-RefactorUserRoles.ts` - Refactor user roles to array
- `1734481000000-StandardizeUsersTableNaming.ts` - Standardize column naming

#### 3. Account BC

- `1766345898000-CreateBusinessOwnersTable.ts` - Create business_owners table

#### 4. Business BC

- `1766334699000-CreateBusinessesTable.ts` - Create businesses table

#### 5. Customer BC

- `1734482000000-CreateCustomersTable.ts` - Create customers table
- `1766128110000-AddMergedIntoToCustomers.ts` - Add merged_into column

#### 6. Offering BC

- `1702553000000-CreateOfferingsTable.ts` - Create offerings table

#### 7. Availability BC

- `1702551100000-CreateCapacitiesTable.ts` - Create capacities table
- `1734650000000-CreateSchedulesTable.ts` - Create schedules table
- `1734650100000-CreateBlockoutsTable.ts` - Create blockouts table

#### 8. Booking BC

- `1702551000000-CreateAppointmentsTable.ts` - Create appointments table

#### 9. Conversation BC

- `1734999000000-CreateConversationsTable.ts` - Create conversations table
- `1735000000000-CreateMessagesTable.ts` - Create messages table

## Database Schema

### Tables by Bounded Context

#### Auth BC

- **users** - User accounts with authentication
  - Columns: id, email, password, name, roles[], is_active, email_verified, created_at, updated_at

#### Account BC

- **business_owners** - Business owner profiles
  - Columns: id, user_id (FK → users), subscription_plan, subscription_status, onboarding_completed, created_at, updated_at, version

#### Business BC

- **businesses** - Business information
  - Columns: id, owner_id (FK → users), name, whatsapp_number, address, timezone, is_active, created_at, updated_at, version

#### Customer BC

- **customers** - Customer profiles (anonymous or registered)
  - Columns: id, user_id (FK → users, nullable), business_id (FK → businesses), whatsapp_phone, name, merged_into (FK → customers), created_at, updated_at

#### Offering BC

- **offerings** - Services offered by businesses
  - Columns: id, business_id (FK → businesses), name, duration, max_capacity_per_slot, max_daily_capacity, is_active, created_at, updated_at

#### Availability BC

- **schedules** - Business hours by day of week
  - Columns: id, business_id (FK → businesses), day_of_week, start_time, end_time, is_active, created_at, updated_at
- **blockouts** - Date ranges when business is closed
  - Columns: id, business_id (FK → businesses), start_date, end_date, reason, created_at, updated_at
- **capacities** - Available slots per offering per date
  - Columns: id, offering_id (FK → offerings), date, total_slots, available_slots, version, created_at, updated_at

#### Booking BC

- **appointments** - Customer appointments
  - Columns: id, business_id (FK → businesses), customer_id (FK → customers), offering_id (FK → offerings), date_time, status, cancelled_at, version, created_at, updated_at

#### Conversation BC

- **conversations** - WhatsApp conversations
  - Columns: id, business_id (FK → businesses), customer_id (FK → customers), status, last_message_at, version, created_at, updated_at
- **messages** - Individual messages in conversations
  - Columns: id, conversation_id (FK → conversations), direction, content, message_type, sent_at, is_from_admin, created_at, updated_at

## Foreign Key Relationships

```
users (Auth)
  ↓ user_id
  ├─→ business_owners (Account)
  ├─→ businesses.owner_id (Business)
  └─→ customers.user_id (Customer) [nullable]

businesses (Business)
  ↓ business_id
  ├─→ customers (Customer)
  ├─→ offerings (Offering)
  ├─→ schedules (Availability)
  ├─→ blockouts (Availability)
  ├─→ appointments (Booking)
  └─→ conversations (Conversation)

offerings (Offering)
  ↓ offering_id
  ├─→ capacities (Availability)
  └─→ appointments (Booking)

customers (Customer)
  ↓ customer_id
  ├─→ appointments (Booking)
  ├─→ conversations (Conversation)
  └─→ customers.merged_into (Customer) [self-reference]

conversations (Conversation)
  ↓ conversation_id
  └─→ messages (Conversation)
```

## Running Migrations

### Development

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName
```

### Production

```bash
# Run migrations
NODE_ENV=production npm run migration:run
```

## Migration Best Practices

1. **Timestamp Format**: Always use 13-digit Unix timestamp (milliseconds)
2. **Naming Convention**: `{timestamp}-{PascalCaseDescription}.ts`
3. **Class Name**: Must match filename (e.g., `CreateUsersTable`)
4. **Idempotency**: Use `IF NOT EXISTS` for CREATE TABLE
5. **Rollback**: Always implement `down()` method
6. **Foreign Keys**: Create after all tables exist
7. **Indexes**: Create for frequently queried columns
8. **Version Field**: Add to tables using Optimistic Locking

## Known Issues

### To Be Fixed

1. **Duplicate Migration**: `1734480001000-CreateBusinessesTableOld.ts`
   - Status: Duplicate of `1766334699000-CreateBusinessesTable.ts`
   - Action: Delete old version

2. **Invalid Timestamp**: `20251219020859-add-search-indexes-to-customers.ts`
   - Status: Timestamp has 14 digits instead of 13
   - Action: Rename to `1766334699001-AddSearchIndexesToCustomers.ts`

## Verification

Run the migration analysis script to verify integrity:

```bash
npm run migration:analyze
```

Expected output:

- Total Migrations: 17 (after cleanup: 16)
- Valid Migrations: 16 (after cleanup: 16)
- Invalid Migrations: 0
- Duplicates: 0
- Missing Tables: 0
