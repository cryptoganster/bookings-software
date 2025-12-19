# Design Document - Factory Pattern for CQRS Strict Compliance

## Overview

Este diseño implementa el patrón Factory para la reconstrucción de aggregates desde persistencia, eliminando métodos de lectura de los write repositories y garantizando CQRS estricto en todos los bounded contexts.

El patrón Factory es **compatible y complementario** con el patrón Repository. Los tres componentes trabajan juntos:

- **Read Repository**: Retorna read models (DTOs) para queries
- **Factory**: Reconstruye aggregates con lógica de negocio para modificación
- **Write Repository**: Solo persiste aggregates (save/delete)

Esta separación respeta DDD, Clean Architecture, SOLID y CQRS estricto.

## Architecture

### Current State (Violates CQRS)

```
Command Handler
    ↓
Write Repository (❌ tiene findById)
    ↓
Aggregate (reconstruido en write repo)
    ↓
Write Repository.save()
```

**Problemas:**

- Write repository tiene responsabilidad dual (lectura + escritura)
- Viola Single Responsibility Principle
- Viola CQRS estricto
- Dificulta testing y mocking

### Target State (CQRS Strict)

```
Command Handler
    ↓
Factory.load() → Reconstruye Aggregate
    ↓
Aggregate.businessMethod() → Modifica estado
    ↓
Write Repository.save() → Solo persiste
```

**Beneficios:**

- Separación clara de responsabilidades
- CQRS estricto respetado
- Cada componente tiene una única responsabilidad
- Fácil de testear y mockear

## Components and Interfaces

### 1. Factory Interface (Domain Layer)

**Ubicación:** `src/{bc}/domain/interfaces/factories/{aggregate}-factory.ts`

```typescript
import { Aggregate } from '../../aggregates/{aggregate}';

/**
 * Factory interface for loading {Aggregate} aggregates from persistence
 *
 * Responsibilities:
 * - Load domain aggregates (with business logic) from database
 * - Reconstruct aggregate state for modification
 *
 * This is separate from:
 * - I{Aggregate}ReadRepository: Returns read models (DTOs) for queries
 * - I{Aggregate}WriteRepository: Only persists aggregates
 */
export interface I{Aggregate}Factory {
  /**
   * Loads an aggregate by ID for modification
   *
   * @returns Domain aggregate with business logic (not a read model)
   * @usage Used in command handlers to load aggregates before modification
   */
  loadById(id: string): Promise<Aggregate | null>;

  // Otros métodos de carga según necesidad del BC
}
```

### 2. Factory Implementation (Infrastructure Layer)

**Ubicación:** `src/{bc}/infra/persistence/factories/{aggregate}-factory.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I{Aggregate}Factory } from '@{bc}/domain/interfaces/factories/{aggregate}-factory';
import { {Aggregate}Model } from '../models/{aggregate}';
import { {Aggregate} } from '@{bc}/domain/aggregates/{aggregate}';
import { UUID } from '@shared/vo/uuid';

/**
 * Infrastructure implementation of I{Aggregate}Factory
 *
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 *
 * Located in infrastructure because it depends on TypeORM and database models.
 */
@Injectable()
export class {Aggregate}Factory implements I{Aggregate}Factory {
  constructor(
    @InjectRepository({Aggregate}Model)
    private readonly repository: Repository<{Aggregate}Model>,
  ) {}

  async loadById(id: string): Promise<{Aggregate} | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    // Usar método estático fromPersistence del aggregate
    return {Aggregate}.fromPersistence(
      UUID.fromString(model.id),
      // ... otros campos
      model.version, // ← Importante para optimistic locking
    );
  }
}
```

### 3. Updated Write Repository Interface (Domain Layer)

**Ubicación:** `src/{bc}/domain/interfaces/repositories/{aggregate}-write.ts`

```typescript
import { Aggregate } from '../../aggregates/{aggregate}';

/**
 * Write repository for {Aggregate} aggregate
 *
 * Responsibilities:
 * - Persist aggregates (save/delete)
 * - Handle optimistic locking
 * - Manage transactions
 *
 * Does NOT:
 * - Load aggregates for modification (use Factory)
 * - Return read models (use Read Repository)
 */
export interface I{Aggregate}WriteRepository {
  /**
   * Persists an aggregate with optimistic locking
   */
  save(aggregate: Aggregate): Promise<void>;

  /**
   * Deletes an aggregate (if applicable)
   */
  delete(id: UUID): Promise<void>;
}
```

### 4. Updated Command Handler Pattern

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { I{Aggregate}Factory } from '@{bc}/domain/interfaces/factories/{aggregate}-factory';
import { I{Aggregate}WriteRepository } from '@{bc}/domain/interfaces/repositories/{aggregate}-write';
import { {Aggregate}NotFoundException } from '@{bc}/domain/exceptions/{aggregate}-not-found';

