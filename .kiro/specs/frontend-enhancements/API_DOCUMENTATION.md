# API Documentation - Frontend Enhancements

**Date:** December 24, 2024  
**Version:** 1.0  
**Status:** Complete

---

## Overview

This document provides comprehensive documentation for all API endpoints implemented during the frontend enhancements project. All endpoints require JWT authentication unless otherwise specified.

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

---

## Endpoints by Module

### 1. Offerings

#### GET `/api/offerings`

Get all offerings for the authenticated business.

**Response:**

```typescript
OfferingDto[]
```

**Example:**

```json
[
  {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Corte de Pelo",
    "duration": 30,
    "maxCapacityPerSlot": 2,
    "maxDailyCapacity": 20,
    "isActive": true,
    "createdAt": "2024-12-24T10:00:00Z"
  }
]
```

#### GET `/api/offerings/active`

Get only active offerings.

**Response:** Same as GET `/api/offerings` but filtered by `isActive: true`

#### GET `/api/offerings/:id`

Get a specific offering by ID.

**Response:**

```typescript
OfferingDto;
```

#### POST `/api/offerings`

Create a new offering.

**Request Body:**

```typescript
{
  name: string;           // min 3, max 100 chars
  duration: number;       // min 15, max 480 minutes
  maxCapacityPerSlot: number;  // min 1, max 50
  maxDailyCapacity?: number;   // optional, min 1
}
```

**Response:**

```typescript
{
  offeringId: string;
}
```

#### PUT `/api/offerings/:id`

Update an existing offering.

**Request Body:** Same as POST (all fields optional)

**Response:**

```typescript
{
  message: string;
}
```

#### DELETE `/api/offerings/:id`

Deactivate an offering (soft delete).

**Response:**

```typescript
{
  message: string;
}
```

#### PATCH `/api/offerings/:id/active`

Toggle offering active status.

**Request Body:**

```typescript
{
  isActive: boolean;
}
```

**Response:**

```typescript
{
  message: string;
}
```

---

### 2. Schedules

#### GET `/api/schedules`

Get all schedules for the authenticated business.

**Response:**

```typescript
ScheduleDto[]
```

**Example:**

```json
[
  {
    "id": "uuid",
    "businessId": "uuid",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "18:00",
    "isActive": true
  }
]
```

#### POST `/api/schedules`

Create a new schedule.

**Request Body:**

```typescript
{
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}
```

**Response:**

```typescript
{
  scheduleId: string;
}
```

#### PUT `/api/schedules/:id`

Update an existing schedule.

**Request Body:** Same as POST (all fields optional)

**Response:**

```typescript
{
  message: string;
}
```

#### DELETE `/api/schedules/:id`

Delete a schedule.

**Response:**

```typescript
{
  message: string;
}
```

---

### 3. Blockouts

#### GET `/api/blockouts`

Get all blockouts for the authenticated business.

**Response:**

```typescript
BlockoutDto[]
```

**Example:**

```json
[
  {
    "id": "uuid",
    "businessId": "uuid",
    "startDate": "2024-12-25",
    "endDate": "2024-12-26",
    "reason": "Christmas Holiday"
  }
]
```

#### POST `/api/blockouts`

Create a new blockout.

**Request Body:**

```typescript
{
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  reason: string; // min 3, max 200 chars
}
```

**Response:**

```typescript
{
  blockoutId: string;
}
```

#### DELETE `/api/blockouts/:id`

Delete a blockout.

**Response:**

```typescript
{
  message: string;
}
```

---

### 4. Appointments

#### GET `/api/appointments`

Get all appointments with optional filters.

**Query Parameters:**

- `status?: string` - Filter by status (CONFIRMED, CANCELLED, COMPLETED)
- `startDate?: string` - Filter by start date (ISO 8601)
- `endDate?: string` - Filter by end date (ISO 8601)

**Response:**

```typescript
AppointmentReadModel[]
```

**Example:**

```json
[
  {
    "id": "uuid",
    "businessId": "uuid",
    "customerId": "uuid",
    "customerName": "Juan Pérez",
    "customerPhone": "+18095551234",
    "offeringId": "uuid",
    "offeringName": "Corte de Pelo",
    "dateTime": "2024-12-24T10:00:00Z",
    "status": "CONFIRMED",
    "createdAt": "2024-12-20T10:00:00Z",
    "cancelledAt": null
  }
]
```

#### GET `/api/appointments/today`

Get today's appointments.

**Response:** Same as GET `/api/appointments`

#### GET `/api/appointments/upcoming`

Get upcoming appointments (next 7 days).

**Response:** Same as GET `/api/appointments`

#### GET `/api/appointments/:id`

Get a specific appointment by ID.

**Response:**

```typescript
AppointmentReadModel;
```

#### PUT `/api/appointments/:id/cancel`

Cancel an appointment.

**Response:**

```typescript
{
  message: string;
}
```

