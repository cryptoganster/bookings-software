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
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-03-15'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('user-123');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe('bo-123');
      expect(result!.userId).toBe('user-123');
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
        id: 'bo-789',
        userId: 'user-789',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 1,
        createdAt: new Date('2024-12-01'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('user-789');

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
      expect(result!.userId).toBe('user-789');
    });

    it('should handle unique constraint (one BusinessOwner per userId)', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-unique',
        userId: 'user-unique',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerByUserIdQuery('user-unique');

      // Act
      const result = await handler.execute(query);

      // Assert - Should return exactly one result
      expect(result).toBeDefined();
      expect(result!.userId).toBe('user-unique');
    });
  });
});
