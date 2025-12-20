# Database Verification Guide

## Overview

This guide provides step-by-step instructions for verifying the Customer BC seed data and database schema in the Docker PostgreSQL container.

**Container ID:** `d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0`

---

## Prerequisites

1. Docker container is running
2. Seeds have been executed: `pnpm --filter backend seed`
3. Migrations have been applied: `pnpm --filter backend migration:run`

---

## Connection Methods

### Method 1: Direct Docker Exec

```bash
docker exec -it d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0 psql -U postgres -d bookings_dev
```

### Method 2: Docker Compose (if using docker-compose)

```bash
docker-compose exec postgres psql -U postgres -d bookings_dev
```

### Method 3: Local psql Client

```bash
psql -h localhost -p 5432 -U postgres -d bookings_dev
```

**Password:** (check `.env` file or docker-compose.yml)

---

## Verification Checklist

### ✅ Step 1: Verify Connection

```sql
-- Check current database
SELECT current_database();
-- Expected: bookings_dev

-- Check PostgreSQL version
SELECT version();
-- Expected: PostgreSQL 14.x or higher

-- List all tables
\dt
-- Expected: customers, users, businesses, appointments, offerings, etc.
```

---

### ✅ Step 2: Verify Customer Counts

```sql
-- Total customers
SELECT COUNT(*) as total FROM customers;
-- Expected: 25

-- Anonymous customers (userId IS NULL, not merged)
SELECT COUNT(*) as anonymous
FROM customers
WHERE user_id IS NULL
  AND merged_into IS NULL;
-- Expected: 12

-- Registered customers (userId IS NOT NULL)
SELECT COUNT(*) as registered
FROM customers
WHERE user_id IS NOT NULL;
-- Expected: 8

-- Merged customers (soft deleted)
SELECT COUNT(*) as merged
FROM customers
WHERE merged_into IS NOT NULL;
-- Expected: 5

-- Active customers (not merged)
SELECT COUNT(*) as active
FROM customers
WHERE merged_into IS NULL;
-- Expected: 20
```

**✅ Pass Criteria:** All counts match expected values

---

### ✅ Step 3: Verify Indexes

```sql
-- List all indexes on customers table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customers'
ORDER BY indexname;
```

**Expected Indexes:**

| Index Name                     | Definition                                        |
| ------------------------------ | ------------------------------------------------- |
| `customers_pkey`               | PRIMARY KEY (id)                                  |
| `idx_customers_business_id`    | INDEX (business_id)                               |
| `idx_customers_business_phone` | UNIQUE (business_id, whatsapp_phone)              |
| `idx_customers_merged_into`    | INDEX (merged_into) WHERE merged_into IS NOT NULL |
| `idx_customers_name_search`    | INDEX (LOWER(name))                               |
| `idx_customers_user_id`        | INDEX (user_id) WHERE user_id IS NOT NULL         |

**✅ Pass Criteria:** All 6 indexes exist

---

### ✅ Step 4: Verify Foreign Keys

```sql
-- List foreign keys on customers table
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customers'
ORDER BY tc.constraint_name;
```

**Expected Foreign Keys:**

| Constraint Name         | Column      | References     |
| ----------------------- | ----------- | -------------- |
| `fk_customers_business` | business_id | businesses(id) |
| `fk_customers_user`     | user_id     | users(id)      |

**✅ Pass Criteria:** Both foreign keys exist

---

### ✅ Step 5: Verify Unique Constraint

```sql
-- Test unique constraint on (business_id, whatsapp_phone)
-- This INSERT should FAIL with duplicate key error
INSERT INTO customers (id, business_id, whatsapp_phone, name, version)
SELECT
  gen_random_uuid(),
  business_id,
  whatsapp_phone,
  'Test Duplicate',
  0
FROM customers
WHERE whatsapp_phone = '+18095551111'
LIMIT 1;
```

**Expected Result:**

```
ERROR:  duplicate key value violates unique constraint "idx_customers_business_phone"
DETAIL:  Key (business_id, whatsapp_phone)=(xxx, +18095551111) already exists.
```

**✅ Pass Criteria:** INSERT fails with duplicate key error

**Cleanup:**

```sql
-- No cleanup needed (INSERT failed)
```

---

### ✅ Step 6: Verify Sample Data

```sql
-- View all customers with key details
SELECT
  id,
  CASE
    WHEN user_id IS NOT NULL THEN 'Registered'
    WHEN merged_into IS NOT NULL THEN 'Merged'
    ELSE 'Anonymous'
  END as type,
  name,
  whatsapp_phone,
  version,
  created_at::date as created_date
FROM customers
ORDER BY created_at DESC
LIMIT 25;
```

