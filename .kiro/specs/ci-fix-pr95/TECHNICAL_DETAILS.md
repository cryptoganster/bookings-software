# CI Fix for PR #95 - Technical Details

**Date:** December 22, 2024  
**Branch:** `feature/account-business-owner-bc`  
**PR:** #95

---

## Error Analysis

### Original Error Message

```
QueryFailedError: relation "customers" does not exist at character 487

at PostgresQueryRunner.query (typeorm/src/driver/postgres/PostgresQueryRunner.ts:325:19)
at SelectQueryBuilder.loadRawResults (typeorm/src/query-builder/SelectQueryBuilder.ts:3868:25)
```

### Error Location

The error occurred in `AppointmentReadRepository` when executing queries with LEFT JOINs:

```typescript
// apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts

async findById(id: string): Promise<AppointmentReadModel | null> {
  const result = await this.repository
    .createQueryBuilder('appointment')
    .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')  // ← ERROR HERE
    .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')  // ← AND HERE
    .select([
      'appointment.id as id',
      'customer.name as "customerName"',
      'customer.whatsapp_phone as "customerPhone"',
      'offering.name as "offeringName"',
      // ...
    ])
    .where('appointment.id = :id', { id })
    .getRawOne();
}
```

### Why It Failed in CI But Not Locally

**Local Development:**

- Database has all tables created from previous runs
- Manual SQL scripts or migrations created `customers` and `offerings` tables
- Tests pass because tables exist

**CI Environment:**

- Fresh database for each test run
- Only tables for registered TypeORM models are created
- `customers` and `offerings` tables missing because models not registered in `BookingModule`

---

## TypeORM Module Registration Deep Dive

### How TypeORM Creates Tables

When `synchronize: true` is enabled (as in test environments), TypeORM:

1. Scans all models registered in `TypeOrmModule.forFeature()`
2. Generates CREATE TABLE statements for each model
3. Executes the statements to create the schema

**Key Point:** Only registered models get their tables created.

### The Problem

`BookingModule` only registered `AppointmentModel`:

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AppointmentModel]), // ← Only this model
    AvailabilityModule,
    forwardRef(() => CustomerModule),
  ],
  // ...
})
export class BookingModule {}
```

**Result:**

- ✅ `appointments` table created
- ❌ `customers` table NOT created (model not registered)
- ❌ `offerings` table NOT created (model not registered)

### The Solution

Register all models that are referenced in queries:

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      AppointmentModel, // ← Primary model
      CustomerModel, // ← Referenced in JOINs
      OfferingModel, // ← Referenced in JOINs
    ]),
    AvailabilityModule,
    forwardRef(() => CustomerModule),
  ],
  // ...
})
export class BookingModule {}
```

**Result:**

- ✅ `appointments` table created
- ✅ `customers` table created
- ✅ `offerings` table created

---

## Column Name Mapping in TypeORM

### TypeORM Property-to-Column Mapping

TypeORM models use decorators to map camelCase properties to snake_case columns:

```typescript
@Entity("business_owners")
export class BusinessOwnerModel {
  @Column("uuid", { name: "user_id" }) // ← Database column name
  userId!: string; // ← TypeScript property name

  @Column("varchar", { length: 50, name: "subscription_plan" })
  subscriptionPlan!: string;
}
```

### When to Use Which Name

**TypeORM Query Builder (use property names):**

```typescript
// ✅ CORRECT - Use camelCase property names
await repository
  .createQueryBuilder("owner")
  .where("owner.userId = :userId", { userId })
  .andWhere("owner.subscriptionPlan = :plan", { plan: "PRO" })
  .getOne();
```

**Raw SQL Queries (use column names):**

```typescript
// ✅ CORRECT - Use snake_case column names
await dataSource.query(
  `UPDATE business_owners SET subscription_plan = 'PRO' WHERE user_id = $1`,
  [userId],
);

// ❌ WRONG - Using property names in raw SQL
await dataSource.query(
  `UPDATE business_owners SET "subscriptionPlan" = 'PRO' WHERE "userId" = $1`,
  [userId],
);
```

### The Business BC E2E Test Error

The test was using property names in raw SQL:

```typescript
// ❌ WRONG
await dataSource.query(
  `UPDATE business_owners SET "subscriptionPlan" = 'PRO' WHERE "userId" = $1`,
  [userId],
);
```

**Error:**

```
QueryFailedError: column "userId" does not exist
```

**Fix:**

```typescript
// ✅ CORRECT
await dataSource.query(
  `UPDATE business_owners SET subscription_plan = 'PRO' WHERE user_id = $1`,
  [userId],
);
```

---

## Test Database Synchronization

### The `synchronize` Option

TypeORM's `synchronize` option controls automatic schema creation:

```typescript
TypeOrmModule.forRoot({
  type: "postgres",
  // ...
  synchronize: true, // ← Auto-create/update schema
});
```

**When `synchronize: true`:**

