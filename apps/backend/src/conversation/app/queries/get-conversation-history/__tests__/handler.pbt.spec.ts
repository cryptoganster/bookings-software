import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import * as fc from 'fast-check';

describe('GetConversationHistoryHandler - Property-Based Tests', () => {
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
    // Clean up test data
    await messageRepository.createQueryBuilder().delete().execute();
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
    await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
    await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId]);
    await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    await module.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await messageRepository.createQueryBuilder().delete().execute();
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
  });

  describe('Task 3.7: Property 4 - Message ordering property', () => {
    /**
     * Requirements: FR-3.2, US-2.3
     * Property: Property 4 (PBT-3.4)
     *
     * Property: For any set of messages with random timestamps,
     *           GetConversationHistoryQuery MUST return messages
     *           ordered by sentAt ASC (chronological order)
     *
     * Test: Generate messages with random timestamps using fast-check
     * Test: Execute GetConversationHistoryQuery
     * Test: Assert messages[i].sentAt <= messages[i+1].sentAt for all i
     * Test: Run 100+ iterations with random timestamps
     */
    it('should always return messages in chronological order for any random timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 100 }),
              direction: fc.constantFrom('INBOUND', 'OUTBOUND'),
              messageType: fc.constantFrom('TEXT', 'BUTTON', 'LOCATION'),
              isFromAdmin: fc.boolean(),
              sentAt: fc
                .integer({
                  min: new Date('2024-01-01').getTime(),
                  max: new Date('2024-12-31').getTime(),
                })
                .map((ts) => new Date(ts)),
            }),
            { minLength: 3, maxLength: 20 },
          ),
          async (messages) => {
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
            for (const msg of messages) {
              await messageRepository.save({
                id: msg.id,
                conversationId: conversationId,
                direction: msg.direction,
                content: msg.content,
                messageType: msg.messageType,
                sentAt: msg.sentAt,
                isFromAdmin: msg.isFromAdmin,
                createdAt: new Date(),
              });
            }

            // Act: Execute query
            const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

            // Assert: Messages ordered chronologically (ascending)
            for (let i = 0; i < result.length - 1; i++) {
              const currentTime = new Date(result[i].sentAt).getTime();
              const nextTime = new Date(result[i + 1].sentAt).getTime();
              expect(currentTime).toBeLessThanOrEqual(nextTime);
            }

            // Assert: All messages present
            expect(result).toHaveLength(messages.length);

            // Assert: All message IDs are present
            const resultIds = result.map((m) => m.id);
            messages.forEach((msg) => {
              expect(resultIds).toContain(msg.id);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle messages with identical timestamps (stable sorting)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 50 }),
              sentAt: fc.constant(new Date('2024-01-01T10:00:00Z')), // All same timestamp
            }),
            { minLength: 2, maxLength: 10 },
          ),
          async (messages) => {
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
            for (const msg of messages) {
              await messageRepository.save({
                id: msg.id,
                conversationId: conversationId,
                direction: 'INBOUND',
                content: msg.content,
                messageType: 'TEXT',
                sentAt: msg.sentAt,
                isFromAdmin: false,
                createdAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

            // Assert: All messages returned
            expect(result).toHaveLength(messages.length);

            // Assert: All have same sentAt
            const firstTimestamp = result[0].sentAt;
            expect(result.every((m) => m.sentAt === firstTimestamp)).toBe(true);

            // Assert: Ordering is stable (no duplicates, all IDs present)
            const resultIds = result.map((m) => m.id);
            const uniqueIds = new Set(resultIds);
            expect(uniqueIds.size).toBe(messages.length);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should maintain chronological order for messages within same day', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 100 }),
              sentAt: fc
                .integer({
                  min: new Date('2024-01-01T00:00:00Z').getTime(),
                  max: new Date('2024-01-01T23:59:59Z').getTime(),
                })
                .map((ts) => new Date(ts)), // All within same day
            }),
            { minLength: 5, maxLength: 15, selector: (msg) => msg.id },
          ),
          async (messages) => {
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

            // Create messages
            for (const msg of messages) {
              await messageRepository.save({
                id: msg.id,
                conversationId: conversationId,
                direction: 'INBOUND',
                content: msg.content,
                messageType: 'TEXT',
                sentAt: msg.sentAt,
                isFromAdmin: false,
                createdAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

            // Assert: Chronological order maintained
            for (let i = 0; i < result.length - 1; i++) {
              const currentTime = new Date(result[i].sentAt).getTime();
              const nextTime = new Date(result[i + 1].sentAt).getTime();
              expect(currentTime).toBeLessThanOrEqual(nextTime);
            }

            // Assert: All messages returned
            expect(result).toHaveLength(messages.length);

            // Assert: All message IDs present
            const resultIds = result.map((m) => m.id);
            messages.forEach((msg) => {
              expect(resultIds).toContain(msg.id);
            });
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Task 3.7 Additional: Property - Message completeness', () => {
    /**
     * Property: For any set of messages, all messages MUST be returned
     *           with complete data (no data loss)
     */
    it('should return all messages with complete data for any random message set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 200 }),
              direction: fc.constantFrom('INBOUND', 'OUTBOUND'),
              messageType: fc.constantFrom('TEXT', 'BUTTON', 'LOCATION'),
              isFromAdmin: fc.boolean(),
              sentAt: fc
                .integer({
                  min: new Date('2024-01-01').getTime(),
                  max: new Date('2024-12-31').getTime(),
                })
                .map((ts) => new Date(ts)),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (messages) => {
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

            // Create messages
            for (const msg of messages) {
              await messageRepository.save({
                id: msg.id,
                conversationId: conversationId,
                direction: msg.direction,
                content: msg.content,
                messageType: msg.messageType,
                sentAt: msg.sentAt,
                isFromAdmin: msg.isFromAdmin,
                createdAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetConversationHistoryQuery(conversationId));

            // Assert: All messages returned
            expect(result).toHaveLength(messages.length);

            // Assert: All fields present and correct
            result.forEach((resultMsg) => {
              const originalMsg = messages.find((m) => m.id === resultMsg.id);
              expect(originalMsg).toBeDefined();

              expect(resultMsg.id).toBe(originalMsg!.id);
              expect(resultMsg.conversationId).toBe(conversationId);
              expect(resultMsg.content).toBe(originalMsg!.content);
              expect(resultMsg.direction).toBe(originalMsg!.direction);
              expect(resultMsg.messageType).toBe(originalMsg!.messageType);
              expect(resultMsg.isFromAdmin).toBe(originalMsg!.isFromAdmin);
              expect(new Date(resultMsg.sentAt).getTime()).toBe(originalMsg!.sentAt.getTime());
            });
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Task 3.7 Additional: Property - Empty conversation', () => {
    /**
     * Property: For a conversation with no messages,
     *           query MUST return empty array (not null or undefined)
     */
    it('should return empty array for conversation with no messages', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (conversationId) => {
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

          // Assert: Empty array (not null or undefined)
          expect(result).toBeDefined();
          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(0);
        }),
        { numRuns: 20 },
      );
    });
  });
});
