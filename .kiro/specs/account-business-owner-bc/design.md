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

### Overview

Comprehensive test suite with >80% coverage target, covering all layers and edge cases.

**Test Structure:**

```
src/account/
├── domain/
│   ├── aggregates/__tests__/
│   │   ├── business-owner.spec.ts (Unit)
│   │   └── business-owner.pbt.spec.ts (Property-Based)
│   └── vo/__tests__/
│       ├── subscription-plan.spec.ts (Unit)
│       └── subscription-status.spec.ts (Unit)
├── app/
│   ├── commands/*/__tests__/handler.integration.spec.ts
│   ├── queries/*/__tests__/handler.integration.spec.ts
│   └── event_handlers/__tests__/on-user-registered.handler.integration.spec.ts
├── infra/
│   └── persistence/
│       ├── repositories/__tests__/
│       │   ├── business-owner-write.repository.integration.spec.ts
│       │   └── business-owner-read.repository.integration.spec.ts
│       └── factories/__tests__/
│           └── business-owner.factory.integration.spec.ts
└── presentation/
    └── controllers/__tests__/
        └── business-owner.e2e.spec.ts
```

### Test Categories

#### 1. Unit Tests (24 tests)

**Value Objects (17 tests):**

- SubscriptionPlan: Factory methods, limits validation, canUpgradeTo(), equals()
- SubscriptionStatus: Factory methods, query methods, equals()

**Aggregates (15 tests):**

- BusinessOwner.create(): Initial state, event generation, version, validation
- BusinessOwner.completeOnboarding(): State change, events, idempotency
- BusinessOwner.upgradeSubscription(): Valid upgrades, exceptions, events
- BusinessOwner.suspendSubscription(): State change, events
- BusinessOwner.restoreSubscription(): State change, idempotency
- BusinessOwner.fromPersistence(): Reconstruction, version preservation

**Example:**

```typescript
describe("BusinessOwner", () => {
  describe("upgradeSubscription", () => {
    it("should upgrade from FREE to BASIC successfully", () => {
      const owner = createTestBusinessOwner(SubscriptionPlan.free());
      const newPlan = SubscriptionPlan.basic();

      owner.upgradeSubscription(newPlan);

      expect(owner.getSubscriptionPlan()).toEqual(newPlan);
    });

    it("should throw CannotDowngradeSubscriptionException when downgrading", () => {
      const owner = createTestBusinessOwner(SubscriptionPlan.pro());
      const lowerPlan = SubscriptionPlan.basic();

      expect(() => owner.upgradeSubscription(lowerPlan)).toThrow(
        CannotDowngradeSubscriptionException,
      );
    });
  });
});
```

#### 2. Property-Based Tests (4 tests)

Using `@fast-check/vitest` with 100+ iterations per property:

**Property 1: Subscription upgrade is monotonic**

```typescript
test.prop([
  fc.constantFrom("FREE", "BASIC", "PRO", "ENTERPRISE"),
  fc.constantFrom("FREE", "BASIC", "PRO", "ENTERPRISE"),
])("subscription upgrade is monotonic", (currentPlanName, targetPlanName) => {
  const tiers = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  const currentIndex = tiers.indexOf(currentPlanName);
  const targetIndex = tiers.indexOf(targetPlanName);

  if (targetIndex > currentIndex) {
    expect(() => owner.upgradeSubscription(targetPlan)).not.toThrow();
  } else {
    expect(() => owner.upgradeSubscription(targetPlan)).toThrow();
  }
});
```

**Property 2: Version increments on state changes**

- Generate random operation sequences
- Verify version increments by exactly 1 after each operation

**Property 3: BusinessOwner-User relationship is 1:1**

- Attempt to create multiple BusinessOwners with same userId
- Verify database constraint prevents duplicates

**Property 4: Subscription plan determines limits**

- Generate random subscription plans
- Verify limits match expected values

#### 3. Integration Tests (13 tests)

**Command Handlers (5 tests):**

- CreateBusinessOwnerHandler: Persistence, FK constraints, unique constraints, events
- CompleteOnboardingHandler: Factory loading, state persistence, events
- UpgradeSubscriptionHandler: Upgrade validation, persistence, exceptions
- SuspendSubscriptionHandler: Suspension logic, persistence
- RestoreSubscriptionHandler: Restoration logic, idempotency

**Query Handlers (2 tests):**

- GetBusinessOwnerHandler: Read model retrieval, null handling
- GetBusinessOwnerByUserIdHandler: User-based lookup

**Event Handlers (1 test):**

- OnUserRegisteredHandler: Role filtering, command dispatching, error handling

**Repositories (3 tests):**

