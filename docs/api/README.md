# API Documentation

This directory contains comprehensive API documentation for all backend services.

## Available APIs

### 1. [Auth API](./auth.md)

Authentication and user management endpoints.

**Key Features:**

- User registration with multi-role support
- JWT-based authentication
- Role management (add/remove roles)
- Email verification
- User activation/deactivation

**Endpoints:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Authenticate user
- `POST /auth/users/:id/roles` - Add role to user
- `DELETE /auth/users/:id/roles/:role` - Remove role from user
- `PATCH /auth/users/:id/verify-email` - Verify email
- `PATCH /auth/users/:id/activate` - Activate user
- `PATCH /auth/users/:id/deactivate` - Deactivate user

---

### 2. [Account API](./account.md)

Business Owner profile and subscription management endpoints.

**Key Features:**

- Business Owner profile management
- Subscription plan information and upgrades
- Multi-tier plans (FREE, BASIC, PRO, ENTERPRISE)
- Onboarding completion tracking
- Subscription status management

**Endpoints:**

- `GET /account/profile` - Get Business Owner profile
- `GET /account/subscription` - Get subscription details
- `PUT /account/subscription/upgrade` - Upgrade subscription plan
- `POST /account/onboarding/complete` - Complete onboarding

---

### 3. [Customer API](./customer.md)

Customer management and GDPR compliance endpoints.

**Key Features:**

- Customer search and filtering
- Customer statistics and analytics
- Duplicate detection and merging
- GDPR compliance (data export, anonymization)
- Multi-tenant support

**Endpoints:**

- `GET /customers/search` - Search customers with filters
- `GET /customers/stats` - Get customer statistics
- `GET /customers/:id` - Get customer by ID
- `GET /customers/duplicates` - Detect duplicate customers
- `POST /customers/merge` - Merge two customers
- `DELETE /customers/:id` - Anonymize customer (GDPR)
- `GET /customers/:id/export` - Export customer data (GDPR)
- `GET /customers/by-user/:userId` - Get customers by user ID

---

## Documentation Template

Use [example-api-docs.md](./example-api-docs.md) as a template when creating new API documentation.

**Template Structure:**

1. Overview and authentication
2. Endpoints with examples
3. Error codes and responses
4. Data models
5. Rate limiting and performance targets
6. Changelog

---

## General Information

### Base URL

```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

### Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

Get a token by calling `POST /auth/login` or `POST /auth/register`.

### Common HTTP Status Codes

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

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-01-25T10:00:00.000Z"
}
```

### Pagination

Endpoints that return lists support pagination:

**Query Parameters:**

- `page` - Page number (default: 1, min: 1)
- `limit` - Items per page (default: 10, min: 1, max: 100)

**Response Format:**

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Timestamps

All timestamps are in ISO 8601 format (UTC):

```
2025-01-25T10:30:00.000Z
```

### UUIDs

All IDs are UUIDs v4:

```
123e4567-e89b-12d3-a456-426614174000
```

---

## API Versioning

**Current:** No versioning (v1 implicit)

**Future:** URL-based versioning (`/api/v2/...`)

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended (Future):**

- Authentication endpoints: 5-10 requests per minute
- Read endpoints: 100 requests per minute per user
- Write endpoints: 50 requests per minute per user
- Admin endpoints: 200 requests per minute

---

## CORS

**Development:** All origins allowed

**Production:** Whitelist specific domains

---

## Testing

### Postman Collection

Import the Postman collection for easy API testing:

```bash
# TODO: Add Postman collection export
```

### cURL Examples

Each endpoint documentation includes cURL examples.

### Integration Tests

Run integration tests:

```bash
cd apps/backend
pnpm test:e2e
```

---

## Contributing

When adding new API endpoints:

1. Create/update the relevant API documentation file
2. Follow the [example-api-docs.md](./example-api-docs.md) template
3. Include request/response examples
4. Document all error cases
5. Add data models
6. Update this README with the new API

---

## Upcoming APIs

The following APIs are planned but not yet documented:

- **Business API** - Business management and configuration
- **Offering API** - Service offerings management
- **Availability API** - Schedules and capacity management
- **Booking API** - Appointment management
- **Conversation API** - WhatsApp integration
- **Notification API** - Reminders and notifications

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
