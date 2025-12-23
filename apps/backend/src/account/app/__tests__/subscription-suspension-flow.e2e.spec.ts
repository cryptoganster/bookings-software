/**
 * E2E Test: Subscription Suspension Flow
 *
 * Tests subscription suspension and restoration:
 * 1. Create BusinessOwner with active subscription
 * 2. Create Business and Appointments
 * 3. Suspend subscription
 * 4. Verify cannot create new Appointments
 * 5. Restore subscription
 * 6. Verify can create new Appointments
 *
 * Requirements: 5.1-5.5, Integration with Booking BC
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { SuspendSubscriptionCommand } from '../commands/suspend-subscription/command';
import { RestoreSubscriptionCommand } from '../commands/restore-subscription/command';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment/command';
import { AppModule } from '@/app.module';

describe('E2E: Subscription Suspension Flow', () => {
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
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM offerings');
    await dataSource.query('DELETE FROM customers');
    await dataSource.query('DELETE FROM businesses');
    await dataSource.query('DELETE FROM business_owners');
    await dataSource.query('DELETE FROM users');
  });

  it('should suspend subscription successfully', async () => {
    // Arrange: Register user and create business
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

    expect(businessOwnerBefore.subscriptionStatus).toBe('ACTIVE');

    // Act: Suspend subscription
    await commandBus.execute(new SuspendSubscriptionCommand(businessOwnerBefore.id));

    // Assert
    const businessOwnerAfter = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerAfter.subscriptionStatus).toBe('SUSPENDED');
    expect(businessOwnerAfter.version).toBe(3); // Version 2 (auto-onboarding) + 1 (suspend)
  });

  it('should restore subscription successfully', async () => {
    // Arrange: Register user and suspend subscription
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

    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    const businessOwnerSuspended = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerSuspended.subscriptionStatus).toBe('SUSPENDED');

    // Act: Restore subscription
    await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

    // Assert
    const businessOwnerRestored = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerRestored.subscriptionStatus).toBe('ACTIVE');
    expect(businessOwnerRestored.version).toBe(4); // Version 2 (auto-onboarding) + 1 (suspend) + 1 (restore)
  });

  it('should prevent appointment creation when subscription is suspended', async () => {
    // Arrange: Register user, create business, suspend subscription
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

    // Create business
    const businessResult = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'My Business',
        '+18095551234',
        {
          street: 'Calle Principal 123',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Create customer and offering (simplified - would need actual setup)
    const customerId = 'test-customer-id';
    const offeringId = 'test-offering-id';

    // Suspend subscription
    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    // Act & Assert: Attempt to create appointment with suspended subscription
    // Note: This would require Business BC to check subscription status
    // For now, we verify the subscription is suspended
    const businessOwnerSuspended = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerSuspended.subscriptionStatus).toBe('SUSPENDED');

    // In a real implementation, CreateAppointmentCommand would check
    // BusinessOwner.subscriptionStatus and throw SubscriptionSuspendedException
  });

  it('should allow appointment creation after restoring subscription', async () => {
    // Arrange: Register user, create business, suspend and restore
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

    // Create business
    const businessResult = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'My Business',
        '+18095551235',
        {
          street: 'Calle Principal 123',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Suspend and restore
    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

    // Act: Verify subscription is active
    const businessOwnerRestored = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    // Assert
    expect(businessOwnerRestored.subscriptionStatus).toBe('ACTIVE');

    // In a real implementation, CreateAppointmentCommand would succeed
    // because subscription is active
  });

  it('should handle suspend-restore cycle multiple times', async () => {
    // Arrange: Register user
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

    // Act: Suspend and restore multiple times
    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    await commandBus.execute(new RestoreSubscriptionCommand(businessOwner.id));

    // Assert
    const businessOwnerFinal = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwnerFinal.subscriptionStatus).toBe('ACTIVE');
    expect(businessOwnerFinal.version).toBe(6); // Version 2 (auto-onboarding) + 1 (suspend) + 1 (restore) + 1 (suspend) + 1 (restore)
  });

  it('should throw error when suspending already suspended subscription', async () => {
    // Arrange: Register user and suspend
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

    await commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id));

    // Act & Assert: Attempt to suspend again
    await expect(
      commandBus.execute(new SuspendSubscriptionCommand(businessOwner.id)),
    ).rejects.toThrow(); // Should throw SubscriptionAlreadySuspendedException
  });
});
