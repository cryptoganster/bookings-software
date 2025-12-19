# Design Document - Customer BC Enhancements

## 1. Overview

Este documento define el diseño técnico para las mejoras post-MVP del Customer BC, incluyendo gestión avanzada de clientes, búsqueda, deduplicación, GDPR compliance, y UI dedicada en el frontend.

### 1.1 Arquitectura General

```
Frontend (React + FSD)
         ↓
Backend API (NestJS)
         ↓
Application Layer (Commands/Queries/Handlers)
         ↓
Domain Layer (Aggregates/VOs/Events)
         ↓
Infrastructure Layer (Repositories/Database)
```

### 1.2 Principios Arquitectónicos

- **Feature-Sliced Design (FSD)**: Frontend organizado en capas (shared, entities, features, widgets, pages, app)
- **Clean Architecture**: Backend con separación de capas (domain, application, infrastructure, presentation)
- **CQRS Estricto**: Separación total entre escritura y lectura
- **Multi-tenancy**: Customer único por (businessId, whatsappPhone)
- **GDPR Compliance**: Soft delete con anonimización

## 2. Backend Design

### 2.1 New Commands

#### MergeCustomersCommand

**Ubicación**: `apps/backend/src/customer/app/commands/merge-customers/command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

export class MergeCustomersCommand extends Command<void> {
  constructor(
    public readonly sourceCustomerId: string,
    public readonly targetCustomerId: string,
    public readonly mergedBy: string, // userId of business owner
  ) {
    super();
  }
}
```

**Handler**: `merge-customers/handler.ts`

**Responsibilities:**

1. Load both customers using Factory
2. Validate they belong to same business
3. Validate source !== target
4. Update all appointments: sourceCustomerId → targetCustomerId
5. Update all conversations: sourceCustomerId → targetCustomerId
6. Mark source customer as merged (soft delete with merged_into field)
7. Publish CustomersMerged event
8. Use transaction for atomicity

**Optimistic Locking:** Use version field on both customers to prevent concurrent modifications

#### DeleteCustomerCommand

**Ubicación**: `apps/backend/src/customer/app/commands/delete-customer/command.ts`

```typescript
import { Command } from "@nestjs/cqrs";

export class DeleteCustomerCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly deletedBy: string, // userId of business owner
  ) {
    super();
  }
}
```

**Handler**: `delete-customer/handler.ts`

**Responsibilities:**

1. Load customer using Factory
2. Verify no future appointments exist
3. Anonymize data: name → null, whatsappPhone → "DELETED\_[timestamp]"
4. Unlink from User if linked
5. Publish CustomerDeleted event
6. Use transaction for atomicity

**GDPR Compliance:** Soft delete preserves referential integrity while removing personal data

### 2.2 New Queries

#### SearchCustomersQuery

**Ubicación**: `apps/backend/src/customer/app/queries/search-customers/query.ts`

```typescript
import { Query } from "@nestjs/cqrs";

export interface SearchCustomersFilters {
  businessId: string;
  searchText?: string; // Search in name and phone
  type?: "anonymous" | "registered" | "all";
  dateRange?: { start: Date; end: Date };
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "appointmentCount";
  sortOrder?: "asc" | "desc";
}

export interface SearchCustomersResult {
  customers: CustomerReadModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SearchCustomersQuery extends Query<SearchCustomersResult> {
  constructor(public readonly filters: SearchCustomersFilters) {
    super();
  }
}
```

**Handler**: `search-customers/handler.ts`

**Implementation:**

- Use TypeORM QueryBuilder with LIKE for text search
- Escape special characters (%, \_, \) to prevent SQL injection
- Use LOWER() for case-insensitive search
- Add indexes on name and whatsappPhone columns
- Implement pagination with OFFSET and LIMIT

#### DetectDuplicateCustomersQuery

**Ubicación**: `apps/backend/src/customer/app/queries/detect-duplicate-customers/query.ts`

```typescript
import { Query } from "@nestjs/cqrs";

export interface DuplicateCustomerPair {
  customer1: CustomerReadModel;
  customer2: CustomerReadModel;
  similarityScore: number;
  reasons: string[]; // e.g., ["Similar names", "Same phone digits"]
}

export class DetectDuplicateCustomersQuery extends Query<
  DuplicateCustomerPair[]
> {
  constructor(
    public readonly businessId: string,
    public readonly threshold: number = 0.8, // Similarity threshold (0-1)
  ) {
    super();
  }
}
```

**Handler**: `detect-duplicate-customers/handler.ts`

**Deduplication Algorithm:**

