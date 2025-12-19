# Design Document - Auth BC Roles Refactoring

## Overview

Este documento define el diseño detallado para refactorizar el Auth BC (Bounded Context de Autenticación) para soportar la arquitectura unificada de identidades con roles múltiples. El objetivo es transformar User de una entidad simple vinculada a Business a una identidad universal que puede tener múltiples roles simultáneamente (BUSINESS_OWNER, CUSTOMER, ADMIN), preparando el sistema para el escenario marketplace.

### Cambios Principales

1. **User Aggregate**: Agregar array de roles, eliminar businessId, agregar emailVerified e isActive
2. **UserRole Enum**: Nuevo value object para roles (BUSINESS_OWNER, CUSTOMER, ADMIN)
3. **Domain Events**: Actualizar UserRegistered para incluir initialRole, agregar UserRoleAdded, UserRoleRemoved, UserEmailVerified
4. **Commands**: Actualizar RegisterCommand, agregar AddUserRoleCommand, RemoveUserRoleCommand
5. **JWT Payload**: Incluir roles array, eliminar businessId
6. **Database**: Migración para agregar columnas roles, email_verified, is_active y eliminar business_id

### Impacto en Otros BCs

- **Account BC**: Event handler escuchará UserRegistered con role=BUSINESS_OWNER para crear BusinessOwner automáticamente
- **Customer BC**: Event handler escuchará CustomerLinkedToUser para agregar role CUSTOMER al User
- **Business BC**: Eliminará dependencia de User.businessId, usará Business.ownerId → User.id

## Architecture

### Bounded Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Auth BC)                           │
│  - Identidad universal del sistema                          │
│  - Autenticación (email/password)                           │
│  - Roles: ['BUSINESS_OWNER', 'CUSTOMER', 'ADMIN']          │
│  - Un User puede tener múltiples roles simultáneamente      │
└─────────────────────────────────────────────────────────────┘
                    ↓                           ↓
        ┌───────────────────────┐    ┌──────────────────────┐
        │  BusinessOwner (BC)   │    │  Customer (BC)       │
        │  - userId (required)  │    │  - userId (optional) │
        │  - businessProfile    │    │  - whatsappPhone     │
        │  - subscriptionPlan   │    │  - businessId        │
        └───────────────────────┘    └──────────────────────┘
```

### Layer Architecture

```
Presentation Layer
    ↓
Application Layer (Commands, Queries, Event Handlers)
    ↓
Domain Layer (Aggregates, Value Objects, Events)
    ↓
Infrastructure Layer (Repositories, Factories, Persistence)
```

## Components and Interfaces

### Domain Layer

#### User Aggregate

**Ubicación:** `apps/backend/src/auth/domain/aggregates/user.ts`

**Responsabilidades:**

- Gestionar identidad universal con múltiples roles
- Validar reglas de negocio para roles (no duplicados, no eliminar último rol)
- Gestionar verificación de email
- Gestionar activación/desactivación de cuenta
- Publicar domain events

**Métodos Públicos:**

```typescript
// Factory methods
static register(id: UUID, email: Email, password: Password, name: string, initialRole: UserRole): User
static fromPersistence(id: UUID, email: Email, hashedPassword: string, name: string, roles: UserRole[], isActive: boolean, emailVerified: boolean, createdAt: Date, version: number): User

// Business logic
addRole(role: UserRole): void
removeRole(role: UserRole): void
hasRole(role: UserRole): boolean
verifyEmail(): void
deactivate(): void
activate(): void
async validatePassword(plainPassword: string): Promise<boolean>

// Getters
getId(): UUID
getEmail(): Email
getName(): string
getRoles(): UserRole[]
isActive(): boolean
isEmailVerified(): boolean
getCreatedAt(): Date
```

#### UserRole Enum

**Ubicación:** `apps/backend/src/auth/domain/vo/user-role.ts`

**Valores:**

```typescript
export enum UserRole {
  BUSINESS_OWNER = "BUSINESS_OWNER",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}
