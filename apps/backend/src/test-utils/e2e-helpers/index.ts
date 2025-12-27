/**
 * E2E Testing Helpers
 *
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please migrate to the new test helpers organized by Bounded Context:
 *
 * - Auth helpers → `@test-utils/helpers/auth`
 * - Database helpers → `@test-utils/helpers/database`
 * - Types → `@test-utils/helpers/types`
 * - Capacity helpers → `@test-utils/helpers/availability/capacity`
 * - Offering helpers → `@test-utils/helpers/offering`
 *
 * See `.kiro/specs/refactor-backend-test-utils/design.md` for migration guide.
 *
 * Consolidated exports for all E2E testing utilities
 */

// ============================================================================
// Re-exports for Backward Compatibility
// ============================================================================
// All helpers have been moved to their respective Bounded Context locations.
// These re-exports maintain backward compatibility during the migration period.
// ============================================================================

// ============================================================================
// Class Aliases for Backward Compatibility
// ============================================================================

/**
 * @deprecated Use TestAuthHelper from `@test-utils/helpers/auth` instead
 */
export { TestAuthHelper as E2EAuthHelper } from '../helpers/auth';

/**
 * @deprecated Use TestDatabaseHelper from `@test-utils/helpers/database` instead
 */
export { TestDatabaseHelper as E2EDatabaseHelper } from '../helpers/database';

// ============================================================================
// Function Aliases for Backward Compatibility
// ============================================================================

/**
 * @deprecated Use createTestUserInDb from `@test-utils/helpers/auth` instead
 */
export { createTestUserInDb as createTestUser } from '../helpers/auth';

/**
 * @deprecated Use TestDatabaseHelper.cleanDatabase from `@test-utils/helpers/database` instead
 */
export { cleanDatabase } from '../helpers/database';

// ============================================================================
// Re-export All Other Exports
// ============================================================================

/**
 * @deprecated Import from `@test-utils/helpers/auth` instead
 */
export * from '../helpers/auth';

/**
 * @deprecated Import from `@test-utils/helpers/database` instead
 */
export * from '../helpers/database';

/**
 * @deprecated Import from `@test-utils/helpers/types` instead
 */
export * from '../helpers/types';

/**
 * @deprecated Import from `@test-utils/helpers/availability/capacity` instead
 */
export * from '../helpers/availability/capacity';

/**
 * @deprecated Import from `@test-utils/helpers/offering` instead
 */
export * from '../helpers/offering';
