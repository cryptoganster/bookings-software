import { Test, TestingModule } from '@nestjs/testing';
import { createTestUser } from '@test-utils/helpers';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { SuspendSubscriptionHandler } from '../handler';
import { SuspendSubscriptionCommand } from '../command';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';
import { getRepositoryToken } from '@nestjs/typeorm';
import { setupTestDatabase, cleanDatabase, generateTestId } from '@test-utils/helpers/database';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

describe('SuspendSubscriptionHandler (Integration)', () => {
  let module: TestingModule;
  let handler: SuspendSubscriptionHandler;
  let repository: Repository<BusinessOwnerModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureMigrationsRun();

    // Create shared DataSource with all entities
    dataSource = await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        SuspendSubscriptionHandler,
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

    handler = module.get<SuspendSubscriptionHandler>(SuspendSubscriptionHandler);
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('execute', () => {
    it('should suspend subscription successfully', async () => {
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

      const command = new SuspendSubscriptionCommand(boId);

      // Act
      await handler.execute(command);

      // Assert
      const updated = await repository.findOne({
        where: { id: boId },
      });
      expect(updated).toBeDefined();
      expect(updated!.subscriptionStatus).toBe('SUSPENDED');
      expect(updated!.version).toBe(2); // Version incremented
    });

    it('should throw BusinessOwnerNotFoundException if not found', async () => {
      // Arrange
      const nonExistentId = generateTestId();
      const command = new SuspendSubscriptionCommand(nonExistentId);

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
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
      });
      await repository.save(businessOwnerModel);

      const command = new SuspendSubscriptionCommand(boId);

      // Act
      await handler.execute(command);

      // Assert - Verify persistence
      const persisted = await repository.findOne({
        where: { id: boId },
      });
      expect(persisted).toBeDefined();
      expect(persisted!.subscriptionStatus).toBe('SUSPENDED');
      expect(persisted!.version).toBe(2);
    });
  });
});