```

#### Domain Events

**Ubicación:** `apps/backend/src/auth/domain/events/`

**UserRegistered:**

```typescript
export class UserRegistered {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly initialRole: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**UserRoleAdded:**

```typescript
export class UserRoleAdded {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**UserRoleRemoved:**

```typescript
export class UserRoleRemoved {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**UserEmailVerified:**

```typescript
export class UserEmailVerified {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**UserDeactivated:**

```typescript
export class UserDeactivated {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**UserActivated:**

```typescript
export class UserActivated {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### Domain Exceptions

**Ubicación:** `apps/backend/src/auth/domain/exceptions/`

```typescript
export class UserAlreadyHasRoleException extends DomainException {
  constructor(userId: string, role: UserRole) {
    super(`User ${userId} already has role ${role}`);
  }
}

export class UserDoesNotHaveRoleException extends DomainException {
  constructor(userId: string, role: UserRole) {
    super(`User ${userId} does not have role ${role}`);
  }
}

export class CannotRemoveLastRoleException extends DomainException {
  constructor(userId: string) {
    super(`Cannot remove last role from user ${userId}`);
  }
}

export class EmailAlreadyVerifiedException extends DomainException {
  constructor(userId: string) {
    super(`Email for user ${userId} is already verified`);
  }
}

export class UserAlreadyActiveException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is already active`);
  }
}

export class UserAlreadyInactiveException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is already inactive`);
  }
}
```

### Application Layer

#### Commands

**RegisterCommand:**

```typescript
export class RegisterCommand extends Command<{
  userId: string;
  accessToken: string;
}> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly initialRole: UserRole,
  ) {
    super();
  }
}
```

**AddUserRoleCommand:**

```typescript
export class AddUserRoleCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
  ) {
    super();
  }
}
```

**RemoveUserRoleCommand:**

```typescript
export class RemoveUserRoleCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
  ) {
    super();
  }
}
```

**VerifyEmailCommand:**

```typescript
export class VerifyEmailCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

**DeactivateUserCommand:**

```typescript
export class DeactivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

**ActivateUserCommand:**

```typescript
export class ActivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

#### Queries

**GetUserQuery:**

```typescript
export class GetUserQuery extends Query<UserReadModel> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

**GetUserByEmailQuery:**

```typescript
export class GetUserByEmailQuery extends Query<UserReadModel | null> {
  constructor(public readonly email: string) {
    super();
  }
}
```

#### Read Model

**UserReadModel:**

```typescript
export class UserReadModel {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}
```

### Infrastructure Layer

#### Persistence Model

**UserModel:**

```typescript
@Entity("users")
export class UserModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column("simple-array")
  roles: string[];

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "email_verified", default: false })
  emailVerified: boolean;

  @Column({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ default: 0 })
  version: number;
}
```

#### Factory Interface

**IUserFactory:**

```typescript
export interface IUserFactory {
  /**
   * Loads a User aggregate for modification
   * @returns Domain aggregate with business logic
   */
  loadById(id: string): Promise<User | null>;

  /**
   * Loads a User aggregate by email for authentication
   * @returns Domain aggregate with business logic
   */
  loadByEmail(email: string): Promise<User | null>;
}
```

#### Repository Interfaces

**IUserWriteRepository:**

```typescript
export interface IUserWriteRepository {
  /**
   * Persists a user aggregate
   * Uses optimistic locking with version field
   */
  save(user: User): Promise<void>;
}
```

**IUserReadRepository:**

```typescript
export interface IUserReadRepository {
  /**
   * Gets user data for display
   * @returns Read model (DTO) without business logic
   */
  findById(id: string): Promise<UserReadModel | null>;

  /**
   * Gets user data by email
   * @returns Read model (DTO) without business logic
   */
  findByEmail(email: string): Promise<UserReadModel | null>;
}
```

## Data Models

### Database Schema

**users table:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roles TEXT[] NOT NULL DEFAULT ARRAY['BUSINESS_OWNER'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
```

