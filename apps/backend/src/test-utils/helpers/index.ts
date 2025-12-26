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
  createTestBusinessInDb,
} from './business';

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
} from './database';

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
