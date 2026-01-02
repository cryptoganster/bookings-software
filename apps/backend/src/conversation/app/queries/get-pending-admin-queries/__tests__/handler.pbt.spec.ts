import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetPendingAdminQueriesHandler } from '../handler';
import { GetPendingAdminQueriesQuery } from '../query';
import { ConversationReadRepository } from '@conversation/infra/persistence/repositories/conversation-read.repository';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
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

describe('GetPendingAdminQueriesHandler - Property-Based Tests', () => {
  let module: TestingModule;
  let handler: GetPendingAdminQueriesHandler;
  let conversationRepository: Repository<ConversationModel>;
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
          entities: [ConversationModel, CustomerModel],
          synchronize: false,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([ConversationModel, CustomerModel]),
      ],
      providers: [
        GetPendingAdminQueriesHandler,
        {
          provide: 'IConversationReadRepository',
          useClass: ConversationReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPendingAdminQueriesHandler>(GetPendingAdminQueriesHandler);
    conversationRepository = module.get<Repository<ConversationModel>>(
      getRepositoryToken(ConversationModel),
    );
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
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
    await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
    await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId]);
    await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    await module.close();
  });

  beforeEach(async () => {
    // Clean up before each test - delete all conversations and customers for this business
    await conversationRepository
      .createQueryBuilder()
      .delete()
      .where('businessId = :businessId', { businessId })
      .execute();
    await customerRepository
      .createQueryBuilder()
      .delete()
      .where('business_id = :businessId', { businessId })
      .execute();
  });

  describe('Task 3.6: Property 1 - Pending queries filter property', () => {
    /**
     * Requirements: FR-3.1, US-1.1
     * Property: Property 1 (PBT-3.3)
     *
     * Property: For any set of conversations with various statuses,
     *           GetPendingAdminQueriesQuery MUST return only conversations
     *           with status='AWAITING_ADMIN'
     *
     * Test: Generate random conversations with various statuses using fast-check
     * Test: Execute GetPendingAdminQueriesQuery
     * Test: Assert all results have status='AWAITING_ADMIN'
     * Test: Run 100+ iterations with random data
     */
    it('should always return only AWAITING_ADMIN conversations for any random set of conversations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 20 }), // Number of conversations to create
          fc.array(fc.constantFrom('ACTIVE', 'AWAITING_ADMIN', 'RESOLVED'), {
            minLength: 5,
            maxLength: 20,
          }), // Statuses
          fc.array(
            fc.constantFrom(
              'GREETING',
              'AWAITING_ADMIN_RESPONSE',
              'COMPLETED',
              'SELECTING_SERVICE',
            ),
            { minLength: 5, maxLength: 20 },
          ), // States
          fc.array(
            fc.integer({
              min: new Date('2024-01-01').getTime(),
              max: new Date('2024-12-31').getTime(),
            }),
            { minLength: 5, maxLength: 20 },
          ), // Timestamps
          async (count, statuses, states, timestamps) => {
            // Arrange: Create conversations with unique IDs
            const conversations = [];
            for (let i = 0; i < Math.min(count, statuses.length); i++) {
              conversations.push({
                id: uuidv4(), // Generate unique ID
                status: statuses[i],
                state: states[i % states.length],
                lastMessageAt: new Date(timestamps[i % timestamps.length]),
              });
            }

            // Create customers for all conversations
            const customerIds = new Map<string, string>();
            for (const conv of conversations) {
              const customerId = uuidv4();
              customerIds.set(conv.id, customerId);

              await customerRepository.save({
                id: customerId,
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${conv.id.substring(0, 8)}`,
                user_id: null,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }

            // Create conversations with random statuses
            for (const conv of conversations) {
              await conversationRepository.save({
                id: conv.id,
                businessId,
                customerId: customerIds.get(conv.id)!,
                customerPhone: `+1809555${Math.floor(Math.random() * 10000)
                  .toString()
                  .padStart(4, '0')}`,
                status: conv.status,
                state: conv.state,
                version: 0,
                lastMessageAt: conv.lastMessageAt,
                createdAt: conv.lastMessageAt,
                updatedAt: new Date(),
              });
            }

            // Act: Execute query
            const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

            // Assert: All results have status='AWAITING_ADMIN'
            expect(result.every((c) => c.status === 'AWAITING_ADMIN')).toBe(true);

            // Assert: Count matches expected
            const expectedCount = conversations.filter((c) => c.status === 'AWAITING_ADMIN').length;
            expect(result).toHaveLength(expectedCount);

            // Assert: All AWAITING_ADMIN conversations are present
            const awaitingAdminIds = conversations
              .filter((c) => c.status === 'AWAITING_ADMIN')
              .map((c) => c.id);
            const resultIds = result.map((c) => c.id);

            awaitingAdminIds.forEach((id) => {
              expect(resultIds).toContain(id);
            });

            // Assert: No ACTIVE or RESOLVED conversations are present
            const nonAwaitingIds = conversations
              .filter((c) => c.status !== 'AWAITING_ADMIN')
              .map((c) => c.id);

            nonAwaitingIds.forEach((id) => {
              expect(resultIds).not.toContain(id);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should return all conversations when all have status AWAITING_ADMIN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of conversations
          fc.array(
            fc.integer({
              min: new Date('2024-01-01').getTime(),
              max: new Date('2024-12-31').getTime(),
            }),
            { minLength: 1, maxLength: 10 },
          ), // Timestamps
          async (count, timestamps) => {
            // Arrange: Create conversations with unique IDs
            const conversations = [];
            for (let i = 0; i < count; i++) {
              conversations.push({
                id: uuidv4(), // Generate unique ID
                status: 'AWAITING_ADMIN',
                lastMessageAt: new Date(timestamps[i % timestamps.length]),
              });
            }

            // Create customers
            const customerIds = new Map<string, string>();
            for (const conv of conversations) {
              const customerId = uuidv4();
              customerIds.set(conv.id, customerId);

              await customerRepository.save({
                id: customerId,
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${conv.id.substring(0, 8)}`,
                user_id: null,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }

            // Create all AWAITING_ADMIN conversations
            for (const conv of conversations) {
              await conversationRepository.save({
                id: conv.id,
                businessId,
                customerId: customerIds.get(conv.id)!,
                customerPhone: `+1809555${Math.floor(Math.random() * 10000)
                  .toString()
                  .padStart(4, '0')}`,
                status: 'AWAITING_ADMIN',
                state: 'AWAITING_ADMIN_RESPONSE',
                version: 0,
                lastMessageAt: conv.lastMessageAt,
                createdAt: conv.lastMessageAt,
                updatedAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

            // Assert: All conversations returned
            expect(result).toHaveLength(conversations.length);
            expect(result.every((c) => c.status === 'AWAITING_ADMIN')).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should return empty array when no conversations have status AWAITING_ADMIN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of conversations
          fc.array(fc.constantFrom('ACTIVE', 'RESOLVED'), { minLength: 1, maxLength: 10 }), // Statuses (no AWAITING_ADMIN)
          fc.array(
            fc.integer({
              min: new Date('2024-01-01').getTime(),
              max: new Date('2024-12-31').getTime(),
            }),
            { minLength: 1, maxLength: 10 },
          ), // Timestamps
          async (count, statuses, timestamps) => {
            // Arrange: Create conversations with unique IDs
            const conversations = [];
            for (let i = 0; i < count; i++) {
              conversations.push({
                id: uuidv4(), // Generate unique ID
                status: statuses[i % statuses.length],
                lastMessageAt: new Date(timestamps[i % timestamps.length]),
              });
            }

            // Create customers
            const customerIds = new Map<string, string>();
            for (const conv of conversations) {
              const customerId = uuidv4();
              customerIds.set(conv.id, customerId);

              await customerRepository.save({
                id: customerId,
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${conv.id.substring(0, 8)}`,
                user_id: null,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }

            // Create conversations without AWAITING_ADMIN status
            for (const conv of conversations) {
              await conversationRepository.save({
                id: conv.id,
                businessId,
                customerId: customerIds.get(conv.id)!,
                customerPhone: `+1809555${Math.floor(Math.random() * 10000)
                  .toString()
                  .padStart(4, '0')}`,
                status: conv.status,
                state: conv.status === 'ACTIVE' ? 'GREETING' : 'COMPLETED',
                version: 0,
                lastMessageAt: conv.lastMessageAt,
                createdAt: conv.lastMessageAt,
                updatedAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

            // Assert: Empty array
            expect(result).toHaveLength(0);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Task 3.6 Additional: Property - Ordering consistency', () => {
    /**
     * Property: For any set of AWAITING_ADMIN conversations,
     *           results MUST be ordered by lastMessageAt DESC
     */
    it('should always order results by lastMessageAt DESC for any random timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 3, max: 15 }), // Number of conversations
          fc.array(
            fc.integer({
              min: new Date('2024-01-01').getTime(),
              max: new Date('2024-12-31').getTime(),
            }),
            { minLength: 3, maxLength: 15 },
          ), // Timestamps
          async (count, timestamps) => {
            // Arrange: Create conversations with unique IDs
            const conversations = [];
            for (let i = 0; i < count; i++) {
              conversations.push({
                id: uuidv4(), // Generate unique ID
                lastMessageAt: new Date(timestamps[i % timestamps.length]),
              });
            }

            // Create customers
            const customerIds = new Map<string, string>();
            for (const conv of conversations) {
              const customerId = uuidv4();
              customerIds.set(conv.id, customerId);

              await customerRepository.save({
                id: customerId,
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${conv.id.substring(0, 8)}`,
                user_id: null,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }

            // Create AWAITING_ADMIN conversations with random timestamps
            for (const conv of conversations) {
              await conversationRepository.save({
                id: conv.id,
                businessId,
                customerId: customerIds.get(conv.id)!,
                customerPhone: `+1809555${Math.floor(Math.random() * 10000)
                  .toString()
                  .padStart(4, '0')}`,
                status: 'AWAITING_ADMIN',
                state: 'AWAITING_ADMIN_RESPONSE',
                version: 0,
                lastMessageAt: conv.lastMessageAt,
                createdAt: conv.lastMessageAt,
                updatedAt: new Date(),
              });
            }

            // Act
            const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

            // Assert: Ordered by lastMessageAt DESC
            for (let i = 0; i < result.length - 1; i++) {
              const current = new Date(result[i].lastMessageAt).getTime();
              const next = new Date(result[i + 1].lastMessageAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
