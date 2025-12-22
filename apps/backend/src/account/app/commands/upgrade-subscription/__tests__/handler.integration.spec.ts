import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { UpgradeSubscriptionHandler } from '../handler';
import { UpgradeSubscriptionCommand } from '../command';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { AlreadyOnThisPlanException } from '@account/domain/exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '@account/domain/exceptions/cannot-downgrade-subscription.exception';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UpgradeSubscriptionHandler (Integration)', () => {
  let module: TestingModule;
  let handler: UpgradeSubscriptionHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        UpgradeSubscriptionHandler,
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

    handler = module.get<UpgradeSubscriptionHandler>(UpgradeSubscriptionHandler);
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
    it('should upgrade subscription from FREE to BASIC successfully', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'BASIC');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({ where: { id: 'bo-123' } });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('BASIC');
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should upgrade subscription from BASIC to PRO successfully', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'PRO');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({ where: { id: 'bo-123' } });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('PRO');
      expect(updated!.version).toBe(2);
    });

    it('should upgrade subscription from PRO to ENTERPRISE successfully', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'ENTERPRISE');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({ where: { id: 'bo-123' } });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('ENTERPRISE');
      expect(updated!.version).toBe(2);
    });

    it('should throw AlreadyOnThisPlanException when upgrading to same plan', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(AlreadyOnThisPlanException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from PRO to BASIC', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from ENTERPRISE to PRO', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'PRO');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const command = new UpgradeSubscriptionCommand('non-existent', 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BusinessOwnerNotFoundException);
    });

    it('should persist changes to database', async () => {
      // Arrange
      const businessOwnerModel = repository.create({
        id: 'bo-123',
        userId: 'user-123',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand('bo-123', 'BASIC');

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({ where: { id: 'bo-123' } });
      expect(persisted).toBeDefined();
      expect(persisted!.subscriptionPlan).toBe('BASIC');
      expect(persisted!.version).toBe(2);
    });
  });
});
