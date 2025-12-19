# Design Document - Account BC (BusinessOwner)

## Overview

Account BC gestiona los perfiles de cuenta de dueños de negocios (BusinessOwner), incluyendo planes de suscripción, límites, estado de onboarding y relación 1:1 con User (Auth BC).

**Separación de Concerns:**

- **User (Auth BC)**: Identidad y autenticación
- **BusinessOwner (Account BC)**: Perfil de cuenta y suscripción
- **Business (Business BC)**: Información de negocios específicos

## Architecture

Sigue Clean Architecture + DDD + CQRS estricto + Factory Pattern:

```
src/account/
├── domain/
│   ├── aggregates/
│   │   └── business-owner.ts
│   ├── vo/
│   │   ├── subscription-plan.ts
│   │   └── subscription-status.ts
│   ├── events/
│   │   ├── business-owner-created.ts
│   │   ├── business-owner-onboarding-completed.ts
│   │   └── business-owner-subscription-upgraded.ts
│   ├── exceptions/
│   │   ├── already-on-this-plan.ts
│   │   ├── cannot-downgrade-subscription.ts
│   │   └── onboarding-not-completed.ts
│   ├── interfaces/
│   │   ├── factories/
│   │   │   └── business-owner-factory.ts
│   │   └── repositories/
│   │       ├── business-owner-write.ts
│   │       └── business-owner-read.ts
│   └── read_models/
│       └── business-owner.read-model.ts
├── app/
│   ├── commands/
│   │   ├── create-business-owner/
│   │   ├── complete-onboarding/
│   │   ├── upgrade-subscription/
│   │   ├── suspend-subscription/
│   │   └── restore-subscription/
│   ├── queries/
│   │   ├── get-business-owner/
│   │   └── get-business-owner-by-user-id/
│   └── event_handlers/
│       └── on-user-registered.handler.ts
├── infra/
│   ├── persistence/
│   │   ├── models/
│   │   │   └── business-owner.model.ts
│   │   ├── mappers/
│   │   │   ├── business-owner-write.mapper.ts
│   │   │   └── business-owner-read.mapper.ts
│   │   ├── factories/
│   │   │   └── business-owner.factory.ts
│   │   └── repositories/
│   │       ├── business-owner-write.repository.ts
│   │       └── business-owner-read.repository.ts
│   └── migrations/
│       └── create-business-owners-table.ts
└── account.module.ts
```

## Domain Layer

### BusinessOwner Aggregate

```typescript
export class BusinessOwner extends VersionedAggregateRoot {
  private id: UUID;
  private userId: UUID; // ← 1:1 con User (Auth BC)
  private subscriptionPlan: SubscriptionPlan;
  private subscriptionStatus: SubscriptionStatus;
  private onboardingCompleted: boolean;
  private createdAt: Date;

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

    if (!this.subscriptionPlan.canUpgradeTo(newPlan)) {
      throw new CannotDowngradeSubscriptionException(this.id);
    }

    const oldPlan = this.subscriptionPlan;
    this.subscriptionPlan = newPlan;
    this.incrementVersion();
    this.apply(
      new BusinessOwnerSubscriptionUpgraded(this.id, oldPlan, newPlan),
    );
  }

  static fromPersistence(
    id: UUID,
    userId: UUID,
    subscriptionPlan: SubscriptionPlan,
    subscriptionStatus: SubscriptionStatus,
    onboardingCompleted: boolean,
    createdAt: Date,
    version: number,
  ): BusinessOwner {
    const owner = new BusinessOwner();
    owner.id = id;
    owner.userId = userId;
    owner.subscriptionPlan = subscriptionPlan;
    owner.subscriptionStatus = subscriptionStatus;
    owner.onboardingCompleted = onboardingCompleted;
    owner.createdAt = createdAt;
    owner.setVersion(version);
    return owner;
  }
}
```

### Value Objects

**SubscriptionPlan:**

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

  canUpgradeTo(other: SubscriptionPlan): boolean {
    const tiers = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
    return tiers.indexOf(other.name) > tiers.indexOf(this.name);
  }
}
```

## Application Layer

### Commands

- `CreateBusinessOwnerCommand extends Command<{ businessOwnerId: string }>`
- `CompleteOnboardingCommand extends Command<void>`
- `UpgradeSubscriptionCommand extends Command<void>`
- `SuspendSubscriptionCommand extends Command<void>`
- `RestoreSubscriptionCommand extends Command<void>`

### Queries

- `GetBusinessOwnerQuery extends Query<BusinessOwnerReadModel>`
- `GetBusinessOwnerByUserIdQuery extends Query<BusinessOwnerReadModel | null>`

### Event Handlers

**OnUserRegisteredHandler:**

```typescript
@EventsHandler(UserRegistered)
export class OnUserRegisteredHandler implements IEventHandler<UserRegistered> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: UserRegistered) {
    if (event.initialRole === UserRole.BUSINESS_OWNER) {
      await this.commandBus.execute(
        new CreateBusinessOwnerCommand(event.userId, SubscriptionPlan.free()),
      );
    }
  }
}
```

## Infrastructure Layer

### Factory Pattern (CQRS Strict)

```typescript
export interface IBusinessOwnerFactory {
  loadById(id: string): Promise<BusinessOwner | null>;
  loadByUserId(userId: string): Promise<BusinessOwner | null>;
}
```

### Repositories

**Write Repository:**

```typescript
export interface IBusinessOwnerWriteRepository {
  save(businessOwner: BusinessOwner): Promise<void>;
  // NO findById - usar Factory
}
```

**Read Repository:**

```typescript
export interface IBusinessOwnerReadRepository {
  findById(id: string): Promise<BusinessOwnerReadModel | null>;
  findByUserId(userId: string): Promise<BusinessOwnerReadModel | null>;
}
```

## Integration Points

### With Auth BC

- **Event:** `UserRegistered` → triggers `CreateBusinessOwnerCommand`
- **Relationship:** BusinessOwner.userId → User.id (1:1)

### With Business BC

- **Query:** Business BC queries `GetBusinessOwnerByUserIdQuery` before creating Business
- **Validation:** Checks `onboardingCompleted` and `maxBusinesses` limit

## Database Schema

```sql
CREATE TABLE business_owners (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription_plan VARCHAR(20) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_business_owners_user_id ON business_owners(user_id);
```

## Testing Strategy

- **Unit Tests:** Aggregates, Value Objects, Domain Services
- **Integration Tests:** Command/Query Handlers, Repositories, Event Handlers
- **Property Tests:** Subscription upgrade monotonicity, version increments
- **E2E Tests:** Complete registration flow (User → BusinessOwner → Business)
