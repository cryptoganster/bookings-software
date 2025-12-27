/**
 * @deprecated This file has been moved to `@test-utils/helpers/availability/capacity`
 *
 * This file is kept for backward compatibility during the migration period.
 * Please update your imports to use the new location:
 *
 * ```typescript
 * // Old (deprecated)
 * import { createCapacityForTomorrow } from '@test-utils/e2e-helpers/capacity';
 *
 * // New (recommended)
 * import { createCapacityForTomorrow } from '@test-utils/helpers/availability/capacity';
 * ```
 *
 * This file will be removed in Phase 6 of the refactoring.
 */

// Re-export everything from the new location
export {
  TestCapacityHelper,
  createCapacityForTomorrow,
  createCapacityForDate,
} from '../helpers/availability/capacity';
