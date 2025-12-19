# Design Document - Business BC

## Overview

Business BC gestiona la información y configuración de cada negocio específico. Un User puede tener múltiples Business según los límites de su plan de suscripción (definido en BusinessOwner).

**Separación de Concerns:**

- **User (Auth BC)**: Identidad y autenticación
- **BusinessOwner (Account BC)**: Perfil de cuenta y suscripción (límites)
- **Business (Business BC)**: Información de cada negocio específico

**Relación Clave:**

- `Business.ownerId → User.id` (NO BusinessOwner.id)
- Un User puede tener N Business (según BusinessOwner.maxBusinesses)

## Architecture

Sigue Clean Architecture + DDD + CQRS estricto + Factory Pattern:

```
src/business/
├── domain/
│   ├── aggregates/
│   │   └── business.ts
│   ├── vo/
│   │   ├── whatsapp-number.ts
│   │   ├── timezone.ts
│   │   └── business-address.ts
│   ├── events/
│   │   ├── business-created.ts
│   │   ├── business-whatsapp-configured.ts
│   │   ├── business-info-updated.ts
│   │   ├── business-deactivated.ts
│   │   └── business-activated.ts
│   ├── exceptions/
│   │   ├── whatsapp-number-already-exists.ts
│   │   ├── invalid-timezone.ts
│   │   ├── invalid-business-name.ts
│   │   ├── onboarding-not-completed.ts
│   │   └── max-businesses-exceeded.ts
│   ├── interfaces/
│   │   ├── factories/
│   │   │   └── business-factory.ts
│   │   └── repositories/
│   │       ├── business-write.ts
│   │       └── business-read.ts
│   └── read_models/
│       └── business.read-model.ts
├── app/
│   ├── commands/
│   │   ├── create-business/
│   │   ├── update-business-info/
│   │   ├── configure-whatsapp/
│   │   ├── deactivate-business/
│   │   └── activate-business/
│   └── queries/
│       ├── get-business/
│       ├── get-businesses-by-owner-id/
│       └── get-business-by-whatsapp-number/
├── infra/
│   ├── persistence/
│   │   ├── models/
│   │   │   └── business.model.ts
│   │   ├── mappers/
│   │   │   ├── business-write.mapper.ts
│   │   │   └── business-read.mapper.ts
│   │   ├── factories/
│   │   │   └── business.factory.ts
│   │   └── repositories/
│   │       ├── business-write.repository.ts
│   │       └── business-read.repository.ts
│   └── migrations/
│       └── create-businesses-table.ts
└── business.module.ts
```

## Domain Layer

### Business Aggregate

```typescript
export class Business extends VersionedAggregateRoot {
  private id: UUID;
  private ownerId: UUID; // ← Referencia a User.id (NO BusinessOwner.id)
  private name: string;
  private whatsappNumber: WhatsAppNumber;
  private address: BusinessAddress;
  private timezone: Timezone;
  private isActive: boolean;
  private createdAt: Date;

  static create(
    id: UUID,
    ownerId: UUID, // ← User.id del dueño
    name: string,
    whatsappNumber: WhatsAppNumber,
    address: BusinessAddress,
    timezone: Timezone,
  ): Business {
    if (name.length < 3 || name.length > 100) {
      throw new InvalidBusinessNameException(name);
    }

    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name;
    business.whatsappNumber = whatsappNumber;
    business.address = address;
    business.timezone = timezone;
    business.isActive = true;
    business.createdAt = new Date();

    business.apply(
      new BusinessCreated(id, ownerId, name, whatsappNumber.getValue()),
    );
    business.incrementVersion();

    return business;
  }

  updateInfo(name: string, address: BusinessAddress, timezone: Timezone): void {
    if (name.length < 3 || name.length > 100) {
      throw new InvalidBusinessNameException(name);
    }

    this.name = name;
    this.address = address;
    this.timezone = timezone;
    this.incrementVersion();
    this.apply(new BusinessInfoUpdated(this.id, name));
  }

  configureWhatsApp(whatsappNumber: WhatsAppNumber): void {
    this.whatsappNumber = whatsappNumber;
    this.incrementVersion();
    this.apply(
      new BusinessWhatsAppConfigured(this.id, whatsappNumber.getValue()),
    );
  }

  deactivate(): void {
    if (!this.isActive) {
      return; // Idempotent
    }

    this.isActive = false;
    this.incrementVersion();
    this.apply(new BusinessDeactivated(this.id));
  }

  activate(): void {
    if (this.isActive) {
      return; // Idempotent
    }

    this.isActive = true;
    this.incrementVersion();
    this.apply(new BusinessActivated(this.id));
  }

  static fromPersistence(
    id: UUID,
    ownerId: UUID,
    name: string,
    whatsappNumber: WhatsAppNumber,
    address: BusinessAddress,
    timezone: Timezone,
    isActive: boolean,
    createdAt: Date,
    version: number,
  ): Business {
    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name;
    business.whatsappNumber = whatsappNumber;
    business.address = address;
    business.timezone = timezone;
    business.isActive = isActive;
    business.createdAt = createdAt;
    business.setVersion(version);
    return business;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }
  getOwnerId(): UUID {
    return this.ownerId;
  }
  getName(): string {
    return this.name;
  }
  getWhatsAppNumber(): WhatsAppNumber {
    return this.whatsappNumber;
  }
  getAddress(): BusinessAddress {
    return this.address;
  }
  getTimezone(): Timezone {
    return this.timezone;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
}
```

