# Implementation Plan - Customer BC Enhancements

## Overview

Este documento proporciona un checklist de implementación paso a paso para las mejoras post-MVP del Customer BC. Cada tarea incluye pasos de validación, referencias a requirements y commits.

---

## Task List

### Phase 1: Frontend Customer Entity Layer (1 week)

- [x] 1.1 Create Customer Entity Structure
  - Create `apps/frontend/src/entities/customer/` directory
  - Create `index.ts` with public API exports
  - Create `model/` and `ui/` subdirectories
  - _Requirements: 1.1_
  - **Commit:** `feat(frontend): add customer entity structure`

- [x] 1.2 Create Customer Types
  - Create `apps/frontend/src/entities/customer/model/types.ts`
  - Import `CustomerReadModel` from `@packages/shared-types`
  - Define `CustomerFilters` interface with searchText, type, dateRange, page, limit, sortBy, sortOrder
  - Define `CustomerSearchResult` interface with customers, total, page, limit, totalPages
  - _Requirements: 1.2_
  - **Commit:** `feat(frontend): add customer types`

- [x] 1.3 Create Customer Query Keys
  - Create `apps/frontend/src/entities/customer/model/useCustomer.ts`
  - Define `customerKeys` object with: all, detail(id), list(filters), byUserId(userId)
  - Export `useCustomer(id)` hook using TanStack Query
  - _Requirements: 1.3_
  - **Commit:** `feat(frontend): add useCustomer hook`

- [x] 1.4 Create useCustomers Hook
  - Create `apps/frontend/src/entities/customer/model/useCustomers.ts`
  - Implement `useCustomers(filters)` with keepPreviousData for pagination
  - Use `customerKeys.list(filters)` for query key
  - _Requirements: 1.3_
  - **Commit:** `feat(frontend): add useCustomers hook`

- [x] 1.5 Create useCustomersByUserId Hook
  - Create `apps/frontend/src/entities/customer/model/useCustomersByUserId.ts`
  - Implement `useCustomersByUserId(userId)` for marketplace support
  - Use `customerKeys.byUserId(userId)` for query key
  - _Requirements: 1.3_
  - **Commit:** `feat(frontend): add useCustomersByUserId hook`

- [x] 1.6 Create Customer Utility Functions
  - Create `apps/frontend/src/shared/lib/customer/formatters.ts`
  - Implement `formatCustomerName(customer)` - returns name or "Cliente sin nombre"
  - Implement `formatCustomerPhone(phone)` - formats WhatsApp phone
  - Implement `getCustomerInitials(customer)` - returns initials for avatar
  - _Requirements: 1.5_
  - **Commit:** `feat(frontend): add customer utility functions`

- [x] 1.7 Create CustomerCard Component
  - Create `apps/frontend/src/entities/customer/ui/CustomerCard.tsx`
  - Use Mantine Card, Group, Text, Badge, Avatar
  - Display name, phone, type badge, appointment count
  - Handle onClick for navigation
  - _Requirements: 1.4_
  - **Commit:** `feat(frontend): add CustomerCard component`

- [x] 1.8 Create CustomerAvatar Component
  - Create `apps/frontend/src/entities/customer/ui/CustomerAvatar.tsx`
  - Use Mantine Avatar with initials
  - Color based on customer type (blue for registered, gray for anonymous)
  - _Requirements: 1.4_
  - **Commit:** `feat(frontend): add CustomerAvatar component`

- [x] 1.9 Create CustomerBadge Component
  - Create `apps/frontend/src/entities/customer/ui/CustomerBadge.tsx`
  - Use Mantine Badge
  - Show "Registrado" (green) or "Anónimo" (gray)
  - _Requirements: 1.4_
  - **Commit:** `feat(frontend): add CustomerBadge component`

- [x] 1.10 Phase 1 Checkpoint
  - Run validations: `pnpm lint:frontend && pnpm typecheck:frontend`
  - Test components in Storybook (optional)
  - **Commit:** `feat(frontend): complete customer entity layer`

### Phase 2: Backend Search and Filtering (1 week)

- [ ] 2.1 Create SearchCustomersQuery
  - Create `apps/backend/src/customer/app/queries/search-customers/query.ts`
  - Query extends `Query<SearchCustomersResult>`
  - Include filters: businessId, searchText, type, dateRange, page, limit, sortBy, sortOrder
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - **Commit:** `feat(customer): add SearchCustomersQuery`

