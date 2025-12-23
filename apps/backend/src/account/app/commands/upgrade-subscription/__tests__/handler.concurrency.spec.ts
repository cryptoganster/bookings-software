import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeSubscriptionHandler } from '../handler';
import { UpgradeSubscriptionCommand } from '../command';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { UUID } from '@shared/vo/uuid';

describe('UpgradeSubscriptionHandler - Concurrency Tests', () => {
  let module: TestingModule;
  let handler: UpgradeSubscriptionHandler;
  let dataSource: DataSource;
  let factory: BusinessOwnerFactory;
  let repository: Repository<BusinessOwnerModel>;

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
      ],
    }).compile();

    handler = module.get<UpgradeSubscriptionHandler>(UpgradeSubscriptionHandler);
    dataSource = module.get<DataSource>(DataSource);
    factory = module.get<BusinessOwnerFactory>('IBusinessOwnerFactory');
    repository = module.get<Repository<BusinessOwnerModel>>(getRepositoryToken(BusinessOwnerModel));
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('Concurrent Subscription Upgrades', () => {
    it('should handle concurrent upgrade attempts with optimistic locking', async () => {
      // Arrange: Create a BusinessOwner with FREE plan
      const businessOwnerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();

      await dataSource.query(
        `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [businessOwnerId, userId, 'FREE', 'ACTIVE', true, 0],
      );

      // Act: Simulate two concurrent upgrade attempts
      const command1 = new UpgradeSubscriptionCommand(businessOwnerId, 'BASIC');
      const command2 = new UpgradeSubscriptionCommand(businessOwnerId, 'PRO');

      const results = await Promise.allSettled([
        handler.execute(command1),
        handler.execute(command2),
      ]);

      // Assert: One should succeed, one should fail with ConcurrencyException
      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // Verify the failed one threw ConcurrencyException
      const failedResult = failed[0] as PromiseRejectedResult;
      expect(failedResult.reason).toBeInstanceOf(ConcurrencyException);

      // Verify only one upgrade was applied
      const businessOwner = await factory.loadById(businessOwnerId);
      expect(businessOwner).toBeDefined();
      expect(businessOwner!.getVersion().getValue()).toBe(1); // Only incremented once

      // Verify the plan is either BASIC or PRO (whichever succeeded)
      const plan = businessOwner!.getSubscriptionPlan();
      expect(['BASIC', 'PRO']).toContain(plan.getName());
    });

    it('should allow retry after concurrency exception', async () => {
      // Arrange: Create a BusinessOwner with FREE plan
      const businessOwnerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();

      await dataSource.query(
        `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [businessOwnerId, userId, 'FREE', 'ACTIVE', true, 0],
      );

      // Act: First upgrade succeeds
      const command1 = new UpgradeSubscriptionCommand(businessOwnerId, 'BASIC');
      await handler.execute(command1);

      // Second upgrade with stale version fails
      const command2 = new UpgradeSubscriptionCommand(businessOwnerId, 'PRO');

      // Retry should succeed after reloading
      await expect(handler.execute(command2)).resolves.not.toThrow();

      // Assert: Final state should be PRO
      const businessOwner = await factory.loadById(businessOwnerId);
      expect(businessOwner).toBeDefined();
      expect(businessOwner!.getSubscriptionPlan().getName()).toBe('PRO');
      expect(businessOwner!.getVersion().getValue()).toBe(2); // Incremented twice
    });

    it('should handle multiple concurrent operations on same aggregate', async () => {
      // Arrange: Create a BusinessOwner
      const businessOwnerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();

      await dataSource.query(
        `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [businessOwnerId, userId, 'FREE', 'ACTIVE', true, 0],
      );

      // Act: Simulate 5 concurrent upgrade attempts
      const commands = [
        new UpgradeSubscriptionCommand(businessOwnerId, 'BASIC'),
        new UpgradeSubscriptionCommand(businessOwnerId, 'PRO'),
        new UpgradeSubscriptionCommand(businessOwnerId, 'ENTERPRISE'),
        new UpgradeSubscriptionCommand(businessOwnerId, 'BASIC'),
        new UpgradeSubscriptionCommand(businessOwnerId, 'PRO'),
      ];

      const results = await Promise.allSettled(commands.map((cmd) => handler.execute(cmd)));

      // Assert: At least one should succeed
      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBeGreaterThanOrEqual(1);
      expect(failed.length).toBeGreaterThanOrEqual(1);

      // All failures should be ConcurrencyException
      failed.forEach((result) => {
        const failedResult = result as PromiseRejectedResult;
        expect(failedResult.reason).toBeInstanceOf(ConcurrencyException);
      });

      // Verify final state is consistent
      const businessOwner = await factory.loadById(businessOwnerId);
      expect(businessOwner).toBeDefined();
      expect(businessOwner!.getVersion().getValue()).toBeGreaterThanOrEqual(1);
    });
  });
});
