# Requirements Document - Customer Pagination Fix

## Introduction

The customer search pagination feature is not working correctly. When users navigate between pages (1, 2, 3), they see the same customers on all pages instead of different customers. This breaks the user experience and makes it impossible to browse through the full customer list.

## Glossary

- **Customer**: A client of a business who can book appointments
- **Pagination**: The process of dividing a large dataset into discrete pages
- **Offset**: The number of records to skip before starting to return results
- **Limit**: The maximum number of records to return per page
- **Page**: A subset of the total dataset, identified by a page number

## Requirements

### Requirement 1: Correct Pagination Offset

**User Story:** As a business owner, I want to see different customers on each page, so that I can browse through my entire customer list.

#### Acceptance Criteria

1. WHEN a user requests page 1 with limit 12, THE System SHALL return customers 1-12 (offset 0)
2. WHEN a user requests page 2 with limit 12, THE System SHALL return customers 13-24 (offset 12)
3. WHEN a user requests page 3 with limit 12, THE System SHALL return customers 25-36 (offset 24)
4. WHEN a user requests page N with limit L, THE System SHALL calculate offset as (N-1) × L
5. THE System SHALL apply the calculated offset using TypeORM's `skip()` method before executing the query

### Requirement 2: Pagination Metadata Accuracy

**User Story:** As a business owner, I want accurate pagination information, so that I know how many pages exist and can navigate correctly.

#### Acceptance Criteria

1. WHEN the System returns search results, THE System SHALL include the current page number
2. WHEN the System returns search results, THE System SHALL include the total number of records
3. WHEN the System returns search results, THE System SHALL include the total number of pages calculated as Math.ceil(total / limit)
4. WHEN the System returns search results, THE System SHALL include hasNextPage flag (true if page < totalPages)
5. WHEN the System returns search results, THE System SHALL include hasPreviousPage flag (true if page > 1)

### Requirement 3: Consistent Ordering

**User Story:** As a business owner, I want customers to appear in a consistent order across pages, so that pagination is predictable.

#### Acceptance Criteria

1. WHEN no sort order is specified, THE System SHALL sort customers by created_at in descending order (newest first)
2. WHEN sorting by name, THE System SHALL apply a secondary sort by created_at to ensure consistent ordering for customers with the same name
3. WHEN sorting by appointmentCount, THE System SHALL apply a secondary sort by created_at to ensure consistent ordering for customers with the same count
4. THE System SHALL apply the sort order before applying pagination offset and limit

### Requirement 4: Edge Case Handling

**User Story:** As a business owner, I want the system to handle edge cases gracefully, so that I don't encounter errors when browsing customers.

#### Acceptance Criteria

1. WHEN a user requests a page number beyond the total pages, THE System SHALL return an empty array of customers with correct metadata
2. WHEN a user requests page 0 or negative page number, THE System SHALL treat it as page 1
3. WHEN a user requests a limit of 0 or negative limit, THE System SHALL use the default limit of 10
4. WHEN a user requests a limit greater than 100, THE System SHALL cap it at 100
5. WHEN there are no customers matching the filters, THE System SHALL return total=0, totalPages=0, and empty customers array

### Requirement 5: Performance Optimization

**User Story:** As a business owner, I want customer search to be fast, so that I can quickly find the customers I need.

#### Acceptance Criteria

1. THE System SHALL execute only one COUNT query to get the total number of matching records
2. THE System SHALL execute only one SELECT query with OFFSET and LIMIT to get the page of results
3. THE System SHALL use database indexes on business_id, created_at, and name columns for efficient querying
4. THE System SHALL complete the search query in less than 500ms for datasets up to 10,000 customers
5. THE System SHALL log query execution time for monitoring and optimization

## Testing Requirements

### Unit Tests

1. Test offset calculation for various page numbers and limits
2. Test pagination metadata calculation (totalPages, hasNextPage, hasPreviousPage)
3. Test edge cases (page 0, negative page, page beyond total, limit 0, limit > 100)

### Integration Tests

1. Test actual database queries with pagination
2. Verify different results on different pages
3. Test with various sort orders
4. Test with filters applied

### Property-Based Tests

1. **Property 1: Pagination Consistency** - For any valid page number and limit, the offset should equal (page - 1) × limit
2. **Property 2: No Duplicate Records** - For any two different pages with the same filters and sort order, the returned customer IDs should not overlap
3. **Property 3: Complete Coverage** - For any dataset, iterating through all pages should return all records exactly once
4. **Property 4: Metadata Accuracy** - For any search result, totalPages should equal Math.ceil(total / limit)

### End-to-End Tests

1. Test navigating through multiple pages in the frontend
2. Verify that each page shows different customers
3. Test that the last page shows the correct number of remaining customers
4. Test pagination with search filters applied
