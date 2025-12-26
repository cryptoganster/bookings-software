# API Documentation Template

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token (if required)

---

## Table of Contents

1. [Authentication](#authentication) (if required)
2. [Endpoints](#endpoints)
   - [Endpoint 1 Name](#1-endpoint-1-name)
   - [Endpoint 2 Name](#2-endpoint-2-name)
3. [Error Codes](#error-codes)
4. [Data Models](#data-models)

---

## Authentication

(Include this section if endpoints require authentication)

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

### 1. Endpoint Name

Brief description of what this endpoint does.

**Endpoint:** `METHOD /path`

**Authentication:** Required/Not Required

**Query Parameters:** (if applicable)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `param1` | string | No | - | Description |
| `param2` | number | Yes | - | Description |

**Path Parameters:** (if applicable)
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Resource ID |

**Request Body:** (if applicable)

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Example Request:**

```http
METHOD /path?param1=value
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "field1": "value1"
}
```

**Example Response:** `200 OK`

```json
{
  "result": "success",
  "data": {}
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found

---

### 2. Another Endpoint

(Repeat the structure above for each endpoint)

---

## Error Codes

### HTTP Status Codes

| Code  | Description           | When                            |
| ----- | --------------------- | ------------------------------- |
| `200` | OK                    | Successful request              |
| `201` | Created               | Resource created successfully   |
| `400` | Bad Request           | Invalid input, validation error |
| `401` | Unauthorized          | Missing or invalid JWT token    |
| `403` | Forbidden             | Insufficient permissions        |
| `404` | Not Found             | Resource not found              |
| `409` | Conflict              | Resource already exists         |
| `500` | Internal Server Error | Unexpected server error         |

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

**Missing Required Field:**

```json
{
  "statusCode": 400,
  "message": ["field1 should not be empty"],
  "error": "Bad Request"
}
```

---

## Data Models

### ModelName

```typescript
{
  id: string; // UUID
  field1: string; // Description
  field2: number; // Description
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### ResponseDto

```typescript
{
  data: ModelName[];
  total: number;
  page: number;
  limit: number;
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

| Endpoint   | Target (p95) | Notes             |
| ---------- | ------------ | ----------------- |
| Endpoint 1 | < 200ms      | With indexes      |
| Endpoint 2 | < 500ms      | Complex operation |

---

## Changelog

### Version 1.0 (YYYY-MM-DD)

- Initial API documentation
- X endpoints documented
- Authentication and error handling documented
- Data models defined

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
