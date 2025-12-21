# Design Document - Test Utils Reorganization

## Overview

Este documento describe el diseño técnico para reorganizar la estructura de test utilities del backend, consolidando todo el código de testing en `apps/backend/test/` y eliminando `apps/backend/src/test-utils/`.

## Architecture

### Current Structure (Before)

```
apps/backend/
├── src/
│   ├── test-utils/                    # ❌ Código de testing en src/
│   │   ├── e2e/
│   │   │   ├── auth-helper.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── fixtures/
│   │   │       ├── appointment.fixture.ts
│   │   │       ├── business.fixture.ts
│   │   │       ├── customer.fixture.ts
│   │   │       └── index.ts
│   │   └── generators.ts
│   └── customer/
│       └── presentation/
│           └── controllers/
│               └── __tests__/
│                   └── customer.e2e.spec.ts  # ❌ E2E test en src/
└── test/
    └── e2e/
        ├── helpers/
        │   ├── capacity-helper.ts
        │   └── offering-helper.ts
        ├── app.e2e-spec.ts
        ├── conversation-flow.e2e-spec.ts
        └── customer-flow.e2e-spec.ts
```

### Target Structure (After)

```
apps/backend/
├── src/                               # ✅ Solo código de producción
│   └── (sin test-utils ni tests)
└── test/                              # ✅ Todo el código de testing
    ├── setup/                         # ✅ Configuración de tests
    │   ├── jest-e2e.json              # Movido
    │   ├── README.md                  # Movido
    │   ├── setup-db.ts                # Movido
    │   ├── setup-test-db.sh           # Movido
    │   └── setup.ts                   # Movido
    ├── e2e/
    │   ├── helpers/
    │   │   ├── auth-helper.ts         # Movido
    │   │   ├── types.ts               # Movido
    │   │   ├── capacity-helper.ts
    │   │   └── offering-helper.ts
    │   ├── fixtures/                  # ✅ Separado de helpers
    │   │   ├── appointment.fixture.ts # Movido (si se usa)
    │   │   ├── business.fixture.ts    # Movido (si se usa)
    │   │   └── customer.fixture.ts    # Movido (si se usa)
    │   ├── app.e2e-spec.ts
    │   ├── conversation-flow.e2e-spec.ts
    │   ├── customer-flow.e2e-spec.ts
    │   └── customer-api.e2e-spec.ts   # Movido
    └── utils/
        └── generators.ts              # Movido
```

## Components and Interfaces

### 1. E2E Helpers

**Location:** `apps/backend/test/e2e/helpers/`

#### auth-helper.ts

```typescript
/**
 * E2E Authentication Helper
 * Provides authentication utilities for E2E tests
 */
export class E2EAuthHelper {
  // ... existing implementation
}
```

**Exports:**

- `E2EAuthHelper` class
- Used by: E2E tests that need authentication

#### types.ts

```typescript
/**
 * E2E Testing Types
 * Type definitions for E2E testing infrastructure
 */
export enum UserRole { ... }
export interface TestUser { ... }
export interface RegisterDto { ... }
// ... other types
```

**Exports:**

- Type definitions for E2E tests
- Used by: `auth-helper.ts` and E2E tests

### 2. Fixtures

**Location:** `apps/backend/test/e2e/fixtures/`

**Difference from Helpers:**

- **Helpers:** Simple functions that create data (e.g., `createActiveOffering()`)
- **Fixtures:** Classes with state that create data AND manage cleanup (e.g., `AppointmentFixture`)

**Decision:** Verificar uso antes de mover

- Si están siendo usadas → Mover a `test/e2e/fixtures/`
- Si NO están siendo usadas → Eliminar

**Current Status:** No se encontraron imports de fixtures en ningún test

**Action:** Eliminar fixtures no usadas (o moverlas si se planea usarlas en el futuro)

**Rationale:** Fixtures son más complejas que helpers y merecen su propio directorio al mismo nivel que `helpers/`, no como subdirectorio.

### 3. Generators

**Location:** `apps/backend/test/utils/generators.ts`

```typescript
/**
 * Property-Based Testing Generators
 * Provides generators for fast-check property tests
 */
export const uuidV4 = (): fc.Arbitrary<string> => {
  return fc.constant(null).map(() => uuidv4());
};
```

**Exports:**

