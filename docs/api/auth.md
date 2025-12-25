# Auth API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer JWT Token (for protected endpoints)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Register User](#1-register-user)
   - [Login](#2-login)
   - [Add User Role](#3-add-user-role)
   - [Remove User Role](#4-remove-user-role)
   - [Verify Email](#5-verify-email)
   - [Activate User](#6-activate-user)
   - [Deactivate User](#7-deactivate-user)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)

---

## Overview

The Auth API provides endpoints for user authentication, registration, and role management. It supports multiple user roles (BUSINESS_OWNER, CUSTOMER, ADMIN) and JWT-based authentication.

**Key Features:**

- User registration with initial role assignment
- JWT-based authentication
- Multi-role support (users can have multiple roles)
- Email verification
- User activation/deactivation
- Role management (add/remove roles)

---

## Authentication

Protected endpoints require a valid JWT token in the Authorization header:

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

**Token Expiration:** 1 day (configurable via JWT_EXPIRATION env var)

---

## Endpoints

### 1. Register User

Create a new user account with an initial role.

**Endpoint:** `POST /auth/register`

**Authentication:** Not Required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "Juan Pérez",
  "initialRole": "BUSINESS_OWNER"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email format | User's email address (unique) |
| `password` | string | Yes | Min 8 characters | User's password (will be hashed) |
| `name` | string | Yes | Not empty | User's full name |
| `initialRole` | enum | No | BUSINESS_OWNER, CUSTOMER, ADMIN | Initial role (default: BUSINESS_OWNER) |

**Example Request:**

```http
POST /auth/register
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "SecurePass123",
  "name": "Juan Pérez",
  "initialRole": "BUSINESS_OWNER"
}
```

**Example Response:** `201 Created`

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Flow:**

1. User is created with hashed password
2. Initial role is assigned
3. JWT token is generated and returned
4. `UserRegistered` domain event is published
5. If role is BUSINESS_OWNER, `BusinessOwner` profile is created automatically

**Error Responses:**

- `400 Bad Request` - Validation error (invalid email, password too short, etc.)
- `409 Conflict` - Email already exists

**Validation Errors:**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

### 2. Login

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /auth/login`

**Authentication:** Not Required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Request Body Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

**Example Request:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Example Response:** `200 OK`

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER"],
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - User account is deactivated

**Invalid Credentials:**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Deactivated Account:**

```json
{
  "statusCode": 403,
  "message": "User account is deactivated",
  "error": "Forbidden"
}
```

---

### 3. Add User Role

Add a role to an existing user. Users can have multiple roles simultaneously.

**Endpoint:** `POST /auth/users/:id/roles`

**Authentication:** Required (JWT)

**Authorization:** Currently any authenticated user. TODO: Restrict to ADMIN only (Phase 14)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Request Body:**

```json
{
  "role": "CUSTOMER"
}
```

**Request Body Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `role` | enum | Yes | BUSINESS_OWNER, CUSTOMER, ADMIN | Role to add |

**Example Request:**

```http
POST /auth/users/123e4567-e89b-12d3-a456-426614174000/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "role": "CUSTOMER"
}
```

**Example Response:** `200 OK`

```json
{
  "message": "Role added successfully"
}
```

**Use Cases:**

- Business owner also becomes a customer (marketplace scenario)
- Promote user to admin
- Grant additional permissions

**Error Responses:**

- `400 Bad Request` - Invalid role or user already has this role
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User not found

**User Already Has Role:**

```json
{
  "statusCode": 400,
  "message": "User already has role CUSTOMER",
  "error": "Bad Request"
}
```

---

### 4. Remove User Role

Remove a role from a user. Users must have at least one role.

**Endpoint:** `DELETE /auth/users/:id/roles/:role`

**Authentication:** Required (JWT)

**Authorization:** Currently any authenticated user. TODO: Restrict to ADMIN only (Phase 14)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |
| `role` | enum | Yes | Role to remove (BUSINESS_OWNER, CUSTOMER, ADMIN) |

**Example Request:**

```http
DELETE /auth/users/123e4567-e89b-12d3-a456-426614174000/roles/CUSTOMER
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Role removed successfully"
}
```

**Error Responses:**

- `400 Bad Request` - User doesn't have this role or trying to remove last role
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User not found

**Cannot Remove Last Role:**

```json
{
  "statusCode": 400,
  "message": "Cannot remove last role from user",
  "error": "Bad Request"
}
```

**User Doesn't Have Role:**

```json
{
  "statusCode": 400,
  "message": "User does not have role CUSTOMER",
  "error": "Bad Request"
}
```

---

### 5. Verify Email

Mark a user's email as verified.

**Endpoint:** `PATCH /auth/users/:id/verify-email`

**Authentication:** Required (JWT)

**Authorization:** User can verify their own email, or admin can verify any user

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Example Request:**

```http
PATCH /auth/users/123e4567-e89b-12d3-a456-426614174000/verify-email
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Email already verified
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User trying to verify another user's email (non-admin)
- `404 Not Found` - User not found

**Email Already Verified:**

```json
{
  "statusCode": 400,
  "message": "Email already verified",
  "error": "Bad Request"
}
```

---

### 6. Activate User

Activate a deactivated user account.

**Endpoint:** `PATCH /auth/users/:id/activate`

**Authentication:** Required (JWT)

**Authorization:** Currently any authenticated user. TODO: Restrict to ADMIN only (Phase 14)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Example Request:**

```http
PATCH /auth/users/123e4567-e89b-12d3-a456-426614174000/activate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "User activated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - User already active
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User not found

**User Already Active:**

```json
{
  "statusCode": 400,
  "message": "User is already active",
  "error": "Bad Request"
}
```

---

### 7. Deactivate User

Deactivate a user account (prevents login).

**Endpoint:** `PATCH /auth/users/:id/deactivate`

**Authentication:** Required (JWT)

**Authorization:** Currently any authenticated user. TODO: Restrict to ADMIN only (Phase 14)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Example Request:**

```http
PATCH /auth/users/123e4567-e89b-12d3-a456-426614174000/deactivate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:** `200 OK`

```json
{
  "message": "User deactivated successfully"
}
```

**Effects:**

- User cannot login
- Existing JWT tokens remain valid until expiration
- User data is preserved (not deleted)
- Can be reactivated later

**Error Responses:**

- `400 Bad Request` - User already inactive
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User not found

**User Already Inactive:**

```json
{
  "statusCode": 400,
  "message": "User is already inactive",
  "error": "Bad Request"
}
```

---

## Error Codes

### HTTP Status Codes

| Code  | Description           | When                                            |
| ----- | --------------------- | ----------------------------------------------- |
| `200` | OK                    | Successful request                              |
| `201` | Created               | User registered successfully                    |
| `400` | Bad Request           | Invalid input, validation error                 |
| `401` | Unauthorized          | Invalid credentials or missing JWT              |
| `403` | Forbidden             | Account deactivated or insufficient permissions |
| `404` | Not Found             | User not found                                  |
| `409` | Conflict              | Email already exists                            |
| `500` | Internal Server Error | Unexpected server error                         |

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

**Invalid Email:**

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

**Password Too Short:**

```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

**Invalid UUID:**

```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

**Invalid Role:**

```json
{
  "statusCode": 400,
  "message": [
    "role must be one of the following values: BUSINESS_OWNER, CUSTOMER, ADMIN"
  ],
  "error": "Bad Request"
}
```

---

## Data Models

### UserDto

```typescript
{
  id: string;              // UUID
  email: string;           // Email address (unique)
  name: string;            // User's full name
  roles: UserRole[];       // Array of roles (can have multiple)
  isActive: boolean;       // Account status
  emailVerified: boolean;  // Email verification status
  createdAt: string;       // ISO 8601 timestamp
}
```

### UserRole (Enum)

```typescript
enum UserRole {
  BUSINESS_OWNER = "BUSINESS_OWNER", // Can create and manage businesses
  CUSTOMER = "CUSTOMER", // Can book appointments
  ADMIN = "ADMIN", // System administrator
}
```

### RegisterResponseDto

```typescript
{
  userId: string; // UUID of created user
  token: string; // JWT token for authentication
}
```

### LoginResponseDto

```typescript
{
  user: UserDto; // User information
  token: string; // JWT token for authentication
}
```

### JWT Token Payload

```typescript
{
  sub: string;             // User ID (UUID)
  email: string;           // User email
  businessId?: string;     // Business ID (if BUSINESS_OWNER)
  roles: UserRole[];       // User roles
  iat: number;             // Issued at (Unix timestamp)
  exp: number;             // Expiration (Unix timestamp)
}
```

---

## Security

### Password Hashing

- Algorithm: bcrypt
- Salt rounds: 10
- Passwords are never stored in plain text
- Passwords are never returned in API responses

### JWT Configuration

- Algorithm: HS256
- Secret: Configured via JWT_SECRET env var
- Expiration: 1 day (configurable via JWT_EXPIRATION)
- Token includes user ID, email, businessId, and roles

### Best Practices

1. **Always use HTTPS in production**
2. **Store JWT tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh mechanism** (future enhancement)
4. **Rate limit authentication endpoints** (future enhancement)
5. **Implement account lockout** after failed login attempts (future enhancement)

---

## Multi-Role Architecture

### Role Combinations

Users can have multiple roles simultaneously:

| Roles                        | Use Case                     | Example                                            |
| ---------------------------- | ---------------------------- | -------------------------------------------------- |
| `[BUSINESS_OWNER]`           | Business owner only          | Juan owns a barbershop                             |
| `[CUSTOMER]`                 | Customer only                | María books appointments                           |
| `[BUSINESS_OWNER, CUSTOMER]` | Marketplace scenario         | Juan owns barbershop AND books dentist appointment |
| `[ADMIN]`                    | System administrator         | Platform admin                                     |
| `[ADMIN, BUSINESS_OWNER]`    | Admin who also owns business | Platform admin with demo business                  |

### Role-Based Access Control (RBAC)

**Current Implementation:**

- Most endpoints are open to any authenticated user
- Authorization is enforced at the business level (businessId in JWT)

**Future Implementation (Phase 14):**

- `@RolesGuard` decorator for endpoint-level authorization
- Admin-only endpoints for user management
- Business owner can only manage their own businesses
- Customers can only view their own appointments

---

## Integration with Other BCs

### Auth → Account BC

When a user registers with `BUSINESS_OWNER` role:

1. `UserRegistered` event is published
2. `OnUserRegisteredHandler` listens to event
3. `CreateBusinessOwnerCommand` is executed
4. `BusinessOwner` profile is created with FREE plan

### Auth → Customer BC

When a customer is linked to a user:

1. `CustomerLinkedToUser` event is published
2. `OnCustomerLinkedToUserHandler` listens to event
3. `AddUserRoleCommand` is executed
4. `CUSTOMER` role is added to user

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended (Future):**

- Login: 5 attempts per 15 minutes per IP
- Register: 3 attempts per hour per IP
- Other endpoints: 100 requests per minute per user

---

## Performance Targets

| Endpoint     | Target (p95) | Notes                   |
| ------------ | ------------ | ----------------------- |
| Register     | < 500ms      | Includes bcrypt hash    |
| Login        | < 300ms      | Includes bcrypt compare |
| Add Role     | < 100ms      | Simple update           |
| Remove Role  | < 100ms      | Simple update           |
| Verify Email | < 100ms      | Simple update           |
| Activate     | < 100ms      | Simple update           |
| Deactivate   | < 100ms      | Simple update           |

---

## Testing

### Unit Tests

- User aggregate business logic
- Password hashing and validation
- Email validation
- Role management rules

### Integration Tests

- Command handlers with database
- JWT token generation and validation
- Event publishing

### E2E Tests

- Complete registration flow
- Login with valid/invalid credentials
- Role management flows
- Email verification flow

---

## Changelog

### Version 1.0 (2025-12-19)

- Initial API documentation
- 7 endpoints documented
- Multi-role support documented
- JWT authentication documented
- Integration with other BCs documented

---

## Future Enhancements

1. **Password Reset** - Forgot password flow with email
2. **Email Verification** - Send verification email on registration
3. **Refresh Tokens** - Long-lived refresh tokens for better UX
4. **OAuth Integration** - Google, Facebook login
5. **Two-Factor Authentication (2FA)** - SMS or authenticator app
6. **Account Lockout** - After N failed login attempts
7. **Password History** - Prevent password reuse
8. **Session Management** - View and revoke active sessions
9. **Audit Log** - Track all authentication events
10. **Role-Based Guards** - Enforce authorization at endpoint level

---

**Last Updated:** December 19, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
