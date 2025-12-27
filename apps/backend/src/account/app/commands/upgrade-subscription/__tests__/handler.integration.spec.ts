import { Test, TestingModule } from '@nestjs/testing';
import { createTestUser } from '@test-utils/helpers';
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
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('UpgradeSubscriptionHandler (Integration)', () => {
  let module: TestingModule;
  let handler: UpgradeSubscriptionHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    // Create shared DataSource with all entities
    dataSource = await createIntegrationTestDataSource();

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
          useValue: dataSource,
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
    commandBus = module.get<CommandBus>(CommandBus);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase(dataSource);
  });

  describe('execute', () => {
    it('should upgrade subscription from FREE to BASIC successfully', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'BASIC');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({ where: { id: boId } });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('BASIC');
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should upgrade subscription from BASIC to PRO successfully', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'PRO');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: boId },
      });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('PRO');
      expect(updated!.version).toBe(2);
    });

    it('should upgrade subscription from PRO to ENTERPRISE successfully', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'ENTERPRISE');

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: boId },
      });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionPlan).toBe('ENTERPRISE');
      expect(updated!.version).toBe(2);
    });

    it('should throw AlreadyOnThisPlanException when upgrading to same plan', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(AlreadyOnThisPlanException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from PRO to BASIC', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading from ENTERPRISE to PRO', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'PRO');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const nonExistentId = generateTestId();
      const command = new UpgradeSubscriptionCommand(nonExistentId, 'BASIC');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BusinessOwnerNotFoundException);
    });

    it('should persist changes to database', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new UpgradeSubscriptionCommand(boId, 'BASIC');

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({
        where: { id: boId },
      });
      expect(persisted).toBeDefined();
      expect(persisted!.subscriptionPlan).toBe('BASIC');
      expect(persisted!.version).toBe(2);
    });
  });
});
