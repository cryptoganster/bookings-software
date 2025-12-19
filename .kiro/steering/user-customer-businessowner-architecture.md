# User, Customer y BusinessOwner - Arquitectura Unificada

Arquitectura unificada para gestión de identidades y roles, preparada para evolución hacia **marketplace de servicios**.

## Visión General

Tres conceptos de identidad con propósitos distintos:

1. **User (Auth BC)** - Identidad universal con autenticación y roles múltiples
2. **Customer (Customer BC)** - Perfil de cliente (anónimo o vinculado a User)
3. **BusinessOwner (Account BC)** - Perfil de dueño de negocio (siempre vinculado a User)

### 🔑 Decisión Clave

**User es la identidad universal con múltiples roles simultáneos:**

- Un User puede ser BUSINESS_OWNER Y CUSTOMER
- Permite marketplace: Juan (abogado) publica servicios Y agenda cita con dentista
- Customer y BusinessOwner son **perfiles contextuales**, no identidades separadas

```
User (Auth BC) → Autenticación + Roles
    ↓                           ↓
BusinessOwner (Account)    Customer (Customer)
    ↓                           ↓
Business (Business)        Appointment (Booking)
```

## 1. User (Auth BC)

**Propósito:** Identidad universal con autenticación  
**Alcance:** Global | **Tabla:** `users` | **Roles:** Múltiples simultáneos

### Aggregate

```typescript
export class User extends VersionedAggregateRoot {
  private id: UUID;
  private email: Email;
  private password: Password;
  private name: string;
  private roles: UserRole[]; // ['BUSINESS_OWNER', 'CUSTOMER', 'ADMIN']
  private isActive: boolean;
  private emailVerified: boolean;

  // Factory method
  static register(
    id: UUID,
    email: Email,
    password: Password,
    name: string,
    initialRole: UserRole,
  ): User {
    const user = new User();
    user.id = id;
    user.email = email;
    user.password = password;
    user.name = name;
    user.roles = [initialRole];
    user.isActive = true;
    user.emailVerified = false;

    user.apply(new UserRegistered(id, email, name, initialRole));
    user.incrementVersion();

    return user;
  }

  // Business logic
  addRole(role: UserRole): void {
    if (this.hasRole(role)) {
      throw new UserAlreadyHasRoleException(this.id, role);
    }

    this.roles.push(role);
    this.incrementVersion();
    this.apply(new UserRoleAdded(this.id, role));
  }

  removeRole(role: UserRole): void {
    if (!this.hasRole(role)) {
      throw new UserDoesNotHaveRoleException(this.id, role);
    }

    if (this.roles.length === 1) {
      throw new CannotRemoveLastRoleException(this.id);
    }

    this.roles = this.roles.filter((r) => r !== role);
    this.incrementVersion();
    this.apply(new UserRoleRemoved(this.id, role));
  }

  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  verifyEmail(): void {
    if (this.emailVerified) {
      throw new EmailAlreadyVerifiedException(this.id);
    }

    this.emailVerified = true;
    this.incrementVersion();
    this.apply(new UserEmailVerified(this.id));
  }
}
```

### Value Objects

```typescript
export enum UserRole {
  BUSINESS_OWNER = "BUSINESS_OWNER",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

export class Email extends ValueObject {
  constructor(private readonly value: string) {
    super();
    if (!this.isValid(value)) {
      throw new InvalidEmailException(value);
    }
  }

  private isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}

export class Password extends ValueObject {
  constructor(private readonly hashedValue: string) {
    super();
  }

  static async fromPlainText(plainText: string): Promise<Password> {
    if (plainText.length < 8) {
      throw new PasswordTooShortException();
    }

    const hashed = await bcrypt.hash(plainText, 10);
    return new Password(hashed);
  }

  async matches(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hashedValue);
  }

  getHashedValue(): string {
    return this.hashedValue;
  }

  protected getEqualityComponents(): any[] {
    return [this.hashedValue];
  }
}
```

### Domain Events

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

