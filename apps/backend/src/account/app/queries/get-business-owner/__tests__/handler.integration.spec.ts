import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { GetBusinessOwnerHandler } from '../handler';
import { GetBusinessOwnerQuery } from '../query';
import { BusinessOwnerReadRepository } from '@account/infra/persistence/repositories/business-owner-read.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('GetBusinessOwnerHandler (Integration)', () => {
  let module: TestingModule;
  let handler: GetBusinessOwnerHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        GetBusinessOwnerHandler,
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

    handler = module.get<GetBusinessOwnerHandler>(GetBusinessOwnerHandler);
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
    it('should return BusinessOwnerReadModel for valid id', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-01-01'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerQuery('bo-123');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('bo-123');
      expect(result!.userId).toBe('user-123');
      expect(result!.subscriptionPlan).toBe('PRO');
      expect(result!.subscriptionStatus).toBe('ACTIVE');
      expect(result!.onboardingCompleted).toBe(true);
    });

    it('should return null for non-existent id', async () => {
      // Arrange
      const query = new GetBusinessOwnerQuery('non-existent');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
    });

    it('should return read model with all expected fields', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-456',
        userId: 'user-456',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: false,
        version: 3,
        createdAt: new Date('2024-06-15'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerQuery('bo-456');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('subscriptionPlan');
      expect(result).toHaveProperty('subscriptionStatus');
      expect(result).toHaveProperty('onboardingCompleted');
      expect(result).toHaveProperty('createdAt');
      expect(result!.subscriptionPlan).toBe('ENTERPRISE');
      expect(result!.subscriptionStatus).toBe('SUSPENDED');
    });
  });
});
