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
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('be67026b-b1e5-4104-b66c-f23d86098321');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe('be67026b-b1e5-4104-b66c-f23d86098321');
      expect(aggregate!.getUserId().getValue()).toBe('65f818ad-9782-40bd-b8ed-16251f31f511');
    });

    it('should preserve version from database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'cc6f68fc-eb33-4f68-8766-373718cb24fa',
        userId: '7c956221-da3a-49db-b00e-2a25aae38ca7',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('cc6f68fc-eb33-4f68-8766-373718cb24fa');

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
        id: '9660e857-1161-47f5-bf42-ae8c0341ee71',
        userId: '61e339a2-b501-4ca3-88e0-be8af02d9f09',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadById('9660e857-1161-47f5-bf42-ae8c0341ee71');

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
        id: '88d769f4-b41b-45a9-8391-896089054fba',
        userId: '777f368d-b9e1-44f4-b4c4-3c200e6ec960',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('777f368d-b9e1-44f4-b4c4-3c200e6ec960');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getUserId().getValue()).toBe('777f368d-b9e1-44f4-b4c4-3c200e6ec960');
    });

    it('should preserve version from database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: '8016076f-812f-4cd1-a318-b98a389f0de7',
        userId: '79fc1f94-b7c3-4f3b-b36f-03b7161b45db',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('79fc1f94-b7c3-4f3b-b36f-03b7161b45db');

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
        id: 'a2343508-b80a-4bed-bfb1-6f0cc72ac6d6',
        userId: '1071aa6c-1e34-425a-8b95-7552f0152faf',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const aggregate = await factory.loadByUserId('1071aa6c-1e34-425a-8b95-7552f0152faf');

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.completeOnboarding).toBe('function');
      expect(typeof aggregate!.upgradeSubscription).toBe('function');
    });
  });
});
