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

describe('GetPendingAdminQueriesHandler - Integration Tests', () => {
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
    // Clean up before each test
    await conversationRepository.delete({ businessId });
    await customerRepository.delete({ business_id: businessId });
  });

  describe('Task 3.3: Returns only AWAITING_ADMIN conversations', () => {
    /**
     * Requirements: FR-3.1, US-1.1
     * Property: Property 1 (PBT-3.3)
     *
     * Test: Create conversations with statuses: 'ACTIVE', 'AWAITING_ADMIN', 'RESOLVED'
     * Test: Execute GetPendingAdminQueriesQuery with businessId
     * Test: Assert result only contains conversations with status='AWAITING_ADMIN'
     * Test: Assert conversations with 'ACTIVE' and 'RESOLVED' are excluded
     */
    it('should return only conversations with status AWAITING_ADMIN', async () => {
      // Arrange: Create customers first
      const customer1Id = uuidv4();
      const customer2Id = uuidv4();
      const customer3Id = uuidv4();
      const customer4Id = uuidv4();

      await customerRepository.save([
        {
          id: customer1Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 1',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer2Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 2',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer3Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 3',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer4Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 4',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Create conversations with different statuses
      const conv1Id = uuidv4();
      const conv2Id = uuidv4();
      const conv3Id = uuidv4();
      const conv4Id = uuidv4();

      await conversationRepository.save([
        {
          id: conv1Id,
          businessId,
          customerId: customer1Id,
          customerPhone: '+18095551001',
          status: 'ACTIVE',
          state: 'GREETING',
          version: 0,
          lastMessageAt: new Date(Date.now() - 4000),
          createdAt: new Date(Date.now() - 4000),
          updatedAt: new Date(),
        },
        {
          id: conv2Id,
          businessId,
          customerId: customer2Id,
          customerPhone: '+18095551002',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date(Date.now() - 3000),
          createdAt: new Date(Date.now() - 3000),
          updatedAt: new Date(),
        },
        {
          id: conv3Id,
          businessId,
          customerId: customer3Id,
          customerPhone: '+18095551003',
          status: 'RESOLVED',
          state: 'COMPLETED',
          version: 0,
          lastMessageAt: new Date(Date.now() - 2000),
          createdAt: new Date(Date.now() - 2000),
          updatedAt: new Date(),
        },
        {
          id: conv4Id,
          businessId,
          customerId: customer4Id,
          customerPhone: '+18095551004',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date(Date.now() - 1000),
          createdAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        },
      ]);

      // Act: Execute query
      const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

      // Assert: Only AWAITING_ADMIN conversations returned
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.status === 'AWAITING_ADMIN')).toBe(true);

      // Verify specific conversations are included/excluded
      const resultIds = result.map((c) => c.id);
      expect(resultIds).toContain(conv2Id);
      expect(resultIds).toContain(conv4Id);
      expect(resultIds).not.toContain(conv1Id); // ACTIVE excluded
      expect(resultIds).not.toContain(conv3Id); // RESOLVED excluded
    });

    it('should return empty array when no AWAITING_ADMIN conversations exist', async () => {
      // Arrange: Create customers
      const customer1Id = uuidv4();
      const customer2Id = uuidv4();

      await customerRepository.save([
        {
          id: customer1Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 1',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer2Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 2',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Create conversations with only ACTIVE and RESOLVED statuses
      await conversationRepository.save([
        {
          id: uuidv4(),
          businessId,
          customerId: customer1Id,
          customerPhone: '+18095551001',
          status: 'ACTIVE',
          state: 'GREETING',
          version: 0,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          businessId,
          customerId: customer2Id,
          customerPhone: '+18095551002',
          status: 'RESOLVED',
          state: 'COMPLETED',
          version: 0,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Task 3.4: Filters by businessId', () => {
    /**
     * Requirements: FR-3.1, US-1.7
     * Property: Property 3 (PBT-5.1) - Multi-tenant isolation
     *
     * Test: Create conversations for businessId A and businessId B
     * Test: Execute GetPendingAdminQueriesQuery with businessId A
     * Test: Assert result only contains conversations for business A
     * Test: Assert conversations for business B are excluded
     */
    it('should filter conversations by businessId', async () => {
      // Arrange: Create second business
      const userId2 = uuidv4();
      await createTestUserInDb(dataSource, userId2);

      const businessIdB = uuidv4();
      await createTestBusinessInDb(dataSource, businessIdB, userId2);

      // Create customers for both businesses
      const customerA1Id = uuidv4();
      const customerA2Id = uuidv4();
      const customerB1Id = uuidv4();

      await customerRepository.save([
        {
          id: customerA1Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer A1',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customerA2Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer A2',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customerB1Id,
          business_id: businessIdB,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer B1',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Create conversations for both businesses
      const convA1Id = uuidv4();
      const convA2Id = uuidv4();
      const convB1Id = uuidv4();

      await conversationRepository.save([
        {
          id: convA1Id,
          businessId,
          customerId: customerA1Id,
          customerPhone: '+18095551001',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date(Date.now() - 2000),
          createdAt: new Date(Date.now() - 2000),
          updatedAt: new Date(),
        },
        {
          id: convA2Id,
          businessId,
          customerId: customerA2Id,
          customerPhone: '+18095551002',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date(Date.now() - 1000),
          createdAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        },
        {
          id: convB1Id,
          businessId: businessIdB,
          customerId: customerB1Id,
          customerPhone: '+18095551003',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act: Execute query for business A
      const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

      // Assert: Only business A conversations returned
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.businessId === businessId)).toBe(true);

      const resultIds = result.map((c) => c.id);
      expect(resultIds).toContain(convA1Id);
      expect(resultIds).toContain(convA2Id);
      expect(resultIds).not.toContain(convB1Id); // Business B excluded

      // Clean up second business
      await conversationRepository.delete({ businessId: businessIdB });
      await customerRepository.delete({ business_id: businessIdB });
      await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessIdB]);
      await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId2]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId2]);
    });

    it('should return empty array when business has no pending conversations', async () => {
      // Arrange: Create empty business
      const emptyBusinessId = uuidv4();

      // Act
      const result = await handler.execute(new GetPendingAdminQueriesQuery(emptyBusinessId));

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Task 3.3 Additional: Ordering by lastMessageAt DESC', () => {
    /**
     * Requirements: FR-3.1
     * Property: Most recent conversations first
     *
     * Test: Create conversations with different lastMessageAt timestamps
     * Test: Execute query
     * Test: Assert conversations ordered by lastMessageAt DESC (most recent first)
     */
    it('should order conversations by lastMessageAt DESC (most recent first)', async () => {
      // Arrange: Create customers
      const customer1Id = uuidv4();
      const customer2Id = uuidv4();
      const customer3Id = uuidv4();

      await customerRepository.save([
        {
          id: customer1Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 1',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer2Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 2',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer3Id,
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: 'Customer 3',
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Create conversations with different timestamps
      const conv1Id = uuidv4();
      const conv2Id = uuidv4();
      const conv3Id = uuidv4();

      await conversationRepository.save([
        {
          id: conv1Id,
          businessId,
          customerId: customer1Id,
          customerPhone: '+18095551001',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date('2024-01-01T10:00:00Z'), // Oldest
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date(),
        },
        {
          id: conv2Id,
          businessId,
          customerId: customer2Id,
          customerPhone: '+18095551002',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date('2024-01-03T10:00:00Z'), // Most recent
          createdAt: new Date('2024-01-03T10:00:00Z'),
          updatedAt: new Date(),
        },
        {
          id: conv3Id,
          businessId,
          customerId: customer3Id,
          customerPhone: '+18095551003',
          status: 'AWAITING_ADMIN',
          state: 'AWAITING_ADMIN_RESPONSE',
          version: 0,
          lastMessageAt: new Date('2024-01-02T10:00:00Z'), // Middle
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const result = await handler.execute(new GetPendingAdminQueriesQuery(businessId));

      // Assert: Ordered by lastMessageAt DESC
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(conv2Id); // 2024-01-03 (most recent)
      expect(result[1].id).toBe(conv3Id); // 2024-01-02
      expect(result[2].id).toBe(conv1Id); // 2024-01-01 (oldest)

      // Verify descending order
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].lastMessageAt).getTime();
        const next = new Date(result[i + 1].lastMessageAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });
});