### Migration Strategy

**Migración:** `apps/backend/src/database/migrations/XXXXXX-RefactorUserRoles.ts`

```typescript
export class RefactorUserRoles implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar nuevas columnas
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN roles TEXT[] DEFAULT ARRAY['BUSINESS_OWNER'],
      ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN is_active BOOLEAN DEFAULT TRUE
    `);

    // 2. Migrar datos existentes: todos los users actuales son BUSINESS_OWNER
    await queryRunner.query(`
      UPDATE users 
      SET roles = ARRAY['BUSINESS_OWNER']
      WHERE roles IS NULL
    `);

    // 3. Hacer roles NOT NULL
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN roles SET NOT NULL
    `);

    // 4. Eliminar columna business_id
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS business_id
    `);

    // 5. Crear índice GIN para búsquedas eficientes en array de roles
    await queryRunner.query(`
      CREATE INDEX idx_users_roles ON users USING GIN(roles)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_roles`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN business_id UUID`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN is_active`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verified`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN roles`);
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: User always has at least one role

_For any_ User, the roles array should never be empty.

**Validates: Requirements 1.2, 2.4**

### Property 2: Adding duplicate role is idempotent

_For any_ User with role R, calling addRole(R) should throw UserAlreadyHasRoleException.

**Validates: Requirements 2.2, 5.4**

### Property 3: Removing last role is prevented

_For any_ User with exactly one role, calling removeRole should throw CannotRemoveLastRoleException.

**Validates: Requirements 2.4, 5.5**

### Property 4: Email verification is idempotent

_For any_ User with emailVerified=true, calling verifyEmail() should throw EmailAlreadyVerifiedException.

**Validates: Requirements 6.5**

### Property 5: JWT contains roles array

_For any_ authenticated User, the JWT payload should contain a roles array matching User.getRoles().

**Validates: Requirements 4.1, 4.2**

### Property 6: User aggregate version increments on changes

_For any_ User, applying any domain operation (addRole, removeRole, verifyEmail, activate, deactivate) should increment version by exactly 1.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: UserRegistered event includes initialRole

_For any_ User created with register(), the UserRegistered event should include the initialRole passed to the factory method.

**Validates: Requirements 3.1, 3.4**

## Error Handling

### Domain Exceptions

Todas las excepciones de dominio extienden `DomainException` del shared kernel y son capturadas por el `DomainExceptionFilter` global que las mapea a códigos HTTP apropiados:

- `UserAlreadyHasRoleException` → 409 Conflict
- `UserDoesNotHaveRoleException` → 400 Bad Request
- `CannotRemoveLastRoleException` → 400 Bad Request
- `EmailAlreadyVerifiedException` → 409 Conflict
- `UserAlreadyActiveException` → 409 Conflict
- `UserAlreadyInactiveException` → 409 Conflict

### Concurrency Handling

El User aggregate usa Optimistic Locking con el campo `version`. Si dos procesos intentan modificar el mismo User simultáneamente:

1. Primer proceso: Lee User (version=5), modifica, guarda (version=6) ✅
2. Segundo proceso: Lee User (version=5), modifica, intenta guardar (version=5) ❌
3. Sistema lanza `ConcurrencyException`
4. Segundo proceso reintenta: Lee User (version=6), modifica, guarda (version=7) ✅

## Testing Strategy

### Unit Tests

**User Aggregate:**

- `user.spec.ts`: Testear register(), addRole(), removeRole(), hasRole(), verifyEmail(), activate(), deactivate()
- Verificar que se publiquen los eventos correctos
- Verificar que se incrementen las versiones
- Verificar que se lancen las excepciones apropiadas

**UserRole Enum:**

- `user-role.spec.ts`: Verificar que los valores sean correctos

**Value Objects:**

- `email.spec.ts`: Validación de formato
- `password.spec.ts`: Hashing, comparación

### Integration Tests

**Command Handlers:**

