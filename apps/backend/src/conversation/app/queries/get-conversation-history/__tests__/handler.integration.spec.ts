import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetConversationHistoryHandler } from '../handler';
import { GetConversationHistoryQuery } from '../query';
import { MessageReadRepository } from '@conversation/infra/persistence/repositories/message-read.repository';
import { ConversationReadRepository } from '@conversation/infra/persistence/repositories/conversation-read.repository';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { CustomerModel } from '@customer/infra/persistence/models';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  generateUniqueWhatsAppNumber,
  createTestBusinessInDb,
  createTestUserInDb,
  setupTestDatabase,
} from '@test-utils/helpers';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';
import { v4 as uuidv4 } from 'uuid';

describe('GetConversationHistoryHandler - Integration Tests', () => {
  let module: TestingModule;
  let handler: GetConversationHistoryHandler;
  let conversationRepository: Repository<ConversationModel>;
  let messageRepository: Repository<MessageModel>;
  let customerRepository: Repository<CustomerModel>;
  let dataSource: DataSource;
  let businessId: string;
  let userId: string;

  beforeAll(async () => {
    await ensureMigrationsRun();
    await setupTestDatabase();

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [ConversationModel, MessageModel, CustomerModel],
          synchronize: false,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([ConversationModel, MessageModel, CustomerModel]),
      ],
      providers: [
        GetConversationHistoryHandler,
        {
          provide: 'IMessageReadRepository',
          useClass: MessageReadRepository,
        },
        {
          provide: 'IConversationReadRepository',
          useClass: ConversationReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetConversationHistoryHandler>(GetConversationHistoryHandler);
    conversationRepository = module.get<Repository<ConversationModel>>(
      getRepositoryToken(ConversationModel),
    );
    messageRepository = module.get<Repository<MessageModel>>(getRepositoryToken(MessageModel));
    customerRepository = module.get<Repository<CustomerModel>>(getRepositoryToken(CustomerModel));
    dataSource = module.get<DataSource>(DataSource);

    // Create test user
    userId = uuidv4();
    await createTestUserInDb(dataSource, userId);

    // Create test business
    businessId = uuidv4();
    await createTestBusinessInDb(dataSource, businessId, userId);
  });

  afterAll(async () => {
    // Clean up test data - use query builder to delete all messages
    await messageRepository.createQueryBuilder().delete().execute();
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
    await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
    await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId]);
    await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    await module.close();
  });

  beforeEach(async () => {
    // Clean up before each test - use query builder to delete all messages
    await messageRepository.createQueryBuilder().delete().execute();
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
  });

  describe('Task 3.5: Orders messages chronologically (oldest first)', () => {
    /**
     * Requirements: FR-3.2, US-2.3
     * Property: Property 4 (PBT-3.4) - Message ordering
     *
     * Test: Create conversation with messages at random timestamps
     * Test: Execute GetConversationHistoryQuery
     * Test: Assert messages ordered by sentAt ASC (oldest first)
     * Test: Verify timestamps are in ascending order
     */
    it('should return messages ordered chronologically (oldest first)', async () => {
      // Arrange: Create customer
      const customerId = uuidv4();
      await customerRepository.save({
        id: customerId,
        business_id: businessId,
        whatsapp_phone: generateUniqueWhatsAppNumber(),
        name: 'Test Customer',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create conversation
      const conversationId = uuidv4();
      await conversationRepository.save({
        id: conversationId,
        businessId,
        customerId,
        customerPhone: '+18095551001',
        status: 'ACTIVE',
        state: 'GREETING',
        version: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create messages with random timestamps
      const msg1Id = uuidv4();
      const msg2Id = uuidv4();
      const msg3Id = uuidv4();

      await messageRepository.save([
        {
          id: msg1Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Message 3',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-03T10:00:00Z'), // Third
          isFromAdmin: false,
          createdAt: new Date(),
        },
        {
          id: msg2Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Message 1',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:00:00Z'), // First (oldest)
          isFromAdmin: false,
          createdAt: new Date(),
        },
        {
          id: msg3Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'OUTBOUND',
          content: 'Message 2',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-02T10:00:00Z'), // Second
          isFromAdmin: true,
          createdAt: new Date(),
        },
      ]);

      // Act: Execute query
      const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

      // Assert: Messages ordered by sentAt ASC
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(msg2Id); // 2024-01-01 (oldest)
      expect(result[1].id).toBe(msg3Id); // 2024-01-02
      expect(result[2].id).toBe(msg1Id); // 2024-01-03 (most recent)

      // Verify ascending order
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].sentAt).getTime();
        const next = new Date(result[i + 1].sentAt).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    });

    it('should handle messages with same timestamp (stable sorting)', async () => {
      // Arrange: Create customer
      const customerId = uuidv4();
      await customerRepository.save({
        id: customerId,
        business_id: businessId,
        whatsapp_phone: generateUniqueWhatsAppNumber(),
        name: 'Test Customer',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create conversation
      const conversationId = uuidv4();
      await conversationRepository.save({
        id: conversationId,
        businessId,
        customerId,
        customerPhone: '+18095551001',
        status: 'ACTIVE',
        state: 'GREETING',
        version: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create messages with same timestamp
      const sameTimestamp = new Date('2024-01-01T10:00:00Z');
      const msg1Id = uuidv4();
      const msg2Id = uuidv4();
      const msg3Id = uuidv4();

      await messageRepository.save([
        {
          id: msg1Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Message 1',
          messageType: 'TEXT',
          sentAt: sameTimestamp,
          isFromAdmin: false,
          createdAt: new Date(Date.now() - 3000),
        },
        {
          id: msg2Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'OUTBOUND',
          content: 'Message 2',
          messageType: 'TEXT',
          sentAt: sameTimestamp,
          isFromAdmin: true,
          createdAt: new Date(Date.now() - 2000),
        },
        {
          id: msg3Id,
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Message 3',
          messageType: 'TEXT',
          sentAt: sameTimestamp,
          isFromAdmin: false,
          createdAt: new Date(Date.now() - 1000),
        },
      ]);

      // Act
      const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

      // Assert: All messages returned with stable ordering
      expect(result).toHaveLength(3);
      // All should have same sentAt
      expect(result.every((m) => m.sentAt === sameTimestamp.toISOString())).toBe(true);
    });

    it('should return empty array when conversation has no messages', async () => {
      // Arrange: Create customer
      const customerId = uuidv4();
      await customerRepository.save({
        id: customerId,
        business_id: businessId,
        whatsapp_phone: generateUniqueWhatsAppNumber(),
        name: 'Test Customer',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create conversation without messages
      const conversationId = uuidv4();
      await conversationRepository.save({
        id: conversationId,
        businessId,
        customerId,
        customerPhone: '+18095551001',
        status: 'ACTIVE',
        state: 'GREETING',
        version: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      // Arrange: Non-existent conversation ID
      const nonExistentId = uuidv4();

      // Act & Assert
      await expect(handler.execute(new GetConversationHistoryQuery(nonExistentId))).rejects.toThrow(
        NotFoundException,
      );

      await expect(handler.execute(new GetConversationHistoryQuery(nonExistentId))).rejects.toThrow(
        `Conversation with id ${nonExistentId} not found`,
      );
    });
  });

  describe('Task 3.5 Additional: Message content and metadata', () => {
    /**
     * Requirements: FR-3.2
     * Property: Complete message data returned
     *
     * Test: Create messages with various types and directions
     * Test: Execute query
     * Test: Assert all message fields are present and correct
     */
    it('should return complete message data with all fields', async () => {
      // Arrange: Create customer
      const customerId = uuidv4();
      await customerRepository.save({
        id: customerId,
        business_id: businessId,
        whatsapp_phone: generateUniqueWhatsAppNumber(),
        name: 'Test Customer',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create conversation
      const conversationId = uuidv4();
      await conversationRepository.save({
        id: conversationId,
        businessId,
        customerId,
        customerPhone: '+18095551001',
        status: 'ACTIVE',
        state: 'GREETING',
        version: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create messages with different types
      await messageRepository.save([
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Hello, I need help',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:00:00Z'),
          isFromAdmin: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'OUTBOUND',
          content: 'How can I help you?',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:01:00Z'),
          isFromAdmin: true,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'BUTTON_CLICKED:service_1',
          messageType: 'BUTTON',
          sentAt: new Date('2024-01-01T10:02:00Z'),
          isFromAdmin: false,
          createdAt: new Date(),
        },
      ]);

      // Act
      const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

      // Assert: All fields present
      expect(result).toHaveLength(3);

      result.forEach((message) => {
        expect(message.id).toBeDefined();
        expect(message.conversationId).toBe(conversationId);
        expect(message.direction).toMatch(/^(INBOUND|OUTBOUND)$/);
        expect(message.content).toBeDefined();
        expect(message.messageType).toMatch(/^(TEXT|BUTTON|LOCATION)$/);
        expect(message.sentAt).toBeDefined();
        expect(typeof message.isFromAdmin).toBe('boolean');
      });

      // Verify specific message types
      expect(result[0].messageType).toBe('TEXT');
      expect(result[0].isFromAdmin).toBe(false);
      expect(result[1].messageType).toBe('TEXT');
      expect(result[1].isFromAdmin).toBe(true);
      expect(result[2].messageType).toBe('BUTTON');
      expect(result[2].isFromAdmin).toBe(false);
    });

    it('should correctly distinguish between customer and admin messages', async () => {
      // Arrange: Create customer
      const customerId = uuidv4();
      await customerRepository.save({
        id: customerId,
        business_id: businessId,
        whatsapp_phone: generateUniqueWhatsAppNumber(),
        name: 'Test Customer',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create conversation
      const conversationId = uuidv4();
      await conversationRepository.save({
        id: conversationId,
        businessId,
        customerId,
        customerPhone: '+18095551001',
        status: 'AWAITING_ADMIN',
        state: 'AWAITING_ADMIN_RESPONSE',
        version: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create alternating customer/admin messages
      await messageRepository.save([
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Customer message 1',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:00:00Z'),
          isFromAdmin: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'OUTBOUND',
          content: 'Admin response 1',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:01:00Z'),
          isFromAdmin: true,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          conversationId: conversationId, // Use camelCase property name
          direction: 'INBOUND',
          content: 'Customer message 2',
          messageType: 'TEXT',
          sentAt: new Date('2024-01-01T10:02:00Z'),
          isFromAdmin: false,
          createdAt: new Date(),
        },
      ]);

      // Act
      const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

      // Assert: Correct isFromAdmin flags
      expect(result).toHaveLength(3);
      expect(result[0].isFromAdmin).toBe(false); // Customer
      expect(result[0].direction).toBe('INBOUND');
      expect(result[1].isFromAdmin).toBe(true); // Admin
      expect(result[1].direction).toBe('OUTBOUND');
      expect(result[2].isFromAdmin).toBe(false); // Customer
      expect(result[2].direction).toBe('INBOUND');
    });
  });
});
