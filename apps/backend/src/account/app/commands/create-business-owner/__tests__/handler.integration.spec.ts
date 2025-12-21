import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CreateBusinessOwnerHandler } from '../handler';
import { CreateBusinessOwnerCommand } from '../command';
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { UUID } from '@shared/vo/uuid';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { DataSource } from 'typeorm';

/**
 * Integration Test for CreateBusinessOwnerHandler
 *
 * Tests the complete flow from command to database persistence.
 */
describe('CreateBusinessOwnerHandler - Integration Test', () => {
  let module: TestingModule;
  let handler: CreateBusinessOwnerHandler;
  let dataSource: DataSource;
  let factory: BusinessOwnerFactory;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE_TEST || 'bookings_test',
          entities: [BusinessOwnerModel],
          synchronize: true, // Only for tests
          dropSchema: true, // Clean database before each test
        }),
        TypeOrmModule.forFeature([BusinessOwnerModel]),
        CqrsModule,
      ],
      providers: [
        CreateBusinessOwnerHandler,
        BusinessOwnerWriteRepository,
        BusinessOwnerFactory,
        TypeOrmUnitOfWork,
        {
          provide: 'IBusinessOwnerWriteRepository',
          useClass: BusinessOwnerWriteRepository,
        },
        {
          provide: 'IBusinessOwnerFactory',
          useClass: BusinessOwnerFactory,
        },
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    handler = module.get<CreateBusinessOwnerHandler>(CreateBusinessOwnerHandler);
    dataSource = module.get<DataSource>(DataSource);
    factory = module.get<BusinessOwnerFactory>(BusinessOwnerFactory);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await module.close();
  });

  it('should create BusinessOwner and persist to database', async () => {
    // Arrange
    const userId = UUID.generate();
    const command = new CreateBusinessOwnerCommand(userId.getValue(), 'FREE');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.businessOwnerId).toBeDefined();

    // Verify persistence
    const businessOwner = await factory.loadById(result.businessOwnerId);
    expect(businessOwner).toBeDefined();
    expect(businessOwner!.getUserId().equals(userId)).toBe(true);
    expect(businessOwner!.getSubscriptionPlan().equals(SubscriptionPlan.free())).toBe(true);
    expect(businessOwner!.getSubscriptionStatus().isActive()).toBe(true);
    expect(businessOwner!.isOnboardingCompleted()).toBe(false);
    expect(businessOwner!.getVersion().getValue()).toBe(1);
  });

  it('should create BusinessOwner with BASIC plan', async () => {
    // Arrange
    const userId = UUID.generate();
    const command = new CreateBusinessOwnerCommand(userId.getValue(), 'BASIC');

    // Act
    const result = await handler.execute(command);

    // Assert
    const businessOwner = await factory.loadById(result.businessOwnerId);
    expect(businessOwner!.getSubscriptionPlan().equals(SubscriptionPlan.basic())).toBe(true);
  });

  it('should create multiple BusinessOwners independently', async () => {
    // Arrange
    const userId1 = UUID.generate();
    const userId2 = UUID.generate();
    const command1 = new CreateBusinessOwnerCommand(userId1.getValue(), 'FREE');
    const command2 = new CreateBusinessOwnerCommand(userId2.getValue(), 'PRO');

    // Act
    const result1 = await handler.execute(command1);
    const result2 = await handler.execute(command2);

    // Assert
    expect(result1.businessOwnerId).not.toBe(result2.businessOwnerId);

    const businessOwner1 = await factory.loadById(result1.businessOwnerId);
    const businessOwner2 = await factory.loadById(result2.businessOwnerId);

    expect(businessOwner1!.getSubscriptionPlan().equals(SubscriptionPlan.free())).toBe(true);
    expect(businessOwner2!.getSubscriptionPlan().equals(SubscriptionPlan.pro())).toBe(true);
  });
});