- `register.handler.spec.ts`: Crear user, verificar que se guarde, verificar JWT
- `add-user-role.handler.spec.ts`: Agregar rol, verificar evento
- `remove-user-role.handler.spec.ts`: Remover rol, verificar evento

**Query Handlers:**

- `get-user.handler.spec.ts`: Consultar user, verificar read model

**Repositories:**

- `user-write.repository.spec.ts`: Guardar user, verificar optimistic locking
- `user-read.repository.spec.ts`: Consultar users, verificar datos

### Property-Based Tests

**Property 1: User always has at least one role**

```typescript
test.prop([
  fc.array(fc.constantFrom(...Object.values(UserRole)), { minLength: 1 }),
])("User should always have at least one role", async (roles) => {
  const user = User.register(
    UUID.generate(),
    email,
    password,
    "Test",
    roles[0],
  );

  // Add remaining roles
  for (let i = 1; i < roles.length; i++) {
    if (!user.hasRole(roles[i])) {
      user.addRole(roles[i]);
    }
  }

  // Try to remove all roles except one
  const currentRoles = user.getRoles();
  for (let i = 0; i < currentRoles.length - 1; i++) {
    user.removeRole(currentRoles[i]);
  }

  // Should have exactly one role left
  expect(user.getRoles()).toHaveLength(1);

  // Trying to remove last role should throw
  expect(() => user.removeRole(user.getRoles()[0])).toThrow(
    CannotRemoveLastRoleException,
  );
});
```

**Property 2: Adding duplicate role is idempotent**

```typescript
test.prop([fc.constantFrom(...Object.values(UserRole))])(
  "Adding duplicate role should throw exception",
  async (role) => {
    const user = User.register(UUID.generate(), email, password, "Test", role);

    expect(() => user.addRole(role)).toThrow(UserAlreadyHasRoleException);
  },
);
```

**Property 3: JWT contains roles array**

```typescript
test.prop([
  fc.array(fc.constantFrom(...Object.values(UserRole)), {
    minLength: 1,
    maxLength: 3,
  }),
])("JWT should contain all user roles", async (roles) => {
  const user = User.register(
    UUID.generate(),
    email,
    password,
    "Test",
    roles[0],
  );

  // Add remaining roles
  for (let i = 1; i < roles.length; i++) {
    if (!user.hasRole(roles[i])) {
      user.addRole(roles[i]);
    }
  }

  // Generate JWT
  const payload = {
    sub: user.getId().getValue(),
    email: user.getEmail().getValue(),
    roles: user.getRoles(),
  };
  const token = jwtService.sign(payload);

  // Decode and verify
  const decoded = jwtService.verify(token);
  expect(decoded.roles).toEqual(expect.arrayContaining(roles));
});
```

## Integration with Other BCs

### Account BC Integration

**Event Handler:** `OnUserRegisteredHandler` en Account BC

```typescript
@EventsHandler(UserRegistered)
export class OnUserRegisteredHandler implements IEventHandler<UserRegistered> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: UserRegistered) {
    if (event.initialRole === UserRole.BUSINESS_OWNER) {
      // Crear BusinessOwner automáticamente
      await this.commandBus.execute(
        new CreateBusinessOwnerCommand(event.userId, SubscriptionPlan.free()),
      );
    }
  }
}
```

### Customer BC Integration

**Event Handler:** `OnCustomerLinkedToUserHandler` en Auth BC

```typescript
@EventsHandler(CustomerLinkedToUser)
export class OnCustomerLinkedToUserHandler implements IEventHandler<CustomerLinkedToUser> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: CustomerLinkedToUser) {
    // Agregar role CUSTOMER al User si no lo tiene
    await this.commandBus.execute(
      new AddUserRoleCommand(event.userId, UserRole.CUSTOMER),
    );
  }
}
```

### Business BC Integration

Business BC ya no depende de User.businessId. En su lugar:

- Business.ownerId → User.id (referencia directa)
- Queries usan JOIN con users para obtener información del owner

