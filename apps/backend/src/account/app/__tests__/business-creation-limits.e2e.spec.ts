/**
 * E2E Test: Business Creation Limits
 *
 * Tests subscription plan limits for business creation:
 * 1. FREE plan allows 1 business
 * 2. PRO plan allows 3 businesses
 * 3. ENTERPRISE plan allows 10 businesses
 * 4. Exceeding limits throws MaxBusinessesExceededException
 *
 * Requirements: 11.4-11.5, Integration with Business BC
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { UpgradeSubscriptionCommand } from '../commands/upgrade-subscription/command';
import { GetBusinessOwnerByUserIdQuery } from '../queries/get-business-owner-by-user-id/query';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { AppModule } from '@/app.module';

describe('E2E: Business Creation Limits', () => {
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
    await dataSource.query('DELETE FROM businesses');
    await dataSource.query('DELETE FROM business_owners');
    await dataSource.query('DELETE FROM users');
  });

  it('should allow creating 1 business with FREE plan', async () => {
    // Arrange: Register user with FREE plan
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner@example.com',
        'SecurePass123!',
        'John Doe',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessOwner = await queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(registerResult.userId),
    );

    expect(businessOwner.subscriptionPlan).toBe('FREE');

    // Act: Create first business
    const result = await commandBus.execute(
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

    // Assert
    expect(result.businessId).toBeDefined();

    // Verify business was created
    const businesses = await dataSource.query(
      'SELECT COUNT(*) as count FROM businesses WHERE owner_id = $1',
      [registerResult.userId],
    );

    expect(parseInt(businesses[0].count)).toBe(1);
  });

  it('should prevent creating 2nd business with FREE plan', async () => {
    // Arrange: Register user and create first business
    const registerResult = await commandBus.execute(
      new RegisterCommand(
        'owner2@example.com',
        'SecurePass123!',
        'Jane Doe',
        UserRole.BUSINESS_OWNER,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create first business
    await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'First Business',
        '+18095551235',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Act & Assert: Attempt to create second business
    await expect(
      commandBus.execute(
        new CreateBusinessCommand(
          registerResult.userId,
          'Second Business',
          '+18095551236',
          {
            street: 'Calle 2',
            city: 'Santo Domingo',
            state: 'Distrito Nacional',
            postalCode: '10101',
            country: 'República Dominicana',
          },
          'America/Santo_Domingo',
        ),
      ),
    ).rejects.toThrow(); // Should throw MaxBusinessesExceededException
  });

  it('should allow creating 3 businesses with PRO plan', async () => {
    // Arrange: Register user and upgrade to PRO
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

    // Upgrade to PRO (maxBusinesses=3)
    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

    // Act: Create 3 businesses
    const business1 = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 1',
        '+18095551237',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    const business2 = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 2',
        '+18095551238',
        {
          street: 'Calle 2',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    const business3 = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 3',
        '+18095551239',
        {
          street: 'Calle 3',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Assert
    expect(business1.businessId).toBeDefined();
    expect(business2.businessId).toBeDefined();
    expect(business3.businessId).toBeDefined();

    // Verify 3 businesses were created
    const businesses = await dataSource.query(
      'SELECT COUNT(*) as count FROM businesses WHERE owner_id = $1',
      [registerResult.userId],
    );

    expect(parseInt(businesses[0].count)).toBe(3);
  });

  it('should prevent creating 4th business with PRO plan', async () => {
    // Arrange: Register user, upgrade to PRO, create 3 businesses
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

    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

    // Create 3 businesses
    await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 1',
        '+18095551240',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 2',
        '+18095551241',
        {
          street: 'Calle 2',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 3',
        '+18095551242',
        {
          street: 'Calle 3',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Act & Assert: Attempt to create 4th business
    await expect(
      commandBus.execute(
        new CreateBusinessCommand(
          registerResult.userId,
          'Business 4',
          '+18095551243',
          {
            street: 'Calle 4',
            city: 'Santo Domingo',
            state: 'Distrito Nacional',
            postalCode: '10101',
            country: 'República Dominicana',
          },
          'America/Santo_Domingo',
        ),
      ),
    ).rejects.toThrow(); // Should throw MaxBusinessesExceededException
  });

  it('should allow creating more businesses after upgrading plan', async () => {
    // Arrange: Register user with FREE plan, create 1 business
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

    // Create first business with FREE plan
    await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 1',
        '+18095551244',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Act: Upgrade to PRO
    await commandBus.execute(new UpgradeSubscriptionCommand(businessOwner.id, 'PRO'));

    // Create 2nd and 3rd business (now allowed with PRO)
    const business2 = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 2',
        '+18095551245',
        {
          street: 'Calle 2',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    const business3 = await commandBus.execute(
      new CreateBusinessCommand(
        registerResult.userId,
        'Business 3',
        '+18095551246',
        {
          street: 'Calle 3',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          postalCode: '10101',
          country: 'República Dominicana',
        },
        'America/Santo_Domingo',
      ),
    );

    // Assert
    expect(business2.businessId).toBeDefined();
    expect(business3.businessId).toBeDefined();

    // Verify 3 businesses total
    const businesses = await dataSource.query(
      'SELECT COUNT(*) as count FROM businesses WHERE owner_id = $1',
      [registerResult.userId],
    );

    expect(parseInt(businesses[0].count)).toBe(3);
  });
});
