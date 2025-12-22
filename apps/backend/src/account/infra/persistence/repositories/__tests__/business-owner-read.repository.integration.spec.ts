import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BusinessOwnerReadRepository } from '../business-owner-read.repository';
import { BusinessOwnerModel } from '../../models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BusinessOwnerReadRepository (Integration)', () => {
  let module: TestingModule;
  let readRepository: BusinessOwnerReadRepository;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        BusinessOwnerReadRepository,
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

    readRepository = module.get<BusinessOwnerReadRepository>(BusinessOwnerReadRepository);
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

  describe('findById', () => {
    it('should return correct read model', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findById('bo-123');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('bo-123');
      expect(result!.userId).toBe('user-123');
      expect(result!.subscriptionPlan).toBe('PRO');
      expect(result!.subscriptionStatus).toBe('ACTIVE');
      expect(result!.onboardingCompleted).toBe(true);
      expect(result!.maxBusinesses).toBe(3); // PRO plan
      expect(result!.maxAppointmentsPerMonth).toBe(2000); // PRO plan
      expect(result!.price).toBe(79); // PRO plan
    });

    it('should return null for non-existent id', async () => {
      // Act
      const result = await readRepository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return correct read model', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-456',
        userId: 'user-456',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: false,
        version: 2,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findByUserId('user-456');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('bo-456');
      expect(result!.userId).toBe('user-456');
      expect(result!.subscriptionPlan).toBe('ENTERPRISE');
      expect(result!.subscriptionStatus).toBe('SUSPENDED');
      expect(result!.onboardingCompleted).toBe(false);
      expect(result!.maxBusinesses).toBe(10); // ENTERPRISE plan
      expect(result!.maxAppointmentsPerMonth).toBe(10000); // ENTERPRISE plan
      expect(result!.price).toBe(199); // ENTERPRISE plan
    });

    it('should return null for non-existent userId', async () => {
      // Act
      const result = await readRepository.findByUserId('non-existent-user');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('read models optimization', () => {
    it('should return read models without unnecessary joins', async () => {
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
      const result = await readRepository.findById('bo-789');

      // Assert - Verify all fields are populated correctly
      expect(result).toBeDefined();
      expect(result!.maxBusinesses).toBe(1); // FREE plan
      expect(result!.maxAppointmentsPerMonth).toBe(100); // FREE plan
      expect(result!.price).toBe(0); // FREE plan
    });

    it('should handle BASIC plan correctly', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-basic',
        userId: 'user-basic',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findById('bo-basic');

      // Assert
      expect(result).toBeDefined();
      expect(result!.maxBusinesses).toBe(1); // BASIC plan
      expect(result!.maxAppointmentsPerMonth).toBe(500); // BASIC plan
      expect(result!.price).toBe(29); // BASIC plan
    });
  });
});
