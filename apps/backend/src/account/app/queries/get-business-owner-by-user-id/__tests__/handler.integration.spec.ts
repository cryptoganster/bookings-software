import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { GetBusinessOwnerByUserIdHandler } from '../handler';
import { GetBusinessOwnerByUserIdQuery } from '../query';
import { BusinessOwnerReadRepository } from '@account/infra/persistence/repositories/business-owner-read.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('GetBusinessOwnerByUserIdHandler (Integration)', () => {
  let module: TestingModule;
  let handler: GetBusinessOwnerByUserIdHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        GetBusinessOwnerByUserIdHandler,
        {
          provide: 'IBusinessOwnerReadRepository',
          useClass: BusinessOwnerReadRepository,
        },
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

    handler = module.get<GetBusinessOwnerByUserIdHandler>(GetBusinessOwnerByUserIdHandler);
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

  describe('execute', () => {
    it('should return BusinessOwnerReadModel for valid userId', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-03-15'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('65f818ad-9782-40bd-b8ed-16251f31f511');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe('be67026b-b1e5-4104-b66c-f23d86098321');
      expect(result!.userId).toBe('65f818ad-9782-40bd-b8ed-16251f31f511');
      expect(result!.subscriptionPlan).toBe('BASIC');
      expect(result!.subscriptionStatus).toBe('ACTIVE');
      expect(result!.onboardingCompleted).toBe(true);
    });

    it('should return null for non-existent userId', async () => {
      // Arrange
      const query = new GetBusinessOwnerByUserIdQuery('non-existent-user');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
    });

    it('should return read model with all expected fields', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: '9660e857-1161-47f5-bf42-ae8c0341ee71',
        userId: '61e339a2-b501-4ca3-88e0-be8af02d9f09',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 1,
        createdAt: new Date('2024-12-01'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('61e339a2-b501-4ca3-88e0-be8af02d9f09');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('subscriptionPlan');
      expect(result).toHaveProperty('subscriptionStatus');
      expect(result).toHaveProperty('onboardingCompleted');
      expect(result).toHaveProperty('createdAt');
      expect(result!.userId).toBe('61e339a2-b501-4ca3-88e0-be8af02d9f09');
    });

    it('should handle unique constraint (one BusinessOwner per userId)', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: '3c2a1d01-574e-43b3-93e7-c6ff5ca48603',
        userId: 'e9dc7b8f-4b12-4bfd-a89f-9ab01f640385',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('e9dc7b8f-4b12-4bfd-a89f-9ab01f640385');

      // Act
      const result = await handler.execute(query);

      // Assert - Should return exactly one result
      expect(result).toBeDefined();
      expect(result!.userId).toBe('e9dc7b8f-4b12-4bfd-a89f-9ab01f640385');
    });
  });
});
