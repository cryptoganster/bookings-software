# Design Document - Customer Pagination Fix

## Overview

This design addresses a critical bug in the customer search pagination feature where users see the same customers on all pages instead of different customers. The root cause is that the TypeORM query builder is not correctly applying the pagination offset, likely due to the query structure or the order of operations.

The fix involves:

1. Ensuring the offset calculation is correct
2. Applying the offset and limit in the correct order in the TypeORM query
3. Adding a secondary sort to ensure consistent ordering
4. Validating edge cases
5. Adding comprehensive tests to prevent regression

## Architecture

### Current Implementation (Buggy)

```typescript
// apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts
async search(filters: SearchCustomersFilters): Promise<SearchCustomersResult> {
  const queryBuilder = this.repository.createQueryBuilder('customer')
    .where('customer.business_id = :businessId', { businessId });

  // ... filters ...

  const total = await queryBuilder.getCount();

  // Sorting
  const sortColumn = sortBy === 'name' ? 'customer.name' : 'customer.created_at';
  queryBuilder.orderBy(sortColumn, sortOrder);

  // Pagination - BUG: offset might not be applied correctly
  const offset = (page - 1) * limit;
  queryBuilder.skip(offset).take(limit);

  const models = await queryBuilder.getMany();
  // ...
}
```

**Problem**: The query builder might be reusing state from the `getCount()` call, or the `skip()` and `take()` methods are not being applied correctly.

### Fixed Implementation

```typescript
async search(filters: SearchCustomersFilters): Promise<SearchCustomersResult> {
  const {
    businessId,
    searchText,
    type = 'all',
    dateRange,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = filters;

  // Normalize inputs (edge case handling)
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.max(1, Math.min(100, limit));

  // Build base query for filtering
  const baseQuery = this.repository
    .createQueryBuilder('customer')
    .where('customer.business_id = :businessId', { businessId });

  // Apply filters
  if (searchText && searchText.trim()) {
    const escapedText = searchText
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    baseQuery.andWhere(
      new Brackets((qb) => {
        qb.where('LOWER(customer.name) LIKE LOWER(:searchText)', {
          searchText: `%${escapedText}%`,
        }).orWhere('customer.whatsapp_phone LIKE :searchText', {
          searchText: `%${escapedText}%`,
        });
      }),
    );
  }

  if (type === 'anonymous') {
    baseQuery.andWhere('customer.user_id IS NULL');
  } else if (type === 'registered') {
    baseQuery.andWhere('customer.user_id IS NOT NULL');
  }

  if (dateRange) {
    baseQuery.andWhere('customer.created_at BETWEEN :startDate AND :endDate', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }

  // Get total count BEFORE adding sorting and pagination
  const total = await baseQuery.getCount();

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / normalizedLimit);
  const offset = (normalizedPage - 1) * normalizedLimit;

  // Clone the query for the data fetch to avoid state pollution
  const dataQuery = baseQuery.clone();

  // Apply sorting with secondary sort for consistency
  const primarySort = sortBy === 'name' ? 'customer.name' : 'customer.created_at';
  dataQuery.orderBy(primarySort, sortOrder);

  // Always add secondary sort by created_at for consistency
  if (sortBy !== 'createdAt') {
    dataQuery.addOrderBy('customer.created_at', 'DESC');
  }

  // Apply pagination AFTER sorting
  dataQuery.skip(offset).take(normalizedLimit);

  // Execute query
  const models = await dataQuery.getMany();

  // Map to read models
  const customers = models.map((model) => ({
    id: model.id,
    userId: model.user_id,
    businessId: model.business_id,
    whatsappPhone: model.whatsapp_phone,
    name: model.name,
    createdAt: model.created_at,
    appointmentCount: 0, // TODO: Join with appointments table
  }));

  return {
    customers,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages,
  };
}
```

### Key Changes

