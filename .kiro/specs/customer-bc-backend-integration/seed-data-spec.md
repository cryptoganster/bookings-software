# Customer Seed Data Specification

## Overview

This document specifies comprehensive seed data for testing all customer scenarios and edge cases in the Customer BC backend integration.

---

## Seed Data Requirements

### Total Customers: 25

**Distribution:**

- Anonymous (userId=null): 12 customers
- Registered (userId!=null): 8 customers
- Merged (merged_into set): 5 customers

**Characteristics:**

- Various name patterns (short, long, special characters, null)
- Various phone patterns (different country codes, formats)
- Different appointment counts (0, 1, 5, 10+)
- Potential duplicate pairs for deduplication testing
- Various creation dates for time-based filtering

---

## Seed Data Structure

### 1. Anonymous Customers (12)

#### Customer 1 - Juan Pérez

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095551111',
  name: 'Juan Pérez',
  version: 0,
  mergedInto: null,
  createdAt: '2024-01-15T10:00:00Z',
  appointmentCount: 5
}
```

#### Customer 2 - Carlos López

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095553333',
  name: 'Carlos López',
  version: 0,
  mergedInto: null,
  createdAt: '2024-02-20T14:30:00Z',
  appointmentCount: 0
}
```

#### Customer 3 - No Name (Anonymous)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095554444',
  name: null,
  version: 0,
  mergedInto: null,
  createdAt: '2024-03-10T09:15:00Z',
  appointmentCount: 1
}
```

#### Customer 4 - Juan Perez (Duplicate Candidate)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095556666',
  name: 'Juan Perez', // Similar to Juan Pérez (no accent)
  version: 0,
  mergedInto: null,
  createdAt: '2024-04-05T11:20:00Z',
  appointmentCount: 2
}
```

#### Customer 5 - Luis Rodríguez

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095558888',
  name: 'Luis Rodríguez',
  version: 0,
  mergedInto: null,
  createdAt: '2024-05-12T16:45:00Z',
  appointmentCount: 3
}
```

#### Customer 6 - Carmen Díaz

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095559999',
  name: 'Carmen Díaz',
  version: 0,
  mergedInto: null,
  createdAt: '2024-12-01T08:00:00Z', // Recent (this month)
  appointmentCount: 1
}
```

#### Customer 7 - José María de la Cruz y Fernández (Long Name)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+34612345678', // Spain
  name: 'José María de la Cruz y Fernández',
  version: 0,
  mergedInto: null,
  createdAt: '2024-06-18T13:30:00Z',
  appointmentCount: 4
}
```

#### Customer 8 - O'Brien (Special Character)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+442071234567', // UK
  name: "O'Brien",
  version: 0,
  mergedInto: null,
  createdAt: '2024-07-22T10:15:00Z',
  appointmentCount: 2
}
```

#### Customer 9 - 李明 (Chinese Characters)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+8613800138000', // China
  name: '李明',
  version: 0,
  mergedInto: null,
  createdAt: '2024-08-30T15:20:00Z',
  appointmentCount: 1
}
```

#### Customer 10 - Müller (Umlaut)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+4915123456789', // Germany
  name: 'Müller',
  version: 0,
  mergedInto: null,
  createdAt: '2024-09-14T12:00:00Z',
  appointmentCount: 3
}
```

#### Customer 11 - No Name 2 (Anonymous)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095550000',
  name: null,
  version: 0,
  mergedInto: null,
  createdAt: '2024-10-05T09:30:00Z',
  appointmentCount: 0
}
```

#### Customer 12 - Roberto Sánchez

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+18095551234',
  name: 'Roberto Sánchez',
  version: 0,
  mergedInto: null,
  createdAt: '2024-11-20T14:45:00Z',
  appointmentCount: 6
}
```

---

### 2. Registered Customers (8)

