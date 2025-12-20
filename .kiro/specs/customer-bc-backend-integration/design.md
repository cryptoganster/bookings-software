# Design Document - Customer BC Backend Integration

## Overview

This document provides the technical design for implementing the REST API layer (Presentation Layer) for the Customer BC, enabling complete backend-frontend integration. The design follows Clean Architecture, CQRS patterns, and NestJS best practices.

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Presentation Layer (NEW)                        │
│  - CustomerController                                   │
│  - DTOs (Request/Response)                              │
│  - Guards (JwtAuthGuard)                                │
│  - Pipes (ValidationPipe)                               │
│  - Exception Filters                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Application Layer (EXISTING)                    │
│  - Command Handlers                                     │
│  - Query Handlers                                       │
│  - Event Handlers                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Domain Layer (EXISTING)                         │
│  - Aggregates, Value Objects, Events                    │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
HTTP Request
    ↓
Controller (validate, extract user)
    ↓
CommandBus / QueryBus
    ↓
Handler (business logic)
    ↓
Repository (persistence)
    ↓
HTTP Response (DTO)
```

---

## Components and Interfaces

### 1. CustomerController

**Location:** `apps/backend/src/customer/presentation/controllers/customer.controller.ts`

**Responsibilities:**

- Handle HTTP requests
- Validate input with DTOs
- Extract authenticated user from JWT
- Dispatch commands/queries via CQRS buses
- Transform responses to DTOs
- Handle errors with exception filters

**Endpoints:**

```typescript
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('search')
  async search(@Query() dto: SearchCustomersDto, @CurrentUser() user: UserPayload): Promise<SearchCustomersResponseDto>

  @Get('stats')
  async getStats(@CurrentUser() user: UserPayload): Promise<CustomerStatsResponseDto>

  @Get('duplicates')
  async getDuplicates(@Query() dto: DetectDuplicatesDto, @CurrentUser() user: UserPayload): Promise<DuplicatePairsResponseDto>

  @Get('by-user/:userId')
  async getByUserId(@Param('userId') userId: string, @CurrentUser() user: UserPayload): Promise<CustomerReadModel[]>

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<CustomerReadModel>

  @Get(':id/export')
  async exportData(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<CustomerDataExport>

  @Post('merge')
  async merge(@Body() dto: MergeCustomersDto, @CurrentUser() user: UserPayload): Promise<MessageResponseDto>

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<MessageResponseDto>
}
```

---

### 2. Request DTOs

**Location:** `apps/backend/src/customer/presentation/dtos/`

#### SearchCustomersDto

```typescript
export class SearchCustomersDto {
  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @IsEnum(["anonymous", "registered"])
  type?: "anonymous" | "registered";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(["name", "createdAt", "appointmentCount"])
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
```

#### DetectDuplicatesDto

```typescript
export class DetectDuplicatesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  threshold?: number = 0.8;
}
```

#### MergeCustomersDto

```typescript
export class MergeCustomersDto {
  @IsUUID()
  @IsNotEmpty()
  sourceCustomerId: string;