- BusinessOwnerWriteRepository: Optimistic locking, version conflicts, concurrent saves
- BusinessOwnerReadRepository: Query optimization, read model mapping
- BusinessOwnerFactory: Aggregate loading, version preservation

**Concurrency (2 tests):**

- Concurrent subscription upgrades: Race condition handling
- Concurrent BusinessOwner creation: Unique constraint enforcement

**Example:**

```typescript
describe("BusinessOwnerWriteRepository (Integration)", () => {
  it("should throw ConcurrencyException when version mismatch", async () => {
    const owner = BusinessOwner.create(
      UUID.generate(),
      UUID.generate(),
      SubscriptionPlan.free(),
    );
    await writeRepository.save(owner);

    const owner1 = await factory.loadById(owner.getId().getValue());
    const owner2 = await factory.loadById(owner.getId().getValue());

    owner1.completeOnboarding();
    await writeRepository.save(owner1); // Version 2

    owner2.completeOnboarding();
    await expect(writeRepository.save(owner2)).rejects.toThrow(
      ConcurrencyException,
    );
  });
});
```

#### 4. E2E Tests (5 tests)

Complete user flows through HTTP API:

1. **Complete Registration Flow:** POST /api/auth/register → verify BusinessOwner created
2. **Onboarding Flow:** Complete onboarding → verify Business creation allowed
3. **Subscription Upgrade Flow:** Upgrade plan → verify limits updated
4. **Business Creation Limits:** Test maxBusinesses enforcement
5. **Subscription Suspension Flow:** Suspend → verify Appointment creation blocked

**Example:**

```typescript
describe("BusinessOwner E2E", () => {
  it("should create User and BusinessOwner automatically", async () => {
    const registerResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "Password123!",
        role: "BUSINESS_OWNER",
      })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for event

    const businessOwnerResponse = await request(app.getHttpServer())
      .get("/api/account/business-owner")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .expect(200);

    expect(businessOwnerResponse.body).toMatchObject({
      subscriptionPlan: "FREE",
      onboardingCompleted: false,
    });
  });
});
```

#### 5. Edge Case Tests (5 tests)

Explicit edge case validation:

1. User with multiple roles → no duplicate BusinessOwners
2. Concurrent BusinessOwner creation → unique constraint enforcement
3. Upgrade to same plan → AlreadyOnThisPlanException
4. Downgrade attempt → CannotDowngradeSubscriptionException
5. Suspended subscription restoration → idempotency validation

### Coverage Targets

| Layer                      | Target   | Rationale                     |
| -------------------------- | -------- | ----------------------------- |
| Domain (Aggregates)        | >90%     | Critical business logic       |
| Domain (Value Objects)     | >90%     | Validation and equality logic |
| Application (Handlers)     | >85%     | Orchestration and integration |
| Infrastructure (Repos)     | >80%     | Persistence and mapping       |
| Presentation (Controllers) | >75%     | HTTP layer (less critical)    |
| **Overall**                | **>80%** | Industry standard             |

### Test Commands

```bash
# Run all tests
pnpm --filter backend test

# Run with coverage
pnpm --filter backend test:cov

# Run specific category
pnpm --filter backend test -- --testPathPattern="spec.ts$"        # Unit
pnpm --filter backend test -- --testPathPattern="integration"     # Integration
pnpm --filter backend test -- --testPathPattern="pbt"             # Property
pnpm --filter backend test:e2e                                    # E2E

# Watch mode
pnpm --filter backend test:watch
```

### Test Helpers

```typescript
// Test helper functions
function createTestBusinessOwner(
  plan = SubscriptionPlan.free(),
): BusinessOwner {
  return BusinessOwner.create(UUID.generate(), UUID.generate(), plan);
}

async function registerBusinessOwner() {
  const response = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({
      email: `test-${Date.now()}@example.com`,
      password: "Password123!",
      role: "BUSINESS_OWNER",
    });

  await new Promise((resolve) => setTimeout(resolve, 100));
  return { userId: response.body.userId, token: response.body.token };
}
```

### Best Practices

✅ **Do:**

- Colocar tests en `__tests__` folders
- Usar imports relativos: `import { Component } from '../Component'`
- Testear comportamiento, no implementación
- Usar React Testing Library queries semánticas
- Limpiar después de cada test
- Usar `waitFor` para operaciones asíncronas
- Nombres descriptivos

❌ **Avoid:**

- Testear detalles de implementación
- Tests que dependen de otros
- Snapshots para todo
- Mockear todo

### CI/CD Integration

```yaml
- name: Run tests
  run: pnpm --filter backend test:cov

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./apps/backend/coverage/lcov.info

- name: Fail if coverage < 80%
  run: pnpm --filter backend test:cov -- --coverageThreshold='{"global":{"lines":80}}'
```