1. Load all customers for business
2. Normalize phone numbers (remove +, spaces, dashes)
3. Compare each pair using:
   - **Levenshtein distance** for names (if both have names)
   - **Phone number similarity** (last 7-10 digits)
4. Calculate similarity score: `(nameSimilarity + phoneSimilarity) / 2`
5. Return pairs with score >= threshold
6. Sort by similarity score (descending)

**Performance:** O(n²) complexity - optimize with:

- Limit to customers with names (skip anonymous)
- Use phone number prefix grouping
- Cache results for 1 hour

#### GetCustomerStatsQuery

**Ubicación**: `apps/backend/src/customer/app/queries/get-customer-stats/query.ts`

```typescript
import { Query } from "@nestjs/cqrs";

export interface CustomerStats {
  totalCustomers: number;
  anonymousCount: number;
  registeredCount: number;
  newThisMonth: number;
  newThisWeek: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string | null;
    appointmentCount: number;
  }>;
}

export class GetCustomerStatsQuery extends Query<CustomerStats> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

**Handler**: `get-customer-stats/handler.ts`

**Implementation:**

- Use aggregation queries (COUNT, GROUP BY)
- Join with appointments table for appointmentCount
- Use date functions for time-based filtering
- Cache results for 5 minutes

#### ExportCustomerDataQuery

**Ubicación**: `apps/backend/src/customer/app/queries/export-customer-data/query.ts`

```typescript
import { Query } from "@nestjs/cqrs";

export interface CustomerDataExport {
  customer: {
    id: string;
    name: string | null;
    whatsappPhone: string;
    createdAt: string; // ISO 8601
    updatedAt: string;
  };
  appointments: Array<{
    id: string;
    offeringName: string;
    dateTime: string;
    status: string;
    createdAt: string;
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

export class ExportCustomerDataQuery extends Query<CustomerDataExport> {
  constructor(public readonly customerId: string) {
    super();
  }
}
```

**Handler**: `export-customer-data/handler.ts`

**Implementation:**

- Load customer with all related data (appointments, conversations, messages)
- Format dates in ISO 8601
- Exclude internal fields (version, system IDs)
- Return JSON structure ready for download

### 2.3 New Domain Events

#### CustomersMerged

**Ubicación**: `apps/backend/src/customer/domain/events/customers-merged.ts`

```typescript
export class CustomersMerged {
  constructor(
    public readonly sourceCustomerId: string,
    public readonly targetCustomerId: string,
    public readonly mergedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### CustomerDeleted

**Ubicación**: `apps/backend/src/customer/domain/events/customer-deleted.ts`

```typescript
export class CustomerDeleted {
  constructor(
    public readonly customerId: string,
    public readonly deletedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

### 2.4 Database Changes

#### Migration: Add merged_into column

**Ubicación**: `apps/backend/src/database/migrations/XXXXXX-add-merged-into-to-customers.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMergedIntoToCustomers1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "customers",
      new TableColumn({
        name: "merged_into",
        type: "uuid",
        isNullable: true,
        comment: "ID of target customer if this customer was merged",
      }),
    );

    // Add index for querying merged customers
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_merged_into" 
      ON "customers" ("merged_into") 
      WHERE "merged_into" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("customers", "merged_into");
  }
}
```

#### Migration: Add indexes for search

**Ubicación**: `apps/backend/src/database/migrations/XXXXXX-add-search-indexes-to-customers.ts`

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchIndexesToCustomers1234567890125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for name search (case-insensitive)
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_name_lower" 
      ON "customers" (LOWER("name"))
    `);

    // Index for phone search
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_whatsapp_phone" 
      ON "customers" ("whatsapp_phone")
    `);

    // Index for user_id (registered customers)
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_user_id" 
      ON "customers" ("user_id") 
      WHERE "user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("customers", "IDX_customers_name_lower");
    await queryRunner.dropIndex("customers", "IDX_customers_whatsapp_phone");
    await queryRunner.dropIndex("customers", "IDX_customers_user_id");
  }
}
```

### 2.5 Repository Updates

#### ICustomerReadRepository - Add search method

**Ubicación**: `apps/backend/src/customer/domain/interfaces/repositories/customer-read.ts`

```typescript
export interface ICustomerReadRepository {
  // ... existing methods

  /**
   * Search customers with filters and pagination
   */
  search(filters: SearchCustomersFilters): Promise<SearchCustomersResult>;

  /**
   * Get customer statistics for a business
   */
  getStats(businessId: string): Promise<CustomerStats>;

  /**
   * Get customer with all related data for export
   */
  getFullData(customerId: string): Promise<CustomerDataExport>;
}
```

