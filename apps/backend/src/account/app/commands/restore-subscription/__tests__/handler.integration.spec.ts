import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { RestoreSubscriptionHandler } from '../handler';
import { RestoreSubscriptionCommand } from '../command';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('RestoreSubscriptionHandler (Integration)', () => {
  let module: TestingModule;
  let handler: RestoreSubscriptionHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        RestoreSubscriptionHandler,
        {
          provide: 'IBusinessOwnerFactory',
          useClass: BusinessOwnerFactory,
        },
        {
          provide: 'IBusinessOwnerWriteRepository',
          useClass: BusinessOwnerWriteRepository,
        },
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
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
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<RestoreSubscriptionHandler>(RestoreSubscriptionHandler);
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
    dataSource = module.get<DataSource>(DataSource);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('execute', () => {
    it('should restore subscription successfully', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new RestoreSubscriptionCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: 'be67026b-b1e5-4104-b66c-f23d86098321' },
      });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionStatus).toBe('ACTIVE');
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should be idempotent (no error if already active)', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new RestoreSubscriptionCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act & Assert - Should not throw
      await expect(handler.execute(command)).resolves.not.toThrow();

      // Verify status remains ACTIVE
      const updated = await repository.findOne({
        where: { id: 'be67026b-b1e5-4104-b66c-f23d86098321' },
      });
      expect(updated!.subscriptionStatus).toBe('ACTIVE');
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const command = new RestoreSubscriptionCommand('11111111-1111-1111-1111-111111111111');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BusinessOwnerNotFoundException);
    });

    it('should persist changes to database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new RestoreSubscriptionCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({
        where: { id: 'be67026b-b1e5-4104-b66c-f23d86098321' },
      });
      expect(persisted).toBeDefined();
      expect(persisted!.subscriptionStatus).toBe('ACTIVE');
      expect(persisted!.version).toBe(2);
    });
  });
});