**Expected Output:**

- 25 rows total
- Mix of Registered, Anonymous, and Merged types
- Various names (including null, special characters, international)
- Various phone formats (+1809, +34, +44, +86, +49, +999)
- Dates ranging from January to December 2024

**✅ Pass Criteria:** All 25 customers visible with diverse data

---

### ✅ Step 7: Verify Appointment Counts

```sql
-- Customers with appointment counts
SELECT
  c.id,
  c.name,
  c.whatsapp_phone,
  CASE
    WHEN c.user_id IS NOT NULL THEN 'Registered'
    WHEN c.merged_into IS NOT NULL THEN 'Merged'
    ELSE 'Anonymous'
  END as type,
  COUNT(a.id) as appointment_count
FROM customers c
LEFT JOIN appointments a ON a.customer_id = c.id
WHERE c.merged_into IS NULL
GROUP BY c.id, c.name, c.whatsapp_phone, c.user_id, c.merged_into
ORDER BY appointment_count DESC
LIMIT 10;
```

**Expected Top Customers:**

1. Miguel Ángel Ruiz - 12 appointments
2. María García - 10 appointments
3. Pedro Ramírez - 7 appointments
4. Roberto Sánchez - 6 appointments
5. Juan Pérez - 5 appointments

**✅ Pass Criteria:** Top customers match expected appointment counts

---

### ✅ Step 8: Verify Duplicate Candidates

```sql
-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Find potential duplicates using similarity
SELECT
  c1.id as id1,
  c1.name as name1,
  c1.whatsapp_phone as phone1,
  c2.id as id2,
  c2.name as name2,
  c2.whatsapp_phone as phone2,
  similarity(LOWER(COALESCE(c1.name, '')), LOWER(COALESCE(c2.name, ''))) as name_similarity
FROM customers c1
CROSS JOIN customers c2
WHERE c1.id < c2.id
  AND c1.business_id = c2.business_id
  AND c1.merged_into IS NULL
  AND c2.merged_into IS NULL
  AND c1.name IS NOT NULL
  AND c2.name IS NOT NULL
  AND similarity(LOWER(c1.name), LOWER(c2.name)) > 0.7
ORDER BY name_similarity DESC;
```

**Expected Duplicate Pairs:**

1. Juan Pérez vs Juan Perez - similarity ~0.95
2. María García vs Maria Garcia - similarity ~0.93

**✅ Pass Criteria:** At least 2 duplicate pairs found with similarity > 0.7

---

### ✅ Step 9: Verify Time-Based Filtering

```sql
-- Customers created this week
SELECT COUNT(*) as new_this_week
FROM customers
WHERE created_at >= date_trunc('week', CURRENT_DATE)
  AND merged_into IS NULL;
-- Expected: 1 (Sofía Morales - Dec 15)

-- Customers created this month
SELECT COUNT(*) as new_this_month
FROM customers
WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND merged_into IS NULL;
-- Expected: 3 (Carmen Díaz, Diego Torres, Sofía Morales)

-- Customers by month (last 6 months)
SELECT
  to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
  COUNT(*) as count
FROM customers
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  AND merged_into IS NULL
GROUP BY date_trunc('month', created_at)
ORDER BY month DESC;
```

**Expected Recent Months:**

- 2024-12: 3 customers
- 2024-11: 2 customers
- 2024-10: 1 customer
- 2024-09: 1 customer
- 2024-08: 1 customer
- 2024-07: 1 customer

**✅ Pass Criteria:** Counts match expected distribution

---

### ✅ Step 10: Verify Merged Customers

```sql
-- View merged customers with their targets
SELECT
  c.id as merged_customer_id,
  c.whatsapp_phone as anonymized_phone,
  c.name as anonymized_name,
  c.merged_into as target_customer_id,
  t.name as target_name,
  t.whatsapp_phone as target_phone
FROM customers c
JOIN customers t ON c.merged_into = t.id
WHERE c.merged_into IS NOT NULL
ORDER BY c.created_at;
```

**Expected Output:**

- 5 merged customers
- All have `whatsapp_phone` starting with '+999'
- All have `name` = NULL
- All have valid `merged_into` pointing to active customers

**✅ Pass Criteria:** 5 merged customers with proper anonymization

---

### ✅ Step 11: Verify International Phone Formats

