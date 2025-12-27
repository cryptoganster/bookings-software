import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CqrsModule, CommandBus, EventPublisher, QueryBus } from '@nestjs/cqrs';
import { CreateBusinessHandler } from '../handler';
import { CreateBusinessCommand } from '../command';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessFactory } from '@business/infra/persistence/factories/business.factory';
import { BusinessWriteRepository } from '@business/infra/persistence/repositories/business-write.repository';
import { BusinessReadRepository } from '@business/infra/persistence/repositories/business-read.repository';
import { BusinessUniquenessChecker } from '@business/domain/services/business-uniqueness-checker.service';
import { BusinessLimitChecker } from '@business/domain/services/business-limit-checker.service';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';
import { MaxBusinessesExceededException } from '@business/domain/exceptions/max-businesses-exceeded';
import { createTestUser, cleanDatabase } from '@test-utils/helpers';

/**
 * Integration tests for CreateBusinessHandler
 *
 * Tests the complete flow of business creation including:
 * - Creating new businesses
 * - WhatsAppPhone uniqueness validation
 * - Multi-business support per owner
 * - Address and timezone validation
 *
 * **Validates: Requirements 1.1-1.5, 3.1-3.5, 10.1**
 * **Property 1: WhatsAppPhone global uniqueness**
 * **Property 4: Business ownerId references User.id**
 */