#### CustomerReadRepository - Implement search

**Ubicación**: `apps/backend/src/customer/infra/persistence/repositories/customer-read.ts`

```typescript
async search(filters: SearchCustomersFilters): Promise<SearchCustomersResult> {
  const { businessId, searchText, type, dateRange, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const queryBuilder = this.repository
    .createQueryBuilder('customer')
    .where('customer.businessId = :businessId', { businessId })
    .andWhere('customer.merged_into IS NULL'); // Exclude merged customers

  // Search text filter
  if (searchText) {
    const escapedText = searchText.replace(/[%_\\]/g, '\\$&');
    queryBuilder.andWhere(
      '(LOWER(customer.name) LIKE LOWER(:searchText) OR customer.whatsappPhone LIKE :searchText)',
      { searchText: `%${escapedText}%` }
    );
  }

  // Type filter
  if (type === 'anonymous') {
    queryBuilder.andWhere('customer.userId IS NULL');
  } else if (type === 'registered') {
    queryBuilder.andWhere('customer.userId IS NOT NULL');
  }

  // Date range filter
  if (dateRange) {
    queryBuilder.andWhere('customer.createdAt BETWEEN :start AND :end', {
      start: dateRange.start,
      end: dateRange.end
    });
  }

  // Sorting
  const sortColumn = sortBy === 'appointmentCount' ? 'appointmentCount' : `customer.${sortBy}`;
  queryBuilder.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

  // Pagination
  const offset = (page - 1) * limit;
  queryBuilder.skip(offset).take(limit);

  // Execute query
  const [customers, total] = await queryBuilder.getManyAndCount();

  return {
    customers: customers.map(CustomerReadMapper.toReadModel),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
```

## 3. Frontend Design

### 3.1 Customer Entity Layer

**Ubicación**: `apps/frontend/src/entities/customer/`

**Estructura FSD:**

```
entities/customer/
├── index.ts                    # Public API
├── model/
│   ├── types.ts                # CustomerReadModel (from shared-types)
│   ├── useCustomer.ts          # Hook: useCustomer(id)
│   ├── useCustomers.ts         # Hook: useCustomers(filters)
│   └── useCustomersByUserId.ts # Hook: useCustomersByUserId(userId)
└── ui/
    ├── CustomerCard.tsx        # Card component
    ├── CustomerAvatar.tsx      # Avatar with initials
    ├── CustomerBadge.tsx       # Badge (Anonymous/Registered)
    └── index.ts                # Export UI components
```

#### model/types.ts

```typescript
import type { CustomerReadModel } from "@packages/shared-types";

export type { CustomerReadModel };

export interface CustomerFilters {
  businessId: string;
  searchText?: string;
  type?: "anonymous" | "registered" | "all";
  dateRange?: { start: Date; end: Date };
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "appointmentCount";
  sortOrder?: "asc" | "desc";
}

export interface CustomerSearchResult {
  customers: CustomerReadModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### model/useCustomer.ts

```typescript
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@shared/api/customers";
import type { CustomerReadModel } from "./types";

export const customerKeys = {
  all: ["customers"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
  list: (filters: any) => [...customerKeys.all, "list", filters] as const,
  byUserId: (userId: string) =>
    [...customerKeys.all, "byUserId", userId] as const,
};

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  });
}
```

#### model/useCustomers.ts

```typescript
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@shared/api/customers";
import type { CustomerFilters, CustomerSearchResult } from "./types";
import { customerKeys } from "./useCustomer";

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customersApi.search(filters),
    keepPreviousData: true, // For pagination
  });
}
```

#### ui/CustomerCard.tsx

```typescript
import { Card, Group, Text, Badge, Avatar } from '@mantine/core';
import type { CustomerReadModel } from '../model/types';
import { formatCustomerName, getCustomerInitials } from '@shared/lib/customer';

interface CustomerCardProps {
  customer: CustomerReadModel;
  onClick?: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder onClick={onClick} style={{ cursor: 'pointer' }}>
      <Group position="apart">
        <Group>
          <Avatar color="blue" radius="xl">
            {getCustomerInitials(customer)}
          </Avatar>
          <div>
            <Text weight={500}>{formatCustomerName(customer)}</Text>
            <Text size="sm" color="dimmed">{customer.whatsappPhone}</Text>
          </div>
        </Group>
        <Badge color={customer.userId ? 'green' : 'gray'}>
          {customer.userId ? 'Registrado' : 'Anónimo'}
        </Badge>
      </Group>
    </Card>
  );
}
```

#### ui/CustomerBadge.tsx

```typescript
import { Badge } from '@mantine/core';
import type { CustomerReadModel } from '../model/types';

