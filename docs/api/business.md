# Business API Documentation

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Base URL**: `/api/businesses`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Create Business](#create-business)
   - [Get Business](#get-business)
   - [List Businesses by Owner](#list-businesses-by-owner)
   - [Update Business](#update-business)
   - [Configure WhatsApp](#configure-whatsapp)
   - [Deactivate Business](#deactivate-business)
   - [Activate Business](#activate-business)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)
7. [Integration with Account BC](#integration-with-account-bc)
8. [Changelog](#changelog)

---

## Overview

The Business API manages business profiles and configurations. Each business represents a physical or virtual location that offers services through the platform.

**Key Capabilities**:

- Create and manage business profiles
- Configure WhatsApp Business integration
- Manage business information (name, address, timezone)
- Activate/deactivate businesses
- Multi-business support per owner

**Related APIs**:

- [Account API](./account.md) - Business owner management
- [Offering API](./offering.md) - Services offered by business
- [Availability API](./availability.md) - Business schedules and capacity

---

## Authentication

All endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <jwt_token>
```

The JWT token contains:

- `sub`: User ID (owner ID)
- `email`: User email
- `roles`: User roles array
- `businessId`: Current business ID (after first business creation)

---

## Endpoints

### Create Business

Creates a new business for the authenticated user.

**Endpoint**: `POST /api/businesses`

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "name": "Peluquería Central",
  "whatsappNumber": "+18095551234",
  "address": {
    "street": "Calle Principal 123",
    "city": "Santo Domingo",
    "state": "Distrito Nacional",
    "country": "Dominican Republic",
    "postalCode": "10101"
  },
  "timezone": "America/Santo_Domingo"
}
```

**Response**: `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes**:

- Returns a new JWT token with `businessId` included
- The new token should replace the current token in the client
- WhatsApp number must be unique across all businesses
- Timezone must be a valid IANA timezone identifier

**Error Responses**:

```json
// 400 Bad Request - Invalid data
{
  "statusCode": 400,
  "message": [
    "whatsappNumber must be in E.164 format (e.g., +18095551234)",
    "name must be longer than or equal to 3 characters"
  ],
  "error": "Bad Request"
}

// 401 Unauthorized - Missing or invalid token
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 409 Conflict - WhatsApp number already exists
{
  "statusCode": 409,
  "message": "WhatsApp number +18095551234 is already registered",
  "error": "Conflict"
}

// 403 Forbidden - Business limit exceeded
{
  "statusCode": 403,
  "message": "Business limit exceeded. Current plan allows 1 business. Upgrade to create more.",
  "error": "Forbidden"
}
```

---

### Get Business

Retrieves a business by ID.

**Endpoint**: `GET /api/businesses/:id`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Business UUID

**Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ownerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Peluquería Central",
  "whatsappPhone": "+18095551234",
  "addressStreet": "Calle Principal 123",
  "addressCity": "Santo Domingo",
  "addressState": "Distrito Nacional",
  "addressCountry": "Dominican Republic",
  "addressPostalCode": "10101",
  "timezone": "America/Santo_Domingo",
  "isActive": true,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z",
  "version": 1
}
```

**Error Responses**:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Business with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 403 Forbidden - Not the owner
{
  "statusCode": 403,
  "message": "You do not have permission to access this business",
  "error": "Forbidden"
}
```

---

### List Businesses by Owner

Retrieves all businesses owned by the authenticated user.

**Endpoint**: `GET /api/businesses`

**Authentication**: Required (JWT)

**Response**: `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ownerId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Peluquería Central",
    "whatsappPhone": "+18095551234",
    "addressStreet": "Calle Principal 123",
    "addressCity": "Santo Domingo",
    "addressState": "Distrito Nacional",
    "addressCountry": "Dominican Republic",
    "addressPostalCode": "10101",
    "timezone": "America/Santo_Domingo",
    "isActive": true,
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z",
    "version": 1
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "ownerId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Peluquería Norte",
    "whatsappPhone": "+18095555678",
    "addressStreet": "Av. Independencia 456",
    "addressCity": "Santiago",
    "addressState": "Santiago",
    "addressCountry": "Dominican Republic",
    "addressPostalCode": "51000",
    "timezone": "America/Santo_Domingo",
    "isActive": true,
    "createdAt": "2025-12-26T11:00:00.000Z",
    "updatedAt": "2025-12-26T11:00:00.000Z",
    "version": 1
  }
]
```

**Notes**:

- Returns empty array `[]` if user has no businesses
- Results are ordered by creation date (newest first)

**Error Responses**:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### Update Business

Updates business information (name, address, timezone).

**Endpoint**: `PUT /api/businesses/:id`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Business UUID

**Request Body**:

```json
{
  "name": "Peluquería Central Premium",
  "address": {
    "street": "Calle Principal 123, Local 5",
    "city": "Santo Domingo",
    "state": "Distrito Nacional",
    "country": "Dominican Republic",
    "postalCode": "10101"
  },
  "timezone": "America/Santo_Domingo"
}
```

**Response**: `200 OK`

```json
{
  "message": "Business updated successfully"
}
```

**Notes**:

- Cannot update WhatsApp number (use Configure WhatsApp endpoint)
- All fields are required (partial updates not supported)
- Timezone changes affect all future appointments

**Error Responses**:

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "timezone should not be empty"
  ],
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
  "message": "You do not have permission to update this business",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Business with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

### Configure WhatsApp

Updates the WhatsApp Business number for a business.

**Endpoint**: `PUT /api/businesses/:id/whatsapp`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Business UUID

**Request Body**:

```json
{
  "whatsappNumber": "+18095559999"
}
```

**Response**: `200 OK`

```json
{
  "message": "WhatsApp configured successfully"
}
```

**Notes**:

- WhatsApp number must be unique across all businesses
- Number must be in E.164 format
- Changing the number affects all future conversations
- Existing conversations remain linked to the old number

**Error Responses**:

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "whatsappNumber must be in E.164 format (e.g., +18095551234)"
  ],
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
  "message": "You do not have permission to configure WhatsApp for this business",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Business with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "WhatsApp number +18095559999 is already registered",
  "error": "Conflict"
}
```

---

### Deactivate Business

Deactivates a business (soft delete).

**Endpoint**: `DELETE /api/businesses/:id`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Business UUID

**Response**: `200 OK`

```json
{
  "message": "Business deactivated successfully"
}
```

**Notes**:

- Deactivated businesses cannot receive new appointments
- Existing appointments remain active
- Business can be reactivated later
- Deactivation does not delete data

**Error Responses**:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to deactivate this business",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Business with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict - Already deactivated
{
  "statusCode": 409,
  "message": "Business is already deactivated",
  "error": "Conflict"
}
```

---

### Activate Business

Activates a previously deactivated business.

**Endpoint**: `POST /api/businesses/:id/activate`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Business UUID

**Response**: `200 OK`

```json
{
  "message": "Business activated successfully"
}
```

**Notes**:

- Activated businesses can receive new appointments
- All schedules and offerings remain as configured

**Error Responses**:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to activate this business",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Business with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}

// 409 Conflict - Already active
{
  "statusCode": 409,
  "message": "Business is already active",
  "error": "Conflict"
}
```

---

## Error Codes

| Status Code | Error                 | Description                                                |
| ----------- | --------------------- | ---------------------------------------------------------- |
| 400         | Bad Request           | Invalid request data (validation failed)                   |
| 401         | Unauthorized          | Missing or invalid JWT token                               |
| 403         | Forbidden             | User does not have permission or business limit exceeded   |
| 404         | Not Found             | Business not found                                         |
| 409         | Conflict              | WhatsApp number already exists or invalid state transition |
| 500         | Internal Server Error | Unexpected server error                                    |

---

## Data Models

### BusinessReadModel

```typescript
{
  id: string; // UUID v4
  ownerId: string; // UUID v4 (references User.id)
  name: string; // 3-100 characters
  whatsappPhone: string; // E.164 format (e.g., +18095551234)
  addressStreet: string;
  addressCity: string;
  addressState: string | null;
  addressCountry: string;
  addressPostalCode: string | null;
  timezone: string; // IANA timezone (e.g., America/Santo_Domingo)
  isActive: boolean;
  createdAt: string; // ISO 8601 (e.g., 2025-12-26T10:00:00.000Z)
  updatedAt: string; // ISO 8601
  version: number; // Optimistic locking version
}
```

### CreateBusinessDto

```typescript
{
  name: string;                  // Required, 3-100 characters
  whatsappNumber: string;        // Required, E.164 format
  address: {
    street: string;              // Required
    city: string;                // Required
    state?: string | null;       // Optional
    country: string;             // Required
    postalCode?: string | null;  // Optional
  };
  timezone: string;              // Required, IANA timezone
}
```

### UpdateBusinessInfoDto

```typescript
{
  name: string;                  // Required, 3-100 characters
  address: {
    street: string;              // Required
    city: string;                // Required
    state?: string | null;       // Optional
    country: string;             // Required
    postalCode?: string | null;  // Optional
  };
  timezone: string;              // Required, IANA timezone
}
```

### ConfigureWhatsAppDto

```typescript
{
  whatsappNumber: string; // Required, E.164 format
}
```

---

## Business Rules

### Business Creation

1. **WhatsApp Uniqueness**: WhatsApp number must be unique across all businesses
2. **Business Limit**: Number of businesses per owner is limited by subscription plan:
   - FREE: 1 business
   - BASIC: 1 business
   - PRO: 3 businesses
   - ENTERPRISE: 10 businesses
3. **Owner Verification**: Only verified business owners can create businesses
4. **Timezone Validation**: Timezone must be a valid IANA timezone identifier

### Business Updates

1. **Owner Permission**: Only the business owner can update business information
2. **WhatsApp Change**: Changing WhatsApp number requires uniqueness validation
3. **Timezone Impact**: Timezone changes affect all future appointments (existing appointments unchanged)

### Business Activation/Deactivation

1. **Soft Delete**: Deactivation is a soft delete (data is preserved)
2. **Appointment Impact**:
   - Deactivated businesses cannot receive new appointments
   - Existing appointments remain active
3. **Reactivation**: Businesses can be reactivated at any time

### Multi-Business Management

1. **JWT Token**: After creating first business, JWT token includes `businessId`
2. **Context Switching**: Users can switch between businesses by requesting new tokens
3. **Isolation**: Each business has isolated data (offerings, schedules, appointments)

---

## Integration with Account BC

The Business BC integrates with the Account BC for business owner management:

### Business Owner Verification

Before creating a business, the system verifies:

1. User has `BUSINESS_OWNER` role
2. BusinessOwner profile exists and is active
3. Onboarding is completed
4. Subscription plan allows creating more businesses

### Subscription Plan Limits

Business creation is limited by the owner's subscription plan:

```typescript
// Example: Check business limit
GET /api/account/business-owner/me
Response:
{
  "subscriptionPlan": "PRO",
  "maxBusinesses": 3,
  "currentBusinesses": 2,
  "canCreateBusiness": true
}
```

### Event Flow

```
1. User registers → UserRegistered event
2. Account BC creates BusinessOwner → BusinessOwnerCreated event
3. User completes onboarding → BusinessOwnerOnboardingCompleted event
4. User creates business → BusinessCreated event
5. JWT token updated with businessId
```

---

## Changelog

### Version 1.0 (December 26, 2025)

**Initial Release**:

- Create business endpoint
- Get business endpoint
- List businesses by owner endpoint
- Update business endpoint
- Configure WhatsApp endpoint
- Deactivate business endpoint
- Activate business endpoint
- JWT token refresh with businessId
- Multi-business support
- Subscription plan integration

---

**Related Documentation**:

- [Account API](./account.md) - Business owner management
- [Offering API](./offering.md) - Services offered by business
- [Availability API](./availability.md) - Business schedules and capacity
- [Booking API](./booking.md) - Appointment management

**Last Updated**: December 26, 2025  
**Version**: 1.0