describe('CreateBusinessHandler Integration Tests', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let dataSource: DataSource;
  let ownerId: string;

  beforeAll(async () => {
    const mockEventPublisher = {
      mergeObjectContext: jest.fn((obj: any) => {
        // Return the original object with a mock commit method added
        obj.commit = jest.fn();
        return obj;
      }),
    };

    // Mock QueryBus to return BusinessOwner data for limit checking
    const mockQueryBus = {
      execute: jest.fn().mockResolvedValue({
        id: UUID.generate().getValue(),
        userId: UUID.generate().getValue(),
        subscriptionPlanName: 'PRO',
        subscriptionPlanMaxBusinesses: 3,
        subscriptionPlanMaxAppointmentsPerMonth: 2000,
        subscriptionPlanPrice: 79,
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        createdAt: new Date(),
      }),
    };

    // Mock IBusinessOwnerReadRepository for BusinessLimitChecker
    const mockBusinessOwnerReadRepo = {
      findByUserId: jest.fn().mockResolvedValue({
        id: UUID.generate().getValue(),
        userId: UUID.generate().getValue(),
        subscriptionPlanName: 'PRO',
        maxBusinesses: 3, // ← This is what BusinessLimitChecker accesses
        maxAppointmentsPerMonth: 2000,
        subscriptionPlanPrice: 79,
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        createdAt: new Date(),
      }),
    };

    module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'postgres_test',
          entities: [BusinessModel],
          synchronize: false,
          dropSchema: false,
        }),
        TypeOrmModule.forFeature([BusinessModel]),
      ],
      providers: [
        CreateBusinessHandler,
        {
          provide: 'IBusinessFactory',
          useClass: BusinessFactory,
        },
        {
          provide: 'IBusinessWriteRepository',
          useClass: BusinessWriteRepository,
        },
        {
          provide: 'IBusinessReadRepository',
          useClass: BusinessReadRepository,
        },
        {
          provide: 'IBusinessUniquenessChecker',
          useClass: BusinessUniquenessChecker,
        },
        {
          provide: 'IBusinessLimitChecker',
          useClass: BusinessLimitChecker,
        },
        {
          provide: 'IBusinessOwnerReadRepository',
          useValue: mockBusinessOwnerReadRepo,
        },
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    // Initialize the module to register handlers
    await module.init();

    commandBus = module.get<CommandBus>(CommandBus);
    dataSource = module.get<DataSource>(DataSource);

    ownerId = UUID.generate().getValue();
  }, 30000);

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('Create new business', () => {
    it('should create new business with valid data', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command = new CreateBusinessCommand(
        ownerId,
        'Bufete López',
        '+18095551234',
        {
          street: 'Calle Principal 123',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          country: 'República Dominicana',
          postalCode: '10101',
        },
        'America/Santo_Domingo',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.businessId).toBeDefined();

      // Verify in database
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business).toBeDefined();
      expect(business!.ownerId).toBe(ownerId);
      expect(business!.name).toBe('Bufete López');
      expect(business!.whatsappPhone).toBe('+18095551234');
      expect(business!.addressStreet).toBe('Calle Principal 123');
      expect(business!.addressCity).toBe('Santo Domingo');
      expect(business!.addressState).toBe('Distrito Nacional');
      expect(business!.addressCountry).toBe('República Dominicana');
      expect(business!.addressPostalCode).toBe('10101');
      expect(business!.timezone).toBe('America/Santo_Domingo');
      expect(business!.isActive).toBe(true);
      expect(business!.version).toBe(1);
    });

    it('should create business with minimal address (only street and city)', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command = new CreateBusinessCommand(
        ownerId,
        'Consultorio Médico',
        '+18095555678',
        {
          street: 'Av. Winston Churchill 45',
          city: 'Santo Domingo',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business!.addressStreet).toBe('Av. Winston Churchill 45');
      expect(business!.addressCity).toBe('Santo Domingo');
      expect(business!.addressState).toBeNull();
      expect(business!.addressCountry).toBe('DO');
      expect(business!.addressPostalCode).toBeNull();
    });

    it('should create business with different timezone', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command = new CreateBusinessCommand(
        ownerId,
        'Tech Startup',
        '+18095559999',
        {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
        },
        'America/New_York',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business!.timezone).toBe('America/New_York');
    });
  });

  describe('WhatsAppPhone uniqueness (Property 1)', () => {
    it('should reject duplicate WhatsAppPhone', async () => {
      // Arrange - Create first business
      const existingId = UUID.generate().getValue();
      await createTestUser(dataSource, ownerId);

      await dataSource.getRepository(BusinessModel).insert({
        id: existingId,
        ownerId: ownerId,
        name: 'Existing Business',
        whatsappPhone: '+18095558888',
        addressStreet: 'Calle 1',
        addressCity: 'Santo Domingo',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateBusinessCommand(
        UUID.generate().getValue(), // Different owner
        'New Business',
        '+18095558888', // Same phone
        {
          street: 'Calle 2',
          city: 'Santiago',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        WhatsAppPhoneAlreadyExistsException,
      );

      // Verify no duplicate was created
      const count = await dataSource
        .getRepository(BusinessModel)
        .count({ where: { whatsappPhone: '+18095558888' } });

      expect(count).toBe(1);
    });

    it('should allow same owner to create multiple businesses with different phones', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command1 = new CreateBusinessCommand(
        ownerId,
        'Business 1',
        '+18095551111',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      const command2 = new CreateBusinessCommand(
        ownerId,
        'Business 2',
        '+18095552222',
        {
          street: 'Calle 2',
          city: 'Santiago',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act
      const result1 = await commandBus.execute(command1);
      const result2 = await commandBus.execute(command2);

      // Assert - Different business IDs
      expect(result1.businessId).not.toBe(result2.businessId);

      // Verify both businesses exist for same owner
      const businesses = await dataSource.getRepository(BusinessModel).find({ where: { ownerId } });

      expect(businesses).toHaveLength(2);
      expect(businesses.map((b) => b.whatsappPhone)).toContain('+18095551111');
      expect(businesses.map((b) => b.whatsappPhone)).toContain('+18095552222');
    });
  });

  describe('Business ownerId references User.id (Property 4)', () => {
    it('should store ownerId as User.id', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      await createTestUser(dataSource, userId);

      const command = new CreateBusinessCommand(
        userId,
        'Legal Services',
        '+18095557777',
        {
          street: 'Av. Independencia 100',
          city: 'Santo Domingo',
          state: 'DN',
          country: 'DO',
          postalCode: '10100',
        },
        'America/Santo_Domingo',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business!.ownerId).toBe(userId);
    });
  });

  describe('Multi-business support', () => {
    it('should allow creating multiple businesses for same owner', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const commands = [
        new CreateBusinessCommand(
          ownerId,
          'Bufete Centro',
          '+18095553333',
          {
            street: 'Calle Centro 1',
            city: 'Santo Domingo',
            state: null,
            country: 'DO',
            postalCode: null,
          },
          'America/Santo_Domingo',
        ),
        new CreateBusinessCommand(
          ownerId,
          'Bufete Norte',
          '+18095554444',
          {
            street: 'Calle Norte 2',
            city: 'Santiago',
            state: null,
            country: 'DO',
            postalCode: null,
          },
          'America/Santo_Domingo',
        ),
        new CreateBusinessCommand(
          ownerId,
          'Consultoría Legal',
          '+18095555555',
          {
            street: 'Av. Principal 3',
            city: 'La Vega',
            state: null,
            country: 'DO',
            postalCode: null,
          },
          'America/Santo_Domingo',
        ),
      ];

      // Act
      const results = await Promise.all(commands.map((cmd) => commandBus.execute(cmd)));

      // Assert
      expect(results).toHaveLength(3);
      expect(new Set(results.map((r) => r.businessId)).size).toBe(3); // All unique

      // Verify all businesses exist for same owner
      const businesses = await dataSource.getRepository(BusinessModel).find({ where: { ownerId } });

      expect(businesses).toHaveLength(3);
      expect(businesses.every((b) => b.ownerId === ownerId)).toBe(true);
    });

    it('should reject business creation when limit exceeded', async () => {
      // Arrange - Get the mock and update it to return a plan with maxBusinesses = 1
      await createTestUser(dataSource, ownerId);

      const mockBusinessOwnerReadRepo = module.get('IBusinessOwnerReadRepository');
      jest.spyOn(mockBusinessOwnerReadRepo, 'findByUserId').mockResolvedValue({
        id: UUID.generate().getValue(),
        userId: ownerId,
        subscriptionPlanName: 'FREE',
        maxBusinesses: 1, // ← Limit of 1 business
        maxAppointmentsPerMonth: 100,
        subscriptionPlanPrice: 0,
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        createdAt: new Date(),
      });

      // Create first business (should succeed)
      const command1 = new CreateBusinessCommand(
        ownerId,
        'First Business',
        '+18095556666',
        {
          street: 'Calle 1',
          city: 'Santo Domingo',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      await commandBus.execute(command1);

      // Try to create second business (should fail)
      const command2 = new CreateBusinessCommand(
        ownerId,
        'Second Business',
        '+18095557777',
        {
          street: 'Calle 2',
          city: 'Santiago',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act & Assert
      await expect(commandBus.execute(command2)).rejects.toThrow(MaxBusinessesExceededException);

      // Verify only one business was created
      const businesses = await dataSource.getRepository(BusinessModel).find({ where: { ownerId } });
      expect(businesses).toHaveLength(1);
    });
  });

  describe('Default values', () => {
    it('should set isActive=true by default', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command = new CreateBusinessCommand(
        ownerId,
        'New Business',
        '+18095556666',
        {
          street: 'Calle Test',
          city: 'Santo Domingo',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business!.isActive).toBe(true);
    });

    it('should set version=1 for new business', async () => {
      // Arrange
      await createTestUser(dataSource, ownerId);

      const command = new CreateBusinessCommand(
        ownerId,
        'Version Test',
        '+18095557788',
        {
          street: 'Calle Version',
          city: 'Santo Domingo',
          state: null,
          country: 'DO',
          postalCode: null,
        },
        'America/Santo_Domingo',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const business = await dataSource
        .getRepository(BusinessModel)
        .findOne({ where: { id: result.businessId } });

      expect(business!.version).toBe(1);
    });
  });
});
