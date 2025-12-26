# API Documentation

This directory contains comprehensive API documentation for all backend services.

## Available APIs

### Table of Contents

1. [Auth API](#1-auth-api)
2. [Account API](#2-account-api)
3. [Customer API](#3-customer-api)
4. [Availability API](#4-availability-api)
5. [Booking API](#5-booking-api)
6. [Business API](#6-business-api)
7. [Conversation API](#7-conversation-api)
8. [Offering API](#8-offering-api)

---

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

### 4. [Availability API](./availability.md)

Schedule, blockout, and capacity management endpoints.

**Key Features:**

- Query available dates and time slots
- Schedule management (business hours)
- Blockout management (holidays, closures)
- Capacity tracking and management
- Multi-tenant support

**Endpoints:**

- `GET /availability/dates` - Get available dates for a service
- `GET /availability/slots` - Get available time slots for a date
- `POST /schedules` - Create business schedule
- `GET /schedules` - List schedules
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule
- `POST /blockouts` - Create blockout period
- `GET /blockouts` - List blockouts
- `DELETE /blockouts/:id` - Delete blockout

---

### 5. [Booking API](./booking.md)

Appointment creation and management endpoints.

**Key Features:**

- Appointment creation with validation
- Appointment cancellation (with time restrictions)
- Appointment modification
- Appointment history and filtering
- Status tracking (CONFIRMED, CANCELLED, COMPLETED)
- Optimistic locking for concurrency control

**Endpoints:**

- `POST /appointments` - Create new appointment
- `GET /appointments/:id` - Get appointment details
- `GET /appointments` - List appointments with filters
- `PUT /appointments/:id/cancel` - Cancel appointment
- `PUT /appointments/:id/modify` - Modify appointment
- `GET /appointments/today` - Get today's appointments
- `GET /appointments/upcoming` - Get upcoming appointments

---

### 6. [Business API](./business.md)

Business profile and configuration endpoints.

**Key Features:**

- Business profile management
- WhatsApp configuration
- Multi-business support per owner
- Timezone configuration
- Business activation/deactivation

**Endpoints:**

- `POST /businesses` - Create new business
- `GET /businesses/:id` - Get business details
- `GET /businesses` - List businesses for owner
- `PUT /businesses/:id` - Update business profile
- `PUT /businesses/:id/whatsapp` - Configure WhatsApp
- `PATCH /businesses/:id/activate` - Activate business
- `PATCH /businesses/:id/deactivate` - Deactivate business

---

### 7. [Conversation API](./conversation.md)

WhatsApp integration and customer communication endpoints.

**Key Features:**

- WhatsApp webhook integration
- Admin query management
- Conversation history tracking
- Message sending and receiving
- Webhook signature verification
- Automated response handling

**Endpoints:**

- `GET /conversations/admin-queries/pending` - Get pending admin queries
- `POST /conversations/:id/respond` - Respond to admin query
- `GET /conversations/:id/history` - Get conversation history
- `POST /webhooks/whatsapp` - WhatsApp webhook (receive messages)
- `GET /webhooks/whatsapp` - WhatsApp webhook verification

---

### 8. [Offering API](./offering.md)

Service offerings management endpoints.

**Key Features:**

- Service creation and configuration
- Duration and capacity settings
- Service activation/deactivation
- Service catalog management
- Multi-tenant support

**Endpoints:**

- `POST /offerings` - Create new service
- `GET /offerings/:id` - Get service details
- `GET /offerings` - List services for business
- `PUT /offerings/:id` - Update service
- `DELETE /offerings/:id` - Deactivate service
- `GET /offerings/active` - List active services

---

## Upcoming APIs

The following APIs are planned but not yet documented:

- **Notification API** - Reminders and notifications

---

**Last Updated:** December 26, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