- [ ] 2.2 Implement SearchCustomersHandler
  - Create `apps/backend/src/customer/app/queries/search-customers/handler.ts`
  - Use TypeORM QueryBuilder with LIKE for text search
  - Escape special characters (%, _, \) to prevent SQL injection
  - Implement pagination with OFFSET and LIMIT
  - Support sorting by name, createdAt, appointmentCount
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Properties: 1, 6_
  - _Edge Cases: 2, 7, 9_
  - **Commit:** `feat(customer): implement SearchCustomersHandler`

- [ ] 2.3 Update ICustomerReadRepository
  - Add `search(filters: SearchCustomersFilters): Promise<SearchCustomersResult>` method
  - _Requirements: 2.1_
  - **Commit:** `feat(customer): add search method to ICustomerReadRepository`

- [ ] 2.4 Implement CustomerReadRepository.search
  - Implement search method in `apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts`
  - Use QueryBuilder with proper escaping
  - Add LOWER() for case-insensitive search
  - Filter by type (anonymous/registered)
  - Filter by date range
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Edge Cases: 2, 7, 9_
  - **Commit:** `feat(customer): implement search in CustomerReadRepository`

- [ ] 2.5 Write Unit Tests for SearchCustomersHandler
  - Test search by name (case-insensitive)
  - Test search by phone
  - Test filter by type (anonymous/registered)
  - Test filter by date range
  - Test pagination
  - Test sorting
  - Test SQL injection prevention (special characters)
  - _Requirements: 2.1-2.5_
  - _Properties: 1, 6_
  - _Edge Cases: 2, 7, 9_
  - **Commit:** `test(customer): add unit tests for SearchCustomersHandler`

- [ ] 2.6 Create GetCustomerStatsQuery
  - Create `apps/backend/src/customer/app/queries/get-customer-stats/query.ts`
  - Query extends `Query<CustomerStats>`
  - Include: totalCustomers, anonymousCount, registeredCount, newThisMonth, newThisWeek, topCustomers
  - _Requirements: 3.1_
  - **Commit:** `feat(customer): add GetCustomerStatsQuery`

- [ ] 2.7 Implement GetCustomerStatsHandler
  - Create `apps/backend/src/customer/app/queries/get-customer-stats/handler.ts`
  - Use aggregation queries (COUNT, GROUP BY)
  - Join with appointments table for appointmentCount
  - Use date functions for time-based filtering
  - _Requirements: 3.1_
  - **Commit:** `feat(customer): implement GetCustomerStatsHandler`

- [ ] 2.8 Update ICustomerReadRepository for Stats
  - Add `getStats(businessId: string): Promise<CustomerStats>` method
  - _Requirements: 3.1_
  - **Commit:** `feat(customer): add getStats method to ICustomerReadRepository`

- [ ] 2.9 Implement CustomerReadRepository.getStats
  - Implement getStats method with aggregation queries
  - Cache results for 5 minutes
  - _Requirements: 3.1_
  - **Commit:** `feat(customer): implement getStats in CustomerReadRepository`

- [ ] 2.10 Write Unit Tests for GetCustomerStatsHandler
  - Test stats calculation
  - Test time-based filtering
  - Test top customers query
  - _Requirements: 3.1_
  - **Commit:** `test(customer): add unit tests for GetCustomerStatsHandler`

- [ ] 2.11 Create Database Migration for Search Indexes
  - Create migration `apps/backend/src/database/migrations/XXXXXX-add-search-indexes-to-customers.ts`
  - Add index on LOWER(name) for case-insensitive search
  - Add index on whatsapp_phone
  - Add index on user_id WHERE user_id IS NOT NULL
  - _Requirements: 2.1_
  - **Commit:** `feat(customer): add search indexes migration`

- [ ] 2.12 Phase 2 Checkpoint
  - Run migrations: `pnpm --filter backend migration:run`
  - Run tests: `pnpm test:backend -- --testPathPattern=search-customers`
  - Verify search performance < 200ms
  - **Commit:** `feat(customer): complete search and filtering implementation`

### Phase 3: Deduplication and Merge (3 days)

- [ ] 3.1 Create DetectDuplicateCustomersQuery
  - Create `apps/backend/src/customer/app/queries/detect-duplicate-customers/query.ts`
  - Query extends `Query<DuplicateCustomerPair[]>`
  - Include businessId and threshold (default 0.8)
  - Define `DuplicateCustomerPair` interface with customer1, customer2, similarityScore, reasons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - **Commit:** `feat(customer): add DetectDuplicateCustomersQuery`

