# Account API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token (Required)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Get Business Owner Profile](#1-get-business-owner-profile)
   - [Get Subscription Details](#2-get-subscription-details)
   - [Upgrade Subscription](#3-upgrade-subscription)
   - [Complete Onboarding](#4-complete-onboarding)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Subscription Plans](#subscription-plans)

---

## Overview

The Account API manages Business Owner profiles and subscription plans. It provides endpoints for viewing profile information, managing subscriptions, and completing the onboarding process.

**Key Features:**

- Business Owner profile management
- Subscription plan information and upgrades
- Onboarding completion tracking
- Multi-tier subscription plans (FREE, BASIC, PRO, ENTERPRISE)
- Subscription status management (ACTIVE, SUSPENDED, CANCELLED)

**Business Context:**

- Each User with role `BUSINESS_OWNER` has a corresponding `BusinessOwner` profile
- BusinessOwner is created automatically when a User registers with `BUSINESS_OWNER` role
- Subscription plan determines limits (max businesses, max appointments per month)
- Default plan is FREE when BusinessOwner is created

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

**Required Role:** `BUSINESS_OWNER`

---

## Endpoints

### 1. Get Business Owner Profile

Retrieve the complete Business Owner profile for the authenticated user.

**Endpoint:** `GET /account/profile`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Example Request:**

```http
GET /account/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "subscriptionPlan": "PRO",
  "subscriptionStatus": "ACTIVE",
  "maxBusinesses": 3,
  "maxAppointmentsPerMonth": 2000,
  "price": 79,
  "onboardingCompleted": true,
  "version": 5,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:45:00.000Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Business Owner ID |
| `userId` | UUID | Associated User ID |
| `subscriptionPlan` | string | Current plan (FREE, BASIC, PRO, ENTERPRISE) |
| `subscriptionStatus` | string | Status (ACTIVE, SUSPENDED, CANCELLED) |
| `maxBusinesses` | number | Maximum businesses allowed |
| `maxAppointmentsPerMonth` | number | Maximum appointments per month |
| `price` | number | Monthly price in USD |
| `onboardingCompleted` | boolean | Whether onboarding is complete |
| `version` | number | Optimistic locking version |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business Owner profile not found

---

### 2. Get Subscription Details

Retrieve detailed subscription information including current usage.

**Endpoint:** `GET /account/subscription`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Example Request:**

```http
GET /account/subscription
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "plan": "PRO",
  "status": "ACTIVE",
  "maxBusinesses": 3,
  "currentBusinessCount": 1,
  "maxAppointmentsPerMonth": 2000,
  "price": 79
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `plan` | string | Current subscription plan |
| `status` | string | Subscription status |
| `maxBusinesses` | number | Maximum businesses allowed |
| `currentBusinessCount` | number | Current number of businesses |
| `maxAppointmentsPerMonth` | number | Monthly appointment limit |
| `price` | number | Monthly price in USD |

**Usage Information:**

- `currentBusinessCount` shows how many businesses the owner currently has
- Compare with `maxBusinesses` to check if limit is reached
- `maxAppointmentsPerMonth` is the total limit across all businesses

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business Owner profile not found

---

### 3. Upgrade Subscription

Upgrade to a higher subscription plan.

**Endpoint:** `PUT /account/subscription/upgrade`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Request Body:**

```json
{
  "newPlan": "PRO"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `newPlan` | string | Yes | FREE, BASIC, PRO, ENTERPRISE | Target subscription plan |

**Example Request:**

```http
PUT /account/subscription/upgrade
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newPlan": "PRO"
}
```

**Example Response:** `200 OK`

```json
{
  "message": "Subscription upgraded successfully"
}
```

**Upgrade Rules:**

- Can only upgrade to higher tiers (FREE → BASIC → PRO → ENTERPRISE)
- Cannot downgrade (use separate endpoint in future)
- Cannot upgrade to same plan
- Upgrade is immediate (no proration in MVP)

**Valid Upgrade Paths:**

| From  | To         | Valid          |
| ----- | ---------- | -------------- |
| FREE  | BASIC      | ✅             |
| FREE  | PRO        | ✅             |
| FREE  | ENTERPRISE | ✅             |
| BASIC | PRO        | ✅             |
| BASIC | ENTERPRISE | ✅             |
| PRO   | ENTERPRISE | ✅             |
| PRO   | BASIC      | ❌ (downgrade) |
| BASIC | FREE       | ❌ (downgrade) |
| PRO   | PRO        | ❌ (same plan) |

**Error Responses:**

- `400 Bad Request` - Invalid plan, downgrade attempt, or same plan
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business Owner profile not found

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": "Cannot downgrade from PRO to BASIC",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Already on PRO plan",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Invalid subscription plan: PREMIUM",
  "error": "Bad Request"
}
```

---

### 4. Complete Onboarding

Mark the onboarding process as complete for the Business Owner.

**Endpoint:** `POST /account/onboarding/complete`

**Authentication:** Required (JWT)

**Authorization:** User must have `BUSINESS_OWNER` role

**Request Body:** None

**Example Request:**

```http
POST /account/onboarding/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Onboarding completed successfully"
}
```

**Onboarding Flow:**

1. User registers with `BUSINESS_OWNER` role
2. `BusinessOwner` profile is created automatically (FREE plan)
3. User completes onboarding steps in frontend:
   - Business information
   - Services/offerings
   - Schedule configuration
   - WhatsApp setup
4. Frontend calls this endpoint to mark onboarding as complete
5. `onboardingCompleted` flag is set to `true`

**Effects:**

- Sets `onboardingCompleted` to `true`
- Publishes `BusinessOwnerOnboardingCompleted` domain event
- Enables full access to platform features

**Error Responses:**

- `400 Bad Request` - Onboarding already completed
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have BUSINESS_OWNER role
- `404 Not Found` - Business Owner profile not found

**Onboarding Already Completed:**

```json
{
  "statusCode": 400,
  "message": "Onboarding already completed",
  "error": "Bad Request"
}
```

---

## Error Codes

### HTTP Status Codes

| Code  | Description           | When                                          |
| ----- | --------------------- | --------------------------------------------- |
| `200` | OK                    | Successful request                            |
| `400` | Bad Request           | Invalid input, validation error               |
| `401` | Unauthorized          | Missing or invalid JWT token                  |
| `403` | Forbidden             | Insufficient permissions (not BUSINESS_OWNER) |
| `404` | Not Found             | Business Owner profile not found              |
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

### Common Validation Errors

**Invalid Plan:**

```json
{
  "statusCode": 400,
  "message": ["newPlan should not be empty"],
  "error": "Bad Request"
}
```

**Not Business Owner:**

```json
{
  "statusCode": 403,
  "message": "User does not have BUSINESS_OWNER role",
  "error": "Forbidden"
}
```

**Profile Not Found:**

```json
{
  "statusCode": 404,
  "message": "Business Owner profile not found for user",
  "error": "Not Found"
}
```

---

## Data Models

### BusinessOwnerReadModel

```typescript
{
  id: string; // UUID
  userId: string; // UUID (references User)
  subscriptionPlan: string; // FREE, BASIC, PRO, ENTERPRISE
  subscriptionStatus: string; // ACTIVE, SUSPENDED, CANCELLED
  maxBusinesses: number; // Plan limit
  maxAppointmentsPerMonth: number; // Plan limit
  price: number; // Monthly price in USD
  onboardingCompleted: boolean; // Onboarding status
  version: number; // Optimistic locking version
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### SubscriptionReadModel

```typescript
{
  plan: string; // Current plan name
  status: string; // Subscription status
  maxBusinesses: number; // Maximum businesses allowed
  currentBusinessCount: number; // Current number of businesses
  maxAppointmentsPerMonth: number; // Monthly appointment limit
  price: number; // Monthly price in USD
}
```

### UpgradeSubscriptionDto

```typescript
{
  newPlan: string; // Target plan (FREE, BASIC, PRO, ENTERPRISE)
}
```

---

## Subscription Plans

### Plan Comparison

| Feature                    | FREE     | BASIC     | PRO       | ENTERPRISE |
| -------------------------- | -------- | --------- | --------- | ---------- |
| **Price**                  | $0/month | $29/month | $79/month | $199/month |
| **Max Businesses**         | 1        | 1         | 3         | 10         |
| **Max Appointments/Month** | 100      | 500       | 2000      | 10000      |
| **WhatsApp Integration**   | ✅       | ✅        | ✅        | ✅         |
| **Web Panel**              | ✅       | ✅        | ✅        | ✅         |
| **Email Support**          | ❌       | ✅        | ✅        | ✅         |
| **Priority Support**       | ❌       | ❌        | ✅        | ✅         |
| **Custom Branding**        | ❌       | ❌        | ❌        | ✅         |
| **API Access**             | ❌       | ❌        | ❌        | ✅         |

### Plan Details

#### FREE Plan

- **Target:** Small businesses testing the platform
- **Limits:** 1 business, 100 appointments/month
- **Price:** $0/month
- **Best For:** Freelancers, small service providers

#### BASIC Plan

- **Target:** Growing businesses
- **Limits:** 1 business, 500 appointments/month
- **Price:** $29/month
- **Best For:** Single-location businesses with moderate traffic

#### PRO Plan

- **Target:** Multi-location businesses
- **Limits:** 3 businesses, 2000 appointments/month
- **Price:** $79/month
- **Best For:** Business owners with multiple locations

#### ENTERPRISE Plan

- **Target:** Large organizations
- **Limits:** 10 businesses, 10000 appointments/month
- **Price:** $199/month
- **Best For:** Franchises, large service providers

---

## Subscription Status

### Status Types

#### ACTIVE

- Subscription is active and in good standing
- Can create appointments up to plan limits
- All features available
- Billing is current

#### SUSPENDED

- Subscription is temporarily suspended
- Cannot create new appointments
- Existing appointments remain active
- Usually due to payment issues
- Can be reactivated by resolving payment

#### CANCELLED

- Subscription has been cancelled
- Cannot create new appointments
- Existing appointments remain until completion
- Data is preserved for 30 days
- Can reactivate within grace period

---

## Business Rules

### Subscription Upgrades

1. **Only Upgrades Allowed:** Cannot downgrade in MVP (future feature)
2. **Immediate Effect:** Upgrade takes effect immediately
3. **No Proration:** Full month charged (future: proration)
4. **Limit Increase:** New limits apply immediately
5. **No Refunds:** Previous plan charges are non-refundable

### Onboarding

1. **Required Before Business Creation:** Must complete onboarding
2. **One-Time Process:** Cannot be repeated
3. **Automatic Profile Creation:** BusinessOwner created on User registration
4. **Default Plan:** Starts with FREE plan

### Plan Limits

1. **Business Limit:** Cannot create more businesses than plan allows
2. **Appointment Limit:** Monthly limit across all businesses
3. **Limit Reset:** Appointment counter resets on 1st of each month
4. **Soft Limits:** Warnings at 80% and 90% usage (future)

---

## Integration with Other BCs

### Auth BC → Account BC

**Flow:** User Registration with BUSINESS_OWNER role

1. User registers via `POST /auth/register` with `initialRole: BUSINESS_OWNER`
2. `UserRegistered` event is published
3. `OnUserRegisteredHandler` in Account BC listens to event
4. `CreateBusinessOwnerCommand` is executed
5. `BusinessOwner` profile is created with FREE plan
6. `BusinessOwnerCreated` event is published

### Account BC → Business BC

**Flow:** Onboarding Completion

1. User completes onboarding via `POST /account/onboarding/complete`
2. `BusinessOwnerOnboardingCompleted` event is published
3. User can now create their first Business
4. Business creation checks plan limits via Account BC

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended (Future):**

- Profile endpoints: 100 requests per minute per user
- Upgrade endpoint: 5 requests per minute per user (prevent abuse)

---

## Performance Targets

| Endpoint            | Target (p95) | Notes                   |
| ------------------- | ------------ | ----------------------- |
| Get Profile         | < 100ms      | Primary key lookup      |
| Get Subscription    | < 150ms      | Includes business count |
| Upgrade             | < 300ms      | Includes validation     |
| Complete Onboarding | < 200ms      | Simple update           |

---

## Security

### Authorization

- All endpoints require `BUSINESS_OWNER` role
- Users can only access their own profile
- No cross-user access (enforced by userId in JWT)

### Optimistic Locking

- `BusinessOwner` aggregate uses version field
- Prevents concurrent modification conflicts
- Automatic retry on version mismatch

### Data Privacy

- Subscription information is private
- Only owner can view their subscription
- No public endpoints for account data

---

## Testing

### Unit Tests

- Subscription plan validation
- Upgrade path validation
- Onboarding completion logic

### Integration Tests

- Command handlers with database
- Query handlers with read models
- Event publishing

### E2E Tests

- Complete onboarding flow
- Subscription upgrade flow
- Profile retrieval

---

## Changelog

### Version 1.0 (2025-12-19)

- Initial API documentation
- 4 endpoints documented
- Subscription plans defined
- Integration with Auth BC documented

---

## Future Enhancements

1. **Subscription Downgrade** - Allow downgrading to lower plans
2. **Payment Integration** - Stripe/PayPal integration
3. **Proration** - Prorated charges on plan changes
4. **Usage Analytics** - Detailed usage statistics
5. **Billing History** - View past invoices
6. **Auto-Suspend** - Automatic suspension on payment failure
7. **Grace Period** - 7-day grace period before suspension
8. **Plan Recommendations** - Suggest plan based on usage
9. **Custom Plans** - Enterprise custom pricing
10. **Multi-Currency** - Support for multiple currencies

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