@CommandHandler(Modify{Aggregate}Command)
export class Modify{Aggregate}Handler implements ICommandHandler<Modify{Aggregate}Command> {
  constructor(
    @Inject('I{Aggregate}Factory')
    private readonly factory: I{Aggregate}Factory,
    @Inject('I{Aggregate}WriteRepository')
    private readonly writeRepo: I{Aggregate}WriteRepository,
  ) {}

  async execute(command: Modify{Aggregate}Command): Promise<void> {
    // 1. Load aggregate using Factory
    const aggregate = await this.factory.loadById(command.id);

    if (!aggregate) {
      throw new {Aggregate}NotFoundException(command.id);
    }

    // 2. Execute business logic
    aggregate.modify(command.newData);

    // 3. Persist using Write Repository
    await this.writeRepo.save(aggregate);
  }
}
```

## Data Models

### Aggregate with fromPersistence

Todos los aggregates deben tener un método estático `fromPersistence` para reconstrucción:

```typescript
export class {Aggregate} extends VersionedAggregateRoot {
  private id: UUID;
  private field1: ValueObject;
  private field2: string;
  // ... otros campos

  /**
   * Factory method para reconstrucción desde persistencia
   *
   * NO publica eventos de dominio
   * Establece la versión correcta para optimistic locking
   */
  static fromPersistence(
    id: UUID,
    field1: ValueObject,
    field2: string,
    version: number,
  ): {Aggregate} {
    const aggregate = new {Aggregate}();
    aggregate.id = id;
    aggregate.field1 = field1;
    aggregate.field2 = field2;
    aggregate.setVersion(version); // ← Importante
    return aggregate;
  }