- [ ] 3.2 Implement Deduplication Algorithm
  - Create `apps/backend/src/customer/domain/services/customer-deduplication.service.ts`
  - Implement phone normalization (remove +, spaces, dashes)
  - Implement Levenshtein distance for name similarity
  - Calculate combined similarity score
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Properties: 2_
  - _Edge Cases: 5_
  - **Commit:** `feat(customer): implement deduplication algorithm`

- [ ] 3.3 Implement DetectDuplicateCustomersHandler
  - Create `apps/backend/src/customer/app/queries/detect-duplicate-customers/handler.ts`
  - Load all customers for business
  - Use deduplication service to compare pairs
  - Return pairs with score >= threshold
  - Sort by similarity score (descending)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Properties: 2_
  - _Edge Cases: 5_
  - **Commit:** `feat(customer): implement DetectDuplicateCustomersHandler`

- [ ] 3.4 Write Unit Tests for Deduplication Service
  - Test phone normalization
  - Test Levenshtein distance calculation
  - Test similarity score calculation
  - Test edge cases (null names, same phone)
  - _Requirements: 4.1-4.5_
  - _Properties: 2_
  - _Edge Cases: 5_
  - **Commit:** `test(customer): add unit tests for deduplication service`

- [ ] 3.5 Write Unit Tests for DetectDuplicateCustomersHandler
  - Test duplicate detection
  - Test threshold filtering
  - Test symmetry (A duplicate of B = B duplicate of A)
  - _Requirements: 4.1-4.5_
  - _Properties: 2_
  - **Commit:** `test(customer): add unit tests for DetectDuplicateCustomersHandler`

- [ ] 3.6 Create MergeCustomersCommand
  - Create `apps/backend/src/customer/app/commands/merge-customers/command.ts`
  - Command extends `Command<void>`
  - Include sourceCustomerId, targetCustomerId, mergedBy
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - **Commit:** `feat(customer): add MergeCustomersCommand`

- [ ] 3.7 Implement MergeCustomersHandler
  - Create `apps/backend/src/customer/app/commands/merge-customers/handler.ts`
  - Load both customers using Factory
  - Validate they belong to same business
  - Validate source !== target
  - Update all appointments: sourceCustomerId → targetCustomerId
  - Update all conversations: sourceCustomerId → targetCustomerId
  - Mark source customer as merged (soft delete with merged_into field)
  - Publish CustomersMerged event
  - Use transaction for atomicity
  - Use optimistic locking
  - _Requirements: 5.1-5.7_
  - _Properties: 3, 7_
  - _Edge Cases: 1, 6, 8_
  - **Commit:** `feat(customer): implement MergeCustomersHandler`

- [ ] 3.8 Create CustomersMerged Event
  - Create `apps/backend/src/customer/domain/events/customers-merged.ts`
  - Include sourceCustomerId, targetCustomerId, mergedBy, occurredAt
  - _Requirements: 5.6_
  - **Commit:** `feat(customer): add CustomersMerged event`

- [ ] 3.9 Create Database Migration for merged_into Column
  - Create migration `apps/backend/src/database/migrations/XXXXXX-add-merged-into-to-customers.ts`
  - Add merged_into column (UUID, nullable)
  - Add index on merged_into WHERE merged_into IS NOT NULL
  - _Requirements: 5.5_
  - **Commit:** `feat(customer): add merged_into column migration`

- [ ] 3.10 Write Unit Tests for MergeCustomersHandler
  - Test successful merge
  - Test validation (same business, source !== target)
  - Test appointments update
  - Test conversations update
  - Test soft delete with merged_into
  - Test event publishing
  - Test transaction rollback on error
  - Test optimistic locking
  - _Requirements: 5.1-5.7_
  - _Properties: 3, 7_
  - _Edge Cases: 1, 6, 8_
  - **Commit:** `test(customer): add unit tests for MergeCustomersHandler`

- [ ] 3.11 Write Integration Tests for Merge
  - Test merge with real database
  - Test appointments are updated
  - Test conversations are updated
  - Test referential integrity
  - _Requirements: 5.1-5.7_
  - _Properties: 3_
  - **Commit:** `test(customer): add integration tests for merge`

