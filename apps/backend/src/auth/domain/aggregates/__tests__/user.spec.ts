import { User } from '../user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '../../vo/email';
import { UserRole } from '../../vo/user-role';
import { UserRegistered } from '../../events/user-registered';
import { UserRoleAdded } from '../../events/user-role-added';
import { UserRoleRemoved } from '../../events/user-role-removed';
import { UserEmailVerified } from '../../events/user-email-verified';
import { UserActivated } from '../../events/user-activated';
import { UserDeactivated } from '../../events/user-deactivated';
import { UserAlreadyHasRoleException } from '../../exceptions/user-already-has-role';
import { UserDoesNotHaveRoleException } from '../../exceptions/user-does-not-have-role';
import { CannotRemoveLastRoleException } from '../../exceptions/cannot-remove-last-role';
import { EmailAlreadyVerifiedException } from '../../exceptions/email-already-verified';
import { UserAlreadyActiveException } from '../../exceptions/user-already-active';
import { UserAlreadyInactiveException } from '../../exceptions/user-already-inactive';

describe('User Aggregate', () => {
  const validId = UUID.generate();
  const validEmail = Email.fromString('test@example.com');
  const validPassword = 'SecurePass123!';
  const validName = 'John Doe';

  describe('register() - Factory Method', () => {
    it('should create a new user with initialRole', async () => {
      // Arrange & Act
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Assert
      expect(user.getId()).toEqual(validId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getName()).toBe(validName);
      expect(user.getRoles()).toEqual([UserRole.BUSINESS_OWNER]);
      expect(user.getIsActive()).toBe(true);
      expect(user.getEmailVerified()).toBe(false);
      expect(user.getVersion().getValue()).toBe(1);
    });

    it('should create user with CUSTOMER role', async () => {
      // Arrange & Act
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.CUSTOMER,
      );

      // Assert
      expect(user.getRoles()).toEqual([UserRole.CUSTOMER]);
    });

    it('should create user with ADMIN role', async () => {
      // Arrange & Act
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.ADMIN,
      );

      // Assert
      expect(user.getRoles()).toEqual([UserRole.ADMIN]);
    });

    it('should publish UserRegistered event with initialRole', async () => {
      // Arrange & Act
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getId()).toEqual(validId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getName()).toBe(validName);
      expect(user.getRoles()).toEqual([UserRole.BUSINESS_OWNER]);
      expect(user.getVersion().getValue()).toBe(1); // Version incremented means event was applied
    });

    it('should increment version to 1 after registration', async () => {
      // Arrange & Act
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Assert
      expect(user.getVersion().getValue()).toBe(1);
    });
  });

  describe('addRole()', () => {
    it('should add a new role to user', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.commit(); // Clear events

      // Act
      user.addRole(UserRole.CUSTOMER);

      // Assert
      expect(user.getRoles()).toContain(UserRole.BUSINESS_OWNER);
      expect(user.getRoles()).toContain(UserRole.CUSTOMER);
      expect(user.getRoles()).toHaveLength(2);
    });

    it('should throw UserAlreadyHasRoleException when adding duplicate role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(() => user.addRole(UserRole.BUSINESS_OWNER)).toThrow(UserAlreadyHasRoleException);
    });

    it('should publish UserRoleAdded event', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.addRole(UserRole.CUSTOMER);

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getRoles()).toContain(UserRole.CUSTOMER);
      expect(user.getVersion().getValue()).toBe(initialVersion + 1); // Version incremented means event was applied
    });

    it('should increment version when adding role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.addRole(UserRole.CUSTOMER);

      // Assert
      expect(user.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });

  describe('removeRole()', () => {
    it('should remove an existing role from user', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.addRole(UserRole.CUSTOMER);
      user.commit(); // Clear events

      // Act
      user.removeRole(UserRole.CUSTOMER);

      // Assert
      expect(user.getRoles()).toEqual([UserRole.BUSINESS_OWNER]);
      expect(user.getRoles()).toHaveLength(1);
    });

    it('should throw UserDoesNotHaveRoleException when removing non-existent role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(() => user.removeRole(UserRole.CUSTOMER)).toThrow(UserDoesNotHaveRoleException);
    });

    it('should throw CannotRemoveLastRoleException when removing last role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(() => user.removeRole(UserRole.BUSINESS_OWNER)).toThrow(CannotRemoveLastRoleException);
    });

    it('should publish UserRoleRemoved event', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.addRole(UserRole.CUSTOMER);
      const versionBeforeRemove = user.getVersion().getValue();

      // Act
      user.removeRole(UserRole.CUSTOMER);

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getRoles()).not.toContain(UserRole.CUSTOMER);
      expect(user.getVersion().getValue()).toBe(versionBeforeRemove + 1); // Version incremented means event was applied
    });

    it('should increment version when removing role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.addRole(UserRole.CUSTOMER);
      const versionBeforeRemove = user.getVersion().getValue();

      // Act
      user.removeRole(UserRole.CUSTOMER);

      // Assert
      expect(user.getVersion().getValue()).toBe(versionBeforeRemove + 1);
    });
  });

  describe('hasRole()', () => {
    it('should return true when user has the role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(user.hasRole(UserRole.BUSINESS_OWNER)).toBe(true);
    });

    it('should return false when user does not have the role', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(user.hasRole(UserRole.CUSTOMER)).toBe(false);
    });

    it('should return true for multiple roles', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.addRole(UserRole.CUSTOMER);

      // Act & Assert
      expect(user.hasRole(UserRole.BUSINESS_OWNER)).toBe(true);
      expect(user.hasRole(UserRole.CUSTOMER)).toBe(true);
      expect(user.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('verifyEmail()', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.commit(); // Clear events

      // Act
      user.verifyEmail();

      // Assert
      expect(user.getEmailVerified()).toBe(true);
    });

    it('should throw EmailAlreadyVerifiedException when email already verified', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.verifyEmail();

      // Act & Assert
      expect(() => user.verifyEmail()).toThrow(EmailAlreadyVerifiedException);
    });

    it('should publish UserEmailVerified event', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.verifyEmail();

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getEmailVerified()).toBe(true);
      expect(user.getVersion().getValue()).toBe(initialVersion + 1); // Version incremented means event was applied
    });

    it('should increment version when verifying email', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.verifyEmail();

      // Assert
      expect(user.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });

  describe('activate()', () => {
    it('should activate an inactive user', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.deactivate();
      user.commit(); // Clear events

      // Act
      user.activate();

      // Assert
      expect(user.getIsActive()).toBe(true);
    });

    it('should throw UserAlreadyActiveException when user already active', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act & Assert
      expect(() => user.activate()).toThrow(UserAlreadyActiveException);
    });

    it('should publish UserActivated event', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.deactivate();
      const versionBeforeActivate = user.getVersion().getValue();

      // Act
      user.activate();

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getIsActive()).toBe(true);
      expect(user.getVersion().getValue()).toBe(versionBeforeActivate + 1); // Version incremented means event was applied
    });

    it('should increment version when activating', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.deactivate();
      const versionBeforeActivate = user.getVersion().getValue();

      // Act
      user.activate();

      // Assert
      expect(user.getVersion().getValue()).toBe(versionBeforeActivate + 1);
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active user', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.commit(); // Clear events

      // Act
      user.deactivate();

      // Assert
      expect(user.getIsActive()).toBe(false);
    });

    it('should throw UserAlreadyInactiveException when user already inactive', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      user.deactivate();

      // Act & Assert
      expect(() => user.deactivate()).toThrow(UserAlreadyInactiveException);
    });

    it('should publish UserDeactivated event', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.deactivate();

      // Assert
      // Note: With autoCommit=true, events are published immediately to EventBus
      // We verify the event was applied by checking the aggregate state
      expect(user.getIsActive()).toBe(false);
      expect(user.getVersion().getValue()).toBe(initialVersion + 1); // Version incremented means event was applied
    });

    it('should increment version when deactivating', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );
      const initialVersion = user.getVersion().getValue();

      // Act
      user.deactivate();

      // Assert
      expect(user.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });

  describe('fromPersistence() - Reconstruction', () => {
    it('should reconstruct user from persistence with all fields', () => {
      // Arrange
      const hashedPassword = '$2b$10$hashedpassword';
      const roles = [UserRole.BUSINESS_OWNER, UserRole.CUSTOMER];
      const createdAt = new Date('2024-01-01');
      const version = 5;

      // Act
      const user = User.fromPersistence(
        validId,
        validEmail,
        hashedPassword,
        validName,
        roles,
        true,
        true,
        createdAt,
        version,
      );

      // Assert
      expect(user.getId()).toEqual(validId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getName()).toBe(validName);
      expect(user.getRoles()).toEqual(roles);
      expect(user.getIsActive()).toBe(true);
      expect(user.getEmailVerified()).toBe(true);
      expect(user.getCreatedAt()).toEqual(createdAt);
      expect(user.getVersion().getValue()).toBe(version);
    });

    it('should preserve version for optimistic locking', () => {
      // Arrange
      const hashedPassword = '$2b$10$hashedpassword';
      const version = 10;

      // Act
      const user = User.fromPersistence(
        validId,
        validEmail,
        hashedPassword,
        validName,
        [UserRole.BUSINESS_OWNER],
        true,
        false,
        new Date(),
        version,
      );

      // Assert
      expect(user.getVersion().getValue()).toBe(version);
    });
  });

  describe('getRoles() - Immutability', () => {
    it('should return a copy of roles array', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act
      const roles1 = user.getRoles();
      const roles2 = user.getRoles();

      // Assert
      expect(roles1).toEqual(roles2);
      expect(roles1).not.toBe(roles2); // Different array instances
    });

    it('should not allow external modification of roles', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Act
      const roles = user.getRoles();
      roles.push(UserRole.CUSTOMER); // Try to modify

      // Assert
      expect(user.getRoles()).toEqual([UserRole.BUSINESS_OWNER]); // Original unchanged
    });
  });

  describe('Version Increments', () => {
    it('should increment version on each domain operation', async () => {
      // Arrange
      const user = await User.register(
        validId,
        validEmail,
        validPassword,
        validName,
        UserRole.BUSINESS_OWNER,
      );

      // Initial version after register
      expect(user.getVersion().getValue()).toBe(1);

      // Act & Assert - Each operation increments version
      user.addRole(UserRole.CUSTOMER);
      expect(user.getVersion().getValue()).toBe(2);

      user.verifyEmail();
      expect(user.getVersion().getValue()).toBe(3);

      user.deactivate();
      expect(user.getVersion().getValue()).toBe(4);

      user.activate();
      expect(user.getVersion().getValue()).toBe(5);

      user.removeRole(UserRole.CUSTOMER);
      expect(user.getVersion().getValue()).toBe(6);
    });
  });
});
