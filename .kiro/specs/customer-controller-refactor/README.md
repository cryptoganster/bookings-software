# Customer Controller Refactoring Spec

## Overview

This spec defines the refactoring of the Customer BC REST controller from a monolithic 1023-line file into four focused, maintainable controller files organized by responsibility.

## Status

- **Phase:** Planning Complete ✅
- **Requirements:** Complete ✅
- **Design:** Complete ✅
- **Tasks:** Complete ✅
- **Implementation:** Not Started ⏳

## Goals

1. **Improve Maintainability**: Split monolithic controller into 4 focused files (< 300 lines each)
2. **Enhance Testability**: Smaller files with better test coverage (> 80%)
3. **Simplify Naming**: Remove redundant `.dto` suffixes from files
4. **Preserve Functionality**: Maintain all existing API contracts and behavior
5. **Safe Migration**: Backup strategy with easy rollback capability

## Structure

### Target Architecture

```
apps/backend/src/customer/presentation/
├── controllers/
│   ├── customer.controller.ts        # CRUD (~250 lines)
│   ├── customer-search.ts             # Search & Stats (~200 lines)
│   ├── customer-merge.ts              # Merge (~150 lines)
│   ├── customer-duplicates.ts         # Duplicates (~150 lines)
│   └── __tests__/
│       ├── customer.controller.spec.ts
│       ├── customer-search.spec.ts
│       ├── customer-merge.spec.ts
│       ├── customer-duplicates.spec.ts
│       ├── customer.controller.integration.spec.ts
│       └── customer.e2e.spec.ts
└── dtos/
    ├── search-customer.ts
    ├── merge-customer.ts
    ├── detect-duplicates.ts
    ├── response-types.ts
    ├── index.ts
    └── __tests__/
```

## Key Features

### Controller Separation

| Controller               | Endpoints                                                    | Responsibility            |
| ------------------------ | ------------------------------------------------------------ | ------------------------- |
| `customer.controller.ts` | GET /:id, GET /by-user/:userId, GET /:id/export, DELETE /:id | Core CRUD operations      |
| `customer-search.ts`     | GET /search, GET /stats                                      | Search and statistics     |
| `customer-merge.ts`      | POST /merge                                                  | Customer merge operations |
| `customer-duplicates.ts` | GET /duplicates                                              | Duplicate detection       |

### DTO Consolidation

- **Before**: 7 files with `.dto.ts` suffix
- **After**: 4 files without suffix + 1 consolidated `response-types.ts`
- **Benefit**: Cleaner naming, better organization

### Testing Strategy

- **Unit Tests**: All controllers and DTOs (> 80% coverage)
- **Integration Tests**: CQRS handler integration
- **E2E Tests**: Complete HTTP request/response flows
- **Property-Based Tests**: Validation and pagination logic

## Correctness Properties

1. **Endpoint Preservation**: All endpoints return same responses
2. **DTO Validation Equivalence**: Validation behaves identically
3. **Logging Structure Preservation**: Log format remains unchanged
4. **Authorization Consistency**: Auth checks behave identically
5. **Module Registration Completeness**: All controllers properly registered
6. **Import Path Correctness**: All imports resolve correctly
7. **Backup File Isolation**: Backup files not compiled/imported

## Migration Strategy

### 6 Phases

1. **Preparation**: Create backups, update .gitignore
2. **DTOs**: Refactor without suffixes, write tests
3. **Controllers**: Create 4 new controllers, write tests
4. **Module**: Update registration
5. **Testing**: Integration and E2E tests
6. **Finalize**: Rename originals to `.backup`

### Safety Features

- ✅ Original files preserved as `.backup`
- ✅ Easy rollback by removing `.backup` extension
- ✅ Comprehensive testing before finalization
- ✅ Backup files excluded from git and TypeScript compilation

## Implementation Plan

See [tasks.md](./tasks.md) for detailed implementation steps.

### Quick Start

To begin implementation:

1. Review [requirements.md](./requirements.md)
2. Review [design.md](./design.md)
3. Follow tasks in [tasks.md](./tasks.md) sequentially
4. Run tests after each phase
5. Commit after major milestones

## Success Criteria

- ✅ All 4 controller files < 300 lines
- ✅ All DTOs without `.dto` suffix
- ✅ All tests pass with > 80% coverage
- ✅ API endpoints unchanged
- ✅ Logging preserved
- ✅ Module registration updated
- ✅ Backups created
- ✅ Application compiles and runs

## Rollback Plan

If issues discovered:

```bash
# 1. Stop application
# 2. Restore backups
mv customer.controller.backup customer.controller.ts
mv dtos.backup dtos

# 3. Revert module registration
# 4. Delete new files
# 5. Run tests
# 6. Restart application
```

## Documentation

- **Requirements**: [requirements.md](./requirements.md)
- **Design**: [design.md](./design.md)
- **Tasks**: [tasks.md](./tasks.md)
- **API Docs**: [/docs/customer-api.md](/docs/customer-api.md)

## Related Specs

- [customer-bc-backend-integration](../customer-bc-backend-integration/) - Original Customer BC implementation

## Notes

- All testing tasks are required (comprehensive validation)
- Keep backup files until confident in new implementation
- Document any deviations from the plan
- Commit frequently during implementation

---

**Created**: December 20, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 2-3 days