- `uuidV4` generator
- Used by: Property-based tests (PBT) across all BCs

### 4. E2E Tests

**Location:** `apps/backend/test/e2e/`

#### customer-api.e2e-spec.ts (moved from controllers)

```typescript
/**
 * Customer API E2E Tests
 * Tests the Customer REST API endpoints
 */
describe("Customer API (E2E)", () => {
  // ... existing tests
});
```

**Naming Convention:** `{feature}-api.e2e-spec.ts` for API endpoint tests

### 5. Test Setup Files

**Location:** `apps/backend/test/setup/`

**Files to move:**

- `jest-e2e.json` - Jest configuration for E2E tests
- `README.md` - Documentation for test setup
- `setup-db.ts` - Database setup utilities
- `setup-test-db.sh` - Shell script for test database
- `setup.ts` - Global test setup

**Rationale:** Consolidate all test configuration and setup in one place, separate from actual tests

## Data Models

### Path Aliases Configuration

#### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      // Existing aliases
      "@packages/shared-types": ["../../packages/shared-types/src/index.ts"],
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      // ... other BC aliases

      // New test aliases
      "@test-utils/*": ["test/utils/*"],
      "@e2e-helpers/*": ["test/e2e/helpers/*"]
    }
  }
}
```

#### package.json (Jest config)

```json
{
  "jest": {
    "moduleNameMapper": {
      // Existing mappings
      "^@shared/(.*)$": "<rootDir>/shared/$1",
      "^@booking/(.*)$": "<rootDir>/booking/$1",
      // ... other BC mappings

      // New test mappings
      "^@test-utils/(.*)$": "<rootDir>/../test/utils/$1",
      "^@e2e-helpers/(.*)$": "<rootDir>/../test/e2e/helpers/$1",
      "^@e2e-fixtures/(.*)$": "<rootDir>/../test/e2e/fixtures/$1"
    }
  }
}
```

### Test Setup Configuration

#### jest-e2e.json (moved to test/setup/)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "../../src",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFilesAfterEnv": ["<rootDir>/../test/setup/setup.ts"]
}
```

**Note:** Update `rootDir` and `setupFilesAfterEnv` paths after moving to `test/setup/`

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: All E2E helpers are in test/e2e/helpers/

_For any_ E2E helper file, it should be located in `apps/backend/test/e2e/helpers/` and not in `apps/backend/src/`

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: All fixtures are in test/e2e/fixtures/ or deleted

_For any_ fixture file, it should either be located in `apps/backend/test/e2e/fixtures/` if used, or deleted if unused

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Generators are in test/utils/

_For any_ generator file, it should be located in `apps/backend/test/utils/` and not in `apps/backend/src/`

**Validates: Requirements 3.1, 3.2**

### Property 4: All E2E tests are in test/e2e/

_For any_ file matching `*.e2e.spec.ts` or `*.e2e-spec.ts`, it should be located in `apps/backend/test/e2e/` and not in `apps/backend/src/`

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 5: src/test-utils does not exist

_For any_ path check, `apps/backend/src/test-utils/` should not exist in the filesystem

**Validates: Requirements 5.1**

### Property 6: All imports resolve correctly

_For any_ test file, all imports should resolve without errors after the reorganization

**Validates: Requirements 5.2, 5.3, 6.3, 6.4**

### Property 7: All tests pass after reorganization

_For any_ test suite (unit, integration, E2E, PBT), all tests should pass after the reorganization

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Import Resolution Errors

**Scenario:** Tests fail with "Cannot find module" after moving files

**Handling:**

1. Verify path aliases in `tsconfig.json`
2. Verify Jest `moduleNameMapper` in `package.json`
3. Check relative imports in moved files
4. Run `pnpm typecheck:backend` to catch TypeScript errors

### Test Failures

**Scenario:** Tests fail after reorganization

**Handling:**

1. Check if imports are correct
2. Verify that all dependencies are available
3. Check if test setup/teardown is working
4. Run tests individually to isolate failures

### Missing Files

**Scenario:** Files are referenced but not found after move

**Handling:**

1. Search for all references to the file
2. Update all imports
3. Verify file was moved to correct location
4. Check git status to ensure file was moved, not deleted

## Testing Strategy

### Unit Tests

**Scope:** Verify individual helper functions work correctly