### Value Objects

**WhatsAppNumber:**

```typescript
export class WhatsAppNumber extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  static create(value: string): WhatsAppNumber {
    // Normalizar a formato E.164
    const normalized = this.normalizeToE164(value);

    if (!this.isValidE164(normalized)) {
      throw new InvalidWhatsAppNumberException(value);
    }

    return new WhatsAppNumber(normalized);
  }

  private static normalizeToE164(value: string): string {
    // Remover espacios, guiones, paréntesis
    let cleaned = value.replace(/[\s\-\(\)]/g, "");

    // Si no empieza con +, agregar
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  }

  private static isValidE164(value: string): boolean {
    // E.164: + seguido de 1-15 dígitos
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

**Timezone:**

```typescript
export class Timezone extends ValueObject {
  private static readonly VALID_TIMEZONES = Intl.supportedValuesOf("timeZone");

  private constructor(private readonly value: string) {
    super();
  }

  static create(value: string): Timezone {
    if (!this.VALID_TIMEZONES.includes(value)) {
      throw new InvalidTimezoneException(value);
    }

    return new Timezone(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

**BusinessAddress:**

```typescript
export class BusinessAddress extends ValueObject {
  private constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly state: string | null,
    private readonly country: string | null,
    private readonly postalCode: string | null,
  ) {
    super();
  }

  static create(
    street: string,
    city: string,
    state?: string,
    country?: string,
    postalCode?: string,
  ): BusinessAddress {
    if (!street || street.trim().length === 0) {
      throw new InvalidBusinessAddressException("Street is required");
    }

    if (!city || city.trim().length === 0) {
      throw new InvalidBusinessAddressException("City is required");
    }

    return new BusinessAddress(
      street.trim(),
      city.trim(),
      state?.trim() || null,
      country?.trim() || null,
      postalCode?.trim() || null,
    );
  }

  toObject(): {
    street: string;
    city: string;
    state: string | null;
    country: string | null;
    postalCode: string | null;
  } {
    return {
      street: this.street,
      city: this.city,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,
    };
  }

  protected getEqualityComponents(): any[] {
    return [this.street, this.city, this.state, this.country, this.postalCode];
  }
}
```

## Application Layer

### Commands

**CreateBusinessCommand:**

```typescript
export class CreateBusinessCommand extends Command<{ businessId: string }> {
  constructor(
    public readonly ownerId: string, // ← User.id
    public readonly name: string,
    public readonly whatsappNumber: string,
    public readonly address: {
      street: string;
      city: string;
      state?: string;
      country?: string;
      postalCode?: string;
    },
    public readonly timezone: string,
  ) {
    super();
  }
}
```

**CreateBusinessHandler:**

```typescript
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler implements ICommandHandler<CreateBusinessCommand> {
  constructor(
    @Inject("IBusinessWriteRepository")
    private readonly writeRepo: IBusinessWriteRepository,
    @Inject("IBusinessReadRepository")
    private readonly readRepo: IBusinessReadRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: CreateBusinessCommand,
  ): Promise<{ businessId: string }> {
    // 1. Validar que el BusinessOwner existe y completó onboarding
    const businessOwner = await this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(command.ownerId),
    );

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.ownerId);
    }

    if (!businessOwner.onboardingCompleted) {
      throw new OnboardingNotCompletedException(command.ownerId);
    }

    // 2. Contar businesses existentes del owner
    const existingBusinesses = await this.readRepo.findByOwnerId(
      command.ownerId,
    );

    if (existingBusinesses.length >= businessOwner.maxBusinesses) {
      throw new MaxBusinessesExceededException(
        command.ownerId,
        businessOwner.maxBusinesses,
      );
    }

    // 3. Validar unicidad de WhatsApp number
    const existingByWhatsApp = await this.readRepo.findByWhatsAppNumber(
      command.whatsappNumber,
    );

    if (existingByWhatsApp) {
      throw new WhatsAppNumberAlreadyExistsException(command.whatsappNumber);
    }

    // 4. Crear Business
    const business = Business.create(
      UUID.generate(),
      UUID.fromString(command.ownerId),
      command.name,
      WhatsAppNumber.create(command.whatsappNumber),
      BusinessAddress.create(
        command.address.street,
        command.address.city,
        command.address.state,
        command.address.country,
        command.address.postalCode,
      ),
      Timezone.create(command.timezone),
    );

    // 5. Persistir
    await this.writeRepo.save(business);

    return { businessId: business.getId().getValue() };
  }
}
```

### Queries

- `GetBusinessQuery extends Query<BusinessReadModel>`
- `GetBusinessesByOwnerIdQuery extends Query<BusinessReadModel[]>`
- `GetBusinessByWhatsAppNumberQuery extends Query<BusinessReadModel | null>`

## Infrastructure Layer

### Factory Pattern (CQRS Strict)

```typescript
export interface IBusinessFactory {
  loadById(id: string): Promise<Business | null>;
}
```

### Repositories

**Write Repository:**

```typescript
export interface IBusinessWriteRepository {
  save(business: Business): Promise<void>;
  // NO findById - usar Factory
}
```

**Read Repository:**

```typescript
export interface IBusinessReadRepository {
  findById(id: string): Promise<BusinessReadModel | null>;
  findByOwnerId(ownerId: string): Promise<BusinessReadModel[]>;
  findByWhatsAppNumber(
    whatsappNumber: string,
  ): Promise<BusinessReadModel | null>;
}
```

## Database Schema

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100),
  address_country VARCHAR(100),
  address_postal_code VARCHAR(20),
  timezone VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_businesses_whatsapp_number ON businesses(whatsapp_number);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
```

**Nota:** La FK es `owner_id → users(id)`, NO `business_owners(id)`.

## Integration Points

### With Account BC

- **Query:** `GetBusinessOwnerByUserIdQuery` para validar límites antes de crear Business
- **Validation:** Verifica `onboardingCompleted` y `maxBusinesses`

### With Other BCs

- **Offering BC:** Valida que `businessId` exista antes de crear Offering
- **Availability BC:** Valida que `businessId` exista antes de crear Schedule
- **Booking BC:** Valida que `businessId` exista y `isActive=true` antes de crear Appointment
- **Conversation BC:** Identifica Business por `whatsappNumber` al recibir mensajes

## Correctness Properties

### Property 1: WhatsAppNumber global uniqueness

_For any_ two Business entities, they should never have the same whatsappNumber.

### Property 2: Business count respects subscription limits

_For any_ User with N businesses, N should always be ≤ BusinessOwner.maxBusinesses.

### Property 3: Onboarding must be completed before creating Business

_For any_ User, attempting to create a Business when BusinessOwner.onboardingCompleted=false should fail.

### Property 4: Business ownerId references User.id

_For any_ Business, the ownerId should always reference an existing User.id (NOT BusinessOwner.id).

### Property 5: Inactive business prevents appointments

_For any_ Business with isActive=false, attempting to create an Appointment should fail.

## Testing Strategy

- **Unit Tests:** Aggregates, Value Objects (WhatsAppNumber, Timezone, BusinessAddress)
- **Integration Tests:** Command/Query Handlers, Repositories
- **Property Tests:** WhatsApp uniqueness, business count limits
- **E2E Tests:** Complete flow (User → BusinessOwner → Business)