export class UserRoleAdded {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class UserRoleRemoved {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class UserEmailVerified {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**Commands:** `RegisterUser`, `Login`, `VerifyEmail`, `AddUserRole`, `RemoveUserRole`, `ChangePassword`

---

## 2. Customer (Customer BC)

**Propósito:** Perfil de cliente (anónimo o registrado)  
**Alcance:** Por business (multi-tenant) | **Tabla:** `customers` | **Vinculación:** Opcional a User

### Tipos de Customer

| Tipo           | userId | WhatsApp | Panel Web | Email | Historial |
| -------------- | ------ | -------- | --------- | ----- | --------- |
| **Anónimo**    | null   | ✅       | ❌        | ❌    | ❌        |
| **Registrado** | UUID   | ✅       | ✅        | ✅    | ✅        |

### Aggregate

```typescript
export class Customer {
  private id: UUID;
  private userId: UUID | null; // ← Opcional: vinculado a User si está registrado
  private businessId: UUID;
  private whatsappPhone: WhatsAppPhone;
  private name: string | null;
  private createdAt: Date;

  // Factory method para Customer anónimo
  static createAnonymous(
    id: UUID,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null = null,
  ): Customer {
    const customer = new Customer();
    customer.id = id;
    customer.userId = null; // ← Anónimo
    customer.businessId = businessId;
    customer.whatsappPhone = whatsappPhone;
    customer.name = name;
    customer.createdAt = new Date();

    return customer;
  }

  // Business logic: vincular Customer anónimo a User
  linkToUser(userId: UUID): void {
    if (this.userId !== null) {
      throw new CustomerAlreadyLinkedToUserException(this.id);
    }

    this.userId = userId;
    // Evento para que Auth BC agregue role CUSTOMER al User
  }

  // Business logic: desvincular Customer de User
  unlinkFromUser(): void {
    if (this.userId === null) {
      throw new CustomerNotLinkedToUserException(this.id);
    }

    this.userId = null;
  }

  isAnonymous(): boolean {
    return this.userId === null;
  }

  isRegistered(): boolean {
    return this.userId !== null;
  }
}
```

**Commands:** `IdentifyCustomer`, `LinkCustomerToUser`, `UnlinkCustomerFromUser`, `UpdateCustomerInfo`

**Flujo Anónimo → Registrado:** WhatsApp → Identificar → [Futuro] Registrar User → Vincular → Panel Web

---

## 3. BusinessOwner (Account BC)

**Propósito:** Perfil de dueño de negocio  
**Alcance:** Global | **Tabla:** `business_owners` | **Vinculación:** Obligatoria a User

### Aggregate

```typescript
export class BusinessOwner extends VersionedAggregateRoot {
  private id: UUID;
  private userId: UUID; // ← Siempre vinculado a User
  private subscriptionPlan: SubscriptionPlan;
  private subscriptionStatus: SubscriptionStatus;
  private onboardingCompleted: boolean;
  private createdAt: Date;

  // Factory method
  static create(
    id: UUID,
    userId: UUID,
    subscriptionPlan: SubscriptionPlan,
  ): BusinessOwner {
    const owner = new BusinessOwner();
    owner.id = id;
    owner.userId = userId;
    owner.subscriptionPlan = subscriptionPlan;
    owner.subscriptionStatus = SubscriptionStatus.active();
    owner.onboardingCompleted = false;
    owner.createdAt = new Date();

    owner.apply(new BusinessOwnerCreated(id, userId, subscriptionPlan));
    owner.incrementVersion();

    return owner;
  }

  // Business logic
  completeOnboarding(): void {
    if (this.onboardingCompleted) {
      throw new OnboardingAlreadyCompletedException(this.id);
    }

    this.onboardingCompleted = true;
    this.incrementVersion();
    this.apply(new BusinessOwnerOnboardingCompleted(this.id));
  }

  upgradeSubscription(newPlan: SubscriptionPlan): void {
    if (this.subscriptionPlan.equals(newPlan)) {
      throw new AlreadyOnThisPlanException(this.id);
    }

    this.subscriptionPlan = newPlan;
    this.incrementVersion();
    this.apply(new BusinessOwnerSubscriptionUpgraded(this.id, newPlan));
  }

  suspendSubscription(): void {
    if (this.subscriptionStatus.isSuspended()) {
      throw new SubscriptionAlreadySuspendedException(this.id);
    }

    this.subscriptionStatus = SubscriptionStatus.suspended();
    this.incrementVersion();
    this.apply(new BusinessOwnerSubscriptionSuspended(this.id));
  }
}
```

### Value Objects

```typescript
export class SubscriptionPlan extends ValueObject {
  private constructor(
    private readonly name: string,
    private readonly maxBusinesses: number,
    private readonly maxAppointmentsPerMonth: number,
    private readonly price: number,
  ) {
    super();
  }

  static free(): SubscriptionPlan {
    return new SubscriptionPlan("FREE", 1, 100, 0);
  }

  static basic(): SubscriptionPlan {
    return new SubscriptionPlan("BASIC", 1, 500, 29);
  }

  static pro(): SubscriptionPlan {
    return new SubscriptionPlan("PRO", 3, 2000, 79);
  }

  static enterprise(): SubscriptionPlan {
    return new SubscriptionPlan("ENTERPRISE", 10, 10000, 199);
  }

  protected getEqualityComponents(): any[] {
    return [this.name];
  }
}

export class SubscriptionStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  static active(): SubscriptionStatus {
    return new SubscriptionStatus("ACTIVE");
  }

  static suspended(): SubscriptionStatus {
    return new SubscriptionStatus("SUSPENDED");
  }

  static cancelled(): SubscriptionStatus {
    return new SubscriptionStatus("CANCELLED");
  }

  isActive(): boolean {
    return this.value === "ACTIVE";
  }

  isSuspended(): boolean {
    return this.value === "SUSPENDED";
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

**Commands:** `CreateBusinessOwner`, `CompleteOnboarding`, `UpgradeSubscription`, `SuspendSubscription`

**Flujo Registro:** User → Event Handler → BusinessOwner (FREE) → Onboarding → Create Business

---

## 4. Business (Business BC)

**Propósito:** Información del negocio  
**Alcance:** Múltiples por User | **Tabla:** `businesses` | **Vinculación:** Obligatoria a User (ownerId)

### Aggregate

```typescript
export class Business extends VersionedAggregateRoot {
  private id: UUID;
  private ownerId: UUID; // ← Referencia a User.id
  private name: string;
  private whatsappNumber: WhatsAppNumber;
  private address: BusinessAddress;
  private timezone: Timezone;
  private isActive: boolean;

