import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CqrsModule, CommandBus } from '@nestjs/cqrs';
import { IdentifyCustomerHandler } from '../handler';
import { IdentifyCustomerCommand } from '../command';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { CustomerFactory } from '@customer/infra/persistence/factories/customer.factory';
import { CustomerWriteRepository } from '@customer/infra/persistence/repositories/customer-write.repository';
import { CustomerReadRepository } from '@customer/infra/persistence/repositories/customer-read.repository';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { UUID } from '@shared/vo/uuid';
import { setupTestDatabase, cleanDatabase } from '@test-utils/helpers/database';
import { createTestBusiness } from '@test-utils/helpers/business';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

/**
 * Integration tests for IdentifyCustomerHandler
 *
 * Tests the complete flow of customer identification including:
 * - Creating new customers
 * - Returning existing customers
 * - Updating customer names
 * - Idempotency
 *
 * **Validates: Requirements 1.1-1.5, 6.1, 6.2**
 * **Property 2: Idempotency - calling identify multiple times with same data returns same customer**
 */
describe('IdentifyCustomerHandler Integration Tests', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let dataSource: DataSource;
  let businessId: string;

  beforeAll(async () => {
    await ensureMigrationsRun();

    dataSource = await setupTestDatabase();

    module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot(dataSource.options),
        TypeOrmModule.forFeature([CustomerModel]),
      ],
      providers: [
        IdentifyCustomerHandler,
        {
          provide: 'ICustomerFactory',
          useClass: CustomerFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useClass: CustomerWriteRepository,
        },
        {
          provide: 'ICustomerReadRepository',
          useClass: CustomerReadRepository,
        },
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    // Initialize the module to register handlers
    await module.init();

    commandBus = module.get<CommandBus>(CommandBus);
  }, 30000);

  afterAll(async () => {
    // Don't destroy shared DataSource - it's reused across tests
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    // Create a test business for each test to satisfy foreign key constraint
    businessId = await createTestBusiness(dataSource);
  });

  describe('Create new customer', () => {
    it('should create new customer when not exists', async () => {
      // Arrange
      const command = new IdentifyCustomerCommand(businessId, '+18095551234', 'Juan Pérez');

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.customerId).toBeDefined();

      // Verify in database
      const customer = await dataSource
        .getRepository(CustomerModel)
        .findOne({ where: { id: result.customerId } });

      expect(customer).toBeDefined();
      expect(customer!.business_id).toBe(businessId);
      expect(customer!.whatsapp_phone).toBe('+18095551234');
      expect(customer!.name).toBe('Juan Pérez');
      expect(customer!.user_id).toBeNull(); // Anonymous
      expect(customer!.version).toBe(1);
    });

    it('should create customer with null name', async () => {
      // Arrange
      const command = new IdentifyCustomerCommand(businessId, '+18095555678', null);

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const customer = await dataSource
        .getRepository(CustomerModel)
        .findOne({ where: { id: result.customerId } });

      expect(customer!.name).toBeNull();
    });
  });

  describe('Return existing customer', () => {
    it('should return existing customer when phone already exists', async () => {
      // Arrange - Create customer first
      const existingId = UUID.generate().getValue();
      await dataSource.getRepository(CustomerModel).insert({
        id: existingId,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095559999',
        name: 'María García',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const command = new IdentifyCustomerCommand(businessId, '+18095559999', 'María García');

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result.customerId).toBe(existingId);

      // Verify no duplicate was created
      const count = await dataSource
        .getRepository(CustomerModel)
        .count({ where: { whatsapp_phone: '+18095559999' } });

      expect(count).toBe(1);
    });
  });

  describe('Update customer name', () => {
    it('should update name when customer exists with different name', async () => {
      // Arrange - Create customer with old name
      const existingId = UUID.generate().getValue();
      await dataSource.getRepository(CustomerModel).insert({
        id: existingId,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095558888',
        name: 'Old Name',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const command = new IdentifyCustomerCommand(businessId, '+18095558888', 'New Name');

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result.customerId).toBe(existingId);

      const customer = await dataSource
        .getRepository(CustomerModel)
        .findOne({ where: { id: existingId } });

      expect(customer!.name).toBe('New Name');
      expect(customer!.version).toBe(2); // Version incremented
    });

    it('should not update version when name is the same', async () => {
      // Arrange
      const existingId = UUID.generate().getValue();
      await dataSource.getRepository(CustomerModel).insert({
        id: existingId,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095557777',
        name: 'Same Name',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const command = new IdentifyCustomerCommand(businessId, '+18095557777', 'Same Name');

      // Act
      await commandBus.execute(command);

      // Assert
      const customer = await dataSource
        .getRepository(CustomerModel)
        .findOne({ where: { id: existingId } });

      expect(customer!.version).toBe(1); // Version not incremented
    });
  });

  describe('Idempotency (Property 2)', () => {
    it('should return same customer on multiple calls with same data', async () => {
      // Arrange
      const command = new IdentifyCustomerCommand(businessId, '+18095556666', 'Pedro López');

      // Act - Execute command 3 times
      const result1 = await commandBus.execute(command);
      const result2 = await commandBus.execute(command);
      const result3 = await commandBus.execute(command);

      // Assert - All return same customer ID
      expect(result1.customerId).toBe(result2.customerId);
      expect(result2.customerId).toBe(result3.customerId);

      // Verify only one customer was created
      const count = await dataSource
        .getRepository(CustomerModel)
        .count({ where: { whatsapp_phone: '+18095556666' } });

      expect(count).toBe(1);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should create separate customers for same phone in different businesses', async () => {
      // Arrange - Create two test businesses
      const business1 = await createTestBusiness(dataSource);
      const business2 = await createTestBusiness(dataSource);
      const phone = '+18095555555';

      const command1 = new IdentifyCustomerCommand(business1, phone, 'Customer 1');
      const command2 = new IdentifyCustomerCommand(business2, phone, 'Customer 2');

      // Act
      const result1 = await commandBus.execute(command1);
      const result2 = await commandBus.execute(command2);

      // Assert - Different customer IDs
      expect(result1.customerId).not.toBe(result2.customerId);

      // Verify both customers exist
      const customers = await dataSource
        .getRepository(CustomerModel)
        .find({ where: { whatsapp_phone: phone } });

      expect(customers).toHaveLength(2);
      expect(customers.map((c) => c.business_id)).toContain(business1);
      expect(customers.map((c) => c.business_id)).toContain(business2);
    });
  });
});
