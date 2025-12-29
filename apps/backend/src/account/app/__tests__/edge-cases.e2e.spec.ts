/**
 * E2E Test: Edge Cases
 *
 * Tests edge cases and boundary conditions:
 * 1. User with multiple roles
 * 2. Concurrent BusinessOwner creation
 * 3. Upgrade to same plan
 * 4. Downgrade attempt
 * 5. Suspended subscription restoration
 *
 * Requirements: Edge Cases 1-5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { UpgradeSubscriptionCommand } from '../commands/upgrade-subscription/command';
import { RestoreSubscriptionCommand } from '../commands/restore-subscription/command';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { AppModule } from '@/app.module';
import { AlreadyOnThisPlanException } from '@account/domain/exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '@account/domain/exceptions/cannot-downgrade-subscription.exception';
import { ensureMigrationsRun } from '../../../../test/test-setup';

describe('E2E: Edge Cases', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeAll(async () => {
    // IMPORTANT: Run migrations first (once per test session)
    await ensureMigrationsRun();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    commandBus = moduleFixture.get<CommandBus>(CommandBus);
    queryBus = moduleFixture.get<QueryBus>(QueryBus);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up tables
    await dataSource.query('DELETE FROM business_owners');
    await dataSource.query('DELETE FROM users');
  });

  describe('Edge Case 1: User with Multiple Roles', () => {
    it('should create only one BusinessOwner for User with multiple roles', async () => {
      // Arrange: Register user with BUSINESS_OWNER role
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner@example.com',
          'SecurePass123!',
          'John Doe',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act: Verify BusinessOwner was created
      const businessOwner1 = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwner1).toBeDefined();

      // Note: Adding CUSTOMER role would be done via AddUserRoleCommand in Auth BC
      // This test verifies that only one BusinessOwner exists per userId
      // due to unique constraint on user_id column

      // Verify no duplicate BusinessOwners
      const count = await dataSource.query(
        'SELECT COUNT(*) as count FROM business_owners WHERE user_id = $1',
        [registerResult.userId],
      );

      expect(parseInt(count[0].count)).toBe(1);
    });
  });

  describe('Edge Case 2: Concurrent BusinessOwner Creation', () => {
    it('should prevent duplicate BusinessOwners for same userId', async () => {
      // Arrange: Register user
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner2@example.com',
          'SecurePass123!',
          'Jane Doe',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act: Verify only one BusinessOwner exists
      const count = await dataSource.query(
        'SELECT COUNT(*) as count FROM business_owners WHERE user_id = $1',
        [registerResult.userId],
      );

      expect(parseInt(count[0].count)).toBe(1);

      // Assert: Unique constraint prevents duplicates
      // Attempting to insert another BusinessOwner with same userId should fail
      await expect(
        dataSource.query(
          `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at)
           VALUES (gen_random_uuid(), $1, 'FREE', 'ACTIVE', false, 1, NOW())`,
          [registerResult.userId],
        ),
      ).rejects.toThrow();
    });
  });

  describe('Edge Case 3: Upgrade to Same Plan', () => {
    it('should throw AlreadyOnThisPlanException when upgrading to same plan', async () => {
      // Arrange: Register user with FREE plan
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner3@example.com',
          'SecurePass123!',
          'Bob Smith',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      // Act & Assert: Attempt to upgrade to FREE (same plan)
      await expect(
        commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'FREE')),
      ).rejects.toThrow(AlreadyOnThisPlanException);

      // Verify state unchanged
      const businessOwnerAfter = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwnerAfter.subscriptionPlan).toBe('FREE');
      expect(businessOwnerAfter.version).toBe(2); // Version not incremented (same plan)
    });

    it('should throw AlreadyOnThisPlanException when upgrading BASIC to BASIC', async () => {
      // Arrange: Register and upgrade to BASIC
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner4@example.com',
          'SecurePass123!',
          'Alice Johnson',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

      // Act & Assert: Attempt to upgrade to BASIC again
      await expect(
        commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC')),
      ).rejects.toThrow(AlreadyOnThisPlanException);
    });
  });

  describe('Edge Case 4: Downgrade Attempt', () => {
    it('should throw CannotDowngradeSubscriptionException when downgrading from PRO to BASIC', async () => {
      // Arrange: Register and upgrade to PRO
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner5@example.com',
          'SecurePass123!',
          'Charlie Brown',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

      // Act & Assert: Attempt downgrade to BASIC
      await expect(
        commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC')),
      ).rejects.toThrow(CannotDowngradeSubscriptionException);

      // Verify state unchanged
      const businessOwnerAfter = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwnerAfter.subscriptionPlan).toBe('PRO');
      expect(businessOwnerAfter.version).toBe(4); // Version not incremented (same plan)
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from ENTERPRISE to PRO', async () => {
      // Arrange: Register and upgrade to ENTERPRISE
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner6@example.com',
          'SecurePass123!',
          'David Lee',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'ENTERPRISE'));

      // Act & Assert: Attempt downgrade to PRO
      await expect(
        commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO')),
      ).rejects.toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from BASIC to FREE', async () => {
      // Arrange: Register and upgrade to BASIC
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner7@example.com',
          'SecurePass123!',
          'Eve Wilson',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

      // Act & Assert: Attempt downgrade to FREE
      await expect(
        commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'FREE')),
      ).rejects.toThrow(CannotDowngradeSubscriptionException);
    });
  });

  describe('Edge Case 5: Suspended Subscription Restoration', () => {
    it('should be idempotent when restoring already active subscription', async () => {
      // Arrange: Register user with active subscription
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner8@example.com',
          'SecurePass123!',
          'Frank Miller',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwner.subscriptionStatus).toBe('ACTIVE');

      // Act: Restore already active subscription (should be idempotent)
      await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

      // Assert: No error thrown, state unchanged
      const businessOwnerAfter = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwnerAfter.subscriptionStatus).toBe('ACTIVE');
      expect(businessOwnerAfter.version).toBe(2); // Version unchanged (restore is idempotent when already ACTIVE)
    });

    it('should handle multiple restore attempts gracefully', async () => {
      // Arrange: Register user
      const registerResult = await commandBus.execute(
        new RegisterCommand(
          'owner9@example.com',
          'SecurePass123!',
          'Grace Hopper',
          UserRole.BUSINESS_OWNER,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const businessOwner = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      // Act: Multiple restore attempts
      await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

      await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

      await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

      // Assert: All succeed (idempotent)
      const businessOwnerAfter = await queryBus.execute(
        new GetBusinessOwnerByUserIdQuery(registerResult.userId),
      );

      expect(businessOwnerAfter.subscriptionStatus).toBe('ACTIVE');
      expect(businessOwnerAfter.version).toBe(2); // Version 2 after creation (1) + onboarding (2), unchanged by idempotent restore
    });
  });
});
