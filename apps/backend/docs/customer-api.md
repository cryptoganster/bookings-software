# Customer API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [Search Customers](#1-search-customers)
   - [Get Customer Statistics](#2-get-customer-statistics)
   - [Get Customer by ID](#3-get-customer-by-id)
   - [Detect Duplicate Customers](#4-detect-duplicate-customers)
   - [Merge Customers](#5-merge-customers)
   - [Delete Customer (GDPR)](#6-delete-customer-gdpr)
   - [Export Customer Data](#7-export-customer-data)
   - [Get Customers by User ID](#8-get-customers-by-user-id)
3. [Error Codes](#error-codes)
4. [Data Models](#data-models)

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

---

## Endpoints

### 1. Search Customers

Search and filter customers with pagination.

**Endpoint:** `GET /customers/search`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search term (name or phone) |
| `type` | enum | No | - | Filter by type: `anonymous` or `registered` |
| `sortBy` | enum | No | `createdAt` | Sort field: `name`, `createdAt`, `appointmentCount` |
| `sortOrder` | enum | No | `desc` | Sort order: `asc` or `desc` |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 10 | Items per page (min: 1, max: 100) |

**Example Request:**

```http
GET /customers/search?search=Juan&type=anonymous&sortBy=name&sortOrder=asc&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "customers": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "businessId": "business-uuid",
      "userId": null,
      "whatsappPhone": "+18095551111",
      "name": "Juan Pérez",
      "appointmentCount": 5,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Get Customer Statistics

Get aggregated statistics for business customers.

**Endpoint:** `GET /customers/stats`

**Example Request:**

```http
GET /customers/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "totalCustomers": 25,
  "anonymousCount": 12,
  "registeredCount": 8,
  "newThisWeek": 1,
  "newThisMonth": 3,
  "topCustomers": [
    {
      "id": "customer-uuid",
      "name": "Miguel Ángel Ruiz",
      "whatsappPhone": "+18095552109",
      "appointmentCount": 12
    }
  ]
}
```

---

### 3. Get Customer by ID

Retrieve detailed information for a specific customer.

**Endpoint:** `GET /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Customer ID |

**Example Request:**

```http
GET /customers/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "businessId": "business-uuid",
  "userId": "user-uuid",
  "whatsappPhone": "+18095551111",
  "name": "Juan Pérez",
  "appointmentCount": 5,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `403 Forbidden` - Customer belongs to different business
- `404 Not Found` - Customer not found

---

### 4. Detect Duplicate Customers

Find potential duplicate customers based on name similarity.

**Endpoint:** `GET /customers/duplicates`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `threshold` | number | No | 0.8 | Similarity threshold (0-1) |

**Example Request:**

```http
GET /customers/duplicates?threshold=0.8
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "pairs": [
    {
      "customer1": {
        "id": "customer1-uuid",
        "name": "Juan Pérez",
        "whatsappPhone": "+18095551111",
        "appointmentCount": 5
      },
      "customer2": {
        "id": "customer2-uuid",
        "name": "Juan Perez",
        "whatsappPhone": "+18095552222",
        "appointmentCount": 3
      },
      "similarity": 0.95
    }
  ]
}
```

---

### 5. Merge Customers

Merge two customer records (combines appointments and marks source as merged).

**Endpoint:** `POST /customers/merge`

**Request Body:**

```json
{
  "sourceId": "source-customer-uuid",
  "targetId": "target-customer-uuid"
}
```

**Example Request:**

```http
POST /customers/merge
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sourceId": "123e4567-e89b-12d3-a456-426614174001",
  "targetId": "123e4567-e89b-12d3-a456-426614174002"
}
```

**Example Response:** `200 OK`

```json
{
  "message": "Customers merged successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUIDs, same customer, or different business
- `404 Not Found` - One or both customers not found

---

### 6. Delete Customer (GDPR)

Anonymize customer data for GDPR compliance (soft delete).

**Endpoint:** `DELETE /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Customer ID |

**Example Request:**

```http
DELETE /customers/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Customer data anonymized successfully"
}
```

**Anonymization:**

- `name` → `null`
- `whatsappPhone` → `+999{timestamp}`
- Appointments remain linked (for business records)

**Error Responses:**

- `400 Bad Request` - Customer has future appointments
- `403 Forbidden` - Customer belongs to different business
- `404 Not Found` - Customer not found

---

### 7. Export Customer Data

Export all customer data for GDPR compliance (data portability).

**Endpoint:** `GET /customers/:id/export`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Customer ID |

**Example Request:**

```http
GET /customers/123e4567-e89b-12d3-a456-426614174000/export
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "customer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "whatsappPhone": "+18095551111",
    "name": "Juan Pérez",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "appointments": [
    {
      "id": "appointment-uuid",
      "offeringName": "Corte de Pelo",
      "dateTime": "2025-02-01T14:00:00.000Z",
      "status": "CONFIRMED"
    }
  ],
  "conversations": [
    {
      "id": "conversation-uuid",
      "lastMessageAt": "2025-01-20T15:30:00.000Z",
      "messageCount": 5
    }
  ],
  "exportedAt": "2025-01-25T10:00:00.000Z"
}
```

**Error Responses:**

- `403 Forbidden` - Customer belongs to different business
- `404 Not Found` - Customer not found

---

### 8. Get Customers by User ID

Get all customers linked to a specific user (registered customers).

**Endpoint:** `GET /customers/by-user/:userId`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | UUID | Yes | User ID |

**Example Request:**

```http
GET /customers/by-user/user-uuid
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
[
  {
    "id": "customer-uuid",
    "businessId": "business-uuid",
    "userId": "user-uuid",
    "whatsappPhone": "+18095551111",
    "name": "Juan Pérez",
    "appointmentCount": 5,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

**Error Responses:**

- `403 Forbidden` - User ID doesn't match authenticated user (unless admin)

---

## Error Codes

### HTTP Status Codes

| Code  | Description           | When                                         |
| ----- | --------------------- | -------------------------------------------- |
| `200` | OK                    | Successful request                           |
| `400` | Bad Request           | Invalid input, validation error              |
| `401` | Unauthorized          | Missing or invalid JWT token                 |
| `403` | Forbidden             | Insufficient permissions, different business |
| `404` | Not Found             | Resource not found                           |
| `500` | Internal Server Error | Unexpected server error                      |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-01-25T10:00:00.000Z"
}
```

### Common Validation Errors

**Invalid UUID:**

```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

**Invalid Pagination:**

```json
{
  "statusCode": 400,
  "message": ["page must not be less than 1"],
  "error": "Bad Request"
}
```

**Invalid Threshold:**

```json
{
  "statusCode": 400,
  "message": ["threshold must not be greater than 1"],
  "error": "Bad Request"
}
```

---

## Data Models

### CustomerReadModel

```typescript
{
  id: string; // UUID
  businessId: string; // UUID
  userId: string | null; // UUID or null (anonymous)
  whatsappPhone: string; // E.164 format (+18095551111)
  name: string | null; // Customer name or null
  appointmentCount: number; // Total appointments
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### SearchCustomersResponseDto

```typescript
{
  customers: CustomerReadModel[];
  total: number;                 // Total matching customers
  page: number;                  // Current page
  limit: number;                 // Items per page
  totalPages: number;            // Total pages
}
```

### CustomerStatsResponseDto

```typescript
{
  totalCustomers: number;
  anonymousCount: number;
  registeredCount: number;
  newThisWeek: number;
  newThisMonth: number;
  topCustomers: Array<{
    id: string;
    name: string | null;
    whatsappPhone: string;
    appointmentCount: number;
  }>;
}
```

### DuplicatePairsResponseDto

```typescript
{
  pairs: Array<{
    customer1: {
      id: string;
      name: string;
      whatsappPhone: string;
      appointmentCount: number;
    };
    customer2: {
      id: string;
      name: string;
      whatsappPhone: string;
      appointmentCount: number;
    };
    similarity: number; // 0-1 (0.8 = 80% similar)
  }>;
}
```

### CustomerDataExport

```typescript
{
  customer: {
    id: string;
    whatsappPhone: string;
    name: string | null;
    createdAt: string;
  }
  appointments: Array<{
    id: string;
    offeringName: string;
    dateTime: string;
    status: string;
  }>;
  conversations: Array<{
    id: string;
    lastMessageAt: string;
    messageCount: number;
  }>;
  exportedAt: string; // ISO 8601 timestamp
}
```

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended (Future):**

- 100 requests per minute per user
- 1000 requests per hour per business

---

## Performance Targets

| Endpoint   | Target (p95) | Notes                             |
| ---------- | ------------ | --------------------------------- |
| Search     | < 200ms      | With indexes                      |
| Stats      | < 300ms      | Aggregation query                 |
| Get by ID  | < 100ms      | Primary key lookup                |
| Duplicates | < 2s         | Similarity calculation            |
| Merge      | < 2s         | Transaction with multiple updates |
| Delete     | < 500ms      | Single update                     |
| Export     | < 3s         | Multiple joins                    |
| By User ID | < 200ms      | Indexed query                     |

---

## Changelog

### Version 1.0 (2025-01-25)

- Initial API documentation
- 8 endpoints documented
- Authentication and error handling documented
- Data models defined

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
