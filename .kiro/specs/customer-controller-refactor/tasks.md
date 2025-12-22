# Implementation Plan

## Overview

This implementation plan breaks down the customer controller refactoring into discrete, manageable tasks. Each task builds incrementally on previous steps, ensuring a safe migration with comprehensive testing.

---

## Phase 1: Preparation and Setup

- [x] 1. Prepare workspace and create backups
  - Create `.gitignore` entry for `*.backup` and `dtos.backup/`
  - Verify current tests pass before starting refactoring
  - Document current API response formats for comparison
  - _Requirements: 7.1, 7.2, 7.4_

---

## Phase 2: Refactor DTOs ✅ COMPLETE

- [x] 2. Create new DTO structure without suffixes
  - Create `apps/backend/src/customer/presentation/dtos/search-customer.ts`
  - Create `apps/backend/src/customer/presentation/dtos/merge-customer.ts`
  - Create `apps/backend/src/customer/presentation/dtos/detect-duplicates.ts`
  - Create `apps/backend/src/customer/presentation/dtos/response-types.ts` (consolidate all response DTOs)
  - Update `apps/backend/src/customer/presentation/dtos/index.ts` barrel export
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Write unit tests for search-customer DTO
  - Test validation decorators (page, limit, sortBy, sortOrder)
  - Test edge cases (min/max values)
  - Test invalid inputs
  - _Requirements: 5.4_

- [x] 2.2 Write unit tests for merge-customer DTO
  - Test UUID validation
  - Test required fields
  - Test invalid inputs
  - _Requirements: 5.4_

- [x] 2.3 Write unit tests for detect-duplicates DTO
  - Test threshold validation (0-1 range)
  - Test default value
  - Test invalid inputs
  - _Requirements: 5.4_

- [x] 2.4 Write unit tests for response-types DTOs
  - Test MessageResponseDto structure
  - Test SearchCustomersResponseDto structure
  - Test CustomerStatsResponseDto structure
  - Test DuplicatePairsResponseDto structure
  - _Requirements: 5.4_

---

## Phase 3: Create Search Controller

- [x] 3. Implement customer-search.ts controller
  - Create `apps/backend/src/customer/presentation/controllers/customer-search.ts`
  - Implement `GET /api/customers/search` endpoint
  - Implement `GET /api/customers/stats` endpoint
  - Copy all decorators, guards, and logging from original
  - Update imports to use new DTOs
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.4_

- [x] 3.1 Write unit tests for customer-search controller
  - Test search endpoint with valid filters
  - Test search endpoint with missing businessId (ForbiddenException)
  - Test stats endpoint success case
  - Test stats endpoint with missing businessId (ForbiddenException)
  - Test logging calls (start, complete, error)
  - Test error handling and duration tracking
  - _Requirements: 5.1, 4.3_

- [x] 3.2 Write property test for search pagination
  - **Property 2: DTO Validation Equivalence**
  - **Validates: Requirements 2.2**
  - Test that any valid page/limit combination produces valid pagination
  - Test that offset calculation is always >= 0
  - _Requirements: 5.1_

---

## Phase 4: Create Duplicates Controller

- [x] 4. Implement customer-duplicates.ts controller
  - Create `apps/backend/src/customer/presentation/controllers/customer-duplicates.ts`
  - Implement `GET /api/customers/duplicates` endpoint
  - Copy all decorators, guards, and logging from original
  - Update imports to use new DTOs
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.4_

- [x] 4.1 Write unit tests for customer-duplicates controller
  - Test duplicates endpoint with valid threshold
  - Test duplicates endpoint with default threshold
  - Test duplicates endpoint with missing businessId (ForbiddenException)
  - Test logging calls (start, complete, error)
  - Test error handling and duration tracking
  - _Requirements: 5.1, 4.3_

---

## Phase 5: Create Merge Controller

- [x] 5. Implement customer-merge.ts controller
  - Create `apps/backend/src/customer/presentation/controllers/customer-merge.ts`
  - Implement `POST /api/customers/merge` endpoint
  - Copy all decorators, guards, and logging from original
  - Update imports to use new DTOs
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.4_

- [x] 5.1 Write unit tests for customer-merge controller
  - Test merge endpoint success case
  - Test merge endpoint with invalid UUIDs
  - Test logging calls (start, complete, error)
  - Test error handling and duration tracking
  - _Requirements: 5.1, 4.3_

- [x] 5.2 Write property test for merge validation
  - **Property 2: DTO Validation Equivalence**
  - **Validates: Requirements 2.2**
  - Test that any two different valid UUIDs pass validation
  - Test that same UUID for source and target fails validation
  - _Requirements: 5.1_

