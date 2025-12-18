# Auth BC - API Documentation

## Overview

El Auth BC (Bounded Context de Autenticación) maneja la autenticación y autorización de usuarios con un sistema de roles múltiples.

## Base URL

```
http://localhost:3000/api/auth
```

## Authentication

Todos los endpoints (excepto `/register` y `/login`) requieren un token JWT en el header:

```
Authorization: Bearer {token}
```

---

## Endpoints

### 1. Register User

Registra un nuevo usuario en el sistema.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "initialRole": "BUSINESS_OWNER"  // Opcional, default: BUSINESS_OWNER
}
```

**Validation Rules:**
- `email`: Debe ser un email válido, único en el sistema
- `password`: Mínimo 8 caracteres
- `name`: Requerido, string no vacío
- `initialRole`: Opcional, debe ser uno de: `BUSINESS_OWNER`, `CUSTOMER`, `ADMIN`

**Response:** `201 Created`
```json
{
  "user": {
    "id": "e651ff40-e29b-4d48-9e19-c30301842dfd",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER"],
    "isActive": true,
    "emailVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400 Bad Request`: Validación fallida
- `409 Conflict`: Email ya existe

**Domain Events Published:**
- `UserRegistered`: Incluye `userId`, `email`, `name`, `initialRole`

---

### 2. Login

Autentica un usuario y retorna un JWT.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "e651ff40-e29b-4d48-9e19-c30301842dfd",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER", "CUSTOMER"],
    "isActive": true,
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**
```json
{
  "userId": "e651ff40-e29b-4d48-9e19-c30301842dfd",
  "email": "usuario@example.com",
  "roles": ["BUSINESS_OWNER", "CUSTOMER"],
  "iat": 1734480000,
  "exp": 1734566400
}
```

**Errors:**
- `401 Unauthorized`: Credenciales inválidas
- `403 Forbidden`: Usuario desactivado

---

### 3. Add Role to User

Agrega un rol a un usuario existente.

**Endpoint:** `POST /api/auth/users/:userId/roles`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "role": "CUSTOMER"
}
```

**Response:** `200 OK`
```json
{
  "message": "Role added successfully"
}
```

**Business Rules:**
- No se puede agregar un rol que el usuario ya tiene → `UserAlreadyHasRoleException`
- El usuario debe existir → `UserNotFoundException`
- El usuario debe estar activo

**Domain Events Published:**
- `UserRoleAdded`: Incluye `userId`, `role`

**Errors:**
- `400 Bad Request`: Rol inválido
- `404 Not Found`: Usuario no existe
- `409 Conflict`: Usuario ya tiene ese rol

---

### 4. Remove Role from User

Remueve un rol de un usuario.

**Endpoint:** `DELETE /api/auth/users/:userId/roles/:role`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "Role removed successfully"
}
```

**Business Rules:**
- No se puede remover un rol que el usuario no tiene → `UserDoesNotHaveRoleException`
- No se puede remover el último rol → `CannotRemoveLastRoleException`
- El usuario siempre debe tener al menos un rol

**Domain Events Published:**
- `UserRoleRemoved`: Incluye `userId`, `role`

**Errors:**
- `400 Bad Request`: Rol inválido
- `404 Not Found`: Usuario no existe o no tiene ese rol
- `409 Conflict`: Intento de remover último rol

---

### 5. Verify Email

Verifica el email de un usuario.

**Endpoint:** `POST /api/auth/verify-email`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "userId": "e651ff40-e29b-4d48-9e19-c30301842dfd"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

**Business Rules:**
- Solo se puede verificar una vez → `EmailAlreadyVerifiedException`
- Operación idempotente

**Domain Events Published:**
- `UserEmailVerified`: Incluye `userId`

**Errors:**
- `404 Not Found`: Usuario no existe
- `409 Conflict`: Email ya verificado

---

### 6. Deactivate User

Desactiva una cuenta de usuario.

**Endpoint:** `POST /api/auth/users/:userId/deactivate`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "User deactivated successfully"
}
```

**Business Rules:**
- Usuarios desactivados no pueden hacer login
- Operación idempotente → `UserAlreadyInactiveException`

**Domain Events Published:**
- `UserDeactivated`: Incluye `userId`

**Errors:**
- `404 Not Found`: Usuario no existe
- `409 Conflict`: Usuario ya está desactivado

---

### 7. Activate User

Activa una cuenta de usuario previamente desactivada.

**Endpoint:** `POST /api/auth/users/:userId/activate`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "User activated successfully"
}
```

**Business Rules:**
- Operación idempotente → `UserAlreadyActiveException`

**Domain Events Published:**
- `UserActivated`: Incluye `userId`

**Errors:**
- `404 Not Found`: Usuario no existe
- `409 Conflict`: Usuario ya está activo

---

## Authorization

### Guards

#### JwtAuthGuard

Verifica que el request tenga un JWT válido.

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedResource() {
  return { message: 'Protected resource' };
}
```

#### RolesGuard

Verifica que el usuario tenga al menos uno de los roles requeridos.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin-only')
getAdminResource() {
  return { message: 'Admin only resource' };
}
```

**Nota:** `RolesGuard` requiere `JwtAuthGuard` para funcionar.

### Decorators

#### @CurrentUser()

