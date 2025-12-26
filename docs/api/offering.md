# Offering API Documentation

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Base URL**: `/api/offerings`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [List All Offerings](#list-all-offerings)
   - [List Active Offerings](#list-active-offerings)
   - [Get Offering](#get-offering)
   - [Create Offering](#create-offering)
   - [Update Offering](#update-offering)
   - [Deactivate Offering](#deactivate-offering)
   - [Toggle Offering Status](#toggle-offering-status)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)
7. [Changelog](#changelog)

---

## Overview

The Offering API manages services offered by a business. Each offering represents a bookable service with specific duration and capacity constraints.

**Key Capabilities**:

- Create and manage service offerings
- Configure duration and capacity limits
- Activate/deactivate offerings
- List offerings by business
- Filter active offerings

**Related APIs**:

- [Business API](./business.md) - Business profile management
- [Availability API](./availability.md) - Schedule and capacity management
- [Booking API](./booking.md) - Appointment booking

---

## Authentication

All endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <jwt_token>
```

The JWT token must include:

- `sub`: User ID
- `businessId`: Current business ID (required for all operations)

**Note**: Users without a `businessId` in their token will receive a `400 Bad Request` error.

---

## Endpoints

### List All Offerings

Retrieves all offerings (active and inactive) for the current business.

**Endpoint**: `GET /api/offerings`

**Authentication**: Required (JWT with businessId)

**Response**: `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "businessId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Corte de Pelo",
    "duration": 30,
    "maxCapacityPerSlot": 2,
    "maxDailyCapacity": 20,
    "isActive": true,
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "businessId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tinte Completo",
    "duration": 120,
    "maxCapacityPerSlot": 1,
    "maxDailyCapacity": null,
    "isActive": true,
    "createdAt": "2025-12-26T11:00:00.000Z",
    "updatedAt": "2025-12-26T11:00:00.000Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "businessId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Manicure",
    "duration": 45,
    "maxCapacityPerSlot": 3,
    "maxDailyCapacity": 15,
    "isActive": false,
    "createdAt": "2025-12-26T12:00:00.000Z",
    "updatedAt": "2025-12-26T14:00:00.000Z"
  }
]
```

**Notes**:

- Returns empty array `[]` if business has no offerings
- Includes both active and inactive offerings
- Results are ordered by creation date (newest first)
- `maxDailyCapacity` may be `null` (unlimited)

**Error Responses**:

```json
// 400 Bad Request - No businessId in token
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### List Active Offerings

Retrieves only active offerings for the current business.

**Endpoint**: `GET /api/offerings/active`

**Authentication**: Required (JWT with businessId)

**Response**: `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "businessId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Corte de Pelo",
    "duration": 30,
    "maxCapacityPerSlot": 2,
    "maxDailyCapacity": 20,
    "isActive": true,
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "businessId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tinte Completo",
    "duration": 120,
    "maxCapacityPerSlot": 1,
    "maxDailyCapacity": null,
    "isActive": true,
    "createdAt": "2025-12-26T11:00:00.000Z",
    "updatedAt": "2025-12-26T11:00:00.000Z"
  }
]
```

**Notes**:

- Returns empty array `[]` if no active offerings
- Only includes offerings with `isActive: true`
- Used for customer-facing booking flows
- Results are ordered by creation date (newest first)

**Error Responses**:

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### Get Offering

Retrieves a specific offering by ID.

**Endpoint**: `GET /api/offerings/:id`

**Authentication**: Required (JWT with businessId)

**Path Parameters**:

- `id` (string, required): Offering UUID

**Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "businessId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Corte de Pelo",
  "duration": 30,
  "maxCapacityPerSlot": 2,
  "maxDailyCapacity": 20,
  "isActive": true,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses**:

```json
// 400 Bad Request - No businessId
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden - Offering belongs to different business
{
  "statusCode": 403,
  "message": "You do not have permission to access this offering",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Offering with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

### Create Offering

Creates a new offering for the current business.

**Endpoint**: `POST /api/offerings`

**Authentication**: Required (JWT with businessId)

**Request Body**:

```json
{
  "name": "Corte de Pelo",
  "durationMinutes": 30,
  "maxCapacityPerSlot": 2,
  "maxDailyCapacity": 20
}
```

**Response**: `201 Created`

```json
{
  "offeringId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Notes**:

- `name` must be unique per business
- `durationMinutes` must be between 15 and 480 (8 hours)
- `maxCapacityPerSlot` must be between 1 and 100
- `maxDailyCapacity` is optional (null = unlimited)
- New offerings are created as active by default

**Error Responses**:

```json
// 400 Bad Request - Validation errors
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "durationMinutes must not be less than 15",
    "durationMinutes must not be greater than 480",
    "maxCapacityPerSlot must not be less than 1"
  ],
  "error": "Bad Request"
}

// 400 Bad Request - No businessId
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 409 Conflict - Name already exists
{
  "statusCode": 409,
  "message": "Offering with name 'Corte de Pelo' already exists for this business",
  "error": "Conflict"
}
```

---

### Update Offering

Updates an existing offering.

**Endpoint**: `PUT /api/offerings/:id`

**Authentication**: Required (JWT with businessId)

**Path Parameters**:

- `id` (string, required): Offering UUID

**Request Body**:

```json
{
  "name": "Corte de Pelo Premium",
  "durationMinutes": 45,
  "maxCapacityPerSlot": 1,
  "maxDailyCapacity": 15
}
```

**Response**: `200 OK`

```json
{
  "message": "Offering updated successfully"
}
```

**Notes**:

- All fields are required (no partial updates)
- Name must be unique per business (excluding current offering)
- Cannot update `isActive` status (use toggle endpoint)
- Validation rules same as create

**Error Responses**:

```json
// 400 Bad Request - Validation errors
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "durationMinutes must be an integer number"
  ],
  "error": "Bad Request"
}

// 400 Bad Request - No businessId
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to update this offering",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Offering with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict - Name already exists
{
  "statusCode": 409,
  "message": "Offering with name 'Corte de Pelo Premium' already exists for this business",
  "error": "Conflict"
}
```

---

### Deactivate Offering

Deactivates an offering (soft delete).

**Endpoint**: `DELETE /api/offerings/:id`

**Authentication**: Required (JWT with businessId)

**Path Parameters**:

- `id` (string, required): Offering UUID

**Response**: `200 OK`

```json
{
  "message": "Offering deactivated successfully"
}
```

**Notes**:

- Deactivated offerings cannot be booked
- Existing appointments remain active
- Offering can be reactivated later
- Deactivation does not delete data

**Error Responses**:

```json
// 400 Bad Request - No businessId
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to deactivate this offering",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Offering with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict - Already deactivated
{
  "statusCode": 409,
  "message": "Offering is already deactivated",
  "error": "Conflict"
}
```

---

### Toggle Offering Status

Activates or deactivates an offering.

**Endpoint**: `PATCH /api/offerings/:id/active`

**Authentication**: Required (JWT with businessId)

**Path Parameters**:

- `id` (string, required): Offering UUID

**Request Body**:

```json
{
  "isActive": true
}
```

**Response**: `200 OK`

```json
{
  "message": "Offering status updated successfully"
}
```

**Notes**:

- `isActive: true` activates the offering
- `isActive: false` deactivates the offering
- More flexible than DELETE endpoint
- Useful for temporary deactivation

**Error Responses**:

```json
// 400 Bad Request - Validation error
{
  "statusCode": 400,
  "message": [
    "isActive must be a boolean value"
  ],
  "error": "Bad Request"
}

// 400 Bad Request - No businessId
{
  "statusCode": 400,
  "message": "User does not have a business",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to modify this offering",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Offering with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict - Already in desired state
{
  "statusCode": 409,
  "message": "Offering is already active/inactive",
  "error": "Conflict"
}
```

---

## Error Codes

| Status Code | Error                 | Description                                                    |
| ----------- | --------------------- | -------------------------------------------------------------- |
| 400         | Bad Request           | Invalid request data (validation failed) or missing businessId |
| 401         | Unauthorized          | Missing or invalid JWT token                                   |
| 403         | Forbidden             | User does not have permission to access/modify offering        |
| 404         | Not Found             | Offering not found                                             |
| 409         | Conflict              | Name already exists or invalid state transition                |
| 500         | Internal Server Error | Unexpected server error                                        |

---

## Data Models

### OfferingReadModel

```typescript
{
  id: string; // UUID v4
  businessId: string; // UUID v4
  name: string; // 3-100 characters
  duration: number; // Duration in minutes (15-480)
  maxCapacityPerSlot: number; // Maximum concurrent bookings (1-100)
  maxDailyCapacity: number | null; // Maximum bookings per day (null = unlimited)
  isActive: boolean; // Active status
  createdAt: string; // ISO 8601 (e.g., 2025-12-26T10:00:00.000Z)
  updatedAt: string; // ISO 8601
}
```

### CreateOfferingDto

```typescript
{
  name: string;                  // Required, 3-100 characters
  durationMinutes: number;       // Required, 15-480 (integer)
  maxCapacityPerSlot: number;    // Required, 1-100 (integer)
  maxDailyCapacity?: number | null; // Optional, minimum 1 (integer)
}
```

### UpdateOfferingDto

```typescript
{
  name: string;                  // Required, 3-100 characters
  durationMinutes: number;       // Required, 15-480 (integer)
  maxCapacityPerSlot: number;    // Required, 1-100 (integer)
  maxDailyCapacity?: number | null; // Optional, minimum 1 (integer)
}
```

### ToggleActiveDto

```typescript
{
  isActive: boolean; // Required
}
```

---

## Business Rules

### Offering Creation

1. **Name Uniqueness**: Offering name must be unique per business
2. **Duration Limits**:
   - Minimum: 15 minutes
   - Maximum: 480 minutes (8 hours)
3. **Capacity Limits**:
   - `maxCapacityPerSlot`: 1-100 concurrent bookings
   - `maxDailyCapacity`: Optional, minimum 1 if specified
4. **Default Status**: New offerings are created as active

### Offering Updates

1. **Name Uniqueness**: Updated name must be unique (excluding current offering)
2. **Full Update**: All fields must be provided (no partial updates)
3. **Status Preservation**: Update does not change `isActive` status
4. **Validation**: Same rules as creation

### Offering Activation/Deactivation

1. **Soft Delete**: Deactivation preserves data
2. **Booking Impact**:
   - Deactivated offerings cannot be booked
   - Existing appointments remain active
3. **Reactivation**: Offerings can be reactivated at any time
4. **Capacity Management**: Deactivation does not affect capacity records

### Capacity Management

1. **Slot Capacity**: Maximum concurrent bookings per time slot
2. **Daily Capacity**: Optional limit on total bookings per day
3. **Unlimited Daily**: `maxDailyCapacity: null` means no daily limit
4. **Capacity Tracking**: Managed by Availability BC

### Duration Guidelines

**Common Durations**:

- Quick services: 15-30 minutes (haircut, manicure)
- Standard services: 30-60 minutes (facial, massage)
- Extended services: 60-120 minutes (hair coloring, spa treatment)
- Full services: 120-480 minutes (full day spa, wedding package)

**Duration Multiples**:

- Recommended: Use 15-minute increments (15, 30, 45, 60, etc.)
- Allows flexible scheduling
- Easier capacity management

---

## Changelog

### Version 1.0 (December 26, 2025)

**Initial Release**:

- List all offerings endpoint
- List active offerings endpoint
- Get offering endpoint
- Create offering endpoint
- Update offering endpoint
- Deactivate offering endpoint (DELETE)
- Toggle offering status endpoint (PATCH)
- Name uniqueness validation
- Duration and capacity constraints
- Soft delete support

---

**Related Documentation**:

- [Business API](./business.md) - Business profile management
- [Availability API](./availability.md) - Schedule and capacity management
- [Booking API](./booking.md) - Appointment booking

**Last Updated**: December 26, 2025  
**Version**: 1.0