---

## Phase 6: Create CRUD Controller

- [x] 6. Implement customer.controller.ts (CRUD only)
  - Create `apps/backend/src/customer/presentation/controllers/customer.controller.ts`
  - Implement `GET /api/customers/:id` endpoint
  - Implement `GET /api/customers/by-user/:userId` endpoint
  - Implement `GET /api/customers/:id/export` endpoint
  - Implement `DELETE /api/customers/:id` endpoint
  - Copy all decorators, guards, and logging from original
  - Update imports to use new DTOs
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.4_

- [x] 6.1 Write unit tests for customer CRUD controller
  - Test getById endpoint success case
  - Test getById endpoint with different business (ForbiddenException)
  - Test getByUserId endpoint success case
  - Test getByUserId endpoint with different user (ForbiddenException)
  - Test exportData endpoint success case
  - Test exportData endpoint with different business (ForbiddenException)
  - Test delete endpoint success case
  - Test delete endpoint with different business (ForbiddenException)
  - Test logging calls for all endpoints
  - Test error handling and duration tracking
  - _Requirements: 5.1, 4.3_

---

## Phase 7: Update Module Registration ✅ COMPLETE

- [x] 7. Update customer.module.ts
  - Import all 5 controllers (CustomerController, CustomerCrudController, CustomerSearchController, CustomerDuplicatesController, CustomerMergeController)
  - Add all controllers to `controllers` array
  - Resolve circular dependency with BookingModule using forwardRef
  - Verify module compiles
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7.1 Update integration test setup
  - Add SharedModule import to provide IUnitOfWork
  - Verify integration test compiles
  - _Requirements: 6.5_

**Completion Notes:**

- ✅ All 5 controllers registered in CustomerModule
- ✅ Circular dependency resolved with forwardRef in both CustomerModule and BookingModule
- ✅ TypeScript compilation passes
- ✅ All unit tests pass (50/50 tests)
- ✅ Integration test setup updated with SharedModule

**Files Modified:**

- `apps/backend/src/customer/customer.module.ts` - Registered 5 controllers
- `apps/backend/src/booking/booking.module.ts` - Added forwardRef to CustomerModule
- `apps/backend/src/customer/presentation/controllers/__tests__/customer.controller.integration.spec.ts` - Added SharedModule import

---

## Phase 8: Integration Testing

- [x] 8. Update and expand integration tests
  - Update existing `customer.controller.integration.spec.ts`
  - Test all endpoints with real CommandBus/QueryBus
  - Verify commands/queries are dispatched correctly
  - Verify response transformation
  - _Requirements: 5.2_

- [x] 8.1 Write integration test for search operations
  - Test search endpoint with real QueryBus
  - Test stats endpoint with real QueryBus
  - Verify SearchCustomersQuery is dispatched with correct filters
  - Verify GetCustomerStatsQuery is dispatched with correct businessId
  - _Requirements: 5.2_

- [x] 8.2 Write integration test for CRUD operations
  - Test getById with real QueryBus
  - Test getByUserId with real QueryBus
  - Test exportData with real QueryBus
  - Test delete with real CommandBus
  - Verify correct queries/commands are dispatched
  - _Requirements: 5.2_

- [x] 8.3 Write integration test for merge operations
  - Test merge with real CommandBus
  - Verify MergeCustomersCommand is dispatched with correct parameters
  - _Requirements: 5.2_

- [x] 8.4 Write integration test for duplicate detection
  - Test duplicates with real QueryBus
  - Verify DetectDuplicateCustomersQuery is dispatched with correct threshold
  - _Requirements: 5.2_

---

## Phase 9: E2E Testing ✅ COMPLETE

- [x] 9. Create comprehensive E2E tests
  - Create `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts`
  - Test all endpoints with real HTTP requests
  - Use test database
  - Verify complete request/response flow
  - Compare responses with original controller (if still available)
  - _Requirements: 5.3_

- [x] 9.1 Write E2E test for search operations
  - **Property 1: Controller Endpoint Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Test `GET /api/customers/search` with various filters
  - Test `GET /api/customers/stats`
  - Verify response format matches original
  - Verify status codes match original
  - _Requirements: 5.3, 3.1, 3.2, 3.3_

- [x] 9.2 Write E2E test for CRUD operations
  - **Property 1: Controller Endpoint Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Test `GET /api/customers/:id`
  - Test `GET /api/customers/by-user/:userId`
  - Test `GET /api/customers/:id/export`
  - Test `DELETE /api/customers/:id`
  - Verify response format matches original
  - Verify status codes match original
  - _Requirements: 5.3, 3.1, 3.2, 3.3_