Obtiene el usuario actual del request.

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: UserPayload) {
  // user: { userId, email, roles }
  return user;
}
```

#### @Roles(...roles)

Define los roles requeridos para acceder a un endpoint.

```typescript
@Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
@Get('business-stats')
getBusinessStats() {
  // Solo BUSINESS_OWNER o ADMIN pueden acceder
}
```

---

## Domain Events

### UserRegistered

Publicado cuando un usuario se registra.

```typescript
{
  userId: string;
  email: string;
  name: string;
  initialRole: UserRole;
  occurredAt: Date;
}
```

**Subscribers:**
- **Account BC**: Crea `BusinessOwner` si `initialRole === BUSINESS_OWNER`

### UserRoleAdded

Publicado cuando se agrega un rol a un usuario.

```typescript
{
  userId: string;
  role: UserRole;
  occurredAt: Date;
}
```

### UserRoleRemoved

Publicado cuando se remueve un rol de un usuario.

```typescript
{
  userId: string;
  role: UserRole;
  occurredAt: Date;
}
```

### UserEmailVerified

Publicado cuando se verifica el email de un usuario.

```typescript
{
  userId: string;
  occurredAt: Date;
}
```

### UserActivated

Publicado cuando se activa un usuario.

```typescript
{
  userId: string;
  occurredAt: Date;
}
```

### UserDeactivated

Publicado cuando se desactiva un usuario.

```typescript
{
  userId: string;
  occurredAt: Date;
}
```

---

## Integration with Other BCs

### Account BC Integration

**Flow:**
1. User registers with `initialRole = BUSINESS_OWNER`
2. Auth BC publishes `UserRegistered` event
3. Account BC listens to event
4. Account BC creates `BusinessOwner` with `userId` and `subscriptionPlan = FREE`

### Customer BC Integration

**Flow:**
1. Anonymous customer links to a user account
2. Customer BC publishes `CustomerLinkedToUser` event
3. Auth BC listens to event
4. Auth BC adds `CUSTOMER` role to user

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Validación fallida |
| 401 | `UNAUTHORIZED` | Credenciales inválidas o token expirado |
| 403 | `FORBIDDEN` | Usuario desactivado o sin permisos |
| 404 | `NOT_FOUND` | Usuario no encontrado |
| 409 | `CONFLICT` | Email duplicado, rol duplicado, o violación de regla de negocio |
| 500 | `INTERNAL_SERVER_ERROR` | Error interno del servidor |

---

## Examples

### Complete Registration Flow

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123",
    "name": "Juan Pérez",
    "initialRole": "BUSINESS_OWNER"
  }'

# Response: { user: {...}, token: "..." }

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'

# Response: { user: {...}, token: "..." }

# 3. Add CUSTOMER role (for marketplace scenario)
curl -X POST http://localhost:3000/api/auth/users/{userId}/roles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "CUSTOMER"
  }'

# Response: { message: "Role added successfully" }
```

### Marketplace Scenario

Juan is a lawyer (BUSINESS_OWNER) who also needs dental services (CUSTOMER):

```bash
# 1. Juan registers as BUSINESS_OWNER
POST /api/auth/register
{
  "email": "juan@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "initialRole": "BUSINESS_OWNER"
}

# 2. Account BC automatically creates BusinessOwner

# 3. Juan creates his law firm business (Business BC)

# 4. Juan searches for dentist and books appointment
# Customer BC creates anonymous Customer

# 5. Juan links anonymous Customer to his User account
# Customer BC publishes CustomerLinkedToUser event

# 6. Auth BC automatically adds CUSTOMER role to Juan

# 7. Juan now has roles: ["BUSINESS_OWNER", "CUSTOMER"]
# He can switch between "My Business" and "My Appointments" views
```

---

## Testing

### Unit Tests

```bash
# Run all auth unit tests
pnpm --filter backend test -- auth/domain
pnpm --filter backend test -- auth/app
```

### Integration Tests

```bash
# Run auth integration tests
pnpm --filter backend test -- auth/infra
pnpm --filter backend test -- auth/presentation
```

### Property-Based Tests

```bash
# Run auth property-based tests
pnpm --filter backend test -- auth/ --testPathPattern="pbt.spec.ts"
```

---

## Database Schema

### users table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roles TEXT[] NOT NULL,  -- Array of roles
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 0,  -- Optimistic locking
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GIN index for efficient role queries
CREATE INDEX idx_users_roles ON users USING GIN(roles);
```

---

## Migration

### Apply Migration

```bash
pnpm --filter backend migration:run
```

### Rollback Migration

```bash
pnpm --filter backend migration:revert
```

### Migration Details

**File:** `apps/backend/src/database/migrations/1734480000000-RefactorUserRoles.ts`

**Changes:**
- Add `roles` column (TEXT[])
- Add `email_verified` column (BOOLEAN)
- Add `is_active` column (BOOLEAN)
- Remove `business_id` column
- Create GIN index on `roles`
- Migrate existing data: `roles = ARRAY['BUSINESS_OWNER']`

---

## Security Considerations

### Password Hashing

- Uses `bcrypt` with 10 salt rounds
- Passwords are never stored in plain text
- Password validation happens in domain layer

### JWT Security

- Tokens expire after 1 day (configurable via `JWT_EXPIRATION`)
- Tokens are signed with `JWT_SECRET` (must be strong in production)
- Tokens contain minimal information: `userId`, `email`, `roles`

### Role-Based Access Control

- Guards verify roles before allowing access
- Users can have multiple roles
- Roles are checked against JWT payload (no DB query)

### Optimistic Locking

- User aggregate uses versioning to prevent lost updates
- Concurrent modifications are detected and rejected
- Retry logic handles transient conflicts

---

## Future Enhancements

- [ ] Refresh tokens for long-lived sessions
- [ ] Email verification flow with tokens
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Facebook)
- [ ] Role permissions (fine-grained access control)
- [ ] Audit log for security events

---

## Support

For issues or questions, please refer to:
- [Architecture Documentation](../.kiro/steering/architecture.md)
- [User-Customer-BusinessOwner Architecture](../.kiro/steering/user-customer-businessowner-architecture.md)
- [GitHub Issues](https://github.com/cryptoganster/bookings-software/issues)