**Examples:**

- `E2EAuthHelper.generateTestEmail()` generates unique emails
- `uuidV4()` generator produces valid UUID v4 strings

### Integration Tests

**Scope:** Verify helpers integrate correctly with the application

**Examples:**

- `E2EAuthHelper.login()` successfully authenticates with real API
- `E2EAuthHelper.createTestUser()` creates user in database

### E2E Tests

**Scope:** Verify complete flows work after reorganization

**Examples:**

- All 13 E2E tests pass (conversation-flow, customer-flow, customer-api, app)
- Authentication flows work end-to-end
- Customer API endpoints work correctly

### Property-Based Tests

**Scope:** Verify generators produce valid data

**Examples:**

- `uuidV4()` always produces valid UUID v4 format
- Generated UUIDs are unique across multiple runs

### Verification Checklist

After reorganization, verify:

- [ ] All E2E tests pass (13/13)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All PBT tests pass
- [ ] `pnpm typecheck:backend` passes
- [ ] `pnpm lint:backend` passes
- [ ] No files remain in `src/test-utils/`
- [ ] No `*.e2e.spec.ts` files in `src/`
- [ ] All imports resolve correctly

## Migration Steps

### Phase 1: Prepare New Structure

1. Create `test/setup/` directory
2. Create `test/utils/` directory
3. Create `test/e2e/fixtures/` directory (if fixtures are used)
4. Verify current test status (all passing)

### Phase 2: Move Test Setup Files

1. Move `test/jest-e2e.json` → `test/setup/jest-e2e.json`
2. Move `test/README.md` → `test/setup/README.md`
3. Move `test/setup-db.ts` → `test/setup/setup-db.ts`
4. Move `test/setup-test-db.sh` → `test/setup/setup-test-db.sh`
5. Move `test/setup.ts` → `test/setup/setup.ts`
6. Update paths in `jest-e2e.json` (rootDir, setupFilesAfterEnv)
7. Update package.json scripts if needed
8. Run E2E tests to verify

### Phase 3: Move Generators

1. Move `src/test-utils/generators.ts` → `test/utils/generators.ts`
2. Update imports in all PBT tests
3. Update path alias in `tsconfig.json`
4. Update Jest `moduleNameMapper`
5. Run PBT tests to verify

### Phase 4: Move E2E Helpers

1. Move `src/test-utils/e2e/auth-helper.ts` → `test/e2e/helpers/auth-helper.ts`
2. Move `src/test-utils/e2e/types.ts` → `test/e2e/helpers/types.ts`
3. Update imports in E2E tests
4. Update path aliases
5. Run E2E tests to verify

### Phase 5: Handle Fixtures

1. Verify if fixtures are used (search for imports)
2. If used: Move to `test/e2e/fixtures/` (NOT helpers/fixtures/)
3. If not used: Delete fixtures
4. Update imports if moved
5. Add `@e2e-fixtures/*` path alias if moved
6. Run tests to verify

### Phase 6: Move E2E Tests from Controllers

1. Move `src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` → `test/e2e/customer-api.e2e-spec.ts`
2. Update imports in moved test
3. Run E2E tests to verify

### Phase 7: Clean Up

1. Delete `src/test-utils/e2e/index.ts`
2. Delete `src/test-utils/e2e/` directory
3. Delete `src/test-utils/` directory
4. Verify no references remain

### Phase 8: Final Verification

1. Run all tests: `pnpm test:backend`
2. Run type check: `pnpm typecheck:backend`
3. Run linter: `pnpm lint:backend`
4. Verify directory structure
5. Commit changes

## Rollback Plan

If issues arise:

1. **Immediate Rollback:** `git reset --hard HEAD` (if not committed)
2. **After Commit:** `git revert <commit-hash>`
3. **Partial Rollback:** Revert specific files with `git checkout HEAD~1 -- <file>`

## Benefits

1. ✅ **Clear Separation:** Production code in `src/`, test code in `test/`
2. ✅ **Consistency:** All E2E infrastructure in one place
3. ✅ **Discoverability:** Easy to find test utilities
4. ✅ **Maintainability:** Easier to update and refactor test code
5. ✅ **Best Practices:** Follows industry standards for test organization

## References

- [Jest Configuration](https://jestjs.io/docs/configuration)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
