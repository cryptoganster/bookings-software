import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { CompleteOnboardingHandler } from '../handler';
import { CompleteOnboardingCommand } from '../command';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { IUnitOfWork } from '@shared/kernel/uow';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { OnboardingAlreadyCompletedException } from '@account/domain/exceptions/onboarding-already-completed.exception';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CompleteOnboardingHandler (Integration)', () => {
  let module: TestingModule;
  let handler: CompleteOnboardingHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CompleteOnboardingHandler,
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

    handler = module.get<CompleteOnboardingHandler>(CompleteOnboardingHandler);
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
    it('should load BusinessOwner via factory and complete onboarding', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new CompleteOnboardingCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: 'be67026b-b1e5-4104-b66c-f23d86098321' },
      });
      expect(updated).toBeDefined();
      expect(updated!.onboardingCompleted).toBe(true);
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const command = new CompleteOnboardingCommand('non-existent');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BusinessOwnerNotFoundException);
    });

    it('should throw OnboardingAlreadyCompletedException if already completed', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true, // Already completed
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new CompleteOnboardingCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OnboardingAlreadyCompletedException);
    });

    it('should persist changes to database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'be67026b-b1e5-4104-b66c-f23d86098321',
        userId: '65f818ad-9782-40bd-b8ed-16251f31f511',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new CompleteOnboardingCommand('be67026b-b1e5-4104-b66c-f23d86098321');

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({
        where: { id: 'be67026b-b1e5-4104-b66c-f23d86098321' },
      });
      expect(persisted).toBeDefined();
      expect(persisted!.onboardingCompleted).toBe(true);
      expect(persisted!.version).toBe(2);
    });
  });
});
