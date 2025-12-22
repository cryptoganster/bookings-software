import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BusinessOwnerFactory } from '../business-owner.factory';
import { BusinessOwnerModel } from '../../models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BusinessOwnerFactory (Integration)', () => {
  let module: TestingModule;
  let factory: BusinessOwnerFactory;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        BusinessOwnerFactory,
        {
          provide: getRepositoryToken(BusinessOwnerModel),
          useFactory: (dataSource: DataSource) => dataSource.getRepository(BusinessOwnerModel),
          inject: [DataSource],
        },
        {
          provide: DataSource,
          useFactory: async () => {
            const AppDataSource = new DataSource({
              type: 'postgres',
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'postgres',
              database: process.env.DB_DATABASE || 'bookings_test',
              entities: [BusinessOwnerModel],
              synchronize: true,
              dropSchema: true,
            });
            return AppDataSource.initialize();
          },
        },
      ],
    }).compile();

    factory = module.get<BusinessOwnerFactory>(BusinessOwnerFactory);
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('loadById', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('bo-123');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe('bo-123');
      expect(aggregate!.getUserId().getValue()).toBe('user-123');
    });

    it('should preserve version from database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-456',
        userId: 'user-456',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('bo-456');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate!.getVersion().getValue()).toBe(7);
    });

    it('should return null for non-existent id', async () => {
      // Act
      const aggregate = await factory.loadById('non-existent');

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-789',
        userId: 'user-789',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('bo-789');

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.upgradeSubscription).toBe('function');
      expect(typeof aggregate!.suspendSubscription).toBe('function');
      expect(typeof aggregate!.restoreSubscription).toBe('function');
    });

    it('should handle all subscription plans correctly', async () => {
      // Arrange - Create business owners with different plans
      const plans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
      for (const plan of plans) {
        const model = repository.create({
          id: `bo-${plan}`,
          userId: `user-${plan}`,
          subscriptionPlan: plan,
          subscriptionStatus: 'ACTIVE',
          onboardingCompleted: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const plan of plans) {
        const aggregate = await factory.loadById(`bo-${plan}`);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getSubscriptionPlan().getName()).toBe(plan);
      }
    });

    it('should handle all subscription statuses correctly', async () => {
      // Arrange - Create business owners with different statuses
      const statuses = ['ACTIVE', 'SUSPENDED', 'CANCELLED'];
      for (const status of statuses) {
        const model = repository.create({
          id: `bo-${status}`,
          userId: `user-${status}`,
          subscriptionPlan: 'PRO',
          subscriptionStatus: status,
          onboardingCompleted: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const status of statuses) {
        const aggregate = await factory.loadById(`bo-${status}`);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getSubscriptionStatus().getValue()).toBe(status);
      }
    });
  });

  describe('loadByUserId', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-user-123',
        userId: 'user-unique-123',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('user-unique-123');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getUserId().getValue()).toBe('user-unique-123');
    });

    it('should preserve version from database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-user-456',
        userId: 'user-unique-456',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('user-unique-456');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate!.getVersion().getValue()).toBe(5);
    });

    it('should return null for non-existent userId', async () => {
      // Act
      const aggregate = await factory.loadByUserId('non-existent-user');

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-user-789',
        userId: 'user-unique-789',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('user-unique-789');

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.completeOnboarding).toBe('function');
      expect(typeof aggregate!.upgradeSubscription).toBe('function');
    });
  });
});
