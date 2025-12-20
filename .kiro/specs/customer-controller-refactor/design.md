# Design Document

## Overview

This document describes the design for refactoring the Customer BC REST controller from a monolithic 1023-line file into four focused controller files organized by responsibility. The refactoring will improve maintainability, testability, and code organization while preserving all existing functionality and API contracts.

## Architecture

### Current Structure

```
apps/backend/src/customer/
├── presentation/
│   ├── controllers/
│   │   ├── customer.controller.ts (1023 lines - MONOLITHIC)
│   │   └── __tests__/
│   │       └── customer.controller.integration.spec.ts
│   └── dtos/
│       ├── customer-stats-response.dto.ts
│       ├── detect-duplicates.dto.ts
│       ├── duplicate-pairs-response.dto.ts
│       ├── index.ts
│       ├── merge-customers.dto.ts
│       ├── message-response.dto.ts
│       ├── search-customers-response.dto.ts
│       ├── search-customers.dto.ts
│       └── __tests__/
```

### Target Structure

```
apps/backend/src/customer/
├── presentation/
│   ├── controllers/
│   │   ├── customer.controller.ts (CRUD - ~250 lines)
│   │   ├── customer-search.ts (Search & Stats - ~200 lines)
│   │   ├── customer-merge.ts (Merge - ~150 lines)
│   │   ├── customer-duplicates.ts (Duplicates - ~150 lines)
│   │   ├── customer.controller.backup (original - preserved)
│   │   └── __tests__/
│   │       ├── customer.controller.spec.ts
│   │       ├── customer-search.spec.ts
│   │       ├── customer-merge.spec.ts
│   │       ├── customer-duplicates.spec.ts
│   │       ├── customer.controller.integration.spec.ts
│   │       └── customer.e2e.spec.ts
│   └── dtos/
│       ├── search-customer.ts (renamed from search-customers.dto.ts)
│       ├── merge-customer.ts (renamed from merge-customers.dto.ts)
│       ├── detect-duplicates.ts (renamed from detect-duplicates.dto.ts)
│       ├── response-types.ts (consolidated responses)
│       ├── index.ts (barrel export)
│       ├── dtos.backup/ (original folder - preserved)
│       └── __tests__/
│           ├── search-customer.spec.ts
│           ├── merge-customer.spec.ts
│           ├── detect-duplicates.spec.ts
│           └── response-types.spec.ts
```

## Components and Interfaces

### Controller 1: customer.controller.ts (CRUD Operations)

**Responsibility:** Core CRUD operations for customer management

**Endpoints:**

- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/by-user/:userId` - Get customers by user ID
- `GET /api/customers/:id/export` - Export customer data (GDPR)
- `DELETE /api/customers/:id` - Delete customer (GDPR)

**Dependencies:**

- `CommandBus` - For dispatching DeleteCustomerCommand
- `QueryBus` - For dispatching GetCustomerQuery, GetCustomersByUserIdQuery, ExportCustomerDataQuery
- `PinoLogger` - For structured logging
- `JwtAuthGuard` - For authentication
- `CurrentUser` decorator - For extracting user from JWT

**Class Structure:**

```typescript
@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerController.name);
  }

  @Get(":id")
  async getById(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel> {}

  @Get("by-user/:userId")
  async getByUserId(
    @Param("userId", ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel[]> {}

  @Get(":id/export")
  async exportData(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerDataExport> {}

  @Delete(":id")
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<MessageResponseDto> {}
}
```

### Controller 2: customer-search.ts (Search & Stats)

**Responsibility:** Search and statistics operations

**Endpoints:**

- `GET /api/customers/search` - Search customers with filters
- `GET /api/customers/stats` - Get customer statistics

**Dependencies:**

- `QueryBus` - For dispatching SearchCustomersQuery, GetCustomerStatsQuery
- `PinoLogger` - For structured logging
- `JwtAuthGuard` - For authentication
- `CurrentUser` decorator - For extracting user from JWT

**Class Structure:**

```typescript
@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomerSearchController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerSearchController.name);
  }

  @Get("search")
  async search(
    @Query() dto: SearchCustomersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<SearchCustomersResponseDto> {}

  @Get("stats")
  async getStats(
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerStatsResponseDto> {}
}
```

### Controller 3: customer-merge.ts (Merge Operations)

**Responsibility:** Customer merge operations

**Endpoints:**

- `POST /api/customers/merge` - Merge two customers

**Dependencies:**

- `CommandBus` - For dispatching MergeCustomersCommand
- `PinoLogger` - For structured logging
- `JwtAuthGuard` - For authentication
- `CurrentUser` decorator - For extracting user from JWT

**Class Structure:**

```typescript
@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomerMergeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerMergeController.name);
  }

  @Post("merge")
  async merge(
    @Body() dto: MergeCustomersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<MessageResponseDto> {}
}
```

### Controller 4: customer-duplicates.ts (Duplicate Detection)

**Responsibility:** Duplicate customer detection

**Endpoints:**

- `GET /api/customers/duplicates` - Detect duplicate customers

**Dependencies:**

- `QueryBus` - For dispatching DetectDuplicateCustomersQuery
- `PinoLogger` - For structured logging
- `JwtAuthGuard` - For authentication
- `CurrentUser` decorator - For extracting user from JWT

**Class Structure:**

```typescript
@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomerDuplicatesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerDuplicatesController.name);
  }

  @Get("duplicates")
  async getDuplicates(
    @Query() dto: DetectDuplicatesDto,
    @CurrentUser() user: UserPayload,
  ): Promise<DuplicatePairsResponseDto> {}
}
```

## Data Models

### DTO Refactoring

#### Before (with .dto suffix)

```
dtos/
├── customer-stats-response.dto.ts
├── detect-duplicates.dto.ts
├── duplicate-pairs-response.dto.ts
├── merge-customers.dto.ts
├── message-response.dto.ts
├── search-customers-response.dto.ts
└── search-customers.dto.ts
```

#### After (without .dto suffix)

```
dtos/
├── search-customer.ts          # SearchCustomersDto
├── merge-customer.ts            # MergeCustomersDto
├── detect-duplicates.ts         # DetectDuplicatesDto
├── response-types.ts            # All response DTOs consolidated
│   ├── MessageResponseDto
│   ├── SearchCustomersResponseDto
│   ├── CustomerStatsResponseDto
│   └── DuplicatePairsResponseDto
└── index.ts                     # Barrel export
```

### DTO Consolidation Strategy

**response-types.ts** will consolidate all response DTOs:

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { CustomerReadModel } from "@packages/shared-types";

/**
 * Generic message response
 */
export class MessageResponseDto {
  @ApiProperty({ example: "Operation completed successfully" })
  message: string;
}

/**
 * Search customers response with pagination
 */
export class SearchCustomersResponseDto {
  @ApiProperty({ type: [CustomerReadModel] })
  customers: CustomerReadModel[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

/**
 * Customer statistics response
 */
export class CustomerStatsResponseDto {
  @ApiProperty({ example: 150 })
  totalCustomers: number;

  @ApiProperty({ example: 100 })
  anonymousCount: number;

  @ApiProperty({ example: 50 })
  registeredCount: number;

  @ApiProperty({ example: 10 })
  newThisWeek: number;

  @ApiProperty({ example: 25 })
  newThisMonth: number;

  @ApiProperty({ type: "array", items: { type: "object" } })
  topCustomers: Array<{
    id: string;
    name: string;
    appointmentCount: number;
  }>;
}

/**
 * Duplicate pairs response
 */
export class DuplicatePairsResponseDto {
  @ApiProperty({ type: "array", items: { type: "object" } })
  pairs: Array<{
    customer1: CustomerReadModel;
    customer2: CustomerReadModel;
    similarityScore: number;
    reasons: string[];
  }>;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Controller Endpoint Preservation

_For any_ HTTP request to an existing endpoint, the refactored controllers should return the same response as the original controller

**Validates: Requirements 3.1, 3.2, 3.3**

**Test Strategy:** E2E tests comparing responses before and after refactoring

### Property 2: DTO Validation Equivalence

_For any_ request DTO, validation should behave identically before and after removing the `.dto` suffix

**Validates: Requirements 2.2**

**Test Strategy:** Property-based tests with random valid/invalid inputs

### Property 3: Logging Structure Preservation

_For any_ endpoint execution, the log structure (fields, format, context) should remain identical after refactoring

**Validates: Requirements 4.1, 4.2, 4.4**

**Test Strategy:** Unit tests verifying log calls with same parameters

### Property 4: Authorization Consistency

_For any_ authenticated request, authorization checks should behave identically after refactoring

**Validates: Requirements 3.5**

**Test Strategy:** Integration tests with different user contexts

### Property 5: Module Registration Completeness

_For any_ refactored controller, it should be properly registered in the NestJS module and discoverable

**Validates: Requirements 6.1, 6.2, 6.5**

**Test Strategy:** Integration tests verifying route registration

### Property 6: Import Path Correctness

_For any_ file in the codebase, imports should resolve correctly after path updates

**Validates: Requirements 8.1, 8.2, 8.4, 8.5**

**Test Strategy:** TypeScript compilation + unit tests

### Property 7: Backup File Isolation

_For any_ backup file, it should not be compiled or imported by TypeScript

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Test Strategy:** Build verification + import analysis

## Error Handling

### Error Preservation Strategy

All error handling from the original controller must be preserved:

1. **ForbiddenException** - When user doesn't have access to resource
2. **NotFoundException** - When customer not found (thrown by query handlers)
3. **BadRequestException** - When validation fails (handled by ValidationPipe)
4. **UnauthorizedException** - When JWT is invalid (handled by JwtAuthGuard)

### Error Logging

Each controller must maintain the same error logging structure:

```typescript
catch (error: unknown) {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  this.logger.error(
    {
      action: '{action}_error',
      userId: user.userId,
      businessId: user.businessId,
      error: errorMessage,
      stack: errorStack,
      duration,
    },
    '{Action} failed',
  );

  throw error;
}
```

## Testing Strategy

### Unit Tests

**Coverage Target:** > 80% per controller file

**Test Files:**

- `customer.controller.spec.ts` - CRUD operations
- `customer-search.spec.ts` - Search & stats
- `customer-merge.spec.ts` - Merge operations
- `customer-duplicates.spec.ts` - Duplicate detection

**Test Structure:**

```typescript
describe("CustomerController", () => {
  let controller: CustomerController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let logger: PinoLogger;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: QueryBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  describe("getById", () => {
    it("should return customer when found and authorized", async () => {
      // Test implementation
    });

    it("should throw ForbiddenException when customer belongs to different business", async () => {
      // Test implementation
    });

    it("should log start, complete, and duration", async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

**Coverage Target:** All CQRS handler integrations

**Test File:** `customer.controller.integration.spec.ts` (update existing)

**Test Strategy:**

- Use real CommandBus and QueryBus
- Mock repositories
- Verify commands/queries are dispatched correctly
- Verify response transformation

### E2E Tests

**Coverage Target:** All API endpoints

**Test File:** `customer.e2e.spec.ts` (new)

**Test Strategy:**

- Use real HTTP requests
- Use test database
- Verify complete request/response flow
- Compare responses with original controller (during migration)

### Property-Based Tests

**Test Files:**

- `search-customer.pbt.spec.ts` - Search pagination properties
- `merge-customer.pbt.spec.ts` - Merge validation properties

**Example Property Test:**

```typescript
import { fc, test } from "@fast-check/vitest";

describe("SearchCustomersDto PBT", () => {
  test.prop([
    fc.integer({ min: 1, max: 100 }),
    fc.integer({ min: 1, max: 100 }),
  ])("page and limit should always produce valid pagination", (page, limit) => {
    const dto = new SearchCustomersDto();
    dto.page = page;
    dto.limit = limit;

    // Validate DTO
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);

    // Verify pagination math
    const offset = (page - 1) * limit;
    expect(offset).toBeGreaterThanOrEqual(0);
  });
});
```

### DTO Validation Tests

**Test Files:**

- `search-customer.spec.ts`
- `merge-customer.spec.ts`
- `detect-duplicates.spec.ts`
- `response-types.spec.ts`

**Test Strategy:**

- Test all validation decorators
- Test edge cases (min/max values)
- Test invalid inputs
- Test transformation logic

## Migration Strategy

### Phase 1: Preparation (No Code Changes)

1. Create backup of original files:

   ```bash
   # This will be done automatically by the implementation
   cp customer.controller.ts customer.controller.backup
   cp -r dtos dtos.backup
   ```

2. Update `.gitignore`:
   ```
   *.backup
   dtos.backup/
   ```

### Phase 2: Create New DTOs

1. Create new DTO files without `.dto` suffix
2. Copy content from original DTOs
3. Update class names if needed
4. Create `response-types.ts` consolidating all responses
5. Update `index.ts` barrel export
6. Write DTO validation tests

### Phase 3: Create New Controllers

1. Create 4 new controller files
2. Copy relevant endpoints from original
3. Update imports to use new DTOs
4. Maintain all decorators, guards, and logging
5. Write unit tests for each controller

### Phase 4: Update Module Registration

1. Update `customer.module.ts`:

   ```typescript
   import { CustomerController } from "@customer/presentation/controllers/customer.controller";
   import { CustomerSearchController } from "@customer/presentation/controllers/customer-search";
   import { CustomerMergeController } from "@customer/presentation/controllers/customer-merge";
   import { CustomerDuplicatesController } from "@customer/presentation/controllers/customer-duplicates";

   @Module({
     controllers: [
       CustomerController,
       CustomerSearchController,
       CustomerMergeController,
       CustomerDuplicatesController,
     ],
     // ... rest of module config
   })
   export class CustomerModule {}
   ```

### Phase 5: Testing & Validation

1. Run all unit tests
2. Run integration tests
3. Run E2E tests
4. Verify API endpoints work correctly
5. Verify Swagger documentation is correct
6. Manual testing of all endpoints

### Phase 6: Finalize Migration

1. Rename original controller:

   ```bash
   mv customer.controller.ts customer.controller.backup
   ```

2. Rename original DTOs folder:

   ```bash
   mv dtos dtos.backup
   ```

3. Verify application compiles
4. Verify all tests pass
5. Verify no imports reference backup files

### Rollback Strategy

If issues are discovered:

1. Remove `.backup` extension from original files
2. Revert module registration
3. Delete new controller files
4. Restore original DTO imports

## Implementation Order

1. ✅ Create requirements.md
2. ✅ Create design.md
3. ⏳ Create tasks.md
4. Create new DTO files (without suffix)
5. Write DTO validation tests
6. Create `customer-search.ts` controller
7. Write unit tests for search controller
8. Create `customer-duplicates.ts` controller
9. Write unit tests for duplicates controller
10. Create `customer-merge.ts` controller
11. Write unit tests for merge controller
12. Create `customer.controller.ts` (CRUD only)
13. Write unit tests for CRUD controller
14. Update module registration
15. Write integration tests
16. Write E2E tests
17. Run all tests and verify
18. Rename original files to `.backup`
19. Final verification

## Benefits of This Design

1. **Maintainability**: Each controller < 300 lines, focused responsibility
2. **Testability**: Smaller files easier to test, better coverage
3. **Readability**: Clear separation of concerns
4. **Scalability**: Easy to add new endpoints to appropriate controller
5. **Safety**: Backup strategy allows easy rollback
6. **Consistency**: Maintains all existing patterns and conventions
7. **Documentation**: Swagger docs remain accurate and complete

## Risks and Mitigations

| Risk                           | Mitigation                                     |
| ------------------------------ | ---------------------------------------------- |
| Breaking API contracts         | E2E tests comparing old vs new responses       |
| Missing imports after refactor | TypeScript compilation + import analysis       |
| Lost functionality             | Comprehensive test coverage                    |
| Performance regression         | Performance tests comparing response times     |
| Swagger docs out of sync       | Verify all decorators are preserved            |
| Module registration issues     | Integration tests verifying route registration |

## Success Criteria

The refactoring is successful when:

1. ✅ All 4 controllers created and < 300 lines each
2. ✅ All DTOs refactored without `.dto` suffix
3. ✅ All existing tests pass
4. ✅ New tests added with > 80% coverage
5. ✅ API endpoints unchanged and functional
6. ✅ Logging preserved with same structure
7. ✅ Module registration updated correctly
8. ✅ Original files backed up with `.backup` extension
9. ✅ All imports updated to new paths
10. ✅ Application compiles and runs successfully
11. ✅ Swagger documentation accurate
12. ✅ No performance regression
