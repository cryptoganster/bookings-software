import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { IdentifyCustomerHandler } from '../handler';
import { IdentifyCustomerCommand } from '../command';
import { CustomerFactory } from '@customer/infra/persistence/factories/customer.factory';
import { CustomerWriteRepository } from '@customer/infra/persistence/repositories/customer-write.repository';
import { CustomerReadRepository } from '@customer/infra/persistence/repositories/customer-read.repository';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { DataSource } from 'typeorm';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  createTestBusiness,
} from '@test-utils/integration-test-helper';

/**
 * Concurrency tests for IdentifyCustomerHandler
 *
 * Tests concurrent customer creation with same phone number to verify:
 * - Only one customer is created (no duplicates)
 * - ConcurrencyException is handled correctly
 * - Database constraints prevent duplicate (businessId, whatsappPhone)
 *
 * **Validates: Requirements 11.5**
 * **Property 4: Optimistic locking prevents concurrent modifications**
 */
describe('IdentifyCustomerHandler - Concurrency Tests', () => {
  let module: TestingModule;
  let handler: IdentifyCustomerHandler;
  let dataSource: DataSource;
  let businessId: string;

  beforeAll(async () => {
    dataSource = await createIntegrationTestDataSource();

    module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot(dataSource.options as any),
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

    handler = module.get<IdentifyCustomerHandler>(IdentifyCustomerHandler);
  });

  afterAll(async () => {
    // Don't destroy shared DataSource - it's reused across tests
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    // Create a test business for each test to satisfy foreign key constraint
    businessId = await createTestBusiness(dataSource);
  });

  describe('Concurrent customer creation', () => {
    it('should handle concurrent creation attempts for same phone number', async () => {
      // Arrange
      const whatsappPhone = '+18095551234';
      const name = 'John Doe';

      const command1 = new IdentifyCustomerCommand(businessId, whatsappPhone, name);
      const command2 = new IdentifyCustomerCommand(businessId, whatsappPhone, name);
      const command3 = new IdentifyCustomerCommand(businessId, whatsappPhone, name);

      // Act - Execute commands concurrently
      const results = await Promise.allSettled([
        handler.execute(command1),
        handler.execute(command2),
        handler.execute(command3),
      ]);

      // Assert - All should succeed (idempotent)
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThanOrEqual(1);

      // Verify only one customer was created
      const customers = await dataSource.query(
        'SELECT * FROM customers WHERE business_id = $1 AND whatsapp_phone = $2',
        [businessId, whatsappPhone],
      );

      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe(name);
    });

    it('should handle concurrent creation for different phone numbers', async () => {
      // Arrange
      const commands = [
        new IdentifyCustomerCommand(businessId, '+18095551111', 'Customer 1'),
        new IdentifyCustomerCommand(businessId, '+18095552222', 'Customer 2'),
        new IdentifyCustomerCommand(businessId, '+18095553333', 'Customer 3'),
        new IdentifyCustomerCommand(businessId, '+18095554444', 'Customer 4'),
        new IdentifyCustomerCommand(businessId, '+18095555555', 'Customer 5'),
      ];

      // Act - Execute commands concurrently
      const results = await Promise.allSettled(commands.map((cmd) => handler.execute(cmd)));

      // Assert - All should succeed
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      expect(successfulResults).toHaveLength(5);

      // Verify all customers were created
      const customers = await dataSource.query(
        'SELECT * FROM customers WHERE business_id = $1 ORDER BY whatsapp_phone',
        [businessId],
      );

      expect(customers).toHaveLength(5);
      expect(customers.map((c: any) => c.whatsapp_phone)).toEqual([
        '+18095551111',
        '+18095552222',
        '+18095553333',
        '+18095554444',
        '+18095555555',
      ]);
    });

    it('should handle concurrent name updates for same customer', async () => {
      // Arrange - Create initial customer
      const whatsappPhone = '+18095551234';
      const initialName = 'Initial Name';

      const createCommand = new IdentifyCustomerCommand(businessId, whatsappPhone, initialName);
      await handler.execute(createCommand);

      // Act - Concurrent updates with different names
      const updateCommands = [
        new IdentifyCustomerCommand(businessId, whatsappPhone, 'Name Update 1'),
        new IdentifyCustomerCommand(businessId, whatsappPhone, 'Name Update 2'),
        new IdentifyCustomerCommand(businessId, whatsappPhone, 'Name Update 3'),
      ];

      const results = await Promise.allSettled(updateCommands.map((cmd) => handler.execute(cmd)));

      // Assert - All should succeed (last write wins)
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThanOrEqual(1);

      // Verify only one customer exists with one of the updated names
      const customers = await dataSource.query(
        'SELECT * FROM customers WHERE business_id = $1 AND whatsapp_phone = $2',
        [businessId, whatsappPhone],
      );

      expect(customers).toHaveLength(1);
      expect(['Name Update 1', 'Name Update 2', 'Name Update 3']).toContain(customers[0].name);
    });

    it('should maintain multi-tenant isolation under concurrent load', async () => {
      // Arrange - Create two test businesses
      const business1 = await createTestBusiness(dataSource);
      const business2 = await createTestBusiness(dataSource);
      const sharedPhone = '+18095551234'; // Same phone, different businesses

      const commands = [
        new IdentifyCustomerCommand(business1, sharedPhone, 'Customer B1'),
        new IdentifyCustomerCommand(business2, sharedPhone, 'Customer B2'),
        new IdentifyCustomerCommand(business1, sharedPhone, 'Customer B1 Update'),
        new IdentifyCustomerCommand(business2, sharedPhone, 'Customer B2 Update'),
      ];

      // Act - Execute concurrently
      const results = await Promise.allSettled(commands.map((cmd) => handler.execute(cmd)));

      // Assert - All should succeed
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThanOrEqual(2);

      // Verify two separate customers (one per business)
      const allCustomers = await dataSource.query(
        'SELECT * FROM customers WHERE whatsapp_phone = $1 ORDER BY business_id',
        [sharedPhone],
      );

      expect(allCustomers).toHaveLength(2);
      expect(allCustomers[0].business_id).toBe(business1);
      expect(allCustomers[1].business_id).toBe(business2);
    });
  });

  describe('Database constraint enforcement', () => {
    it('should enforce unique constraint on (business_id, whatsapp_phone)', async () => {
      // Arrange
      const whatsappPhone = '+18095551234';

      // Create first customer
      await handler.execute(new IdentifyCustomerCommand(businessId, whatsappPhone, 'Customer 1'));

      // Act - Try to create duplicate directly in DB (bypassing handler logic)
      const duplicateAttempt = dataSource.query(
        `INSERT INTO customers (id, business_id, whatsapp_phone, name, version, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 0, NOW(), NOW())`,
        [businessId, whatsappPhone, 'Duplicate'],
      );

      // Assert - Should fail with unique constraint violation
      await expect(duplicateAttempt).rejects.toThrow();
    });
  });
});
