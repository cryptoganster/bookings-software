# Requirements Document

## Introduction

This document defines the requirements for refactoring the Customer BC REST controller from a monolithic file into smaller, more maintainable files organized by responsibility. The refactoring will improve code organization, maintainability, and testability while preserving all existing functionality.

## Glossary

- **Controller**: NestJS REST endpoint handler that receives HTTP requests and delegates to CQRS handlers
- **DTO**: Data Transfer Object used for request/response validation and transformation
- **CRUD**: Create, Read, Update, Delete operations
- **Search Operations**: Query operations with filtering, pagination, and sorting
- **Merge Operations**: Business logic for combining duplicate customer records
- **Duplicate Detection**: Algorithm-based identification of potential duplicate customers
- **Deprecation Strategy**: Process of marking old code as deprecated while maintaining it during migration

## Requirements

### Requirement 1: Refactor Controller Structure

**User Story:** As a developer, I want the customer controller split into focused files by responsibility, so that I can easily locate and maintain specific functionality.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN the system SHALL have four controller files:
   - `customer.controller.ts` (CRUD operations)
   - `customer-search.ts` (search and stats)
   - `customer-merge.ts` (merge operations)
   - `customer-duplicates.ts` (duplicate detection)

2. WHEN a controller file is created THEN the system SHALL maintain the same route structure as the original controller

3. WHEN the refactoring is complete THEN each controller file SHALL have a single, focused responsibility

4. WHEN the refactoring is complete THEN the original controller SHALL be renamed to `customer.controller.backup` to preserve it as a backup

5. WHEN the refactoring is complete THEN all controller files SHALL use the same authentication and authorization guards as the original

### Requirement 2: Refactor DTO Structure

**User Story:** As a developer, I want DTOs organized in a clear folder structure without redundant suffixes, so that I can quickly find and understand data contracts.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN the system SHALL have DTOs organized in `presentation/dtos/` folder

2. WHEN a DTO file is created THEN the system SHALL NOT include the `.dto` suffix in the filename

3. WHEN the refactoring is complete THEN DTOs SHALL be grouped by operation type:
   - `create-customer.ts`
   - `update-customer.ts`
   - `search-customer.ts`
   - `merge-customer.ts`
   - `detect-duplicates.ts`
   - `response-types.ts` (shared response DTOs)

4. WHEN the refactoring is complete THEN all DTO exports SHALL be re-exported from an `index.ts` barrel file

5. WHEN the refactoring is complete THEN the original DTO folder SHALL be renamed to `dtos.backup` to preserve it as a backup

### Requirement 3: Maintain API Compatibility

**User Story:** As a frontend developer, I want the API endpoints to remain unchanged, so that existing integrations continue to work without modification.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN all existing API endpoints SHALL maintain the same HTTP methods and paths

2. WHEN the refactoring is complete THEN all request/response formats SHALL remain identical to the original implementation

3. WHEN the refactoring is complete THEN all HTTP status codes SHALL remain the same for each endpoint

4. WHEN the refactoring is complete THEN all Swagger/OpenAPI documentation SHALL remain accurate and complete

5. WHEN the refactoring is complete THEN all authentication and authorization behavior SHALL remain unchanged

### Requirement 4: Preserve Logging and Error Handling

**User Story:** As a DevOps engineer, I want logging and error handling to remain consistent, so that I can continue monitoring and debugging the system effectively.

#### Acceptance Criteria

1. WHEN an endpoint is refactored THEN the system SHALL maintain the same structured logging format

2. WHEN an endpoint is refactored THEN the system SHALL log the same events (start, complete, error) with the same metadata

3. WHEN an error occurs THEN the system SHALL handle it with the same error types and messages as the original

4. WHEN an endpoint is refactored THEN the system SHALL maintain the same performance tracking (duration logging)

5. WHEN an endpoint is refactored THEN the system SHALL maintain the same PinoLogger context naming

### Requirement 5: Implement Comprehensive Testing

**User Story:** As a QA engineer, I want comprehensive tests for all refactored code, so that I can verify functionality is preserved and catch regressions.

#### Acceptance Criteria

1. WHEN a controller is refactored THEN the system SHALL have unit tests for each endpoint

2. WHEN a controller is refactored THEN the system SHALL have integration tests that verify CQRS handler integration