## Security Considerations

### JWT Token Structure

**Antes (❌ Incorrecto):**

```json
{
  "sub": "user-uuid",
  "email": "juan@example.com",
  "businessId": "business-uuid"
}
```

**Después (✅ Correcto):**

```json
{
  "sub": "user-uuid",
  "email": "juan@example.com",
  "roles": ["BUSINESS_OWNER", "CUSTOMER"]
}
```

### Authorization Guards

Los guards de NestJS deben verificar roles en lugar de businessId:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      "roles",
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Uso:**

```typescript
@Controller("businesses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
  @Post()
  @Roles(UserRole.BUSINESS_OWNER)
  async create(@Body() dto: CreateBusinessDto) {
    // Solo users con role BUSINESS_OWNER pueden acceder
  }
}
```

## Performance Considerations

### Database Indexes

```sql
-- Índice para búsquedas por email (ya existe)
CREATE INDEX idx_users_email ON users(email);

-- Índice GIN para búsquedas eficientes en array de roles
CREATE INDEX idx_users_roles ON users USING GIN(roles);
```

### Query Optimization

**Buscar users por rol:**

```sql
SELECT * FROM users WHERE 'BUSINESS_OWNER' = ANY(roles);
```

**Buscar users con múltiples roles:**

```sql
SELECT * FROM users WHERE roles @> ARRAY['BUSINESS_OWNER', 'CUSTOMER'];
```

## Deployment Strategy

### Rollout Plan

1. **Fase 1: Migración de Base de Datos**
   - Ejecutar migración en ambiente de desarrollo
   - Verificar que todos los users existentes tengan role=['BUSINESS_OWNER']
   - Ejecutar migración en staging
   - Ejecutar migración en producción

2. **Fase 2: Deploy de Código**
   - Deploy de Auth BC refactorizado
   - Deploy de Account BC con event handler
   - Deploy de Customer BC con event handler

3. **Fase 3: Verificación**
   - Verificar que login funcione correctamente
   - Verificar que JWT incluya roles
   - Verificar que BusinessOwner se cree automáticamente al registrar

### Rollback Plan

Si algo falla:

1. Revertir deploy de código
2. Ejecutar migración down para restaurar schema anterior
3. Restaurar backup de base de datos si es necesario

## Future Enhancements

### Marketplace Scenario

Cuando se implemente el marketplace, el flujo será:

```
1. Juan (abogado) se registra:
   RegisterUserCommand(email, password, name, role=BUSINESS_OWNER)
   → User creado con roles=['BUSINESS_OWNER']
   → BusinessOwner creado automáticamente

2. Juan agenda cita con dentista:
   IdentifyCustomerCommand(businessId=dentista, userId=Juan.id)
   → Customer creado con userId=Juan.id
   → CustomerLinkedToUser event publicado
   → AddUserRoleCommand(userId=Juan.id, role=CUSTOMER)
   → User.roles actualizado a ['BUSINESS_OWNER', 'CUSTOMER']

3. Juan ahora puede:
   - Administrar su bufete (role BUSINESS_OWNER)
   - Ver sus citas como cliente (role CUSTOMER)
   - Panel web con switch de contexto
```

### Role-Based UI

El frontend podrá mostrar vistas diferentes según los roles:

```typescript
// Frontend
const user = useAuthStore((state) => state.user);

if (user.roles.includes("BUSINESS_OWNER")) {
  // Mostrar vista "Mi Negocio"
}

if (user.roles.includes("CUSTOMER")) {
  // Mostrar vista "Mis Citas"
}
```

## References

- `.kiro/steering/user-customer-businessowner-architecture.md` - Arquitectura completa
- `.kiro/steering/PRD.md` - Product Requirements Document
- `.kiro/specs/account-business-owner-bc/` - Account BC spec
- `.kiro/specs/customer-bc/` - Customer BC spec
- `.kiro/specs/factory-pattern-cqrs/` - Factory pattern reference
