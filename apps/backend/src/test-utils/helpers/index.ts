/**
 * Test Helpers - Central Exports
 *
 * This file provides a central export point for all test helpers.
 * Import from this file to access any helper across the test suite.
 *
 * @example
 * ```typescript
 * // Import specific helpers
 * import { TestAuthHelper, generateTestEmail } from '@test-utils/helpers';
 *
 * // Import types
 * import { TestUser, UserRole } from '@test-utils/helpers';
 *
 * // Import database utilities
 * import { TestDatabaseHelper, setupTestDatabase } from '@test-utils/helpers';
 * ```
 */

// ============================================================================
// Auth BC
// ============================================================================
export { TestAuthHelper, generateTestEmail, createTestUserInDb } from './auth';

// Backward compatibility exports (deprecated)
export { TestAuthHelper as E2EAuthHelper } from './auth';
export { createTestUserInDb as createTestUser } from './auth';

// ============================================================================
// Account BC
// ============================================================================
export { TestAccountHelper, createBusinessOwnerInDb } from './account';

// ============================================================================
// Business BC
// ============================================================================
export {
  TestBusinessHelper,
  generateUniqueWhatsAppNumber,
  createTestBusiness,
  createTestBusinessInDb,
} from './business';

// ============================================================================
// Customer BC
// ============================================================================
export { TestCustomerHelper, createCustomerInDb, generateUniqueWhatsAppPhone } from './customer';

// ============================================================================
// Availability BC
// ============================================================================
export {
  TestCapacityHelper,
  createCapacityForTomorrow,
  createCapacityForDate,
} from './availability/capacity';

export { TestScheduleHelper, createScheduleInDb } from './availability/schedule';

export { TestBlockoutHelper, createBlockoutInDb } from './availability/blockout';

// ============================================================================
// Booking BC
// ============================================================================
export { TestBookingHelper, createAppointmentInDb } from './booking';

// ============================================================================
// Offering BC
// ============================================================================
export {
  TestOfferingHelper,
  createActiveOffering,
  createMultipleOfferings,
  createOfferingInDb,
} from './offering';

// ============================================================================
// Conversation BC
// ============================================================================
export { TestConversationHelper, createConversationInDb } from './conversation';

export { TestMessageHelper, createMessageInDb } from './message';

// ============================================================================
// Database Utilities
// ============================================================================
export {
  TestDatabaseHelper,
  cleanDatabase,
  createTestDataSource,
  setupTestDatabase,
  teardownTestDatabase,
  getTestTypeOrmConfig,
  generateTestId,
  ensureMigrationsRun,
} from './database';

// Backward compatibility exports (deprecated)
export { TestDatabaseHelper as E2EDatabaseHelper } from './database';

// ============================================================================
// Types
// ============================================================================
export {
  // Auth BC
  UserRole,
  TestUser,
  RegisterDto,
  LoginResponse,
  RegisterResponse,

  // Account BC
  SubscriptionPlan,
  CreateBusinessOwnerDto,

  // Business BC
  AddressDto,
  CreateBusinessDto,
  ConfigureWhatsAppDto,

  // Customer BC
  CreateCustomerDto,

  // Offering BC
  CreateOfferingDto,

  // Availability BC
  CreateCapacityDto,
  CreateScheduleDto,
  CreateBlockoutDto,

  // Booking BC
  CreateAppointmentDto,
  ModifyAppointmentDto,

  // Conversation BC
  CreateConversationDto,
  CreateMessageDto,

  // Composite Types
  CreateTestUserOptions,
} from './types';