1. **Input Normalization**: Validate and normalize page and limit values before use
2. **Query Cloning**: Clone the base query before adding sorting and pagination to avoid state pollution
3. **Secondary Sort**: Always add `created_at` as a secondary sort field for consistent ordering
4. **Correct Order of Operations**:
   - Build base query with filters
   - Get count
   - Clone query
   - Add sorting
   - Add pagination
   - Execute

## Components and Interfaces

### Modified Components

#### CustomerReadRepository

**File**: `apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts`

**Changes**:

- Add input normalization for page and limit
- Clone query before adding sorting and pagination
- Add secondary sort by created_at
- Improve error handling

### Data Models

No changes to data models required. The issue is in the query logic, not the data structure.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Offset Calculation Accuracy

_For any_ valid page number N and limit L, the calculated offset should equal (N - 1) × L, and the query should skip exactly that many records.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

**Test Strategy**: Generate random page numbers (1-100) and limits (1-100), verify offset calculation and that different pages return different records.

### Property 2: Metadata Accuracy

_For any_ search result, the metadata fields (page, total, totalPages, hasNextPage, hasPreviousPage) should be calculated correctly according to the formulas:

- totalPages = Math.ceil(total / limit)
- hasNextPage = page < totalPages
- hasPreviousPage = page > 1

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

**Test Strategy**: Generate random datasets and pagination parameters, verify all metadata calculations.

### Property 3: No Duplicate Records Across Pages

_For any_ two different pages with the same filters and sort order, the returned customer IDs should not overlap.

**Validates: Requirements 1.5, 3.4**

**Test Strategy**: Generate random datasets, fetch multiple pages, verify no customer ID appears on more than one page.

### Property 4: Complete Coverage

_For any_ dataset, iterating through all pages should return all records exactly once (no missing records, no duplicates).

**Validates: Requirements 1.5, 3.4**

**Test Strategy**: Generate random datasets, fetch all pages, verify that the union of all pages equals the complete dataset.

### Property 5: Stable Sorting

_For any_ sort field, when multiple records have the same value for that field, they should be consistently ordered by created_at in descending order across multiple queries.

**Validates: Requirements 3.2, 3.3, 3.4**

**Test Strategy**: Create datasets with duplicate values, query multiple times, verify consistent ordering.

### Property 6: Edge Case - Page Beyond Total

_For any_ page number greater than totalPages, the system should return an empty array with correct metadata (total, totalPages unchanged).

**Validates: Requirements 4.1**

**Test Strategy**: Generate datasets, request page numbers beyond totalPages, verify empty results with correct metadata.

### Property 7: Edge Case - Invalid Page Numbers

_For any_ page number less than or equal to 0, the system should normalize it to page 1.

**Validates: Requirements 4.2**

**Test Strategy**: Test with page values: 0, -1, -100, verify all treated as page 1.

### Property 8: Edge Case - Invalid Limits

_For any_ limit less than or equal to 0, the system should use default limit of 10. For any limit greater than 100, the system should cap it at 100.

**Validates: Requirements 4.3, 4.4**

**Test Strategy**: Test with limit values: 0, -1, 101, 1000, verify normalization.

### Property 9: Edge Case - Empty Results

_For any_ search with no matching records, the system should return total=0, totalPages=0, empty customers array, and correct boolean flags.

**Validates: Requirements 4.5**

**Test Strategy**: Create searches that match no records, verify response structure.

## Error Handling

### Input Validation

```typescript
// Normalize page (minimum 1)
const normalizedPage = Math.max(1, page);

// Normalize limit (minimum 1, maximum 100)
const normalizedLimit = Math.max(1, Math.min(100, limit));
```

### Query Errors

- TypeORM query errors should propagate to the handler
- Handler should log errors with context
- Controller should return appropriate HTTP status codes

### Edge Cases

- Page beyond total pages: Return empty array with correct metadata
- No matching records: Return empty array with total=0
- Invalid sort field: Use default sort (createdAt DESC)

## Testing Strategy

### Unit Tests

