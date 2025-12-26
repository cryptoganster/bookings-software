import { Test, TestingModule } from '@nestjs/testing';
import { createTestUser } from '@test-utils/e2e-helpers';
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
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('RestoreSubscriptionHandler (Integration)', () => {
  let module: TestingModule;
  let handler: RestoreSubscriptionHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    // Create shared DataSource with all entities
    dataSource = await createIntegrationTestDataSource();

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

    handler = module.get<RestoreSubscriptionHandler>(RestoreSubscriptionHandler);
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
    commandBus = module.get<CommandBus>(CommandBus);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('execute', () => {
    it('should restore subscription successfully', async () => {
      // Arrange
      const boId = generateTestId();
      const userId = generateTestId();
      await createTestUser(dataSource, userId);
      const businessOwnerModel = repository.create({
        id: boId,
        userId: userId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new RestoreSubscriptionCommand(boId);

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: boId },
      });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionStatus).toBe('ACTIVE');
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should be idempotent (no error if already active)', async () => {
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

      const command = new RestoreSubscriptionCommand(boId);

      // Act - Should not throw
      await handler.execute(command);

      // Assert - Verify status remains ACTIVE and version unchanged (idempotent)
      const updated = await repository.findOne({
        where: { id: boId },
      });
      expect(updated!.subscriptionStatus).toBe('ACTIVE');
      expect(updated!.version).toBe(1); // Version unchanged because no state change
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const nonExistentId = generateTestId();
      const command = new RestoreSubscriptionCommand(nonExistentId);

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
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'SUSPENDED',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new RestoreSubscriptionCommand(boId);

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({
        where: { id: boId },
      });
      expect(persisted).toBeDefined();
      expect(persisted!.subscriptionStatus).toBe('ACTIVE');
      expect(persisted!.version).toBe(2);
    });
  });
});