3. WHEN a controller is refactored THEN the system SHALL have E2E tests that verify complete request/response flows

4. WHEN a DTO is refactored THEN the system SHALL have validation tests for all constraints

5. WHEN the refactoring is complete THEN all tests SHALL pass with the same coverage as the original implementation

### Requirement 6: Maintain Module Registration

**User Story:** As a developer, I want the NestJS module to automatically discover and register all controllers, so that I don't need manual configuration.

#### Acceptance Criteria

1. WHEN a controller is created THEN the system SHALL register it in the CustomerModule

2. WHEN the refactoring is complete THEN all controllers SHALL be exported from the module

3. WHEN the refactoring is complete THEN the module SHALL maintain the same dependency injection configuration

4. WHEN the refactoring is complete THEN the module SHALL maintain the same imports and providers

5. WHEN the refactoring is complete THEN the application SHALL start successfully with all routes registered

### Requirement 7: Implement Safe Migration Strategy

**User Story:** As a tech lead, I want a safe migration strategy with backups, so that we can rollback if issues are discovered.

#### Acceptance Criteria

1. WHEN the migration begins THEN the system SHALL keep the original controller file as `customer.controller.backup`

2. WHEN the migration begins THEN the system SHALL keep the original DTOs folder as `dtos.backup`

3. WHEN the migration is complete THEN the backup files SHALL have `.backup` extension to prevent TypeScript compilation

4. WHEN the migration is complete THEN the backup files SHALL be excluded from git tracking via `.gitignore`

5. WHEN a rollback is needed THEN the system SHALL be able to restore from backup files by removing the `.backup` extension

### Requirement 8: Update Import Paths

**User Story:** As a developer, I want all import paths updated to reference the new file structure, so that the codebase remains consistent.

#### Acceptance Criteria

1. WHEN a file is moved THEN all imports in other files SHALL be updated to the new path

2. WHEN DTOs are refactored THEN all controller imports SHALL use the barrel export from `dtos/index.ts`

3. WHEN the refactoring is complete THEN no file SHALL import from the backup files

4. WHEN the refactoring is complete THEN all imports SHALL use path aliases (`@customer/`) where applicable

5. WHEN the refactoring is complete THEN the codebase SHALL compile without errors

## Controller Responsibility Breakdown

### customer.controller.ts (CRUD Operations)

- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/by-user/:userId` - Get customers by user ID
- `GET /api/customers/:id/export` - Export customer data (GDPR)
- `DELETE /api/customers/:id` - Delete customer (GDPR)

### customer-search.ts (Search & Stats)

- `GET /api/customers/search` - Search customers with filters
- `GET /api/customers/stats` - Get customer statistics

### customer-merge.ts (Merge Operations)

- `POST /api/customers/merge` - Merge two customers

### customer-duplicates.ts (Duplicate Detection)

- `GET /api/customers/duplicates` - Detect duplicate customers

## DTO Organization

### Request DTOs

- `create-customer.ts` - CreateCustomerDto (if needed in future)
- `update-customer.ts` - UpdateCustomerDto (if needed in future)
- `search-customer.ts` - SearchCustomersDto
- `merge-customer.ts` - MergeCustomersDto
- `detect-duplicates.ts` - DetectDuplicatesDto

### Response DTOs

- `response-types.ts` - All response DTOs:
  - MessageResponseDto
  - SearchCustomersResponseDto
  - CustomerStatsResponseDto
  - DuplicatePairsResponseDto

## Success Criteria

The refactoring is considered successful when:

1. ✅ All 4 controller files are created and properly organized
2. ✅ All DTOs are refactored without `.dto` suffix
3. ✅ All existing tests pass
4. ✅ New tests are added for each refactored file
5. ✅ API endpoints remain unchanged and functional
6. ✅ Logging and error handling are preserved
7. ✅ Module registration is updated
8. ✅ Original files are backed up with `.backup` extension
9. ✅ All imports are updated to new paths
10. ✅ Application compiles and runs successfully

## Non-Functional Requirements

- **Performance**: Refactoring SHALL NOT impact API response times
- **Maintainability**: Each controller file SHALL be < 300 lines
- **Testability**: Each controller SHALL have > 80% test coverage
- **Documentation**: All endpoints SHALL maintain Swagger documentation
- **Backward Compatibility**: All existing API contracts SHALL be preserved