**File**: `apps/backend/src/customer/infra/persistence/repositories/__tests__/customer-read.repository.spec.ts`

Tests:

1. Offset calculation for various page/limit combinations
2. Metadata calculation (totalPages, hasNextPage, hasPreviousPage)
3. Input normalization (page, limit)
4. Query structure (sorting, filtering, pagination order)

### Integration Tests

**File**: `apps/backend/src/customer/app/queries/search-customers/__tests__/handler.integration.spec.ts`

Tests:

1. Search with pagination returns different results on different pages
2. Search with filters and pagination works correctly
3. Search with sorting and pagination maintains order
4. Edge cases with real database

### Property-Based Tests

**File**: `apps/backend/src/customer/app/queries/search-customers/__tests__/handler.pbt.spec.ts`

Tests:

1. **Property 1**: Offset calculation accuracy
2. **Property 2**: Metadata accuracy
3. **Property 3**: No duplicate records across pages
4. **Property 4**: Complete coverage
5. **Property 5**: Stable sorting
6. **Property 6-9**: Edge cases

**Configuration**: Minimum 100 iterations per property test

**Tags**:

- Feature: customer-pagination-fix
- Property 1: Offset calculation accuracy
- Property 2: Metadata accuracy
- Property 3: No duplicate records
- Property 4: Complete coverage
- Property 5: Stable sorting
- Property 6: Page beyond total
- Property 7: Invalid page numbers
- Property 8: Invalid limits
- Property 9: Empty results

### End-to-End Tests

**File**: `apps/backend/src/customer/presentation/controllers/__tests__/customer-search.e2e.spec.ts`

Tests:

1. GET /api/customers/search with pagination
2. Navigate through multiple pages
3. Verify different customers on each page
4. Verify last page has correct number of customers
5. Test with search filters applied

## Performance Considerations

### Query Optimization

1. **Single COUNT Query**: Execute count before pagination to get total
2. **Single SELECT Query**: Execute paginated query with OFFSET and LIMIT
3. **Indexes**: Ensure indexes exist on:
   - `business_id` (for filtering)
   - `created_at` (for sorting)
   - `name` (for sorting and searching)
   - `whatsapp_phone` (for searching)

### Query Cloning

Using `queryBuilder.clone()` creates a new query instance, preventing state pollution from the count query. This has minimal performance impact and ensures correctness.

### Monitoring

Log query execution time for monitoring:

```typescript
const startTime = Date.now();
const models = await dataQuery.getMany();
const duration = Date.now() - startTime;

this.logger.debug(
  {
    action: "customer_search_query",
    duration,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  },
  "Customer search query executed",
);
```

## Migration Plan

### Phase 1: Fix Repository

1. Update `CustomerReadRepository.search()` method
2. Add input normalization
3. Add query cloning
4. Add secondary sort

### Phase 2: Add Tests

1. Write unit tests for offset calculation
2. Write integration tests with real database
3. Write property-based tests
4. Write E2E tests

### Phase 3: Verify Fix

1. Run all tests
2. Manual testing in development environment
3. Verify different customers on different pages
4. Test edge cases

### Phase 4: Deploy

1. Deploy to staging
2. Run smoke tests
3. Deploy to production
4. Monitor for errors

## Rollback Plan

If issues are discovered after deployment:

1. Revert the repository changes
2. Investigate root cause
3. Fix and re-test
4. Re-deploy

The changes are isolated to the `CustomerReadRepository.search()` method, making rollback straightforward.

## Future Enhancements

1. **Cursor-Based Pagination**: For better performance with large datasets
2. **Appointment Count**: Join with appointments table to show real counts
3. **Caching**: Cache search results for frequently accessed pages
4. **Elasticsearch**: For advanced search capabilities

## References

- TypeORM QueryBuilder: https://typeorm.io/select-query-builder
- Pagination Best Practices: https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/
- Property-Based Testing: https://hypothesis.works/articles/what-is-property-based-testing/