- [ ] 3.12 Phase 3 Checkpoint
  - Run migrations: `pnpm --filter backend migration:run`
  - Run tests: `pnpm test:backend -- --testPathPattern=merge`
  - Verify merge completes in < 2 seconds
  - **Commit:** `feat(customer): complete deduplication and merge implementation`

### Phase 4: GDPR Compliance (2 days)

- [ ] 4.1 Create DeleteCustomerCommand
  - Create `apps/backend/src/customer/app/commands/delete-customer/command.ts`
  - Command extends `Command<void>`
  - Include customerId, deletedBy
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - **Commit:** `feat(customer): add DeleteCustomerCommand`

- [ ] 4.2 Implement DeleteCustomerHandler
  - Create `apps/backend/src/customer/app/commands/delete-customer/handler.ts`
  - Load customer using Factory
  - Verify no future appointments exist
  - Anonymize data: name → null, whatsappPhone → "DELETED_[timestamp]"
  - Unlink from User if linked
  - Publish CustomerDeleted event
  - Use transaction for atomicity
  - _Requirements: 6.1-6.6_
  - _Properties: 4_
  - _Edge Cases: 3, 10_
  - **Commit:** `feat(customer): implement DeleteCustomerHandler`

- [ ] 4.3 Create CustomerDeleted Event
  - Create `apps/backend/src/customer/domain/events/customer-deleted.ts`
  - Include customerId, deletedBy, occurredAt
  - _Requirements: 6.5_
  - **Commit:** `feat(customer): add CustomerDeleted event`

- [ ] 4.4 Write Unit Tests for DeleteCustomerHandler
  - Test successful deletion (anonymization)
  - Test validation (no future appointments)
  - Test unlink from User
  - Test event publishing
  - Test idempotency (already deleted)
  - _Requirements: 6.1-6.6_
  - _Properties: 4_
  - _Edge Cases: 3, 10_
  - **Commit:** `test(customer): add unit tests for DeleteCustomerHandler`

- [ ] 4.5 Create ExportCustomerDataQuery
  - Create `apps/backend/src/customer/app/queries/export-customer-data/query.ts`
  - Query extends `Query<CustomerDataExport>`
  - Define `CustomerDataExport` interface with customer, appointments, conversations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - **Commit:** `feat(customer): add ExportCustomerDataQuery`

- [ ] 4.6 Implement ExportCustomerDataHandler
  - Create `apps/backend/src/customer/app/queries/export-customer-data/handler.ts`
  - Load customer with all related data (appointments, conversations, messages)
  - Format dates in ISO 8601
  - Exclude internal fields (version, system IDs)
  - Return JSON structure ready for download
  - _Requirements: 7.1-7.5_
  - _Properties: 5_
  - _Edge Cases: 4_
  - **Commit:** `feat(customer): implement ExportCustomerDataHandler`

- [ ] 4.7 Update ICustomerReadRepository for Export
  - Add `getFullData(customerId: string): Promise<CustomerDataExport>` method
  - _Requirements: 7.1_
  - **Commit:** `feat(customer): add getFullData method to ICustomerReadRepository`

- [ ] 4.8 Implement CustomerReadRepository.getFullData
  - Implement getFullData method with joins
  - Include appointments, conversations, messages
  - Format dates in ISO 8601
  - _Requirements: 7.1-7.5_
  - _Edge Cases: 4_
  - **Commit:** `feat(customer): implement getFullData in CustomerReadRepository`

- [ ] 4.9 Write Unit Tests for ExportCustomerDataHandler
  - Test export with data
  - Test export with no data (empty arrays)
  - Test date formatting
  - Test field exclusion
  - _Requirements: 7.1-7.5_
  - _Properties: 5_
  - _Edge Cases: 4_
  - **Commit:** `test(customer): add unit tests for ExportCustomerDataHandler`

- [ ] 4.10 Phase 4 Checkpoint
  - Run tests: `pnpm test:backend -- --testPathPattern=delete|export`
  - Verify deletion completes in < 5 seconds
  - Verify export completes in < 3 seconds
  - **Commit:** `feat(customer): complete GDPR compliance implementation`

### Phase 5: Frontend Customer Management UI (1 week)

- [ ] 5.1 Create Customers API Service
  - Create `apps/frontend/src/shared/api/customers.ts`
  - Implement: getById, search, getByUserId, getStats, merge, delete, exportData
  - Use apiClient from `@shared/api/client`
  - _Requirements: 8.1-8.6, 9.1-9.6, 10.1-10.5_
  - **Commit:** `feat(frontend): add customers API service`

