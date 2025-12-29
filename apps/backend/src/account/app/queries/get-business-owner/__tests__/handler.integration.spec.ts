import { Test, TestingModule } from '@nestjs/testing';
import { createTestUser } from '@test-utils/helpers';
import { DataSource, Repository } from 'typeorm';
import { GetBusinessOwnerHandler } from '../handler';
import { GetBusinessOwnerQuery } from '../query';
import { BusinessOwnerReadRepository } from '@account/infra/persistence/repositories/business-owner-read.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { getRepositoryToken } from '@nestjs/typeorm';
import { setupTestDatabase, cleanDatabase } from '@test-utils/helpers/database';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

describe('GetBusinessOwnerHandler (Integration)', () => {
  let module: TestingModule;
  let handler: GetBusinessOwnerHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureMigrationsRun();

    // Use shared DataSource with all entities
    dataSource = await setupTestDatabase();

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
          useValue: dataSource, // Use the shared DataSource
        },
      ],
    }).compile();

    handler = module.get<GetBusinessOwnerHandler>(GetBusinessOwnerHandler);
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
      await createTestUser(dataSource, '65f818ad-9782-40bd-b8ed-16251f31f511');
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
      const query = new GetBusinessOwnerQuery('11111111-1111-1111-1111-111111111111');

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
      await createTestUser(dataSource, '7c956221-da3a-49db-b00e-2a25aae38ca7');
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