  // Getters
  getId(): UUID { return this.id; }
  // ... otros getters
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Factory Reconstruction Preserves Version

_For any_ aggregate loaded by a factory, the version of the reconstructed aggregate must match the version in the database model.

**Validates: Requirements 5.4**

**Rationale:** Optimistic locking depends on accurate version tracking. If the factory doesn't preserve the version correctly, concurrent modifications won't be detected.

### Property 2: Write Repository Has No Read Methods

_For any_ write repository interface, it must not contain methods that return aggregates or read models (only save/delete).

**Validates: Requirements 1.2**

**Rationale:** CQRS strict requires complete separation. Write repositories should only handle persistence, not retrieval.

### Property 3: Factory Returns Aggregate with Business Logic

_For any_ aggregate loaded by a factory, calling business methods on it must execute domain logic (not throw "not implemented" errors).

**Validates: Requirements 2.2, 5.1**

**Rationale:** Factories must reconstruct full aggregates with behavior, not anemic data objects.

### Property 4: Command Handler Uses Factory Before Write

_For any_ command handler that modifies an aggregate, it must use factory to load, then write repository to save (never write repository to load).

**Validates: Requirements 4.1, 4.2, 4.3**

**Rationale:** This enforces the correct flow and separation of concerns.

### Property 5: Factory Does Not Publish Events

_For any_ aggregate reconstructed by a factory, no domain events should be published during reconstruction.

**Validates: Requirements 5.5**

**Rationale:** Events represent things that happened. Reconstruction is not a new occurrence, so no events should fire.

## Error Handling

### Factory Not Found

```typescript
const aggregate = await factory.loadById(id);

if (!aggregate) {
  throw new {Aggregate}NotFoundException(id);
}
```

### Optimistic Locking Conflict

El write repository ya maneja esto con `ConcurrencyException`. El factory solo debe preservar la versión correcta.

## Testing Strategy

### Unit Tests

#### Factory Tests

```typescript
describe("{Aggregate}Factory", () => {
  it("should reconstruct aggregate with correct version", async () => {
    // Arrange
    const model = createMockModel({ version: 5 });
    repository.findOne.mockResolvedValue(model);

    // Act
    const aggregate = await factory.loadById("id");

    // Assert
    expect(aggregate.getVersion().getValue()).toBe(5);
  });

  it("should return null when not found", async () => {
    repository.findOne.mockResolvedValue(null);

    const aggregate = await factory.loadById("id");

    expect(aggregate).toBeNull();
  });

  it("should reconstruct aggregate with business logic", async () => {
    const model = createMockModel();
    repository.findOne.mockResolvedValue(model);

    const aggregate = await factory.loadById("id");

    // Should not throw - business logic is present
    expect(() => aggregate.someBusinessMethod()).not.toThrow();
  });
});
```

#### Write Repository Tests

```typescript
describe('{Aggregate}WriteRepository', () => {
  it('should only have save and delete methods', () => {
    const methods = Object.getOwnPropertyNames(
      {Aggregate}WriteRepository.prototype
    );

    const allowedMethods = ['save', 'delete', 'constructor'];
    const unexpectedMethods = methods.filter(
      m => !allowedMethods.includes(m)
    );

    expect(unexpectedMethods).toEqual([]);
  });
});
```

#### Command Handler Tests

```typescript
describe('Modify{Aggregate}Handler', () => {
  it('should use factory to load aggregate', async () => {
    const command = new Modify{Aggregate}Command('id', newData);
    const aggregate = createMockAggregate();
    factory.loadById.mockResolvedValue(aggregate);

    await handler.execute(command);

    expect(factory.loadById).toHaveBeenCalledWith('id');
  });

  it('should use write repository to save', async () => {
    const command = new Modify{Aggregate}Command('id', newData);
    const aggregate = createMockAggregate();
    factory.loadById.mockResolvedValue(aggregate);

    await handler.execute(command);

    expect(writeRepo.save).toHaveBeenCalledWith(aggregate);
  });

  it('should throw when aggregate not found', async () => {
    const command = new Modify{Aggregate}Command('id', newData);
    factory.loadById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      {Aggregate}NotFoundException
    );
  });
});
```

### Integration Tests

```typescript
describe("{Aggregate}Factory Integration", () => {
  it("should load aggregate from real database", async () => {
    // Arrange: Insert test data
    await repository.save(createTestModel());

    // Act
    const aggregate = await factory.loadById("test-id");

    // Assert
    expect(aggregate).toBeDefined();
    expect(aggregate.getId().getValue()).toBe("test-id");
  });
});
```

### Property-Based Tests

```typescript
import { fc, test } from "@fast-check/vitest";

describe("{Aggregate}Factory PBT", () => {
  test.prop([fc.integer({ min: 0, max: 100 })])(
    "should preserve version for any valid version number",
    async (version) => {
      const model = createMockModel({ version });
      repository.findOne.mockResolvedValue(model);

      const aggregate = await factory.loadById("id");

      expect(aggregate.getVersion().getValue()).toBe(version);
    },
  );
});
```

## Implementation Plan by Bounded Context

### BC: Availability ✅ (Already Implemented - Reference)

**Status:** Complete
**Files:**

- ✅ `domain/interfaces/factories/capacity-factory.ts`
- ✅ `infra/persistence/factories/capacity-factory.ts`
- ✅ `domain/interfaces/repositories/capacity-write.ts` (no read methods)
- ✅ Command handlers use factory pattern

### BC: Booking

**Aggregates:** Appointment
**Files to Create:**

- `domain/interfaces/factories/appointment-factory.ts`
- `infra/persistence/factories/appointment-factory.ts`

**Files to Modify:**

- `domain/interfaces/repositories/appointment-write.ts` (remove `findById`)
- `infra/persistence/repositories/appointment-write.ts` (remove `findById`)
- `app/commands/cancel-appointment/handler.ts` (use factory)
- `app/commands/modify-appointment/handler.ts` (use factory)

**Tests to Create:**

- `infra/persistence/factories/__tests__/appointment-factory.spec.ts`

**Tests to Update:**

- `app/commands/cancel-appointment/__tests__/handler.spec.ts`
- `app/commands/modify-appointment/__tests__/handler.spec.ts`

### BC: Offering

**Aggregates:** Offering
**Files to Create:**

- `domain/interfaces/factories/offering-factory.ts`
- `infra/persistence/factories/offering-factory.ts`

**Files to Modify:**

- `domain/interfaces/repositories/offering-write.ts` (remove `findById`, `findByBusinessId`)
- `infra/persistence/repositories/offering-write.ts` (remove methods)
- `app/commands/update-offering/handler.ts` (use factory)
- `app/commands/deactivate-offering/handler.ts` (use factory)

**Tests to Create:**

- `infra/persistence/factories/__tests__/offering-factory.spec.ts`

**Tests to Update:**

- `app/commands/update-offering/__tests__/handler.spec.ts`
- `app/commands/deactivate-offering/__tests__/handler.spec.ts`

### BC: Auth

**Aggregates:** User
**Files to Create:**

- `domain/interfaces/factories/user-factory.ts`
- `infra/persistence/factories/user-factory.ts`

**Files to Modify:**

- `domain/interfaces/repositories/user-write.ts` (remove `findById`, `findByEmail`)
- `infra/persistence/repositories/user-write.ts` (remove methods)
- Command handlers that modify users

**Tests to Create:**

- `infra/persistence/factories/__tests__/user-factory.spec.ts`

### BC: Conversation

**Aggregates:** Conversation
**Files to Create:**

- `domain/interfaces/factories/conversation-factory.ts`
- `infra/persistence/factories/conversation-factory.ts`

**Files to Modify:**

- `domain/interfaces/repositories/conversation-write.ts` (remove `findById`)
- `infra/persistence/repositories/conversation-write.ts` (remove methods)
- Command handlers that modify conversations

**Tests to Create:**

- `infra/persistence/factories/__tests__/conversation-factory.spec.ts`

## Documentation Updates

### Steering Files

#### `.kiro/steering/ddd-patterns.md`

**Changes:**

1. Update "Repositories" section to remove `findById` from write repository example
2. Add new "Factories" section after "Repositories" with:
   - Definition and purpose
   - Example implementation (use CapacityFactory as reference)
   - Rules for factories
   - Comparison with repositories
3. Update command handler examples to show factory usage

#### New File: `.kiro/steering/factory-pattern.md`

Create dedicated steering file explaining:

- When to use factories
- How factories differ from repositories
- Factory + Repository + CQRS relationship
- Examples from all BCs
- Testing strategies

### Spec Files

#### `.kiro/specs/offering-bc/tasks.md`

Update task 10 to include:

- Create OfferingFactory
- Update write repository to remove read methods
- Update command handlers to use factory

#### `.kiro/specs/proyecto-base-mvp/*`

Review and update any references to write repositories with read methods.

## Module Registration

Each BC module must register the factory:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([{Aggregate}Model]),
  ],
  providers: [
    // Factory
    {
      provide: 'I{Aggregate}Factory',
      useClass: {Aggregate}Factory,
    },
    // Write Repository
    {
      provide: 'I{Aggregate}WriteRepository',
      useClass: {Aggregate}WriteRepository,
    },
    // Command Handlers
    // ...
  ],
  exports: [
    'I{Aggregate}Factory',
    'I{Aggregate}WriteRepository',
  ],
})
export class {BC}Module {}
```

## Compatibility Analysis: Factory + Repository Patterns

### Question: Are Factories and Repositories Compatible?

**Answer: YES - They are complementary and work together.**

### Roles and Responsibilities

| Component            | Responsibility                          | Layer          | Returns            |
| -------------------- | --------------------------------------- | -------------- | ------------------ |
| **Read Repository**  | Query data for display                  | Infrastructure | Read Models (DTOs) |
| **Factory**          | Reconstruct aggregates for modification | Infrastructure | Domain Aggregates  |
| **Write Repository** | Persist aggregates                      | Infrastructure | void               |

### Why Both Are Needed

1. **Read Repository** ≠ **Factory**
   - Read Repository: Optimized queries, returns DTOs, no business logic
   - Factory: Reconstructs full aggregates with business logic

2. **Factory** ≠ **Write Repository**
   - Factory: Loads and reconstructs
   - Write Repository: Saves and handles transactions

3. **CQRS Strict Requires All Three:**
   - Queries → Read Repository
   - Commands (read phase) → Factory
   - Commands (write phase) → Write Repository

### Flow Comparison

#### Query Flow (Read Side)

```
Query Handler
    ↓