#### Customer 13 - María García (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId1, // Linked to test@example.com
  businessId: testBusinessId,
  whatsappPhone: '+18095552222',
  name: 'María García',
  version: 0,
  mergedInto: null,
  createdAt: '2024-01-20T11:00:00Z',
  appointmentCount: 10
}
```

#### Customer 14 - Ana Martínez (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId2, // Linked to test2@example.com
  businessId: testBusinessId,
  whatsappPhone: '+18095555555',
  name: 'Ana Martínez',
  version: 0,
  mergedInto: null,
  createdAt: '2024-02-15T10:30:00Z',
  appointmentCount: 3
}
```

#### Customer 15 - Maria Garcia (Duplicate Candidate, Registered)

```typescript
{
  id: uuid(),
  userId: testUserId3, // Linked to test3@example.com
  businessId: testBusinessId,
  whatsappPhone: '+18095557777',
  name: 'Maria Garcia', // Similar to María García (no accents)
  version: 0,
  mergedInto: null,
  createdAt: '2024-03-25T09:00:00Z',
  appointmentCount: 2
}
```

#### Customer 16 - Pedro Ramírez (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId4,
  businessId: testBusinessId,
  whatsappPhone: '+18095558765',
  name: 'Pedro Ramírez',
  version: 0,
  mergedInto: null,
  createdAt: '2024-04-10T13:15:00Z',
  appointmentCount: 7
}
```

#### Customer 17 - Laura Fernández (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId5,
  businessId: testBusinessId,
  whatsappPhone: '+18095559876',
  name: 'Laura Fernández',
  version: 0,
  mergedInto: null,
  createdAt: '2024-05-22T16:00:00Z',
  appointmentCount: 4
}
```

#### Customer 18 - Diego Torres (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId6,
  businessId: testBusinessId,
  whatsappPhone: '+18095550987',
  name: 'Diego Torres',
  version: 0,
  mergedInto: null,
  createdAt: '2024-12-10T10:00:00Z', // Recent (this month)
  appointmentCount: 1
}
```

#### Customer 19 - Sofía Morales (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId7,
  businessId: testBusinessId,
  whatsappPhone: '+18095551098',
  name: 'Sofía Morales',
  version: 0,
  mergedInto: null,
  createdAt: '2024-12-15T14:30:00Z', // Recent (this week)
  appointmentCount: 0
}
```

#### Customer 20 - Miguel Ángel Ruiz (Registered)

```typescript
{
  id: uuid(),
  userId: testUserId8,
  businessId: testBusinessId,
  whatsappPhone: '+18095552109',
  name: 'Miguel Ángel Ruiz',
  version: 0,
  mergedInto: null,
  createdAt: '2024-11-05T11:45:00Z',
  appointmentCount: 12
}
```

---

### 3. Merged Customers (5)

#### Customer 21 - Pedro Sánchez (Merged into Customer 16)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+999170000001', // Anonymized
  name: null, // Anonymized
  version: 0,
  mergedInto: customerId16, // Merged into Pedro Ramírez
  createdAt: '2024-01-10T09:00:00Z',
  appointmentCount: 0 // Appointments transferred
}
```

#### Customer 22 - Juan P (Merged into Customer 1)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+999170000002',
  name: null,
  version: 0,
  mergedInto: customerId1, // Merged into Juan Pérez
  createdAt: '2024-02-05T10:30:00Z',
  appointmentCount: 0
}
```

#### Customer 23 - Maria G (Merged into Customer 13)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+999170000003',
  name: null,
  version: 0,
  mergedInto: customerId13, // Merged into María García
  createdAt: '2024-03-12T11:15:00Z',
  appointmentCount: 0
}
```

#### Customer 24 - Carlos L (Merged into Customer 2)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+999170000004',
  name: null,
  version: 0,
  mergedInto: customerId2, // Merged into Carlos López
  createdAt: '2024-04-20T14:00:00Z',
  appointmentCount: 0
}
```

#### Customer 25 - Luis R (Merged into Customer 5)

```typescript
{
  id: uuid(),
  userId: null,
  businessId: testBusinessId,
  whatsappPhone: '+999170000005',
  name: null,
  version: 0,
  mergedInto: customerId5, // Merged into Luis Rodríguez
  createdAt: '2024-05-08T15:30:00Z',
  appointmentCount: 0
}
```

---

## Appointment Distribution