```sql
-- Group customers by country code
SELECT
  CASE
    WHEN whatsapp_phone LIKE '+1809%' THEN 'Dominican Republic (+1809)'
    WHEN whatsapp_phone LIKE '+34%' THEN 'Spain (+34)'
    WHEN whatsapp_phone LIKE '+44%' THEN 'UK (+44)'
    WHEN whatsapp_phone LIKE '+86%' THEN 'China (+86)'
    WHEN whatsapp_phone LIKE '+49%' THEN 'Germany (+49)'
    WHEN whatsapp_phone LIKE '+999%' THEN 'Anonymized (+999)'
    ELSE 'Other'
  END as country,
  COUNT(*) as count
FROM customers
GROUP BY country
ORDER BY count DESC;
```

**Expected Distribution:**

- Dominican Republic (+1809): ~15 customers
- Anonymized (+999): 5 customers
- Spain (+34): 1 customer
- UK (+44): 1 customer
- China (+86): 1 customer
- Germany (+49): 1 customer

**✅ Pass Criteria:** Multiple country codes represented

---

### ✅ Step 12: Verify Special Characters in Names

```sql
-- Find customers with special characters
SELECT
  id,
  name,
  whatsapp_phone,
  CASE
    WHEN name ~ '[áéíóúñü]' THEN 'Spanish accents'
    WHEN name ~ '[ü]' THEN 'German umlaut'
    WHEN name ~ '''' THEN 'Apostrophe'
    WHEN name ~ '[\u4e00-\u9fff]' THEN 'Chinese characters'
    ELSE 'Standard'
  END as character_type
FROM customers
WHERE name IS NOT NULL
  AND merged_into IS NULL
  AND (
    name ~ '[áéíóúñü]' OR
    name ~ '[ü]' OR
    name ~ '''' OR
    name ~ '[\u4e00-\u9fff]'
  )
ORDER BY name;
```

**Expected Special Characters:**

- Spanish accents: José María, Sofía, etc.
- German umlaut: Müller
- Apostrophe: O'Brien
- Chinese: 李明

**✅ Pass Criteria:** Multiple special character types found

---

## Verification Summary

### Checklist

- [ ] ✅ Step 1: Connection successful
- [ ] ✅ Step 2: Customer counts correct (25 total, 12 anonymous, 8 registered, 5 merged)
- [ ] ✅ Step 3: All 6 indexes exist
- [ ] ✅ Step 4: Both foreign keys exist
- [ ] ✅ Step 5: Unique constraint enforced
- [ ] ✅ Step 6: Sample data visible (25 customers)
- [ ] ✅ Step 7: Appointment counts correct
- [ ] ✅ Step 8: Duplicate pairs found (2+)
- [ ] ✅ Step 9: Time-based filtering works
- [ ] ✅ Step 10: Merged customers properly anonymized (5)
- [ ] ✅ Step 11: International phone formats present
- [ ] ✅ Step 12: Special characters in names

### Pass Criteria

**All 12 steps must pass for verification to be complete.**

---

## Troubleshooting

### Issue: Connection Refused

**Solution:**

```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0

# Restart container if needed
docker restart d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0
```

### Issue: Wrong Customer Count

**Solution:**

```bash
# Re-run seeds
pnpm --filter backend seed

# Verify seed output
# Should show: "✅ Customer BC seeded: 25 customers"
```

### Issue: Missing Indexes

**Solution:**

```bash
# Re-run migrations
pnpm --filter backend migration:run

# Check migration status
pnpm --filter backend migration:show
```

### Issue: pg_trgm Extension Not Found

**Solution:**

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
```

---

## Cleanup Commands

```sql
-- Drop all customers (CAUTION: This will cascade to appointments)
-- TRUNCATE customers CASCADE;

-- Reset auto-increment (if using SERIAL)
-- Not applicable (using UUIDs)

-- Drop and recreate database (NUCLEAR OPTION)
-- DROP DATABASE bookings_dev;
-- CREATE DATABASE bookings_dev;
```

---

## References

- `.kiro/specs/customer-bc-backend-integration/requirements.md` - Requirement 14
- `.kiro/specs/customer-bc-backend-integration/design.md` - Database Verification
- `.kiro/specs/customer-bc-backend-integration/seed-data-spec.md` - Seed Data Specification
- `.kiro/specs/customer-bc-backend-integration/tasks.md` - Phase 5
- `apps/backend/src/database/seeds/customer.seed.ts` - Seed implementation
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) - Similarity functions