interface CustomerBadgeProps {
  customer: CustomerReadModel;
}

export function CustomerBadge({ customer }: CustomerBadgeProps) {
  return (
    <Badge color={customer.userId ? 'green' : 'gray'} variant="light">
      {customer.userId ? 'Registrado' : 'Anónimo'}
    </Badge>
  );
}
```

### 3.2 Customer Features

#### Feature: Search Customers

**Ubicación**: `apps/frontend/src/features/customer/search/`

```
features/customer/search/
├── index.ts
├── ui/
│   ├── SearchCustomersForm.tsx  # Search input with filters
│   └── CustomerFilters.tsx      # Filter dropdowns
└── model/
    └── useSearchCustomers.ts    # Hook with debounce
```

#### Feature: Merge Customers

**Ubicación**: `apps/frontend/src/features/customer/merge/`

```
features/customer/merge/
├── index.ts
├── ui/
│   ├── MergeCustomersModal.tsx  # Modal with preview
│   └── CustomerComparisonCard.tsx # Side-by-side comparison
└── model/
    └── useMergeCustomers.ts     # Mutation hook
```

#### Feature: Delete Customer

**Ubicación**: `apps/frontend/src/features/customer/delete/`

```
features/customer/delete/
├── index.ts
├── ui/
│   └── DeleteCustomerModal.tsx  # Confirmation modal with GDPR warning
└── model/
    └── useDeleteCustomer.ts     # Mutation hook
```

### 3.3 Customer Pages

#### CustomersPage (List)

**Ubicación**: `apps/frontend/src/pages/CustomersPage/`

```typescript
import { Container, Title, TextInput, Group, Table, Pagination } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useCustomers } from '@entities/customer';
import { SearchCustomersForm } from '@features/customer/search';
import { CustomerCard } from '@entities/customer';

export function CustomersPage() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchText, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomers({
    businessId: 'current-business-id', // From auth context
    searchText: debouncedSearch,
    page,
    limit: 20,
  });

  return (
    <Container size="xl">
      <Title order={1}>Clientes</Title>

      <SearchCustomersForm
        value={searchText}
        onChange={setSearchText}
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Table>
            {/* Customer rows */}
          </Table>

          <Pagination
            total={data?.totalPages || 0}
            value={page}
            onChange={setPage}
          />
        </>
      )}
    </Container>
  );
}
```

#### CustomerDetailPage

**Ubicación**: `apps/frontend/src/pages/CustomerDetailPage/`

```typescript
import { useParams } from 'react-router-dom';
import { Container, Title, Group, Badge, Button } from '@mantine/core';
import { useCustomer } from '@entities/customer';
import { CustomerBadge } from '@entities/customer';
import { DeleteCustomerModal } from '@features/customer/delete';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id!);

  if (isLoading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <Container size="xl">
      <Group position="apart">
        <div>
          <Title order={1}>{customer.name || 'Cliente sin nombre'}</Title>
          <CustomerBadge customer={customer} />
        </div>
        <Group>
          <Button variant="outline">Editar</Button>
          <Button variant="outline" color="red">Eliminar</Button>
        </Group>
      </Group>

      {/* Customer details, appointments, conversations */}
    </Container>
  );
}
```

### 3.4 Customer Analytics Widget

**Ubicación**: `apps/frontend/src/widgets/CustomerAnalytics/`

```typescript
import { Card, Group, Text, RingProgress } from '@mantine/core';
import { useCustomerStats } from '@entities/customer';

export function CustomerAnalyticsWidget() {
  const { data: stats, isLoading } = useCustomerStats('current-business-id');

  if (isLoading) return <Card>Loading...</Card>;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="lg" weight={500}>Clientes</Text>

      <Group position="apart" mt="md">
        <div>
          <Text size="xl" weight={700}>{stats?.totalCustomers}</Text>
          <Text size="sm" color="dimmed">Total</Text>
        </div>

        <RingProgress
          sections={[
            { value: (stats?.registeredCount / stats?.totalCustomers) * 100, color: 'green' },
          ]}
          label={
            <Text size="xs" align="center">
              {Math.round((stats?.registeredCount / stats?.totalCustomers) * 100)}%
              <br />
              Registrados
            </Text>
          }
        />
      </Group>

      <Text size="sm" color="dimmed" mt="md">
        +{stats?.newThisMonth} este mes
      </Text>
    </Card>
  );
}
```

## 4. API Integration

### 4.1 Customers API Service

**Ubicación**: `apps/frontend/src/shared/api/customers.ts`

```typescript
import { apiClient } from "./client";
import type {
  CustomerReadModel,
  CustomerFilters,
  CustomerSearchResult,
  CustomerStats,
  CustomerDataExport,
} from "@entities/customer";

