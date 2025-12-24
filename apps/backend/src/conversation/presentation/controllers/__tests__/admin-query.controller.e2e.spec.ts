/**
 * Admin Query Controller E2E Tests
 *
 * Tests all conversation controller endpoints with real HTTP requests.
 * Validates:
 * - GET /api/admin-queries/pending returns pending conversations
 * - GET /api/admin-queries/:id/messages returns conversation history
 * - POST /api/admin-queries/:id/respond sends admin response
 * - Authentication required (401)
 * - Validation errors (400)
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { UUID } from '@shared/vo/uuid';
import { E2EAuthHelper, TestUser } from '@test-utils/e2e-helpers';

describe('Admin Query Controller E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authHelper: E2EAuthHelper;
  let testUser: TestUser;
  let authToken: string;
  let testBusinessId: string;
  let testConversationId: string;
  let testCustomerId: string;

  // Mock WhatsApp client for E2E tests
  const mockWhatsAppClient = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    sendInteractiveButtons: jest.fn().mockResolvedValue(undefined),
    sendLocation: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
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

    dataSource = app.get(DataSource);

    // Create auth helper and test user with real authentication
    authHelper = new E2EAuthHelper(app);
    testUser = await authHelper.createBusinessOwner();
    authToken = testUser.token;
    testBusinessId = testUser.businessId!;
  });

  afterAll(async () => {
    // Clean up test users and associated data
    await authHelper.cleanupTestUsers();
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Clean database
    await dataSource.query('DELETE FROM messages');
    await dataSource.query('DELETE FROM conversations');
    await dataSource.query('DELETE FROM customers');

    // Create test customer
    const customer = new CustomerModel();
    customer.id = UUID.generate().getValue();
    customer.business_id = testBusinessId;
    customer.whatsapp_phone = '+1234567890';
    customer.name = 'Test Customer';
    customer.user_id = null;
    await dataSource.getRepository(CustomerModel).save(customer);
    testCustomerId = customer.id;

    // Create test conversation
    const conversation = new ConversationModel();
    conversation.id = UUID.generate().getValue();
    conversation.businessId = testBusinessId;
    conversation.customerId = testCustomerId;
    conversation.customerPhone = '+1234567890';
    conversation.status = 'AWAITING_ADMIN';
    conversation.state = 'AWAITING_ADMIN_RESPONSE';
    conversation.lastMessageAt = new Date();
    await dataSource.getRepository(ConversationModel).save(conversation);
    testConversationId = conversation.id;
  });

  describe('GET /api/admin-queries/pending', () => {
    it('should return pending conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin-queries/pending')
        .query({ businessId: testBusinessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const conversation = response.body[0];
      expect(conversation).toHaveProperty('id');
      expect(conversation).toHaveProperty('businessId');
      expect(conversation).toHaveProperty('customerId');
      expect(conversation).toHaveProperty('status');
      expect(conversation).toHaveProperty('lastMessageAt');
    });

    it('should return empty array when no pending conversations', async () => {
      // Update conversation to RESOLVED
      await dataSource.query(`UPDATE conversations SET status = 'RESOLVED' WHERE id = $1`, [
        testConversationId,
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/admin-queries/pending')
        .query({ businessId: testBusinessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/admin-queries/pending')
        .query({ businessId: testBusinessId })
        .expect(401);
    });

    it('should return 400 for missing businessId', async () => {
      await request(app.getHttpServer())
        .get('/api/admin-queries/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/admin-queries/:id', () => {
    it('should return conversation by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin-queries/${testConversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testConversationId);
      expect(response.body).toHaveProperty('businessId', testBusinessId);
      expect(response.body).toHaveProperty('customerId', testCustomerId);
      expect(response.body).toHaveProperty('status', 'AWAITING_ADMIN');
    });

    it('should return 404 for non-existent conversation', async () => {
      const nonExistentId = UUID.generate().getValue();

      await request(app.getHttpServer())
        .get(`/api/admin-queries/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/admin-queries/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin-queries/${testConversationId}`)
        .expect(401);
    });
  });

  describe('GET /api/admin-queries/:id/messages', () => {
    beforeEach(async () => {
      // Create test messages with camelCase properties (TypeORM entity format)
      const messages = [
        {
          id: UUID.generate().getValue(),
          conversationId: testConversationId,
          direction: 'INBOUND',
          content: 'Hello, I need help',
          messageType: 'TEXT',
          sentAt: new Date('2024-12-25T10:00:00Z'),
          isFromAdmin: false,
        },
        {
          id: UUID.generate().getValue(),
          conversationId: testConversationId,
          direction: 'OUTBOUND',
          content: 'How can I help you?',
          messageType: 'TEXT',
          sentAt: new Date('2024-12-25T10:05:00Z'),
          isFromAdmin: true,
        },
        {
          id: UUID.generate().getValue(),
          conversationId: testConversationId,
          direction: 'INBOUND',
          content: 'I want to book an appointment',
          messageType: 'TEXT',
          sentAt: new Date('2024-12-25T10:10:00Z'),
          isFromAdmin: false,
        },
      ];

      await dataSource.getRepository(MessageModel).save(messages);
    });

    it('should return conversation history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin-queries/${testConversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      // Verify messages are ordered by sentAt ASC
      const sentAtDates = response.body.map((m: any) => new Date(m.sentAt).getTime());
      const sortedDates = [...sentAtDates].sort((a, b) => a - b);
      expect(sentAtDates).toEqual(sortedDates);

      // Verify message structure
      const message = response.body[0];
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('conversationId');
      expect(message).toHaveProperty('direction');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('messageType');
      expect(message).toHaveProperty('sentAt');
      expect(message).toHaveProperty('isFromAdmin');
    });

    it('should return empty array for conversation with no messages', async () => {
      // Create new conversation without messages
      const emptyConversation = new ConversationModel();
      emptyConversation.id = UUID.generate().getValue();
      emptyConversation.businessId = testBusinessId;
      emptyConversation.customerId = testCustomerId;
      emptyConversation.customerPhone = '+1234567890';
      emptyConversation.status = 'ACTIVE';
      emptyConversation.state = 'INITIAL';
      emptyConversation.lastMessageAt = new Date();
      await dataSource.getRepository(ConversationModel).save(emptyConversation);

      const response = await request(app.getHttpServer())
        .get(`/api/admin-queries/${emptyConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 404 for non-existent conversation', async () => {
      const nonExistentId = UUID.generate().getValue();

      await request(app.getHttpServer())
        .get(`/api/admin-queries/${nonExistentId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/admin-queries/invalid-uuid/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin-queries/${testConversationId}/messages`)
        .expect(401);
    });
  });

  describe('POST /api/admin-queries/:id/respond', () => {
    it('should send admin response', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Thank you for contacting us. How can I help you?',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent successfully');

      // Verify message was created in database
      const messages = await dataSource
        .getRepository(MessageModel)
        .find({ where: { conversationId: testConversationId } });

      expect(messages.length).toBeGreaterThan(0);
      const adminMessage = messages.find((m) => m.isFromAdmin === true);
      expect(adminMessage).toBeDefined();
      expect(adminMessage?.content).toBe('Thank you for contacting us. How can I help you?');
      expect(adminMessage?.direction).toBe('OUTBOUND');
    });

    it('should return 400 for empty message', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '',
        })
        .expect(400);
    });

    it('should return 400 for missing message field', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should return 400 for whitespace-only message', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '   ',
        })
        .expect(400);
    });

    it('should return 404 for non-existent conversation', async () => {
      const nonExistentId = UUID.generate().getValue();

      await request(app.getHttpServer())
        .post(`/api/admin-queries/${nonExistentId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Test message',
        })
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .post('/api/admin-queries/invalid-uuid/respond')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Test message',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .send({
          message: 'Test message',
        })
        .expect(401);
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);

      const response = await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: longMessage,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent successfully');

      // Verify message was saved correctly
      const messages = await dataSource
        .getRepository(MessageModel)
        .find({ where: { conversationId: testConversationId } });

      const adminMessage = messages.find((m) => m.isFromAdmin === true);
      expect(adminMessage?.content).toBe(longMessage);
    });

    it('should handle special characters in message', async () => {
      const specialMessage = 'Hello! 👋 How are you? 😊 Price: $50.00 (50% off!)';

      const response = await request(app.getHttpServer())
        .post(`/api/admin-queries/${testConversationId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: specialMessage,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify message was saved correctly
      const messages = await dataSource
        .getRepository(MessageModel)
        .find({ where: { conversationId: testConversationId } });

      const adminMessage = messages.find((m) => m.isFromAdmin === true);
      expect(adminMessage?.content).toBe(specialMessage);
    });
  });
});
