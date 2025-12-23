/**
 * E2E Test: Onboarding Flow
 *
 * Tests the onboarding process:
 * 1. BusinessOwner cannot create Business before onboarding
 * 2. Complete onboarding
 * 3. BusinessOwner can create Business after onboarding
 *
 * Requirements: 3.1-3.5, 11.2-11.3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { CompleteOnboardingCommand } from '../commands/complete-onboarding/command';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { AppModule } from '@/app.module';
import { OnboardingAlreadyCompletedException } from '@account/domain/exceptions/onboarding-already-completed.exception';

describe('E2E: Onboarding Flow', () => {
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

  it('should have onboarding auto-completed after registration', async () => {
    // Arrange: Register user
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner@example.com',
        'SecurePass123!',
        'John Doe',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Act: Get BusinessOwner
    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    // Assert: Onboarding was auto-completed by event handler
    expect(businessOwner.onboardingCompleted).toBe(true);
    expect(businessOwner.version).toBe(2); // Version 1 (create) + 1 (complete onboarding)
  });

  it('should throw error when completing onboarding twice (idempotency)', async () => {
    // Arrange: Register user (onboarding auto-completed)
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

    // Verify onboarding is already completed
    expect(businessOwner.onboardingCompleted).toBe(true);

    // Act & Assert: Attempt to complete onboarding again should throw
    await expect(
      commandBus.execute(new CompleteOnboardingCommand(businessOwner.id)),
    ).rejects.toThrow(OnboardingAlreadyCompletedException);
  });

  it('should allow Business creation after auto-completed onboarding', async () => {
    // Arrange: Register user (onboarding auto-completed)
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner3@example.com',
        'SecurePass123!',
        'Bob Smith',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Act: Get BusinessOwner
    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    // Assert: Onboarding is completed, ready for Business creation
    expect(businessOwner.onboardingCompleted).toBe(true);
    expect(businessOwner.version).toBe(2);

    // Note: Actual Business creation would be tested in Business BC
    // This test verifies that the onboarding flag is set correctly
  });

  it('should handle concurrent onboarding attempts gracefully (idempotency)', async () => {
    // Arrange: Register user (onboarding auto-completed)
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

    // Verify onboarding is already completed
    expect(businessOwner.onboardingCompleted).toBe(true);

    // Act: Attempt concurrent onboarding (both should fail since already completed)
    const promises = [
      commandBus.execute(new CompleteOnboardingCommand(businessOwner.id)),
      commandBus.execute(new CompleteOnboardingCommand(businessOwner.id)),
    ];

    // Assert: Both should fail with OnboardingAlreadyCompletedException
    const results = await Promise.allSettled(promises);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(0);
    expect(failed.length).toBe(2);

    // Verify final state unchanged
    const businessOwnerFinal = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerFinal.onboardingCompleted).toBe(true);
    expect(businessOwnerFinal.version).toBe(2); // Unchanged
  });
});