export const customersApi = {
  getById: async (id: string): Promise<CustomerReadModel> => {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
  },

  search: async (filters: CustomerFilters): Promise<CustomerSearchResult> => {
    const { data } = await apiClient.get("/customers/search", {
      params: filters,
    });
    return data;
  },

  getByUserId: async (userId: string): Promise<CustomerReadModel[]> => {
    const { data } = await apiClient.get(`/customers/by-user/${userId}`);
    return data;
  },

  getStats: async (businessId: string): Promise<CustomerStats> => {
    const { data } = await apiClient.get(`/customers/stats/${businessId}`);
    return data;
  },

  merge: async (sourceId: string, targetId: string): Promise<void> => {
    await apiClient.post("/customers/merge", { sourceId, targetId });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  exportData: async (id: string): Promise<CustomerDataExport> => {
    const { data } = await apiClient.get(`/customers/${id}/export`);
    return data;
  },
};
```

## 5. Testing Strategy

### 5.1 Backend Tests

#### Unit Tests

- MergeCustomersHandler: Test merge logic, validation, transaction rollback
- DeleteCustomerHandler: Test anonymization, GDPR compliance
- SearchCustomersHandler: Test filters, pagination, SQL injection prevention
- DetectDuplicateCustomersHandler: Test deduplication algorithm, similarity scoring

#### Integration Tests

- Test merge with real database (appointments, conversations updated)
- Test delete with future appointments (should fail)
- Test search with various filters and edge cases
- Test deduplication with real customer data

#### Property-Based Tests

- Property: Merging A into B and B into A should have same effect
- Property: Searching with pagination should return each customer exactly once
- Property: Deleting customer should preserve referential integrity

### 5.2 Frontend Tests

#### Component Tests

- CustomerCard: Renders correctly, handles click
- SearchCustomersForm: Debounces input, applies filters
- MergeCustomersModal: Shows preview, confirms merge
- DeleteCustomerModal: Shows GDPR warning, confirms delete

#### Integration Tests (MSW)

- Test search flow with mock API
- Test merge flow with optimistic update
- Test delete flow with error handling

## 6. Performance Considerations

### 6.1 Database Optimization

- Add indexes on name (LOWER), whatsappPhone, userId
- Use EXPLAIN ANALYZE to optimize search queries
- Implement query result caching (5 minutes for stats)

### 6.2 Frontend Optimization

- Debounce search input (300ms)
- Use keepPreviousData for pagination (no loading flicker)
- Lazy load customer detail page
- Virtual scrolling for large customer lists (react-window)

### 6.3 Deduplication Performance

- Limit to customers with names (skip anonymous)
- Use phone number prefix grouping to reduce comparisons
- Cache deduplication results for 1 hour
- Run deduplication as background job (not real-time)

## 7. Security Considerations

### 7.1 Authorization

- Only business owner can access their customers
- Verify businessId matches authenticated user
- Audit log for merge and delete operations

### 7.2 SQL Injection Prevention

- Escape special characters in search queries
- Use parameterized queries (TypeORM handles this)
- Validate all input with class-validator

### 7.3 GDPR Compliance

- Soft delete preserves referential integrity
- Anonymization removes all personal data
- Export includes all customer data
- Audit trail for compliance verification

## 8. Migration Strategy

### 8.1 Database Migrations

1. Add merged_into column (nullable)
2. Add search indexes (name, phone, userId)
3. Backfill data if needed (none required)

### 8.2 Deployment

1. Deploy backend with new commands/queries
2. Run database migrations
3. Deploy frontend with new UI
4. Monitor for errors and performance issues

### 8.3 Rollback Plan

- Revert database migrations (drop column, drop indexes)
- Revert backend deployment
- Revert frontend deployment

## 9. Monitoring and Observability

### 9.1 Metrics

- Customer search response time (p50, p95, p99)
- Deduplication execution time
- Merge operation success rate
- Delete operation success rate

### 9.2 Logging

- Log all merge operations with source/target IDs
- Log all delete operations with customer ID
- Log search queries with filters (for debugging)
- Log deduplication results (pairs found, threshold used)

### 9.3 Alerts

- Alert if search response time > 500ms
- Alert if merge operation fails
- Alert if delete operation fails with future appointments

---

**End of Design Document**