  @IsUUID()
  @IsNotEmpty()
  targetCustomerId: string;
}
```

---

### 3. Response DTOs

#### SearchCustomersResponseDto

```typescript
export class SearchCustomersResponseDto {
  customers: CustomerReadModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### CustomerStatsResponseDto

```typescript
export class CustomerStatsResponseDto {
  totalCustomers: number;
  anonymousCount: number;
  registeredCount: number;
  newThisWeek: number;
  newThisMonth: number;
  topCustomers: Array<{
    id: string;
    name: string;
    appointmentCount: number;
  }>;
}
```

#### DuplicatePairsResponseDto

```typescript
export class DuplicatePairsResponseDto {
  pairs: Array<{
    customer1: CustomerReadModel;
    customer2: CustomerReadModel;
    similarityScore: number;
    reasons: string[];
  }>;
}
```

#### MessageResponseDto

```typescript
export class MessageResponseDto {
  message: string;
}
```

---

### 4. Authentication & Authorization

#### JwtAuthGuard

**Location:** `apps/backend/src/auth/guards/jwt-auth.guard.ts` (existing)

**Behavior:**

- Validates JWT token
- Extracts user payload (userId, businessId, roles)
- Attaches user to request object
- Returns 401 if token invalid/expired

#### CurrentUser Decorator

**Location:** `apps/backend/src/auth/decorators/current-user.decorator.ts` (existing)

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### Business Ownership Validation

**Pattern:** Validate in controller before dispatching command/query

```typescript
@Get(':id')
async getById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  const customer = await this.queryBus.execute(
    new GetCustomerQuery(id)
  );

  if (customer.businessId !== user.businessId) {
    throw new ForbiddenException('Access denied');
  }

  return customer;
}
```

---

### 5. Error Handling

#### DomainExceptionFilter

**Location:** `apps/backend/src/shared/filters/domain-exception.filter.ts` (existing)

**Mappings:**

- `CustomerNotFoundException` → 404 Not Found
- `CustomerAlreadyMergedException` → 400 Bad Request
- `CannotDeleteCustomerWithFutureAppointmentsException` → 400 Bad Request
- `ConcurrencyException` → 409 Conflict
- Generic `DomainException` → 400 Bad Request

#### Error Response Format

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
```

---

### 6. Validation

#### Global ValidationPipe

**Configuration in main.ts:**

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Behavior:**

- Validates all DTOs with class-validator decorators
- Strips unknown properties (whitelist)
- Rejects requests with unknown properties (forbidNonWhitelisted)
- Transforms types (string → number for query params)
- Returns 400 with field-level errors

---

## Data Models

### CustomerReadModel

**Location:** `@packages/shared-types` (existing)

```typescript
export interface CustomerReadModel {
  id: string;
  businessId: string;
  userId: string | null;
  whatsappPhone: string;
  name: string | null;
  type: "anonymous" | "registered";
  appointmentCount: number;
  createdAt: Date;
}
```

### CustomerDataExport

**Location:** `@packages/shared-types` (existing)

```typescript
export interface CustomerDataExport {
  customer: {
    id: string;
    name: string | null;
    whatsappPhone: string;
    createdAt: string;
  };
  appointments: Array<{
    id: string;
    offeringName: string;
    dateTime: string;
    status: string;
  }>;
  conversations: Array<{
    id: string;
    messages: Array<{
      content: string;
      direction: string;
      sentAt: string;
    }>;
  }>;
}
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Search returns only business customers

_For any_ authenticated user and search parameters, all returned customers should belong to the user's business.

**Validates: Requirements 1.7**

### Property 2: Pagination consistency

_For any_ valid pagination parameters (page, limit), the total number of unique customers across all pages should equal the total count.

**Validates: Requirements 1.5**

### Property 3: Merge is idempotent

_For any_ two customers, merging them multiple times should produce the same result as merging once.

**Validates: Requirements 5.8**

### Property 4: Delete anonymizes data

_For any_ customer, after deletion, the customer's name should be null and phone should match the pattern "+999{timestamp}".

**Validates: Requirements 6.2**

### Property 5: Export includes all data

_For any_ customer, the exported data should include all appointments and conversations associated with that customer.

**Validates: Requirements 7.2**

### Property 6: Authentication required

_For any_ endpoint, requests without valid JWT should return 401 Unauthorized.

**Validates: Requirements 9.1**

### Property 7: Business isolation

_For any_ two different businesses, users from business A should never access customers from business B.

**Validates: Requirements 9.2**

---

## Error Handling Strategy

### HTTP Status Codes

| Status | Use Case       | Example                               |
| ------ | -------------- | ------------------------------------- |
| 200    | Success        | Customer retrieved                    |
| 201    | Created        | (not used in this spec)               |
| 400    | Bad Request    | Invalid UUID, validation error        |
| 401    | Unauthorized   | Missing/invalid JWT                   |
| 403    | Forbidden      | Accessing another business's customer |
| 404    | Not Found      | Customer doesn't exist                |
| 409    | Conflict       | Concurrency exception                 |
| 500    | Internal Error | Unexpected error                      |

### Error Response Examples

**Validation Error (400):**

```json
{
  "statusCode": 400,
  "message": ["page must be a positive number"],
  "error": "Bad Request"
}
```

**Not Found (404):**

```json
{
  "statusCode": 404,
  "message": "Customer with id abc-123 not found",
  "error": "Not Found"
}
```

**Forbidden (403):**

```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

---

## Testing Strategy

### Unit Tests

**What to test:**

- DTO validation (class-validator decorators)
- Controller method logic (mocking CommandBus/QueryBus)
- Error mapping in exception filters

**Example:**

```typescript
describe("SearchCustomersDto", () => {
  it("should validate page is positive", async () => {
    const dto = plainToClass(SearchCustomersDto, { page: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

**What to test:**

- Full HTTP request/response cycle
- Authentication with real JWT
- Database queries with test data
- Error responses

**Example:**

```typescript
describe("GET /api/customers/search", () => {
  it("should return paginated customers", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/customers/search?page=1&limit=10")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.customers).toBeInstanceOf(Array);
    expect(response.body.total).toBeGreaterThanOrEqual(0);
  });
});
```

### Property-Based Tests

**Property 1: Search pagination**

```typescript
test.prop([fc.integer({ min: 1, max: 10 }), fc.integer({ min: 1, max: 100 })])(
  "should return consistent results across pages",
  async (page, limit) => {
    const response = await searchCustomers({ page, limit });
    expect(response.customers.length).toBeLessThanOrEqual(limit);
  },
);
```

### E2E Tests

**What to test:**

- Complete user flows (search → view → merge)
- Authentication flows
- Error scenarios

---

## Performance Considerations

### Database Indexes

**Required indexes (already created in Phase 2):**

- `customers(business_id, name)` - For search by name
- `customers(business_id, whatsapp_phone)` - For search by phone
- `customers(business_id, created_at)` - For sorting by date
- `customers(user_id)` WHERE user_id IS NOT NULL - For by-user queries

### Caching Strategy

**Stats endpoint:**

- Cache results for 5 minutes per business
- Invalidate on customer create/delete/merge

**Search endpoint:**

- No caching (real-time data)
- Rely on database indexes for performance

### Query Optimization

- Use `SELECT` with specific fields (avoid `SELECT *`)
- Use `LIMIT` and `OFFSET` for pagination
- Use `COUNT(*)` in separate query for total
- Use `LEFT JOIN` for appointment counts

---

## Security Considerations

### SQL Injection Prevention

- Use parameterized queries (TypeORM QueryBuilder)
- Escape special characters in search text
- Validate all input with class-validator

### Authentication

- JWT tokens with expiration
- Refresh token rotation (existing)
- Secure token storage (httpOnly cookies)

### Authorization

- Business-level isolation (validate businessId)
- User-level permissions (validate userId for by-user endpoint)
- Admin role for cross-business access (future)

### Rate Limiting

- 100 requests/minute per user
- 1000 requests/hour per business
- Exponential backoff for repeated failures

---

## API Documentation

### OpenAPI/Swagger

**Configuration:**

```typescript
const config = new DocumentBuilder()
  .setTitle("Customer BC API")
  .setDescription("Customer management endpoints")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);
```

**Decorators:**

```typescript
@ApiTags('customers')
@ApiBearerAuth()
@ApiOperation({ summary: 'Search customers' })
@ApiResponse({ status: 200, type: SearchCustomersResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

---

## Deployment Considerations

### Environment Variables

```bash
# Already configured
JWT_SECRET=...
JWT_EXPIRATION=1d
DB_HOST=...
DB_PORT=5432
```

### Health Checks

- Existing `/api/health` endpoint includes database check
- No additional health checks needed

### Monitoring

- Log all API requests with Pino
- Track response times
- Monitor error rates
- Alert on high error rates (>5%)

---

## Migration Path

### Phase 1: Create Controller and DTOs

- Create CustomerController
- Create all Request/Response DTOs
- Register in CustomerModule

### Phase 2: Implement Query Endpoints

- GET /api/customers/search
- GET /api/customers/stats
- GET /api/customers/:id
- GET /api/customers/duplicates
- GET /api/customers/by-user/:userId
- GET /api/customers/:id/export

### Phase 3: Implement Command Endpoints

- POST /api/customers/merge
- DELETE /api/customers/:id

### Phase 4: Testing and Documentation

- Write unit tests
- Write integration tests
- Write E2E tests
- Generate Swagger docs

---

## Seed Data Design

### Comprehensive Test Dataset

**Purpose:** Provide realistic and diverse test data for all customer scenarios

**Seed Structure:**

```typescript
// 20+ customers with diverse characteristics
const seedCustomers = [
  // Anonymous customers (userId = null)
  {
    name: "Juan Pérez",
    phone: "+18095551111",
    userId: null,
    appointmentCount: 5,
  },
  {
    name: "Carlos López",
    phone: "+18095553333",
    userId: null,
    appointmentCount: 0,
  },
  { name: null, phone: "+18095554444", userId: null, appointmentCount: 1 }, // No name

  // Registered customers (userId != null)
  {
    name: "María García",
    phone: "+18095552222",
    userId: testUserId,
    appointmentCount: 10,
  },
  {
    name: "Ana Martínez",
    phone: "+18095555555",
    userId: testUserId2,
    appointmentCount: 3,
  },

  // Potential duplicates (for deduplication testing)
  { name: "Juan Perez", phone: "+18095556666", userId: null }, // Similar to Juan Pérez
  { name: "Maria Garcia", phone: "+18095557777", userId: null }, // Similar to María García

  // Merged customers (soft deleted)
  {
    name: "Pedro Sánchez",
    phone: "+999170000001",
    userId: null,
    mergedInto: targetCustomerId,
  },

  // Various date ranges (for time-based filtering)
  { name: "Luis Rodríguez", phone: "+18095558888", createdAt: "2024-01-15" },
  { name: "Carmen Díaz", phone: "+18095559999", createdAt: "2024-12-01" },

  // Edge cases
  { name: "José María de la Cruz y Fernández", phone: "+34612345678" }, // Long name, Spain
  { name: "O'Brien", phone: "+442071234567" }, // Special character, UK
  { name: "李明", phone: "+8613800138000" }, // Chinese characters, China
  { name: "Müller", phone: "+4915123456789" }, // Umlaut, Germany
];
```

**Seed Categories:**

| Category      | Count | Purpose                           |
| ------------- | ----- | --------------------------------- |
| Anonymous     | 10    | Test anonymous customer flow      |
| Registered    | 5     | Test registered customer flow     |
| No name       | 2     | Test null name handling           |
| Duplicates    | 4     | Test deduplication algorithm      |
| Merged        | 2     | Test soft delete with merged_into |
| Various dates | 5     | Test time-based filtering         |
| International | 4     | Test international phone formats  |
| Special chars | 3     | Test name edge cases              |

**Appointment Distribution:**

- 0 appointments: 5 customers
- 1-3 appointments: 8 customers
- 4-10 appointments: 5 customers
- 10+ appointments: 2 customers

---

## Database Verification

### Docker Container Access

**Container ID:** `d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0`

**Connection Commands:**

```bash
# Connect to PostgreSQL in Docker container
docker exec -it d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0 psql -U postgres -d bookings_dev

# Or using docker-compose
docker-compose exec postgres psql -U postgres -d bookings_dev
```

### Verification Queries

#### 1. Count Customers by Type

```sql
-- Total customers
SELECT COUNT(*) as total FROM customers;

-- Anonymous customers
SELECT COUNT(*) as anonymous
FROM customers
WHERE user_id IS NULL;

-- Registered customers
SELECT COUNT(*) as registered
FROM customers
WHERE user_id IS NOT NULL;

-- Merged customers
SELECT COUNT(*) as merged
FROM customers
WHERE merged_into IS NOT NULL;
```

#### 2. Verify Indexes

```sql
-- List all indexes on customers table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customers';

-- Expected indexes:
-- - customers_pkey (PRIMARY KEY on id)
-- - idx_customers_business_phone (UNIQUE on business_id, whatsapp_phone)
-- - idx_customers_business_id (on business_id)
-- - idx_customers_user_id (on user_id WHERE user_id IS NOT NULL)
-- - idx_customers_merged_into (on merged_into WHERE merged_into IS NOT NULL)
-- - idx_customers_name_search (on LOWER(name))
```

#### 3. Verify Foreign Keys

```sql
-- List foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customers';

-- Expected foreign keys:
-- - fk_customers_business (business_id -> businesses.id)
-- - fk_customers_user (user_id -> users.id)
```

#### 4. Verify Unique Constraints

```sql
-- Test unique constraint on (business_id, whatsapp_phone)
-- This should fail:
INSERT INTO customers (id, business_id, whatsapp_phone, name, version)
VALUES (gen_random_uuid(), 'existing-business-id', '+18095551111', 'Test', 0);
-- Expected: ERROR: duplicate key value violates unique constraint
```

#### 5. Sample Data Queries

```sql
-- View all customers with details
SELECT
  id,
  user_id,
  business_id,
  whatsapp_phone,
  name,
  version,
  merged_into,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;

-- Customers with appointment counts
SELECT
  c.id,
  c.name,
  c.whatsapp_phone,
  c.user_id IS NOT NULL as is_registered,
  COUNT(a.id) as appointment_count
FROM customers c
LEFT JOIN appointments a ON a.customer_id = c.id
GROUP BY c.id, c.name, c.whatsapp_phone, c.user_id
ORDER BY appointment_count DESC;

-- Potential duplicates (similar names)
SELECT
  c1.id as id1,
  c1.name as name1,
  c1.whatsapp_phone as phone1,
  c2.id as id2,
  c2.name as name2,
  c2.whatsapp_phone as phone2,
  similarity(LOWER(c1.name), LOWER(c2.name)) as name_similarity
FROM customers c1
CROSS JOIN customers c2
WHERE c1.id < c2.id
  AND c1.business_id = c2.business_id
  AND c1.merged_into IS NULL
  AND c2.merged_into IS NULL
  AND similarity(LOWER(c1.name), LOWER(c2.name)) > 0.7
ORDER BY name_similarity DESC;
```

#### 6. Time-Based Filtering

```sql
-- Customers created this week
SELECT COUNT(*) as new_this_week
FROM customers
WHERE created_at >= date_trunc('week', CURRENT_DATE);

-- Customers created this month
SELECT COUNT(*) as new_this_month
FROM customers
WHERE created_at >= date_trunc('month', CURRENT_DATE);

-- Customers by month (last 6 months)
SELECT
  date_trunc('month', created_at) as month,
  COUNT(*) as count
FROM customers
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC;
```

---

## References

- `.kiro/specs/customer-bc/` - Customer BC MVP implementation (Phase 1-10)
- `.kiro/specs/customer-bc-enhancements/` - Customer BC enhancements (Phase 1-7)
- `.kiro/specs/customer-bc-backend-integration/` - This spec (REST API integration)
- `.kiro/steering/user-customer-businessowner-architecture.md` - Identity architecture
- `.kiro/steering/nestjs-patterns.md` - NestJS patterns
- `.kiro/steering/clean-code.md` - Code quality
- `apps/backend/src/database/seeds/customer.seed.ts` - Current seed implementation
- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [class-validator](https://github.com/typestack/class-validator)
- [PostgreSQL Similarity](https://www.postgresql.org/docs/current/pgtrgm.html)
