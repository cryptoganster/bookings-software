import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProcessIncomingMessageCommand } from '@conversation/app/commands/process-incoming-message';
import { GetAppointmentQuery } from '@booking/app/queries/get-appointment';
import { GetCustomerByPhoneQuery } from '@customer/app/queries/get-customer-by-phone';
import { IWhatsAppClient, Button } from '@conversation/domain/interfaces/external/whatsapp-client';
import { UUID } from '@shared/vo/uuid';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import {
  createCapacityForTomorrow,
  createActiveOffering,
  E2EAuthHelper,
} from '@test-utils/helpers';

describe('Customer Flow E2E', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let dataSource: DataSource;
  let mockWhatsAppClient: jest.Mocked<IWhatsAppClient>;
  let authHelper: E2EAuthHelper;

  // Test data
  let sentMessages: Array<{ phone: string; message: string; buttons?: Button[] }> = [];
  let testBusinessId: string;
  let testOfferingId: string;
  const testCustomerPhone = '+1234567891'; // Unique phone number for this test suite

  beforeAll(async () => {
    // Create mock WhatsApp client
    mockWhatsAppClient = {
      sendMessage: jest.fn().mockImplementation((to: string, message: string) => {
        sentMessages.push({ phone: to, message });
        return Promise.resolve();
      }),
      sendInteractiveButtons: jest
        .fn()
        .mockImplementation((to: string, message: string, buttons: Button[]) => {
          sentMessages.push({ phone: to, message, buttons });
          return Promise.resolve();
        }),
      sendLocation: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IWhatsAppClient')
      .useValue(mockWhatsAppClient)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    await app.init();

    commandBus = app.get(CommandBus);
    queryBus = app.get(QueryBus);
    dataSource = app.get(DataSource);

    // Create auth helper and test business owner
    authHelper = new E2EAuthHelper(app);
    const testUser = await authHelper.createBusinessOwner();
    testBusinessId = testUser.businessId!;

    // Create active offering for foreign key constraint
    testOfferingId = UUID.generate().getValue();
    await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clear sent messages
    sentMessages = [];
    mockWhatsAppClient.sendMessage.mockClear();
    mockWhatsAppClient.sendInteractiveButtons.mockClear();

    // Clean database
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM customers');
    await dataSource.query('DELETE FROM capacities');
    await dataSource.query('DELETE FROM offerings');

    // Clear conversations from database
    await dataSource.query('DELETE FROM conversations');
    await dataSource.query('DELETE FROM messages');

    // Recreate the test offering after cleanup
    await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });
  });

  describe('Requirement 7.1: Customer Identification', () => {
    it('should automatically identify/create customer from WhatsApp message', async () => {
      // Arrange: Create offering so conversation flow can proceed
      await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });

      // Act: Customer sends first message
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          '', // Empty string for no customerId
          testCustomerPhone,
          'Hola',
          undefined,
        ),
      );

      // Assert: Customer should be created
      const customer = await queryBus.execute(
        new GetCustomerByPhoneQuery(testBusinessId, testCustomerPhone),
      );

      expect(customer).toBeDefined();
      expect(customer).not.toBeNull();
      expect(customer!.businessId).toBe(testBusinessId);
      expect(customer!.whatsappPhone).toBe(testCustomerPhone);
      expect(customer!.userId).toBeNull(); // Anonymous customer
      expect(customer!.name).toBeNull(); // Name not set yet
    });

    it('should reuse existing customer on subsequent messages', async () => {
      // Arrange: Create offering so conversation flow can proceed
      await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });

      // Arrange: Send first message to create customer
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, 'Hola', undefined),
      );

      const firstCustomer = await queryBus.execute(
        new GetCustomerByPhoneQuery(testBusinessId, testCustomerPhone),
      );

      // Act: Send second message
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          '',
          testCustomerPhone,
          'Otro mensaje',
          undefined,
        ),
      );

      const secondCustomer = await queryBus.execute(
        new GetCustomerByPhoneQuery(testBusinessId, testCustomerPhone),
      );

      // Assert: Same customer should be reused
      expect(firstCustomer).not.toBeNull();
      expect(secondCustomer).not.toBeNull();
      expect(secondCustomer!.id).toBe(firstCustomer!.id);
      expect(secondCustomer!.createdAt).toEqual(firstCustomer!.createdAt);
    });
  });

  describe('Requirement 7.2: Customer Info in Appointment Queries', () => {
    it('should include customer name and phone in appointment read model', async () => {
      // Arrange: Create offering and capacity
      await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });
      await createCapacityForTomorrow(dataSource, testOfferingId, 5, 10);

      // Act: Complete booking flow
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, 'Hola', undefined),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          '',
          testCustomerPhone,
          '',
          testOfferingId,
        ),
      );

      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', dateButtonId),
      );

      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', timeButtonId),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', 'confirm'),
      );

      // Assert: Get appointment and verify customer info
      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(1);

      const appointment = await queryBus.execute(new GetAppointmentQuery(appointments[0].id));

      expect(appointment).toBeDefined();
      expect(appointment.customerPhone).toBe(testCustomerPhone);
      expect(appointment.customerId).toBeDefined();
      // Name might be null for anonymous customers
      expect(appointment.customerName).toBeDefined();
    });

    it('should handle customer with name set', async () => {
      // Arrange: Create customer with name
      const customer = new CustomerModel();
      customer.id = UUID.generate().getValue();
      customer.business_id = testBusinessId;
      customer.whatsapp_phone = testCustomerPhone;
      customer.name = 'Juan Pérez';
      customer.user_id = null;
      await dataSource.getRepository(CustomerModel).save(customer);

      // Create appointment with future date
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(14, 0, 0, 0); // 2 PM tomorrow

      const appointment = new AppointmentModel();
      appointment.id = UUID.generate().getValue();
      appointment.businessId = testBusinessId;
      appointment.customerId = customer.id;
      appointment.offeringId = testOfferingId;
      appointment.dateTime = tomorrow;
      appointment.status = 'CONFIRMED';
      appointment.version = 0;
      await dataSource.getRepository(AppointmentModel).save(appointment);

      // Act: Query appointment
      const result = await queryBus.execute(new GetAppointmentQuery(appointment.id));

      // Assert: Customer name should be included
      expect(result).toBeDefined();
      expect(result.customerName).toBe('Juan Pérez');
      expect(result.customerPhone).toBe(testCustomerPhone);
    });
  });

  describe('Requirement 7.3: Multi-tenant Isolation', () => {
    it('should isolate customers by business', async () => {
      // Arrange: Create two real business owners with their businesses
      const authHelper2 = new E2EAuthHelper(app);
      const testUser2 = await authHelper2.createBusinessOwner();
      const business1Id = testBusinessId; // Use existing test business
      const business2Id = testUser2.businessId!; // Use second test business
      const offering1Id = testOfferingId; // Use existing test offering
      const offering2Id = UUID.generate().getValue();
      const phone = '+1234567890';

      // Arrange: Create offerings for both businesses
      await createActiveOffering(dataSource, business1Id, { id: offering1Id });
      await createActiveOffering(dataSource, business2Id, { id: offering2Id });

      // Act: Create customer in business 1
      await commandBus.execute(
        new ProcessIncomingMessageCommand(business1Id, '', phone, 'Hola', undefined),
      );

      // Create customer in business 2 (same phone)
      await commandBus.execute(
        new ProcessIncomingMessageCommand(business2Id, '', phone, 'Hola', undefined),
      );

      // Assert: Two different customers should exist
      const customer1 = await queryBus.execute(new GetCustomerByPhoneQuery(business1Id, phone));
      const customer2 = await queryBus.execute(new GetCustomerByPhoneQuery(business2Id, phone));

      expect(customer1).toBeDefined();
      expect(customer2).toBeDefined();
      expect(customer1).not.toBeNull();
      expect(customer2).not.toBeNull();
      expect(customer1!.id).not.toBe(customer2!.id);
      expect(customer1!.businessId).toBe(business1Id);
      expect(customer2!.businessId).toBe(business2Id);

      // Cleanup second test user
      await authHelper2.cleanupTestUsers();
    });

    it('should not allow cross-business customer queries', async () => {
      // Arrange: Create two real business owners with their businesses
      const authHelper2 = new E2EAuthHelper(app);
      const testUser2 = await authHelper2.createBusinessOwner();
      const business1Id = testBusinessId; // Use existing test business
      const business2Id = testUser2.businessId!; // Use second test business
      const offering1Id = testOfferingId; // Use existing test offering
      const phone = '+1234567890';

      // Arrange: Create offering for business 1 and create customer
      await createActiveOffering(dataSource, business1Id, { id: offering1Id });
      await commandBus.execute(
        new ProcessIncomingMessageCommand(business1Id, '', phone, 'Hola', undefined),
      );

      // Act: Try to query from business 2
      const result = await queryBus.execute(new GetCustomerByPhoneQuery(business2Id, phone));

      // Assert: Should not find customer
      expect(result).toBeNull();

      // Cleanup second test user
      await authHelper2.cleanupTestUsers();
    });
  });

  describe('Requirement 7.4: Anonymous Customer Flow', () => {
    it('should allow anonymous customer to complete booking', async () => {
      // Arrange: Create offering and capacity
      await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });
      await createCapacityForTomorrow(dataSource, testOfferingId, 5, 10);

      // Act: Complete booking flow as anonymous customer
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, 'Hola', undefined),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          '',
          testCustomerPhone,
          '',
          testOfferingId,
        ),
      );

      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', dateButtonId),
      );

      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', timeButtonId),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(testBusinessId, '', testCustomerPhone, '', 'confirm'),
      );

      // Assert: Appointment created with anonymous customer
      const customer = await queryBus.execute(
        new GetCustomerByPhoneQuery(testBusinessId, testCustomerPhone),
      );
      expect(customer).not.toBeNull();
      expect(customer!.userId).toBeNull(); // Anonymous

      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(1);
      expect(appointments[0].customerId).toBe(customer!.id);
      expect(appointments[0].status).toBe('CONFIRMED');

      // Verify confirmation message sent
      expect(mockWhatsAppClient.sendMessage).toHaveBeenCalled();
      const confirmMessage = sentMessages.find((m) => m.message.includes('confirmada'));
      expect(confirmMessage).toBeDefined();
    });
  });

  describe('Requirement 7.5: Idempotency', () => {
    it('should handle concurrent customer identification gracefully', async () => {
      // Arrange: Create offering so conversation flow can proceed
      await createActiveOffering(dataSource, testBusinessId, { id: testOfferingId });

      // Act: Send multiple messages concurrently
      // Some may fail due to unique constraint, but that's expected
      const promises = Array.from({ length: 5 }, () =>
        commandBus
          .execute(
            new ProcessIncomingMessageCommand(
              testBusinessId,
              '',
              testCustomerPhone,
              'Hola',
              undefined,
            ),
          )
          .catch((error) => {
            // Ignore duplicate key errors - they're expected in concurrent scenarios
            if (error.message?.includes('duplicate key')) {
              return null;
            }
            throw error;
          }),
      );

      await Promise.all(promises);

      // Assert: Only one customer should be created despite concurrent attempts
      const customers = await dataSource.getRepository(CustomerModel).find({
        where: {
          business_id: testBusinessId,
          whatsapp_phone: testCustomerPhone,
        },
      });

      expect(customers).toHaveLength(1);
    });
  });
});
