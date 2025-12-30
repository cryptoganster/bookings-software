import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { User } from '../user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '../../vo/email';
import { UserRole } from '../../vo/user-role';
import { CannotRemoveLastRoleException } from '../../exceptions/cannot-remove-last-role';
import { UserAlreadyHasRoleException } from '../../exceptions/user-already-has-role';
import { EmailAlreadyVerifiedException } from '../../exceptions/email-already-verified';

/**
 * Property-Based Tests for User Aggregate
 *
 * These tests verify universal properties that should hold for all valid inputs.
 */
describe('User Aggregate - Property-Based Tests', () => {
  // Arbitrary for valid UUID that passes our UUID.fromString validation
  // Generate valid v4 UUIDs
  const hexChar = fc.constantFrom(
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  );
  const hexString = (length: number) =>
    fc.array(hexChar, { minLength: length, maxLength: length }).map((arr) => arr.join(''));

  const validUuidArbitrary = fc
    .tuple(
      hexString(8),
      hexString(4),
      hexString(3), // Will prepend '4' for version
      hexString(3), // Will prepend variant bits
      hexString(12),
    )
    .map(([a, b, c, d, e]) => {
      // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const cFixed = '4' + c; // Version 4
      const dFixed = ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)] + d; // Variant
      return `${a}-${b}-${cFixed}-${dFixed}-${e}`;
    });

  // Arbitrary for UserRole
  const userRoleArbitrary = fc.constantFrom(
    UserRole.BUSINESS_OWNER,
    UserRole.CUSTOMER,
    UserRole.ADMIN,
  );

  // Arbitrary for valid email
  const emailArbitrary = fc.emailAddress().map((email: string) => Email.fromString(email));

  // Arbitrary for valid password - use constant to avoid bcrypt overhead in PBT
  // Password must have: uppercase, lowercase, number, min 8 chars
  const passwordArbitrary = fc.constant('ValidPass123');

  // Arbitrary for name
  const nameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

  /**
   * Property 1: User always has at least one role
   * @requirements 1.2, 2.4
   * @validates Requirements 1.2, 2.4
   *
   * Feature: auth-bc-roles-refactor, Property 1: User always has at least one role
   */
  describe('Property 1: User always has at least one role', () => {
    it('should prevent removing the last role', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (email, password, name, initialRole) => {
            // Arrange
            const userId = UUID.generate(); // Generate valid UUID
            const user = await User.register(userId, email, password, name, initialRole);

            // Act & Assert
            expect(() => user.removeRole(initialRole)).toThrow(CannotRemoveLastRoleException);
            expect(user.getRoles()).toHaveLength(1);
            expect(user.getRoles()).toContain(initialRole);
          },
        ),
        { numRuns: 30 }, // 10 runs per role (3 roles)
      );
    });

    it('should allow removing a role when user has multiple roles', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role1, role2) => {
            // Skip if both roles are the same
            if (role1 === role2) return;

            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role1);
            user.addRole(role2);

            // Act
            user.removeRole(role2);

            // Assert
            expect(user.getRoles()).toHaveLength(1);
            expect(user.getRoles()).toContain(role1);
            expect(user.getRoles()).not.toContain(role2);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should maintain at least one role after multiple operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          fc.array(userRoleArbitrary, { minLength: 1, maxLength: 5 }),
          async (id, email, password, name, initialRole, rolesToAdd) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, initialRole);

            // Act - Add multiple roles
            for (const role of rolesToAdd) {
              if (!user.hasRole(role)) {
                user.addRole(role);
              }
            }

            // Try to remove all roles except one
            const currentRoles = user.getRoles();
            for (let i = 0; i < currentRoles.length - 1; i++) {
              user.removeRole(currentRoles[i]);
            }

            // Assert - Should always have at least one role
            expect(user.getRoles().length).toBeGreaterThanOrEqual(1);
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  /**
   * Property 2: Adding duplicate role is idempotent
   * @requirements 2.2, 5.4
   * @validates Requirements 2.2, 5.4
   *
   * Feature: auth-bc-roles-refactor, Property 2: Adding duplicate role is idempotent
   */
  describe('Property 2: Adding duplicate role throws exception', () => {
    it('should throw UserAlreadyHasRoleException when adding duplicate role', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);

            // Act & Assert
            expect(() => user.addRole(role)).toThrow(UserAlreadyHasRoleException);
            expect(user.getRoles()).toHaveLength(1);
            expect(user.getRoles()).toContain(role);
          },
        ),
        { numRuns: 30 }, // 10 runs per role
      );
    });

    it('should prevent adding any role that already exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          fc.array(userRoleArbitrary, { minLength: 1, maxLength: 3 }),
          async (id, email, password, name, initialRole, rolesToAdd) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, initialRole);

            // Act - Add roles
            const addedRoles = new Set([initialRole]);
            for (const role of rolesToAdd) {
              if (!addedRoles.has(role)) {
                user.addRole(role);
                addedRoles.add(role);
              }
            }

            // Assert - Try to add each role again
            for (const role of addedRoles) {
              expect(() => user.addRole(role)).toThrow(UserAlreadyHasRoleException);
            }
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  /**
   * Property 3: Removing last role is prevented
   * @requirements 2.4, 5.5
   * @validates Requirements 2.4, 5.5
   *
   * Feature: auth-bc-roles-refactor, Property 3: Removing last role is prevented
   */
  describe('Property 3: Removing last role is prevented', () => {
    it('should always throw CannotRemoveLastRoleException when removing last role', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);

            // Act & Assert
            expect(() => user.removeRole(role)).toThrow(CannotRemoveLastRoleException);

            // Verify user still has the role
            expect(user.getRoles()).toHaveLength(1);
            expect(user.hasRole(role)).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should prevent removing last role regardless of which role it is', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          fc.array(userRoleArbitrary, { minLength: 2, maxLength: 3 }),
          async (id, email, password, name, roles) => {
            // Ensure we have unique roles
            const uniqueRoles = Array.from(new Set(roles)) as UserRole[];
            if (uniqueRoles.length < 2) return; // Skip if not enough unique roles

            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, uniqueRoles[0]);

            // Add remaining roles
            for (let i = 1; i < uniqueRoles.length; i++) {
              user.addRole(uniqueRoles[i]);
            }

            // Act - Remove all but one role
            for (let i = 0; i < uniqueRoles.length - 1; i++) {
              user.removeRole(uniqueRoles[i]);
            }

            // Assert - Cannot remove the last role
            const lastRole = user.getRoles()[0];
            expect(() => user.removeRole(lastRole)).toThrow(CannotRemoveLastRoleException);
            expect(user.getRoles()).toHaveLength(1);
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  /**
   * Property 4: Email verification is idempotent
   * @requirements 6.5
   * @validates Requirements 6.5
   *
   * Feature: auth-bc-roles-refactor, Property 4: Email verification is idempotent
   */
  describe('Property 4: Email verification is idempotent', () => {
    it('should throw EmailAlreadyVerifiedException when verifying already verified email', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);

            // Act - Verify email first time
            user.verifyEmail();
            expect(user.getEmailVerified()).toBe(true);

            // Assert - Second verification should throw
            expect(() => user.verifyEmail()).toThrow(EmailAlreadyVerifiedException);
            expect(user.getEmailVerified()).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should maintain verified state after multiple verification attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          fc.integer({ min: 2, max: 5 }),
          async (id, email, password, name, role, attempts) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);

            // Act - Verify email first time
            user.verifyEmail();
            const versionAfterFirstVerify = user.getVersion().getValue();

            // Try to verify multiple times
            for (let i = 0; i < attempts; i++) {
              expect(() => user.verifyEmail()).toThrow(EmailAlreadyVerifiedException);
            }

            // Assert - State should remain unchanged
            expect(user.getEmailVerified()).toBe(true);
            expect(user.getVersion().getValue()).toBe(versionAfterFirstVerify); // Version unchanged
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  /**
   * Property 6: User aggregate version increments on changes
   * @requirements 5.1, 5.2, 5.3
   * @validates Requirements 5.1, 5.2, 5.3
   *
   * Feature: auth-bc-roles-refactor, Property 6: User aggregate version increments on changes
   */
  describe('Property 6: Version increments on changes', () => {
    it('should increment version by exactly 1 for any domain operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);

            // Test addRole
            const versionBeforeAdd = user.getVersion().getValue();
            const roleToAdd = role === UserRole.CUSTOMER ? UserRole.ADMIN : UserRole.CUSTOMER;
            user.addRole(roleToAdd);
            expect(user.getVersion().getValue()).toBe(versionBeforeAdd + 1);

            // Test verifyEmail
            const versionBeforeVerify = user.getVersion().getValue();
            user.verifyEmail();
            expect(user.getVersion().getValue()).toBe(versionBeforeVerify + 1);

            // Test deactivate
            const versionBeforeDeactivate = user.getVersion().getValue();
            user.deactivate();
            expect(user.getVersion().getValue()).toBe(versionBeforeDeactivate + 1);

            // Test activate
            const versionBeforeActivate = user.getVersion().getValue();
            user.activate();
            expect(user.getVersion().getValue()).toBe(versionBeforeActivate + 1);

            // Test removeRole
            const versionBeforeRemove = user.getVersion().getValue();
            user.removeRole(roleToAdd);
            expect(user.getVersion().getValue()).toBe(versionBeforeRemove + 1);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should maintain version consistency across multiple operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          fc.array(userRoleArbitrary, { minLength: 1, maxLength: 3 }),
          async (id, email, password, name, initialRole, rolesToAdd) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, initialRole);
            const initialVersion = user.getVersion().getValue();
            let operationCount = 0;

            // Act - Perform multiple operations
            for (const role of rolesToAdd) {
              if (!user.hasRole(role)) {
                user.addRole(role);
                operationCount++;
              }
            }

            // Assert - Version should increment by number of operations
            expect(user.getVersion().getValue()).toBe(initialVersion + operationCount);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should not increment version when operation throws exception', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUuidArbitrary,
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          userRoleArbitrary,
          async (id, email, password, name, role) => {
            // Arrange
            const userId = UUID.fromString(id);
            const user = await User.register(userId, email, password, name, role);
            const versionBeforeFailedOp = user.getVersion().getValue();

            // Act & Assert - Try operations that should fail
            try {
              user.addRole(role); // Duplicate role
            } catch (_e) {
              // Expected exception
            }
            expect(user.getVersion().getValue()).toBe(versionBeforeFailedOp);

            try {
              user.removeRole(role); // Last role
            } catch (_e) {
              // Expected exception
            }
            expect(user.getVersion().getValue()).toBe(versionBeforeFailedOp);
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
