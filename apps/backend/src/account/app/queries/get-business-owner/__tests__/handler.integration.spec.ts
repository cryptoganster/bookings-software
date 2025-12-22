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
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date('2024-01-01'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerQuery('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('be67026b-b1e5-4104-b66c-f23d86098321');
      expect(result!.userId).toBe('65f818ad-9782-40bd-b8ed-16251f31f511');
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
        id: 'cc6f68fc-eb33-4f68-8766-373718cb24fa',
        userId: '7c956221-da3a-49db-b00e-2a25aae38ca7',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: false,
        version: 3,
        createdAt: new Date('2024-06-15'),
      });
      await repository.save(businessOwnerModel);

      const query = new GetBusinessOwnerQuery('cc6f68fc-eb33-4f68-8766-373718cb24fa');

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
