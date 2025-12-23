/**
 * E2E Test: Subscription Upgrade Flow
 *
 * Tests subscription upgrade scenarios:
 * 1. Upgrade from FREE to BASIC
 * 2. Upgrade from BASIC to PRO
 * 3. Attempt downgrade (should fail)
 * 4. Attempt upgrade to same plan (should fail)
 *
 * Requirements: 4.1-4.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { UpgradeSubscriptionCommand } from '../commands/upgrade-subscription/command';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { AppModule } from '@/app.module';
import { AlreadyOnThisPlanException } from '@account/domain/exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '@account/domain/exceptions/cannot-downgrade-subscription.exception';

describe('E2E: Subscription Upgrade Flow', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeAll(async () => {
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

  it('should upgrade from FREE to BASIC successfully', async () => {
    // Arrange: Register user (gets FREE plan)
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner@example.com',
        'SecurePass123!',
        'John Doe',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessOwnerBefore = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerBefore.subscriptionPlan).toBe('FREE');

    // Act: Upgrade to BASIC
    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwnerBefore.id, 'BASIC'));

    // Assert
    const businessOwnerAfter = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerAfter.subscriptionPlan).toBe('BASIC');
    expect(businessOwnerAfter.version).toBe(3); // Version 2 (after auto-onboarding) + 1 (upgrade)
  });

  it('should upgrade from BASIC to PRO successfully', async () => {
    // Arrange: Register and upgrade to BASIC
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner2@example.com',
        'SecurePass123!',
        'Jane Doe',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

    // Act: Upgrade to PRO
    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

    // Assert
    const businessOwnerAfter = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerAfter.subscriptionPlan).toBe('PRO');
    expect(businessOwnerAfter.version).toBe(4); // Version 2 (auto-onboarding) + 1 (FREE→BASIC) + 1 (BASIC→PRO)
  });

  it('should upgrade from PRO to ENTERPRISE successfully', async () => {
    // Arrange: Register and upgrade to PRO
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

    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC'));

    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

    // Act: Upgrade to ENTERPRISE
    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'ENTERPRISE'));

    // Assert
    const businessOwnerAfter = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerAfter.subscriptionPlan).toBe('ENTERPRISE');
    expect(businessOwnerAfter.version).toBe(5); // Version 2 (auto-onboarding) + 1 (FREE→BASIC) + 1 (BASIC→PRO) + 1 (PRO→ENTERPRISE)
  });

  it('should throw error when upgrading to same plan', async () => {
    // Arrange: Register user
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

    // Act & Assert: Attempt to upgrade to FREE (same plan)
    await expect(
      commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'FREE')),
    ).rejects.toThrow(AlreadyOnThisPlanException);
  });

  it('should throw error when attempting downgrade from PRO to BASIC', async () => {
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
  });

  it('should throw error when attempting downgrade from ENTERPRISE to PRO', async () => {
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

  it('should handle concurrent upgrade attempts gracefully', async () => {
    // Arrange: Register user
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

    // Act: Attempt concurrent upgrades
    const promises = [
      commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'BASIC')),
      commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO')),
    ];

    // Assert: Both should eventually succeed (retry logic)
    // One will succeed immediately, the other will retry and succeed
    const results = await Promise.allSettled(promises);

    // At least one should succeed
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    expect(succeeded.length).toBeGreaterThanOrEqual(1);

    // Verify final state
    const businessOwnerFinal = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    // Should be either BASIC or PRO (depending on which succeeded last)
    expect(['BASIC', 'PRO']).toContain(businessOwnerFinal.subscriptionPlan);
  });
});