| Customer | Name              | Appointments |
| -------- | ----------------- | ------------ |
| 1        | Juan Pérez        | 5            |
| 2        | Carlos López      | 0            |
| 3        | No Name           | 1            |
| 4        | Juan Perez        | 2            |
| 5        | Luis Rodríguez    | 3            |
| 6        | Carmen Díaz       | 1            |
| 7        | José María...     | 4            |
| 8        | O'Brien           | 2            |
| 9        | 李明              | 1            |
| 10       | Müller            | 3            |
| 11       | No Name 2         | 0            |
| 12       | Roberto Sánchez   | 6            |
| 13       | María García      | 10           |
| 14       | Ana Martínez      | 3            |
| 15       | Maria Garcia      | 2            |
| 16       | Pedro Ramírez     | 7            |
| 17       | Laura Fernández   | 4            |
| 18       | Diego Torres      | 1            |
| 19       | Sofía Morales     | 0            |
| 20       | Miguel Ángel Ruiz | 12           |
| 21-25    | Merged            | 0            |

**Total Appointments:** 65

---

## Duplicate Pairs for Testing

### Pair 1: Juan Pérez vs Juan Perez

- **Customer 1:** Juan Pérez (+18095551111)
- **Customer 4:** Juan Perez (+18095556666)
- **Similarity:** ~0.95 (name very similar, different phones)
- **Reason:** Name without accent

### Pair 2: María García vs Maria Garcia

- **Customer 13:** María García (+18095552222)
- **Customer 15:** Maria Garcia (+18095557777)
- **Similarity:** ~0.93 (name very similar, different phones)
- **Reason:** Name without accents

---

## Time-Based Distribution

### By Month (2024)

| Month     | Count | Customers |
| --------- | ----- | --------- |
| January   | 3     | 1, 13, 21 |
| February  | 3     | 2, 14, 22 |
| March     | 3     | 3, 15, 23 |
| April     | 3     | 4, 16, 24 |
| May       | 3     | 5, 17, 25 |
| June      | 1     | 7         |
| July      | 1     | 8         |
| August    | 1     | 9         |
| September | 1     | 10        |
| October   | 1     | 11        |
| November  | 2     | 12, 20    |
| December  | 3     | 6, 18, 19 |

### Recent Customers

**This Week (Dec 15-19, 2024):**

- Customer 19 (Sofía Morales) - Dec 15

**This Month (December 2024):**

- Customer 6 (Carmen Díaz) - Dec 1
- Customer 18 (Diego Torres) - Dec 10
- Customer 19 (Sofía Morales) - Dec 15

---

## Implementation Notes

### Seed File Location

`apps/backend/src/database/seeds/customer.seed.ts`

### Dependencies

- Requires `testBusinessId` from business seed
- Requires `testUserId1-8` from auth seed
- Referenced by appointment seed for `customerId`

### Execution Order

1. Auth seed (creates users)
2. Business seed (creates business)
3. **Customer seed** (creates customers)
4. Offering seed (creates offerings)
5. Appointment seed (creates appointments, references customers)

### Verification Queries

```sql
-- Total customers
SELECT COUNT(*) FROM customers;
-- Expected: 25

-- Anonymous customers
SELECT COUNT(*) FROM customers WHERE user_id IS NULL;
-- Expected: 17 (12 active + 5 merged)

-- Registered customers
SELECT COUNT(*) FROM customers WHERE user_id IS NOT NULL;
-- Expected: 8

-- Merged customers
SELECT COUNT(*) FROM customers WHERE merged_into IS NOT NULL;
-- Expected: 5

-- Customers with appointments
SELECT COUNT(DISTINCT customer_id) FROM appointments;
-- Expected: 18 (excluding merged and 0-appointment customers)
```

---

## References

- `.kiro/specs/customer-bc-backend-integration/requirements.md` - Requirement 13
- `.kiro/specs/customer-bc-backend-integration/design.md` - Seed Data Design
- `.kiro/specs/customer-bc-backend-integration/tasks.md` - Phase 4.4
- `apps/backend/src/database/seeds/customer.seed.ts` - Implementation file
