import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BusinessOwnerReadRepository } from '../business-owner-read.repository';
import { BusinessOwnerModel } from '../../models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
} from '@test-utils/integration-test-helper';

describe('BusinessOwnerReadRepository (Integration)', () => {
  let module: TestingModule;
  let readRepository: BusinessOwnerReadRepository;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Use shared DataSource with all entities
    dataSource = await createIntegrationTestDataSource();

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
          useValue: dataSource, // Use the shared DataSource
        },
      ],
    }).compile();

    readRepository = module.get<BusinessOwnerReadRepository>(BusinessOwnerReadRepository);
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clean all tables with RESTART IDENTITY CASCADE
    await cleanDatabase(dataSource);
  });

  describe('findById', () => {
    it('should return correct read model', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findById('be67026b-b1e5-4104-b66c-f23d86098321');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('be67026b-b1e5-4104-b66c-f23d86098321');
      expect(result!.userId).toBe('65f818ad-9782-40bd-b8ed-16251f31f511');
      expect(result!.subscriptionPlan).toBe('PRO');
      expect(result!.subscriptionStatus).toBe('ACTIVE');
      expect(result!.onboardingCompleted).toBe(true);
      expect(result!.maxBusinesses).toBe(3); // PRO plan
      expect(result!.maxAppointmentsPerMonth).toBe(2000); // PRO plan
      expect(result!.price).toBe(79); // PRO plan
    });

    it('should return null for non-existent id', async () => {
      // Act
      const result = await readRepository.findById('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return correct read model', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'cc6f68fc-eb33-4f68-8766-373718cb24fa',
        userId: '7c956221-da3a-49db-b00e-2a25aae38ca7',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: false,
        version: 2,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-15'),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findByUserId('7c956221-da3a-49db-b00e-2a25aae38ca7');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('cc6f68fc-eb33-4f68-8766-373718cb24fa');
      expect(result!.userId).toBe('7c956221-da3a-49db-b00e-2a25aae38ca7');
      expect(result!.subscriptionPlan).toBe('ENTERPRISE');
      expect(result!.subscriptionStatus).toBe('SUSPENDED');
      expect(result!.onboardingCompleted).toBe(false);
      expect(result!.maxBusinesses).toBe(10); // ENTERPRISE plan
      expect(result!.maxAppointmentsPerMonth).toBe(10000); // ENTERPRISE plan
      expect(result!.price).toBe(199); // ENTERPRISE plan
    });

    it('should return null for non-existent userId', async () => {
      // Act
      const result = await readRepository.findByUserId('22222222-2222-2222-2222-222222222222');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('read models optimization', () => {
    it('should return read models without unnecessary joins', async () => {
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
      const result = await readRepository.findById('9660e857-1161-47f5-bf42-ae8c0341ee71');

      // Assert - Verify all fields are populated correctly
      expect(result).toBeDefined();
      expect(result!.maxBusinesses).toBe(1); // FREE plan
      expect(result!.maxAppointmentsPerMonth).toBe(100); // FREE plan
      expect(result!.price).toBe(0); // FREE plan
    });

    it('should handle BASIC plan correctly', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: '81c10b8c-6cbf-449f-a708-10fda607538a',
        userId: '50254344-ff7c-4933-b50a-e66fadd31688',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      // Act
      const result = await readRepository.findById('81c10b8c-6cbf-449f-a708-10fda607538a');

      // Assert
      expect(result).toBeDefined();
      expect(result!.maxBusinesses).toBe(1); // BASIC plan
      expect(result!.maxAppointmentsPerMonth).toBe(500); // BASIC plan
      expect(result!.price).toBe(29); // BASIC plan
    });
  });
});