- TypeORM automatically creates tables for all registered models
- Schema is updated when models change
- Ideal for tests (fresh schema each run)

**When `synchronize: false`:**

- TypeORM does NOT create or update tables
- Schema must be managed manually (migrations)
- Required for production (prevents accidental schema changes)

### The Business BC Integration Test Error

Three test files used `synchronize: false`:

```typescript
// ❌ WRONG for integration tests
TypeOrmModule.forRoot({
  entities: [BusinessModel],
  synchronize: false, // ← Tables not created
});
```

**Error:**

```
QueryFailedError: relation "businesses" does not exist
```

**Fix:**

```typescript
// ✅ CORRECT for integration tests
TypeOrmModule.forRoot({
  entities: [BusinessModel],
  synchronize: true, // ← Tables auto-created
});
```

---

## Best Practices Established

### 1. Module Registration Rule

**Rule:** Register all models that are referenced in queries (JOINs, subqueries, etc.)

**Example:**

```typescript
// If AppointmentReadRepository does:
.leftJoin('customers', 'customer', ...)
.leftJoin('offerings', 'offering', ...)

// Then BookingModule must register:
TypeOrmModule.forFeature([
  AppointmentModel,
  CustomerModel,   // ← For JOIN
  OfferingModel,   // ← For JOIN
])
```

### 2. Raw SQL Column Names Rule

**Rule:** Always use snake_case column names in raw SQL queries

**Example:**

```typescript
// ✅ CORRECT
await dataSource.query(`WHERE user_id = $1`);

// ❌ WRONG
await dataSource.query(`WHERE "userId" = $1`);
```

### 3. Test Database Setup Rule

**Rule:** Integration tests should use `synchronize: true`

**Example:**

```typescript
// ✅ CORRECT for integration tests
TypeOrmModule.forRoot({
  synchronize: true,
  entities: [
    /* all models used in tests */
  ],
});
```

### 4. E2E Test Database Setup Rule

**Rule:** E2E tests should use `E2EDatabaseHelper.createTestDataSource()`

**Example:**

```typescript
// ✅ CORRECT - Uses helper with all entities
const dataSource = E2EDatabaseHelper.createTestDataSource();
await dataSource.initialize();

// ❌ AVOID - Manual setup may miss entities
const dataSource = new DataSource({
  entities: [SomeModel], // ← May be incomplete
  synchronize: true,
});
```

---

## Verification Steps

### 1. Local Test Verification

```bash
# Run all tests
pnpm --filter backend test

# Expected output:
# Test Suites: 147 passed, 147 total
# Tests:       1312 passed, 1312 total
```

### 2. TypeScript Compilation

```bash
# Verify no type errors
pnpm --filter backend typecheck

# Expected output:
# (no errors)
```

### 3. Linting

```bash
# Verify code style
pnpm --filter backend lint

# Expected output:
# (no errors)
```

### 4. CI Pipeline

- Push to branch triggers CI
- CI runs same tests in clean environment
- All checks must pass

---

## Related Files

### Modified Files

1. `apps/backend/src/booking/booking.module.ts`
2. `apps/backend/src/business/presentation/controllers/__tests__/business.e2e.spec.ts`
3. `apps/backend/src/business/infra/persistence/factories/__tests__/business.factory.integration.spec.ts`
4. `apps/backend/src/business/infra/persistence/repositories/__tests__/business-write.repository.integration.spec.ts`
5. `apps/backend/src/business/infra/persistence/repositories/__tests__/business-read.repository.integration.spec.ts`

### Reference Files

- `apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts` - Contains JOIN queries
- `apps/backend/src/customer/infra/persistence/models/customer.model.ts` - CustomerModel definition
- `apps/backend/src/offering/infra/persistence/models/offering.ts` - OfferingModel definition
- `apps/backend/src/account/infra/persistence/models/business-owner.model.ts` - Column name mappings
- `apps/backend/src/test-utils/e2e-helpers/database.ts` - E2EDatabaseHelper

---

## Commit Details

**Commit Hash:** `3ef99ba`

**Commit Message:**

```
fix(booking,business): resolve CI test failures

- Fix missing customers and offerings tables in Booking BC tests
  * Register CustomerModel and OfferingModel in BookingModule TypeORM
  * AppointmentReadRepository does LEFT JOINs with these tables
  * Without registration, tables don't exist in CI test database

- Fix Business BC E2E test column name mismatch
  * Change 'userId' (camelCase) to 'user_id' (snake_case)
  * Change 'subscriptionPlan' to 'subscription_plan'
  * Match actual database column names in BusinessOwnerModel

- Fix Business BC integration tests table creation
  * Change synchronize from false to true in 3 test files
  * BusinessFactory, BusinessWriteRepository, BusinessReadRepository
  * Ensures businesses table is created in test database

Result: All 1312 tests passing (was 25 failures)
Fixes PR #95 CI error
```

---

**Status:** COMPLETE ✅  
**Date:** December 22, 2024
