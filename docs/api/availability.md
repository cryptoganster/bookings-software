# Availability API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token (Required)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Get Available Dates](#1-get-available-dates)
   - [Get Available Time Slots](#2-get-available-time-slots)
   - [Create Blockout](#3-create-blockout)
   - [Get Blockouts by Business](#4-get-blockouts-by-business)
   - [Delete Blockout](#5-delete-blockout)
   - [Create Schedule](#6-create-schedule)
   - [Get Schedules by Business](#7-get-schedules-by-business)
   - [Update Schedule](#8-update-schedule)
   - [Delete Schedule](#9-delete-schedule)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)

---

## Overview

The Availability API manages business schedules, blockouts, and capacity for appointment booking. It provides endpoints for:

- **Availability Queries** - Check available dates and time slots for services
- **Schedule Management** - Configure business hours by day of week
- **Blockout Management** - Block specific dates (vacations, holidays)
- **Capacity Management** - Track and manage appointment capacity

**Key Features:**

- Real-time availability checking
- Flexible schedule configuration (different hours per day)
- Date range blockouts with reasons
- Automatic capacity calculation
- Multi-timezone support

**Business Context:**

- Schedules define when a business is open (e.g., Mon-Fri 9am-5pm)
- Blockouts override schedules for specific dates (e.g., Christmas Day)
- Capacity tracks how many appointments can be booked per time slot
- Availability queries combine schedules, blockouts, and capacity

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

**Required Role:** `BUSINESS_OWNER` (for management endpoints)

---

## Endpoints

### 1. Get Available Dates

Get a list of available dates for a specific offering within a date range.

**Endpoint:** `GET /availability/dates`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offeringId` | UUID | Yes | ID of the offering/service |
| `businessId` | UUID | Yes | ID of the business |
| `startDate` | string | Yes | Start date (ISO 8601 format) |
| `endDate` | string | Yes | End date (ISO 8601 format) |

**Example Request:**

```http
GET /availability/dates?offeringId=123e4567-e89b-12d3-a456-426614174000&businessId=489b4d38-5146-4760-ae5f-d1910c3308bb&startDate=2025-01-27T00:00:00.000Z&endDate=2025-02-03T00:00:00.000Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "availableDates": [
    "2025-01-27",
    "2025-01-28",
    "2025-01-29",
    "2025-01-30",
    "2025-02-02",
    "2025-02-03"
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `availableDates` | string[] | Array of available dates in YYYY-MM-DD format |

**Business Logic:**

- Excludes dates outside business schedule
- Excludes dates with blockouts
- Excludes dates with no capacity
- Returns dates in chronological order

**Error Responses:**

- `400 Bad Request` - Invalid date format or date range
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Offering or business not found

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": ["startDate must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "End date must be after start date",
  "error": "Bad Request"
}
```

---

### 2. Get Available Time Slots

Get available time slots for a specific date and offering.

**Endpoint:** `GET /availability/slots`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offeringId` | UUID | Yes | ID of the offering/service |
| `businessId` | UUID | Yes | ID of the business |
| `date` | string | Yes | Date to check (ISO 8601 format) |
| `durationMinutes` | number | Yes | Duration of the service in minutes |

**Example Request:**

```http
GET /availability/slots?offeringId=123e4567-e89b-12d3-a456-426614174000&businessId=489b4d38-5146-4760-ae5f-d1910c3308bb&date=2025-01-27T00:00:00.000Z&durationMinutes=30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "availableSlots": [
    {
      "startTime": "09:00",
      "endTime": "09:30",
      "availableCapacity": 2
    },
    {
      "startTime": "09:30",
      "endTime": "10:00",
      "availableCapacity": 2
    },
    {
      "startTime": "10:00",
      "endTime": "10:30",
      "availableCapacity": 1
    },
    {
      "startTime": "14:00",
      "endTime": "14:30",
      "availableCapacity": 2
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `availableSlots` | TimeSlot[] | Array of available time slots |
| `availableSlots[].startTime` | string | Start time in HH:mm format |
| `availableSlots[].endTime` | string | End time in HH:mm format |
| `availableSlots[].availableCapacity` | number | Number of appointments that can be booked |

**Business Logic:**

- Generates slots based on business schedule for that day
- Excludes slots with no capacity
- Respects offering duration
- Returns slots in chronological order
- Slots are in business timezone

**Error Responses:**

- `400 Bad Request` - Invalid date format or duration
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Offering or business not found

---

### 3. Create Blockout

Create a new blockout to prevent bookings for a specific date range.

**Endpoint:** `POST /blockouts`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Request Body:**

```json
{
  "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
  "startDate": "2025-12-24T00:00:00.000Z",
  "endDate": "2025-12-26T23:59:59.999Z",
  "reason": "Christmas Holiday"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `businessId` | UUID | Yes | Valid UUID | ID of the business |
| `startDate` | string | Yes | ISO 8601 | Start date of blockout |
| `endDate` | string | Yes | ISO 8601 | End date of blockout |
| `reason` | string | No | Max 200 chars | Reason for blockout |

**Example Request:**

```http
POST /blockouts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
  "startDate": "2025-12-24T00:00:00.000Z",
  "endDate": "2025-12-26T23:59:59.999Z",
  "reason": "Christmas Holiday"
}
```

**Example Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | ID of the created blockout |

**Business Rules:**

- End date must be after or equal to start date
- Blockouts can overlap (multiple reasons for same date)
- Existing appointments are NOT cancelled automatically
- Prevents new appointments during blockout period

**Error Responses:**

- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business not found

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": ["businessId must be a UUID"],
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "End date must be after or equal to start date",
  "error": "Bad Request"
}
```

---

### 4. Get Blockouts by Business

Get all blockouts for a specific business.

**Endpoint:** `GET /blockouts`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessId` | UUID | Yes | ID of the business |

**Example Request:**

```http
GET /blockouts?businessId=489b4d38-5146-4760-ae5f-d1910c3308bb
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "blockouts": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "startDate": "2025-12-24T00:00:00.000Z",
      "endDate": "2025-12-26T23:59:59.999Z",
      "reason": "Christmas Holiday",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "startDate": "2025-07-04T00:00:00.000Z",
      "endDate": "2025-07-04T23:59:59.999Z",
      "reason": "Independence Day",
      "createdAt": "2025-01-15T10:35:00.000Z"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `blockouts` | BlockoutReadModel[] | Array of blockouts |
| `blockouts[].id` | UUID | Blockout ID |
| `blockouts[].businessId` | UUID | Business ID |
| `blockouts[].startDate` | string | Start date (ISO 8601) |
| `blockouts[].endDate` | string | End date (ISO 8601) |
| `blockouts[].reason` | string \| null | Reason for blockout |
| `blockouts[].createdAt` | string | Creation timestamp (ISO 8601) |

**Error Responses:**

- `400 Bad Request` - Invalid businessId format
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Business not found

---

### 5. Delete Blockout

Delete a blockout by ID.

**Endpoint:** `DELETE /blockouts/:id`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the blockout to delete |

**Example Request:**

```http
DELETE /blockouts/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Blockout deleted successfully"
}
```

**Business Rules:**

- Deleting a blockout does NOT automatically create appointments
- Users can book appointments for previously blocked dates after deletion

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Blockout not found

---

### 6. Create Schedule

Create a new schedule for a specific day of the week.

**Endpoint:** `POST /schedules`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Request Body:**

```json
{
  "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `businessId` | UUID | Yes | Valid UUID | ID of the business |
| `dayOfWeek` | number | Yes | 0-6 | Day of week (0=Sunday, 6=Saturday) |
| `startTime` | string | Yes | HH:mm format | Opening time |
| `endTime` | string | Yes | HH:mm format | Closing time |

**Example Request:**

```http
POST /schedules
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Example Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | ID of the created schedule |

**Business Rules:**

- End time must be after start time
- Can have multiple schedules per day (e.g., 9am-12pm and 2pm-5pm)
- Schedules cannot overlap for the same day
- Times are in business timezone

**Error Responses:**

- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business not found
- `409 Conflict` - Overlapping schedule exists

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": ["dayOfWeek must be between 0 and 6"],
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "End time must be after start time",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 409,
  "message": "Schedule overlaps with existing schedule for Monday",
  "error": "Conflict"
}
```

---

### 7. Get Schedules by Business

Get all schedules for a specific business.

**Endpoint:** `GET /schedules`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessId` | UUID | Yes | ID of the business |

**Example Request:**

```http
GET /schedules?businessId=489b4d38-5146-4760-ae5f-d1910c3308bb
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "schedules": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "dayOfWeek": 1,
      "dayName": "Monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
      "businessId": "489b4d38-5146-4760-ae5f-d1910c3308bb",
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "createdAt": "2025-01-15T10:31:00.000Z"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `schedules` | ScheduleReadModel[] | Array of schedules |
| `schedules[].id` | UUID | Schedule ID |
| `schedules[].businessId` | UUID | Business ID |
| `schedules[].dayOfWeek` | number | Day of week (0-6) |
| `schedules[].dayName` | string | Day name (Sunday-Saturday) |
| `schedules[].startTime` | string | Opening time (HH:mm) |
| `schedules[].endTime` | string | Closing time (HH:mm) |
| `schedules[].isActive` | boolean | Whether schedule is active |
| `schedules[].createdAt` | string | Creation timestamp (ISO 8601) |

**Error Responses:**

- `400 Bad Request` - Invalid businessId format
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Business not found

---

### 8. Update Schedule

Update an existing schedule's times.

**Endpoint:** `PUT /schedules/:id`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the schedule to update |

**Request Body:**

```json
{
  "startTime": "08:00",
  "endTime": "18:00"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `startTime` | string | Yes | HH:mm format | New opening time |
| `endTime` | string | Yes | HH:mm format | New closing time |

**Example Request:**

```http
PUT /schedules/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "startTime": "08:00",
  "endTime": "18:00"
}
```

**Example Response:** `200 OK`

```json
{
  "message": "Schedule updated successfully"
}
```

**Business Rules:**

- End time must be after start time
- Cannot create overlaps with other schedules for same day
- Existing appointments are NOT affected

**Error Responses:**

- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Schedule not found
- `409 Conflict` - Update would create overlap

---

### 9. Delete Schedule

Delete a schedule by ID.

**Endpoint:** `DELETE /schedules/:id`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the schedule to delete |

**Example Request:**

```http
DELETE /schedules/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Schedule deleted successfully"
}
```

**Business Rules:**

- Deleting a schedule prevents new appointments on that day
- Existing appointments are NOT cancelled automatically
- Business should have at least one schedule (warning, not enforced)

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Schedule not found

---

## Error Codes

### HTTP Status Codes

| Code  | Description           | When                                          |
| ----- | --------------------- | --------------------------------------------- |
| `200` | OK                    | Successful request                            |
| `201` | Created               | Resource created successfully                 |
| `400` | Bad Request           | Invalid input, validation error               |
| `401` | Unauthorized          | Missing or invalid JWT token                  |
| `403` | Forbidden             | Insufficient permissions (not BUSINESS_OWNER) |
| `404` | Not Found             | Resource not found                            |
| `409` | Conflict              | Schedule overlap or business rule violation   |
| `500` | Internal Server Error | Unexpected server error                       |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-01-25T10:00:00.000Z"
}
```

---

## Data Models

### TimeSlot

```typescript
{
  startTime: string; // HH:mm format (e.g., "09:00")
  endTime: string; // HH:mm format (e.g., "09:30")
  availableCapacity: number; // Number of appointments that can be booked
}
```

### BlockoutReadModel

```typescript
{
  id: string; // UUID
  businessId: string; // UUID
  startDate: string; // ISO 8601 timestamp
  endDate: string; // ISO 8601 timestamp
  reason: string | null; // Optional reason
  createdAt: string; // ISO 8601 timestamp
}
```

### ScheduleReadModel

```typescript
{
  id: string; // UUID
  businessId: string; // UUID
  dayOfWeek: number; // 0-6 (0=Sunday, 6=Saturday)
  dayName: string; // "Sunday" to "Saturday"
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean; // Whether schedule is active
  createdAt: string; // ISO 8601 timestamp
}
```

---

## Business Rules

### Availability Calculation

1. **Schedule Check** - Date must have an active schedule
2. **Blockout Check** - Date must not be blocked
3. **Capacity Check** - Time slot must have available capacity
4. **Timezone** - All times are in business timezone

### Schedule Rules

1. **No Overlaps** - Schedules for same day cannot overlap
2. **Valid Times** - End time must be after start time
3. **Day Range** - Day of week must be 0-6
4. **Multiple Schedules** - Can have multiple schedules per day (e.g., split shifts)

### Blockout Rules

1. **Date Range** - End date must be after or equal to start date
2. **Overlaps Allowed** - Multiple blockouts can overlap
3. **No Auto-Cancel** - Existing appointments are not cancelled
4. **Prevents New Bookings** - No new appointments during blockout

### Capacity Rules

1. **Per Slot** - Capacity is tracked per time slot
2. **Per Offering** - Different offerings can have different capacities
3. **Decrements** - Capacity decreases when appointment is created
4. **Increments** - Capacity increases when appointment is cancelled

---

## Integration with Other BCs

### Booking BC

**Flow:** Check availability before creating appointment

1. Customer selects service (Offering BC)
2. System queries available dates (`GET /availability/dates`)
3. Customer selects date
4. System queries available slots (`GET /availability/slots`)
5. Customer selects time slot
6. System creates appointment (Booking BC)
7. Capacity is decremented automatically

### Offering BC

**Dependency:** Availability queries require offering information

- Offering duration determines slot size
- Offering capacity determines max appointments per slot

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended (Future):**

- Query endpoints: 100 requests per minute per user
- Management endpoints: 50 requests per minute per user

---

## Performance Targets

| Endpoint            | Target (p95) | Notes                   |
| ------------------- | ------------ | ----------------------- |
| Get Available Dates | < 300ms      | Complex calculation     |
| Get Available Slots | < 200ms      | Moderate complexity     |
| Create Blockout     | < 150ms      | Simple insert           |
| Get Blockouts       | < 100ms      | Indexed query           |
| Delete Blockout     | < 100ms      | Simple delete           |
| Create Schedule     | < 150ms      | With overlap validation |
| Get Schedules       | < 100ms      | Indexed query           |
| Update Schedule     | < 150ms      | With overlap validation |
| Delete Schedule     | < 100ms      | Simple delete           |

---

## Changelog

### Version 1.0 (2025-12-26)

- Initial API documentation
- 9 endpoints documented
- Availability query endpoints (2)
- Blockout management endpoints (3)
- Schedule management endpoints (4)
- Business rules and data models defined
- Integration with Booking and Offering BCs documented

---

**Last Updated:** December 26, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