  // Factory method
  static create(
    id: UUID,
    ownerId: UUID,
    name: string,
    whatsappNumber: WhatsAppNumber,
    address: BusinessAddress,
    timezone: Timezone,
  ): Business {
    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name;
    business.whatsappNumber = whatsappNumber;
    business.address = address;
    business.timezone = timezone;
    business.isActive = true;

    business.apply(new BusinessCreated(id, ownerId, name, whatsappNumber));
    business.incrementVersion();

    return business;
  }
}
```

---

## 5. Integración con Booking BC

**Appointment** referencia `customerId` (anónimo o registrado) sin conocer el tipo.

**Queries Panel Web:**

- `GetCustomerAppointments`: userId → Customers → Appointments
- `GetBusinessAppointments`: userId → Businesses → Appointments

---

## 6. Escenarios de Usuario

| Escenario               | Roles                            | Capacidades                                |
| ----------------------- | -------------------------------- | ------------------------------------------ |
| **Business Owner**      | `['BUSINESS_OWNER']`             | Administrar negocio, ver citas, configurar |
| **Customer Anónimo**    | N/A (sin User)                   | WhatsApp, notificaciones                   |
| **Customer Registrado** | `['CUSTOMER']`                   | WhatsApp + Panel web + Historial           |
| **Ambos Roles**         | `['BUSINESS_OWNER', 'CUSTOMER']` | Todo + Switch de contexto                  |

---

## 7. Comunicación entre BCs

**Eventos de Integración:**

- `UserRegistered` (BUSINESS_OWNER) → Account BC crea BusinessOwner
- `CustomerLinkedToUser` → Auth BC agrega role CUSTOMER

---

## 8. Tabla Comparativa

| Aspecto           | User                | Customer                      | BusinessOwner      |
| ----------------- | ------------------- | ----------------------------- | ------------------ |
| **BC**            | Auth                | Customer                      | Account            |
| **Propósito**     | Identidad universal | Perfil de cliente             | Perfil de dueño    |
| **Autenticación** | ✅ Email/password   | ❌ No (anónimo) o ✅ vía User | ✅ vía User        |
| **Roles**         | Múltiples           | N/A                           | N/A                |
| **Vinculación**   | Independiente       | Opcional a User               | Obligatoria a User |
| **Alcance**       | Global              | Por business                  | Global             |
| **Panel Web**     | ✅ Sí               | ❌ No (anónimo) o ✅ vía User | ✅ Sí              |
| **WhatsApp**      | ❌ No               | ✅ Sí                         | ❌ No              |
| **Tabla**         | `users`             | `customers`                   | `business_owners`  |

---

## 9. Evolución

**MVP:** User = Business Owner, Customer anónimo  
**Post-MVP:** Account BC + BusinessOwner, Customer con userId opcional  
**Marketplace:** User con ambos roles, búsqueda, valoraciones

**Beneficios:** Escalabilidad, flexibilidad, simplicidad, experiencia fluida

---

## 10. ¿Por Qué Separar User, BusinessOwner y Business?

### Separación de Concerns (DDD)

| Aggregate         | BC       | Responsabilidad                         | Ejemplo                                          |
| ----------------- | -------- | --------------------------------------- | ------------------------------------------------ |
| **User**          | Auth     | ¿Quién eres? Autenticación + Roles      | juan@example.com, ['BUSINESS_OWNER', 'CUSTOMER'] |
| **BusinessOwner** | Account  | ¿Qué plan tienes? Límites + Suscripción | PRO: max 3 businesses, 2000 appointments/month   |
| **Business**      | Business | ¿Cuál es tu negocio? Info + Config      | "Bufete López - Centro", +18095551111            |

### Beneficios

1. **Single Responsibility:** Cada BC una responsabilidad
2. **Escalabilidad:** User → 1 BusinessOwner → N Business (según plan)
3. **Independencia:** Cambios en suscripción no afectan autenticación
4. **Queries Optimizadas:** Cada BC su repositorio

**Conclusión:** NO son redundantes. User = identidad, BusinessOwner = cuenta, Business = negocio.

---

## 11. Reglas de Negocio

| Aggregate         | Reglas Clave                                                                     |
| ----------------- | -------------------------------------------------------------------------------- |
| **User**          | Email único, password ≥8 chars, múltiples roles, no eliminar último rol          |
| **Customer**      | WhatsApp único por business, vinculación opcional, múltiples por User            |
| **BusinessOwner** | Vinculado a User, plan determina límites, onboarding antes de Business           |
| **Business**      | WhatsApp único global, múltiples por User (según plan), inactivo no recibe citas |

---

## 12. Beneficios

✅ **Separación de Concerns:** Cada BC una responsabilidad  
✅ **Flexibilidad:** Anónimo → Registrado fluido, múltiples roles  
✅ **Escalabilidad:** Marketplace, múltiples negocios  
✅ **Sin Redundancia:** User única fuente de autenticación

---

## 13. Implementación

**Orden:** Auth BC → Customer BC → Account BC → Business BC → Booking BC

**Migraciones SQL:**

```sql
-- Customer: agregar user_id NULL
-- BusinessOwner: crear tabla con user_id UNIQUE
-- User: agregar roles array
```

**Testing:** Unit (aggregates), Integration (vinculación), E2E (flujos), Property (invariantes)

---

**Fin del documento**
