# Booking API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token (Required)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Create Appointment](#1-create-appointment)
   - [Get Appointment by ID](#2-get-appointment-by-id)
   - [Get Business Appointments](#3-get-business-appointments)
   - [Get Appointment Statistics](#4-get-appointment-statistics)
   - [Get Upcoming Appointments](#5-get-upcoming-appointments)
   - [Get Today's Appointments](#6-get-todays-appointments)
   - [Cancel Appointment](#7-cancel-appointment)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)

---

## Overview

The Booking API manages appointments and reservations. It provides endpoints for creating, viewing, filtering, and cancelling appointments.

**Key Features:**

- Appointment creation with availability validation
- Flexible filtering (status, date range, offering, customer)
- Real-time appointment statistics
- Appointment cancellation with capacity restoration
- Multi-timezone support

**Business Context:**

- Appointments represent confirmed bookings between customers and businesses
- Each appointment is for a specific offering at a specific time
- Appointments have statuses: CONFIRMED, CANCELLED, COMPLETED
- Cancellations must be made at least 2 hours before appointment time
- Appointments use optimistic locking to prevent concurrent modifications

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

**Token Payload:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "businessId": "business-uuid",
  "roles": ["BUSINESS_OWNER"]
}
```

**Required Role:** `BUSINESS_OWNER` (for business management endpoints)

---

## Endpoints

### 1. Create Appointment

Create a new appointment for a customer.

**Endpoint:** `POST /appointments`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "offeringId": "123e4567-e89b-12d3-a456-426614174000",
  "dateTime": "2025-01-27T10:30:00.000Z"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `offeringId` | UUID | Yes | Valid UUID | ID of the service/offering |
| `dateTime` | string | Yes | ISO 8601, future date | Appointment date and time |

**Example Request:**

```http
POST /appointments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "offeringId": "123e4567-e89b-12d3-a456-426614174000",
  "dateTime": "2025-01-27T10:30:00.000Z"
}
```

**Example Response:** `201 Created`

```json
{
  "appointmentId": "789e0123-e89b-12d3-a456-426614174000"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `appointmentId` | UUID | ID of the created appointment |

**Business Rules:**

- DateTime must be in the future
- DateTime must be within business schedule
- DateTime must not be in a blockout period
- Time slot must have available capacity
- Customer can have maximum 3 active appointments
- Minimum 15 minutes between current time and appointment time

**Error Responses:**

- `400 Bad Request` - Invalid input or business rule violation
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Offering or business not found
- `409 Conflict` - No available capacity or customer limit exceeded

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": ["dateTime must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Cannot create appointment in the past",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 409,
  "message": "No available capacity for this time slot",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Customer has reached maximum active appointments (3)",
  "error": "Conflict"
}
```

---

### 2. Get Appointment by ID

Retrieve a specific appointment by its ID.

**Endpoint:** `GET /appointments/:id`

**Authentication:** Required (JWT)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the appointment |

**Example Request:**

```http
GET /appointments/789e0123-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
  "customerId": "234e5678-e89b-12d3-a456-426614174001",
  "customerName": "Maria Garcia",
  "customerPhone": "+18095551111",
  "offeringId": "123e4567-e89b-12d3-a456-426614174000",
  "offeringName": "Haircut",
  "dateTime": "2025-01-27T10:30:00.000Z",
  "status": "CONFIRMED",
  "createdAt": "2025-01-25T14:20:00.000Z",
  "cancelledAt": null
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Appointment ID |
| `businessId` | UUID | Business ID |
| `customerId` | UUID | Customer ID |
| `customerName` | string | Customer name (denormalized) |
| `customerPhone` | string | Customer phone (E.164 format) |
| `offeringId` | UUID | Offering/service ID |
| `offeringName` | string | Offering name (denormalized) |
| `dateTime` | string | Appointment date and time (ISO 8601) |
| `status` | string | CONFIRMED, CANCELLED, or COMPLETED |
| `createdAt` | string | Creation timestamp (ISO 8601) |
| `cancelledAt` | string \| null | Cancellation timestamp (ISO 8601) |

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Appointment not found

---

### 3. Get Business Appointments

Get all appointments for a business with optional filtering.

**Endpoint:** `GET /appointments`

**Authentication:** Required (JWT)

**Authorization:** Uses `businessId` from JWT token

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | Filter by status (CONFIRMED, CANCELLED, COMPLETED) |
| `startDate` | string | No | - | Filter by start date (ISO 8601) |
| `endDate` | string | No | - | Filter by end date (ISO 8601) |
| `offeringId` | UUID | No | - | Filter by offering |
| `customerId` | UUID | No | - | Filter by customer |

**Example Request:**

```http
GET /appointments?status=CONFIRMED&startDate=2025-01-27T00:00:00.000Z&endDate=2025-02-03T00:00:00.000Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "appointments": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "customerId": "234e5678-e89b-12d3-a456-426614174001",
      "customerName": "Maria Garcia",
      "customerPhone": "+18095551111",
      "offeringId": "123e4567-e89b-12d3-a456-426614174000",
      "offeringName": "Haircut",
      "dateTime": "2025-01-27T10:30:00.000Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-25T14:20:00.000Z",
      "cancelledAt": null
    },
    {
      "id": "890e1234-e89b-12d3-a456-426614174002",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "customerId": "345e6789-e89b-12d3-a456-426614174003",
      "customerName": "Juan Perez",
      "customerPhone": "+18095552222",
      "offeringId": "123e4567-e89b-12d3-a456-426614174000",
      "offeringName": "Haircut",
      "dateTime": "2025-01-27T14:00:00.000Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-25T15:10:00.000Z",
      "cancelledAt": null
    }
  ],
  "total": 2
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `appointments` | AppointmentReadModel[] | Array of appointments |
| `total` | number | Total number of appointments matching filters |

**Filtering Logic:**

- All filters are optional and can be combined
- Date range is inclusive (startDate <= dateTime <= endDate)
- Empty result if no appointments match filters

**Error Responses:**

- `400 Bad Request` - Invalid filter parameters
- `401 Unauthorized` - Missing or invalid JWT token

---

### 4. Get Appointment Statistics

Get statistics about appointments for a business.

**Endpoint:** `GET /appointments/stats`

**Authentication:** Required (JWT)

**Authorization:** Uses `businessId` from JWT token

**Example Request:**

```http
GET /appointments/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "totalAppointments": 156,
  "confirmedAppointments": 142,
  "cancelledAppointments": 12,
  "completedAppointments": 2,
  "cancellationRate": 7.7,
  "appointmentsThisWeek": 23,
  "appointmentsThisMonth": 89,
  "popularOfferings": [
    {
      "offeringId": "123e4567-e89b-12d3-a456-426614174000",
      "offeringName": "Haircut",
      "count": 78
    },
    {
      "offeringId": "234e5678-e89b-12d3-a456-426614174001",
      "offeringName": "Hair Coloring",
      "count": 45
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `totalAppointments` | number | Total appointments (all statuses) |
| `confirmedAppointments` | number | Appointments with CONFIRMED status |
| `cancelledAppointments` | number | Appointments with CANCELLED status |
| `completedAppointments` | number | Appointments with COMPLETED status |
| `cancellationRate` | number | Percentage of cancelled appointments |
| `appointmentsThisWeek` | number | Appointments in current week |
| `appointmentsThisMonth` | number | Appointments in current month |
| `popularOfferings` | OfferingStats[] | Most booked offerings |

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

---

### 5. Get Upcoming Appointments

Get upcoming appointments for a business (future appointments only).

**Endpoint:** `GET /appointments/upcoming`

**Authentication:** Required (JWT)

**Authorization:** Uses `businessId` from JWT token

**Example Request:**

```http
GET /appointments/upcoming
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "appointments": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "customerId": "234e5678-e89b-12d3-a456-426614174001",
      "customerName": "Maria Garcia",
      "customerPhone": "+18095551111",
      "offeringId": "123e4567-e89b-12d3-a456-426614174000",
      "offeringName": "Haircut",
      "dateTime": "2025-01-27T10:30:00.000Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-25T14:20:00.000Z",
      "cancelledAt": null
    }
  ]
}
```

**Business Logic:**

- Returns only appointments with dateTime > current time
- Includes only CONFIRMED status appointments
- Ordered by dateTime ascending (earliest first)
- Typically limited to next 7-30 days

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

---

### 6. Get Today's Appointments

Get appointments scheduled for today.

**Endpoint:** `GET /appointments/today`

**Authentication:** Required (JWT)

**Authorization:** Uses `businessId` from JWT token

**Example Request:**

```http
GET /appointments/today
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "appointments": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "customerId": "234e5678-e89b-12d3-a456-426614174001",
      "customerName": "Maria Garcia",
      "customerPhone": "+18095551111",
      "offeringId": "123e4567-e89b-12d3-a456-426614174000",
      "offeringName": "Haircut",
      "dateTime": "2025-01-26T10:30:00.000Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-25T14:20:00.000Z",
      "cancelledAt": null
    },
    {
      "id": "890e1234-e89b-12d3-a456-426614174002",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "customerId": "345e6789-e89b-12d3-a456-426614174003",
      "customerName": "Juan Perez",
      "customerPhone": "+18095552222",
      "offeringId": "234e5678-e89b-12d3-a456-426614174001",
      "offeringName": "Hair Coloring",
      "dateTime": "2025-01-26T14:00:00.000Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-25T15:10:00.000Z",
      "cancelledAt": null
    }
  ]
}
```

**Business Logic:**

- Returns appointments where dateTime is today (in business timezone)
- Includes CONFIRMED and COMPLETED status
- Ordered by dateTime ascending
- Useful for daily dashboard view

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

---

### 7. Cancel Appointment

Cancel an existing appointment.

**Endpoint:** `PUT /appointments/:id/cancel`

**Authentication:** Required (JWT)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the appointment to cancel |

**Example Request:**

```http
PUT /appointments/789e0123-e89b-12d3-a456-426614174000/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Appointment cancelled successfully"
}
```

**Business Rules:**

- Can only cancel appointments with CONFIRMED status
- Must cancel at least 2 hours before appointment time
- Capacity is restored when appointment is cancelled
- Reminder is automatically cancelled
- Customer is notified via WhatsApp

**Error Responses:**

- `400 Bad Request` - Cannot cancel (too close to appointment time or wrong status)
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't own this appointment
- `404 Not Found` - Appointment not found
- `409 Conflict` - Concurrent modification detected

**Business Rule Violations:**

```json
{
  "statusCode": 400,
  "message": "Cannot cancel appointment within 2 hours of scheduled time",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Appointment is already cancelled",
  "error": "Bad Request"
}
```

**Concurrency Error:**

```json
{
  "statusCode": 409,
  "message": "Appointment was modified by another transaction. Please try again.",
  "error": "Conflict"
}
```

---

## Error Codes

### HTTP Status Codes

| Code  | Description  | When                                                     |
| ----- | ------------ | -------------------------------------------------------- |
| `200` | OK           | Successful request                                       |
| `201` | Created      | Appointment created successfully                         |
| `400` | Bad Request  | Invalid input, validation error, business rule violation |
| `401` | Unauthorized | Missing or invalid JWT token                             |
| `403` | Forbidden    | Insufficient permissions                                 |
| found |
| `or   |

#at

```json
{
 0,
  "ailed",

  "Z"

```

### Common Validation

**Invalid UUID:**

```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

\*\*

on
{
,
"message": ["offerty"],
"error": "Bad Request"
}

````

**I**

```son
{
  "statusCode"

  "error": "Bad Request"
}
````

---

## Data Models

### AppointmentReadModel

````typescript
{
  id: string; // UUID
  businessId: string; // UUID
  customerId: string; // UUID
  customerName: string; // Denormalized frmer
  customerPhone: string; // E.164 format
  offeringId: string; // UUID

  dmp
ED
  createdAt: string; // ISO 8
ll
}
`

### AppointmentFilters

```typescript
{
  status?: string; // CONFIRMEDED
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
 UUID
  c UUID
}
````

### Appointme

```typescript
{
 ber;
  c;
;
  completedAppointments: number;

  appointmentr;

  popularOfferings: OfferingStats[];
}
```

### OfferingStats

```ript
{
  o/ UUID
g;
  count: number; ts
}
```

### CreateAppointmentDto

```typescript
{
  offeringId: string; // UUID
  dateTime: string; // ISO 8601 timestamp
}
``

---

## Business Rules

### Appointment Creation

1. **Future Only** - Cannt

3. hours
4. **No Blockouts** - Cannot book during bles
5. **Capacity Available** - Time slot must have available cay
6. nts
tive



1. **Minimum Notice** - Must cancel at least 2 hours before appment
2. **Status Check** - Can only cancel CONFIRMED appointments
celled
4. **Notification**
lled
6. **No Refunds** - Cancellation policy is enforced (future: payment inteion)

### Appointment Status Flow

```

point)
CONFIRMED → COMPLETED (via sye)

````

ions:**

d
- `CANCELLED` - After cancellation
- `COMPLETED` - After appointment time passes (automed)

---

## Integration BCs

### Availability BC

**Flow:** Validate availability beft

1. Check if date has schedule (`Schedule`)
)
3. Check if tim`)
ent
5. Decrement capacity automatically

### Offering BC

**Dependency:** Appointment requires offering information

- Offering duration
lot
- Only active offerings can be booked

### Customer BC

**Dependency:** Appointment requires cu

- Ct
ns
- Customer can v

### Conversation BC

**Integration:** Notifica

- Appointment confirmation sent after creation
- Cancellation notification sent after cancellation
- Reminder sent 24 hours before appointment

---

## Concurrency Handling

### Optimistic Locking

Appointments use optimistic locking with a `version` field to preventions.

**Scenario:** Two users try to cancel the same appointment simultaneoly

1. User A reads appointment (version=1)
2. User B reads appointment (version=1)
3. User A cancels → version=2 ✅
nflict` ❌
5. )

**Error Resp

```json
{
  "statusCode": 409,
  "message": "Appointmen
  "error": "Conflict"
}
````

---

##

**Current:** No rate limiting implemented

**Recommended (Future):**
.com
ampleev@ex:** d
**Contacteam velopment T:** Deintained By
**Ma5 ber 26, 202 DecemUpdated:\*\*

\*\*Last -DF

-- to CSV/Pintmentsppo Export at** - **Expors
10.ntmentple appoicel multiCantions** - **Bulk Operandpoint 9. e echedul reslified- Simpcheduling** 8. **Resllations
ance late cge fee fors** - Charn Feeancellatio**Coking 7. ent on bot paymllec- Coation** tegr**Payment In 6. tionomple after cerviceate ss** - Rtingtomer Ra **Cusments
5.oint to app Add notesnt Notes** -*Appointmeable 4. *ity availpacwhen no catlist oin wait** - J*Waitlisngs 3. * booki recurringt for* - Supporointments*urring App*Rect 2. *pointmenapf existing me o date/ti* - Changedification*ointment Mo

1. \*\*AppEnhancements

## Future s

---

tion BCd Conversastomer, anOffering, Cuty, Availabiliion with

- Integratg documentedandlinrency h
- Concurness ruleson with busiati
- Cancellicsatistd st anringnt
- Filte managemeion and creat Appointmentented
  -oints documdp
- 7 enationumentocial API d)

- Init (2025-12-26.0ersion 1# V
  ##og
  ngel# Cha

#

---ing
rror handl E
-ticsd statising anFilterel)

- ew → cancreate → viow (c flte booking- Comple

sts## E2E Teation

#idlocking valmistic Optintment

- same appoition ofcellaaneous cSimultane slot
- or sam creation fpointmentultaneous ap

- Simsstncy Te Concurre

###cancelte/crea updates on pacity- Caead models
h rers witery handlQu- ase
ith databd handlers w

- Commanion Tests

### Integrat

leson rulatinceltions

- Caatus transigic
- Stess loe busin aggregatointment
- App
  ts## Unit Tes

#esting T-

##--s access

oss-busines

- No crlti-tenant)s (muusinesolated by bs are isntntme
- Appoiownersiness to busible visnumbers are r phone
- Custome Privacy

## Data

#

uest)from reqot WT token (nrom J fis extracted BusinessId

- ownted orreahey cntments toi cancel app onlys canness
- Usereir busi thtments forview appoiny nln o
- Users caation
  Authorizy

### ecurit S

---

## | updateapacity c Includes | 00ms | < 3ent intmcel Appoan

| C | y ed querIndexs | < 200m | dayet To |
| G ed query | Index 200ms | < oming Get Upc |
|ery tion qu Aggrega00ms | | < 4 Statistics Get|
| nd joinsilters a | With fms ents | < 300pointm Apessusin|
| Get B key lookup| Primary 0ms | < 10 ent ppointm A |
| Getk bility checudes availa Incl | 0ms < 50 |ointment Create App
|---- |------------------------------ | - ------- |----------------------| - |
s (p95) | Noteet | Targ ndpoint gets

| Earrmance T# Perfo

#

---ser
per ur minute pe0 requests t: 2dpoin en Cancelnt spam)
-user (prevee per per minutquests 10 ree endpoint: r

- Creat per use per minutetses 100 requts:ndpoiny e- Quer