- [ ] 5.2 Create SearchCustomersForm Feature
  - Create `apps/frontend/src/features/customer/search/`
  - Create `ui/SearchCustomersForm.tsx` with TextInput and debounce
  - Create `ui/CustomerFilters.tsx` with filter dropdowns
  - Create `model/useSearchCustomers.ts` with debounce hook
  - _Requirements: 8.1, 8.2, 8.3_
  - **Commit:** `feat(frontend): add search customers feature`

- [ ] 5.3 Create CustomersPage (List)
  - Create `apps/frontend/src/pages/CustomersPage/`
  - Use SearchCustomersForm, CustomerCard, Pagination
  - Implement debounced search (300ms)
  - Implement pagination
  - Implement sorting
  - _Requirements: 8.1-8.6_
  - **Commit:** `feat(frontend): add CustomersPage`

- [ ] 5.4 Create CustomerDetailPage
  - Create `apps/frontend/src/pages/CustomerDetailPage/`
  - Display customer info, badge, appointment history
  - Show conversations
  - Add action buttons (Edit, Merge, Delete, Export)
  - _Requirements: 9.1-9.6_
  - **Commit:** `feat(frontend): add CustomerDetailPage`

- [ ] 5.5 Create MergeCustomersModal Feature
  - Create `apps/frontend/src/features/customer/merge/`
  - Create `ui/MergeCustomersModal.tsx` with preview
  - Create `ui/CustomerComparisonCard.tsx` for side-by-side comparison
  - Create `model/useMergeCustomers.ts` mutation hook
  - _Requirements: 10.1-10.5_
  - **Commit:** `feat(frontend): add merge customers feature`

- [ ] 5.6 Create DeleteCustomerModal Feature
  - Create `apps/frontend/src/features/customer/delete/`
  - Create `ui/DeleteCustomerModal.tsx` with GDPR warning
  - Create `model/useDeleteCustomer.ts` mutation hook
  - _Requirements: 10.1-10.5_
  - **Commit:** `feat(frontend): add delete customer feature`

- [ ] 5.7 Create CustomerAnalyticsWidget
  - Create `apps/frontend/src/widgets/CustomerAnalytics/`
  - Display totalCustomers, newThisMonth, registeredPercentage
  - Show evolution chart (last 6 months)
  - Handle loading and error states
  - _Requirements: 11.1-11.5_
  - **Commit:** `feat(frontend): add CustomerAnalyticsWidget`

- [ ] 5.8 Create CustomerDuplicatesPage
  - Create `apps/frontend/src/pages/CustomerDuplicatesPage/`
  - Display list of duplicate pairs
  - Show similarity score
  - Add "Merge" and "Not duplicates" actions
  - _Requirements: 12.1-12.5_
  - **Commit:** `feat(frontend): add CustomerDuplicatesPage`

- [ ] 5.9 Add Customer Routes
  - Update `apps/frontend/src/app/router/routes.tsx`
  - Add routes: /customers, /customers/:id, /customers/duplicates
  - Add navigation links in sidebar
  - _Requirements: 8.1, 9.1, 12.1_
  - **Commit:** `feat(frontend): add customer routes`

- [ ] 5.10 Phase 5 Checkpoint
  - Run validations: `pnpm lint:frontend && pnpm typecheck:frontend`
  - Test UI manually
  - Verify loading states work correctly
  - **Commit:** `feat(frontend): complete customer management UI`

### Phase 6: Testing and Validation

- [ ] 6.1 Write Component Tests for Customer Entity
  - Test CustomerCard renders correctly
  - Test CustomerAvatar shows initials
  - Test CustomerBadge shows correct type
  - _Requirements: 1.4_
  - **Commit:** `test(frontend): add component tests for customer entity`

- [ ] 6.2 Write Component Tests for Search Feature
  - Test SearchCustomersForm debounces input
  - Test CustomerFilters applies filters
  - _Requirements: 8.1-8.3_
  - **Commit:** `test(frontend): add component tests for search feature`

- [ ] 6.3 Write Integration Tests with MSW
  - Mock search API endpoint
  - Mock merge API endpoint
  - Mock delete API endpoint
  - Test optimistic updates
  - _Requirements: 8.1-12.5_
  - **Commit:** `test(frontend): add integration tests with MSW`

