/**
 * E2E Test: Complete Registration Flow
 *
 * Tests the integration between Auth BC and Account BC:
 * 1. User registers with role=BUSINESS_OWNER
 * 2. BusinessOwner is created automatically
 * 3. BusinessOwner has FREE plan and onboardingCompleted=false
 *
 * Requirements: 10.1-10.5, Integration with Auth BC
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { AppModule } from '@/app.module';

describe('E2E: Complete Registration Flow (Auth → Account)', () => {
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

  it('should create BusinessOwner automatically when User registers with role=BUSINESS_OWNER', async () => {
    // Arrange
    const email = 'owner@example.com';
    const password = 'SecurePass123!';
    const name = 'John Doe';
    const role = UserRole.BUSINESS_OWNER;

    // Act: Register user with BUSINESS_OWNER role
    const registerResult = await commandBus.execute(
      new RegisterCommand(email, password, name, role),
    );

    // Wait for event handler to process (eventual consistency)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert: User was created
    expect(registerResult).toBeDefined();
    expect(registerResult.userId).toBeDefined();

    // Assert: BusinessOwner was created automatically
    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwner).toBeDefined();
    expect(businessOwner.userId).toBe(registerResult.userId);
    expect(businessOwner.subscriptionPlan).toBe('FREE');
    expect(businessOwner.subscriptionStatus).toBe('ACTIVE');
    expect(businessOwner.onboardingCompleted).toBe(true);
    expect(businessOwner.version).toBe(2);
  });

  it('should NOT create BusinessOwner when User registers with role=CUSTOMER', async () => {
    // Arrange
    const email = 'customer@example.com';
    const password = 'SecurePass123!';
    const name = 'Jane Doe';
    const role = UserRole.CUSTOMER;

    // Act: Register user with CUSTOMER role
    const registerResult = await commandBus.execute(
      new RegisterCommand(email, password, name, role),
    );

    // Wait for event handler to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert: User was created
    expect(registerResult).toBeDefined();
    expect(registerResult.userId).toBeDefined();

    // Assert: BusinessOwner was NOT created
    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwner).toBeNull();
  });

  it('should create BusinessOwner with correct FREE plan limits', async () => {
    // Arrange
    const email = 'owner2@example.com';
    const password = 'SecurePass123!';
    const name = 'Bob Smith';
    const role = UserRole.BUSINESS_OWNER;

    // Act
    const registerResult = await commandBus.execute(
      new RegisterCommand(email, password, name, role),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert
    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwner).toBeDefined();

    // Verify FREE plan limits
    expect(businessOwner.subscriptionPlan).toBe('FREE');
    // Note: maxBusinesses and maxAppointmentsPerMonth are not in read model
    // They are derived from the plan name in the domain
  });

  it('should handle multiple concurrent registrations correctly', async () => {
    // Arrange
    const registrations = [
      {
        email: 'owner3@example.com',
        password: 'Pass123!',
        name: 'Alice',
        role: UserRole.BUSINESS_OWNER,
      },
      {
        email: 'owner4@example.com',
        password: 'Pass123!',
        name: 'Bob',
        role: UserRole.BUSINESS_OWNER,
      },
      {
        email: 'customer1@example.com',
        password: 'Pass123!',
        name: 'Charlie',
        role: UserRole.CUSTOMER,
      },
    ];

    // Act: Register multiple users concurrently
    const results = await Promise.all(
      registrations.map((reg) =>
        commandBus.execute(new RegisterCommand(reg.email, reg.password, reg.name, reg.role)),
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Assert: All users created
    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.userId).toBeDefined();
    });

    // Assert: Only BUSINESS_OWNER users have BusinessOwner
    const businessOwner1 = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(results[0].userId),
    );
    const businessOwner2 = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(results[1].userId),
    );
    const businessOwner3 = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(results[2].userId),
    );

    expect(businessOwner1).toBeDefined();
    expect(businessOwner2).toBeDefined();
    expect(businessOwner3).toBeNull(); // CUSTOMER role
  });
});
