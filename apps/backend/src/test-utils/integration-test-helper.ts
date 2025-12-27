/**
 * Integration Test Helper
 *
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please migrate to the new test helpers organized by Bounded Context:
 *
 * - `generateTestId` → `@test-utils/helpers/database` (generateTestId)
 * - `generateTestEmail` → `@test-utils/helpers/auth` (generateTestEmail)
 * - `createTestUser` → `@test-utils/helpers/auth` (createTestUserInDb)
 * - `createTestBusiness` → `@test-utils/helpers/business` (createTestBusiness - simplified version)
 * - `createIntegrationTestDataSource` → `@test-utils/helpers/database` (TestDatabaseHelper.setupTestDatabase)
 * - `cleanDatabase` → `@test-utils/helpers/database` (cleanDatabase)
 *
 * See `.kiro/specs/refactor-backend-test-utils/design.md` for migration guide.
 *
 * Provides a shared DataSource for integration tests.
 * Uses the same database as E2E tests (postgres_test) with all entities.
 * Schema is created once in global setup, tests just clean data.
 */

// ============================================================================
// Re-exports for Backward Compatibility
// ============================================================================
// All functions have been moved to their respective Bounded Context helpers.
// These re-exports maintain backward compatibility during the migration period.
// ============================================================================

/**
 * @deprecated Import from `@test-utils/helpers/database` instead
 */
export { generateTestId } from './helpers/database';

/**
 * @deprecated Import from `@test-utils/helpers/auth` instead
 */
export { generateTestEmail } from './helpers/auth';

/**
 * @deprecated Import from `@test-utils/helpers/auth` instead
 * Note: Function renamed to `createTestUserInDb` in new location
 */
export { createTestUserInDb as createTestUser } from './helpers/auth';

/**
 * @deprecated Import from `@test-utils/helpers/business` instead
 * Note: Now uses the simplified createTestBusiness function that auto-generates IDs
 */
export { createTestBusiness } from './helpers/business';

/**
 * @deprecated Import from `@test-utils/helpers/database` instead
 * Note: Function renamed to `setupTestDatabase` in new location
 */
export { setupTestDatabase as createIntegrationTestDataSource } from './helpers/database';

/**
 * @deprecated Import from `@test-utils/helpers/database` instead
 */
export { cleanDatabase } from './helpers/database';