---

### 5. Account

#### GET `/api/account/profile`

Get business owner profile.

**Response:**

```typescript
{
  id: string;
  userId: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  onboardingCompleted: boolean;
  createdAt: string;
}
```

#### GET `/api/account/subscription`

Get subscription details.

**Response:**

```typescript
{
  plan: string;
  status: string;
  maxBusinesses: number;
  maxAppointmentsPerMonth: number;
  price: number;
}
```

#### PUT `/api/account/subscription/upgrade`

Upgrade subscription plan.

**Request Body:**

```typescript
{
  plan: string; // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
}
```

**Response:**

```typescript
{
  message: string;
}
```

#### POST `/api/account/onboarding/complete`

Mark onboarding as complete.

**Response:**

```typescript
{
  message: string;
}
```

---

### 6. Business

#### GET `/api/businesses`

Get all businesses owned by the authenticated user.

**Response:**

```typescript
BusinessDto[]
```

#### GET `/api/businesses/:id`

Get a specific business by ID.

**Response:**

```typescript
BusinessDto;
```

#### POST `/api/businesses`

Create a new business.

**Request Body:**

```typescript
{
  name: string;
  whatsappNumber: string;
  address: string;
  timezone: string;
}
```

**Response:**

```typescript
{
  businessId: string;
}
```

#### PUT `/api/businesses/:id`

Update business information.

**Request Body:** Same as POST (all fields optional)

**Response:**

```typescript
{
  message: string;
}
```

#### PUT `/api/businesses/:id/whatsapp`

Configure WhatsApp for business.

**Request Body:**

```typescript
{
  whatsappNumber: string;
}
```

**Response:**

```typescript
{
  message: string;
}
```

#### DELETE `/api/businesses/:id`

Deactivate a business.

**Response:**

```typescript
{
  message: string;
}
```

#### POST `/api/businesses/:id/activate`

Activate a business.

**Response:**

```typescript
{
  message: string;
}
```

---

### 7. Conversations

#### GET `/api/admin-queries/pending`

Get pending admin queries (conversations awaiting response).

**Response:**

```typescript
ConversationReadModel[]
```

**Example:**

```json
[
  {
    "id": "uuid",
    "businessId": "uuid",
    "customerId": "uuid",
    "customerName": "Juan Pérez",
    "customerPhone": "+18095551234",
    "status": "AWAITING_ADMIN",
    "lastMessageAt": "2024-12-24T10:00:00Z",
    "messageCount": 3
  }
]
```

#### GET `/api/admin-queries/:id`

Get conversation details with message history.

**Response:**

```typescript
{
  conversation: ConversationReadModel;
  messages: MessageReadModel[];
}
```

**Example:**

```json
{
  "conversation": {
    "id": "uuid",
    "businessId": "uuid",
    "customerId": "uuid",
    "customerName": "Juan Pérez",
    "customerPhone": "+18095551234",
    "status": "AWAITING_ADMIN",
    "lastMessageAt": "2024-12-24T10:00:00Z"
  },
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "direction": "INBOUND",
      "content": "Hola, quisiera agendar una cita",
      "messageType": "TEXT",
      "sentAt": "2024-12-24T09:00:00Z",
      "isFromAdmin": false
    },
    {
      "id": "uuid",
      "conversationId": "uuid",
      "direction": "OUTBOUND",
      "content": "¡Hola! Con gusto te ayudo",
      "messageType": "TEXT",
      "sentAt": "2024-12-24T09:05:00Z",
      "isFromAdmin": true
    }
  ]
}
```

#### POST `/api/admin-queries/:id/respond`

Respond to a customer query.

**Request Body:**

```typescript
{
  message: string; // min 1, max 1000 chars
}
```

**Response:**

```typescript
{
  message: string;
}
```

---

### 8. Customers

#### GET `/api/customers`

Get all customers for the authenticated business.

**Response:**

```typescript
CustomerReadModel[]
```

#### GET `/api/customers/:id`

Get a specific customer by ID.

**Response:**

```typescript
CustomerReadModel;
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Validation error message"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Resource already exists or conflict",
  "error": "Conflict"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:

- **Limit:** 100 requests per minute per IP
- **Response Header:** `X-RateLimit-Remaining`
- **Error:** 429 Too Many Requests

---

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get offerings (with token)
curl -X GET http://localhost:3000/api/offerings \
  -H "Authorization: Bearer <your-token>"

# Create offering
curl -X POST http://localhost:3000/api/offerings \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Corte de Pelo","duration":30,"maxCapacityPerSlot":2}'
```

### Using Postman

Import the Postman collection (if available) or manually create requests using the examples above.

---

## Changelog

### Version 1.0 (December 24, 2024)

- Initial API documentation
- Documented all endpoints from frontend enhancements project
- Added request/response examples
- Added error response documentation
- Added testing examples

---

**End of API Documentation**