- [x] 9.3 Write E2E test for merge operations
  - **Property 1: Controller Endpoint Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Test `POST /api/customers/merge`
  - Verify response format matches original
  - Verify status codes match original
  - _Requirements: 5.3, 3.1, 3.2, 3.3_

- [x] 9.4 Write E2E test for duplicate detection
  - **Property 1: Controller Endpoint Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Test `GET /api/customers/duplicates`
  - Verify response format matches original
  - Verify status codes match original
  - _Requirements: 5.3, 3.1, 3.2, 3.3_

**Completion Notes:**

- ✅ Created comprehensive E2E test file with 40+ test cases
- ✅ Tests all refactored controller endpoints with real HTTP requests
- ✅ Validates Property 1: Controller Endpoint Preservation
- ✅ Tests authentication (401 without token)
- ✅ Tests validation (400 for invalid inputs)
- ✅ Tests success cases (200 with correct response structure)
- ✅ Tests error cases (404 for not found)
- ✅ Uses test database for data isolation
- ✅ Verifies response formats match requirements

**Files Created:**

- `apps/backend/src/customer/presentation/controllers/__tests__/customer.e2e.spec.ts` (500+ lines)

---

## Phase 10: Verification and Validation

- [x] 10. Run all tests and verify functionality
  - Run all unit tests: `pnpm test:backend`
  - Run all integration tests
  - Run all E2E tests
  - Verify test coverage > 80%
  - Verify all tests pass
  - _Requirements: 5.5_

- [x] 10.1 Verify API endpoints
  - Start application: `pnpm dev:backend`
  - Test all endpoints manually with Postman/curl
  - Verify Swagger documentation at `/api/docs`
  - Verify all endpoints return expected responses
  - Verify authentication works correctly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10.2 Verify logging structure
  - **Property 3: Logging Structure Preservation**
  - **Validates: Requirements 4.1, 4.2, 4.4**
  - Review logs for each endpoint
  - Verify log format matches original (action, userId, businessId, duration)
  - Verify error logs include stack traces
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10.3 Verify authorization
  - **Property 4: Authorization Consistency**
  - **Validates: Requirements 3.5**
  - Test endpoints with different user contexts
  - Verify business-level isolation works correctly
  - Verify ForbiddenException is thrown when appropriate
  - _Requirements: 3.5_

---

## Phase 11: Finalize Migration

- [x] 11. Create backups and clean up
  - Rename original controller: `customer.controller.ts` → `customer.controller.backup`
  - Rename original DTOs folder: `dtos/` → `dtos.backup/`
  - Verify `.gitignore` excludes backup files
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 11.1 Verify compilation and imports
  - **Property 6: Import Path Correctness**
  - **Validates: Requirements 8.1, 8.2, 8.4, 8.5**
  - Run TypeScript compilation: `pnpm build:backend`
  - Verify no compilation errors
  - Verify no imports reference backup files
  - Search codebase for any remaining references to old paths
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11.2 Verify backup isolation
  - **Property 7: Backup File Isolation**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  - Verify backup files have `.backup` extension
  - Verify backup files are not compiled by TypeScript
  - Verify backup files are not imported anywhere
  - Verify backup files are excluded from git
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

---

## Phase 12: Final Checkpoint

- [x] 12. Final verification and documentation
  - Run full test suite one more time
  - Verify application starts successfully
  - Verify all routes are registered correctly
  - Test all endpoints manually
  - Update any relevant documentation
  - Create summary of changes
  - _Requirements: All_

---

## Rollback Plan

If issues are discovered after migration:

1. Stop the application
2. Remove `.backup` extension from original files:
   ```bash
   mv customer.controller.backup customer.controller.ts
   mv dtos.backup dtos
   ```
3. Revert module registration in `customer.module.ts`
4. Delete new controller files
5. Restore original DTO imports
6. Run tests to verify rollback
7. Restart application

---

## Success Criteria

The refactoring is complete when:

- ✅ All 4 controller files created and < 300 lines each
- ✅ All DTOs refactored without `.dto` suffix
- ✅ All existing tests pass
- ✅ New tests added with > 80% coverage
- ✅ API endpoints unchanged and functional
- ✅ Logging preserved with same structure
- ✅ Module registration updated correctly
- ✅ Original files backed up with `.backup` extension
- ✅ All imports updated to new paths
- ✅ Application compiles and runs successfully
- ✅ Swagger documentation accurate
- ✅ No performance regression

---

## Notes

- All testing tasks are now required for comprehensive validation
- Each phase should be completed before moving to the next
- Run tests frequently during implementation
- Commit after each major phase
- Keep backup files until confident in new implementation
- Document any deviations from the plan