- [ ] 6.4 Write E2E Tests for Customer Flow
  - Test search and filter customers
  - Test view customer detail
  - Test merge customers
  - Test delete customer
  - Test export customer data
  - _Requirements: All_
  - **Commit:** `test(customer): add E2E tests for customer management`

- [ ] 6.5 Write Property-Based Tests
  - Property: Search pagination returns each customer exactly once
  - Property: Merge is idempotent
  - Property: Deduplication is symmetric
  - _Properties: 2, 6, 7_
  - **Commit:** `test(customer): add property-based tests`

- [ ] 6.6 Phase 6 Checkpoint
  - Run all tests: `pnpm test`
  - Verify coverage > 70%
  - **Commit:** `test(customer): complete testing suite`

### Phase 7: Final Validation and Documentation

- [ ] 7.1 Run Full Validation Suite
  - `pnpm lint && pnpm typecheck && pnpm format`
  - `pnpm test`
  - Verify all tests pass
  - **Commit:** `chore(customer): run full validation suite`

- [ ] 7.2 Performance Testing
  - Test search response time < 200ms
  - Test deduplication < 5 seconds for 10,000 customers
  - Test merge operation < 2 seconds
  - Test export operation < 3 seconds
  - Test UI list page load < 1 second
  - _Requirements: Performance_
  - **Commit:** `test(customer): add performance tests`

- [ ] 7.3 Update Documentation
  - Update README with customer enhancements
  - Document API endpoints
  - Document UI components
  - Add usage examples
  - _Requirements: All_
  - **Commit:** `docs(customer): update documentation`

- [ ] 7.4 Code Review Checklist
  - [ ] All commands extend Command<TResult>
  - [ ] All queries extend Query<TResult>
  - [ ] Factory pattern used for loading aggregates
  - [ ] Optimistic locking implemented for merge
  - [ ] SQL injection prevention in search
  - [ ] GDPR compliance verified
  - [ ] Frontend uses TanStack Query for server state
  - [ ] Frontend uses Zustand for UI state
  - [ ] All tests passing
  - [ ] Performance requirements met
  - **Commit:** `chore(customer): complete code review checklist`

- [ ] 7.5 Final Checkpoint
  - **Commit:** `feat(customer): complete customer BC enhancements`

---

## Summary

| Phase | Tasks | Description | Duration |
|-------|-------|-------------|----------|
| 1 | 10 | Frontend Customer Entity Layer | 1 week |
| 2 | 12 | Backend Search and Filtering | 1 week |
| 3 | 12 | Deduplication and Merge | 3 days |
| 4 | 10 | GDPR Compliance | 2 days |
| 5 | 10 | Frontend Customer Management UI | 1 week |
| 6 | 6 | Testing and Validation | 2 days |
| 7 | 5 | Final Validation and Documentation | 1 day |
| **Total** | **65** | **Complete Customer BC Enhancements** | **2-3 weeks** |

**Order of Implementation:**
1. Phase 1 (Frontend Entity) → Foundation for UI
2. Phase 2 (Backend Search) → Core functionality
3. Phase 3 (Deduplication) → Data quality
4. Phase 4 (GDPR) → Compliance
5. Phase 5 (Frontend UI) → User interface
6. Phase 6 (Testing) → Quality assurance
7. Phase 7 (Validation) → Final checks

---

## Validation Commands

```bash
# Backend
pnpm lint:backend
pnpm typecheck:backend
pnpm format:backend
pnpm test:backend

# Frontend
pnpm lint:frontend
pnpm typecheck:frontend
pnpm format:frontend
pnpm test:frontend

# All validations
pnpm lint && pnpm typecheck && pnpm format && pnpm test

# Specific test file
pnpm test:backend -- --testPathPattern=search-customers
pnpm test:frontend -- --testPathPattern=CustomerCard

# Migration
pnpm --filter backend migration:run

# Performance test
pnpm test:backend -- --testPathPattern=performance
```

---

## References

- `.kiro/specs/customer-bc-enhancements/requirements.md` - Requirements Document
- `.kiro/specs/customer-bc-enhancements/design.md` - Design Document
- `.kiro/specs/customer-bc/` - Customer BC MVP spec
- `.kiro/steering/user-customer-businessowner-architecture.md` - Architecture
- `.kiro/steering/frontend-PRD.md` - Frontend architecture
- `.kiro/steering/naming-conventions.md` - Naming conventions
- `.kiro/steering/ddd-patterns.md` - DDD Patterns
- `.kiro/steering/factory-pattern.md` - Factory Pattern
