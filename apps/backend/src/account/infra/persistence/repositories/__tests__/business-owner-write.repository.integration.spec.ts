import { Test, TestingModule } from '@nestjs/testing';
import { createTestUser } from '@test-utils/e2e-helpers';
import { TypeOrmModule } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BusinessOwnerWriteRepository } from '../business-owner-write.repository';
import { BusinessOwnerFactory } from '../../factories/business-owner.factory';
import { BusinessOwnerModel } from '../../models/business-owner.model';
import { BusinessOwner } from '@account/domain/aggregates/business-owner';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { UUID } from '@shared/vo/uuid';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { DataSource } from 'typeorm';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
} from '@test-utils/integration-test-helper';

/**
 * Integration Test for BusinessOwnerWriteRepository
 *
 * Tests optimistic locking and concurrency handling.
 */
describe('BusinessOwnerWriteRepository - Integration Test (Optimistic Locking)', () => {
  let module: TestingModule;
  let repository: BusinessOwnerWriteRepository;
  let factory: BusinessOwnerFactory;
  let dataSource: DataSource;

  beforeEach(async () => {
    // Use shared DataSource with all entities
    dataSource = await createIntegrationTestDataSource();

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'postgres_test',
          entities: [BusinessOwnerModel],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([BusinessOwnerModel]),
      ],
      providers: [
        BusinessOwnerWriteRepository,
        BusinessOwnerFactory,
        TypeOrmUnitOfWork,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
        {
          provide: DataSource,
          useValue: dataSource, // Use the shared DataSource
        },
      ],
    }).compile();

    repository = module.get<BusinessOwnerWriteRepository>(BusinessOwnerWriteRepository);
    factory = module.get<BusinessOwnerFactory>(BusinessOwnerFactory);

    // Clean all tables with RESTART IDENTITY CASCADE
    await cleanDatabase(dataSource);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await module.close();
  });

  it('should save BusinessOwner successfully', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());

    // Act
    await repository.save(businessOwner);

    // Assert
    const loaded = await factory.loadById(businessOwner.getId().getValue());
    expect(loaded).toBeDefined();
    expect(loaded!.getId().equals(businessOwner.getId())).toBe(true);
  });

  it('should increment version on save', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());
    await repository.save(businessOwner);

    // Act
    const loaded = await factory.loadById(businessOwner.getId().getValue());
    loaded!.completeOnboarding();
    await repository.save(loaded!);

    // Assert
    const reloaded = await factory.loadById(businessOwner.getId().getValue());
    expect(reloaded!.getVersion().getValue()).toBe(2);
  });

  it('should throw ConcurrencyException when version mismatch (optimistic locking)', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());
    await repository.save(businessOwner);

    // Load same BusinessOwner twice (simulating two concurrent requests)
    const instance1 = await factory.loadById(businessOwner.getId().getValue());
    const instance2 = await factory.loadById(businessOwner.getId().getValue());

    // Act & Assert
    // First save should succeed
    instance1!.completeOnboarding();
    await repository.save(instance1!);

    // Second save should fail with ConcurrencyException (version mismatch)
    instance2!.suspendSubscription();
    await expect(repository.save(instance2!)).rejects.toThrow(ConcurrencyException);
  });

  it('should handle concurrent modifications correctly', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());
    await repository.save(businessOwner);

    // Load same BusinessOwner twice
    const instance1 = await factory.loadById(businessOwner.getId().getValue());
    const instance2 = await factory.loadById(businessOwner.getId().getValue());

    // Act
    // First modification
    instance1!.completeOnboarding();
    await repository.save(instance1!);

    // Second modification should fail
    instance2!.suspendSubscription();
    let errorThrown = false;
    try {
      await repository.save(instance2!);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(ConcurrencyException);
    }

    // Assert
    expect(errorThrown).toBe(true);

    // Verify final state (only first modification applied)
    const final = await factory.loadById(businessOwner.getId().getValue());
    expect(final!.isOnboardingCompleted()).toBe(true);
    expect(final!.getSubscriptionStatus().isActive()).toBe(true); // Not suspended
    expect(final!.getVersion().getValue()).toBe(2); // Only one increment
  });

  it('should allow retry after ConcurrencyException', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());
    await repository.save(businessOwner);

    // Load same BusinessOwner twice
    const instance1 = await factory.loadById(businessOwner.getId().getValue());
    const instance2 = await factory.loadById(businessOwner.getId().getValue());

    // Act
    // First modification
    instance1!.completeOnboarding();
    await repository.save(instance1!);

    // Second modification fails
    instance2!.suspendSubscription();
    await expect(repository.save(instance2!)).rejects.toThrow(ConcurrencyException);

    // Retry: reload and apply modification
    const reloaded = await factory.loadById(businessOwner.getId().getValue());
    reloaded!.suspendSubscription();
    await repository.save(reloaded!);

    // Assert
    const final = await factory.loadById(businessOwner.getId().getValue());
    expect(final!.isOnboardingCompleted()).toBe(true);
    expect(final!.getSubscriptionStatus().isSuspended()).toBe(true);
    expect(final!.getVersion().getValue()).toBe(3); // Two successful modifications
  });

  it('should handle multiple sequential saves correctly', async () => {
    // Arrange
    const userId = UUID.generate();
    await createTestUser(dataSource, userId.getValue());
    const businessOwner = BusinessOwner.create(UUID.generate(), userId, SubscriptionPlan.free());
    await repository.save(businessOwner);

    // Act - Sequential modifications
    let loaded = await factory.loadById(businessOwner.getId().getValue());
    loaded!.completeOnboarding();
    await repository.save(loaded!);

    loaded = await factory.loadById(businessOwner.getId().getValue());
    loaded!.upgradeSubscription(SubscriptionPlan.basic());
    await repository.save(loaded!);

    loaded = await factory.loadById(businessOwner.getId().getValue());
    loaded!.suspendSubscription();
    await repository.save(loaded!);

    // Assert
    const final = await factory.loadById(businessOwner.getId().getValue());
    expect(final!.isOnboardingCompleted()).toBe(true);
    expect(final!.getSubscriptionPlan().equals(SubscriptionPlan.basic())).toBe(true);
    expect(final!.getSubscriptionStatus().isSuspended()).toBe(true);
    expect(final!.getVersion().getValue()).toBe(4); // 1 (create) + 3 modifications
  });
});