Read Repository
    ↓
Read Model (DTO)
    ↓
Return to client
```

#### Command Flow (Write Side)

```
Command Handler
    ↓
Factory (load aggregate)
    ↓
Aggregate (business logic)
    ↓
Write Repository (persist)
```

### Conclusion

The Factory pattern **enhances** the Repository pattern by:

- Removing dual responsibility from write repositories
- Providing clear separation of concerns
- Maintaining CQRS strict compliance
- Following Single Responsibility Principle

All three components (Read Repo, Factory, Write Repo) are necessary and work together harmoniously.

## Migration Strategy

### Phase 1: Create Factories (No Breaking Changes)

1. Create factory interfaces in domain
2. Create factory implementations in infrastructure
3. Register factories in modules
4. Add factory tests

### Phase 2: Update Command Handlers

1. Inject factories into command handlers
2. Replace write repository read calls with factory calls
3. Update command handler tests
4. Verify all tests pass

### Phase 3: Clean Up Write Repositories

1. Remove read methods from write repository interfaces
2. Remove read methods from write repository implementations
3. Update write repository tests
4. Verify no compilation errors

### Phase 4: Update Documentation

1. Update steering files
2. Update spec files
3. Create factory-pattern.md steering file
4. Commit all changes

## Validation Checklist

Before considering the migration complete:

- [ ] All write repository interfaces have only `save()` and `delete()` methods
- [ ] All factories have corresponding interfaces in domain layer
- [ ] All command handlers that modify aggregates use factories
- [ ] All aggregates have `fromPersistence` static method
- [ ] All factories preserve version correctly
- [ ] All tests pass (unit, integration, PBT)
- [ ] `pnpm typecheck:backend` passes
- [ ] `pnpm lint:backend` passes
- [ ] `pnpm format:backend` passes
- [ ] `pnpm test:backend` passes
- [ ] Documentation updated (steering + specs)
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub main branch

## References

- Availability BC (reference implementation)
- DDD Patterns steering file
- CQRS documentation
- Clean Architecture principles
