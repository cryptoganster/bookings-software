import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageReadRepository } from '@conversation/infra/persistence/repositories/message-read.repository';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { Message } from '@conversation/domain/aggregates/message';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('MessageReadRepository (Integration)', () => {
  let repository: MessageReadRepository;
  let dataSource: DataSource;

  // Helper function to create a conversation with all dependencies
  const createConversation = async (conversationId: UUID): Promise<void> => {
    const businessId = UUID.generate().getValue();
    const customerId = UUID.generate().getValue();
    const ownerId = generateTestId();

    // Create user first (foreign key requirement for business)
    await dataSource.query(
      `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        ownerId,
        `test-${ownerId}@example.com`,
        'hashed_password',
        'Test Owner',
        ['BUSINESS_OWNER'],
        true,
        true,
      ],
    );

    // Create business (foreign key requirement)
    const business = new BusinessModel();
    business.id = businessId;
    business.ownerId = ownerId;
    business.name = 'Test Business';
    business.whatsappPhone = `+1${businessId.substring(0, 10)}`;
    business.addressStreet = '123 Test St';
    business.addressCity = 'Test City';
    business.addressState = 'Test State';
    business.addressCountry = 'Test Country';
    business.addressPostalCode = '12345';
    business.timezone = 'America/New_York';
    business.isActive = true;
    await dataSource.getRepository(BusinessModel).save(business);

    // Create customer (foreign key requirement)
    const customer = new CustomerModel();
    customer.id = customerId;
    customer.business_id = businessId;
    customer.whatsapp_phone = `+1${customerId.substring(0, 10)}`;
    customer.name = 'Test Customer';
    await dataSource.getRepository(CustomerModel).save(customer);

    // Create conversation
    const conversationRepo = dataSource.getRepository(ConversationModel);
    await conversationRepo.save({
      id: conversationId.getValue(),
      businessId: businessId,
      customerId: customerId,
      customerPhone: `+1${customerId.substring(0, 10)}`,
      status: 'ACTIVE',
      state: 'AWAITING_SERVICE_SELECTION',
      version: 0,
    });
  };

  beforeAll(async () => {
    // Create shared DataSource with ALL entities
    dataSource = await createIntegrationTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageReadRepository,
        {
          provide: getRepositoryToken(MessageModel),
          useFactory: (dataSource: DataSource) => dataSource.getRepository(MessageModel),
          inject: [DataSource],
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<MessageReadRepository>(MessageReadRepository);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('findByConversationId', () => {
    it('should return empty array when conversation has no messages', async () => {
      // Arrange
      const conversationId = UUID.generate().getValue();

      // Act
      const result = await repository.findByConversationId(conversationId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return messages for a conversation', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message1 = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.inbound(),
        'Hello',
        MessageType.text(),
        false,
      );
      const message2 = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.outbound(),
        'Hi, how can I help?',
        MessageType.text(),
        true,
      );

      // Save messages directly to database
      const messageRepo = dataSource.getRepository(MessageModel);
      await messageRepo.save({
        id: message1.getId().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'Hello',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:00:00Z'),
        isFromAdmin: false,
      });
      await messageRepo.save({
        id: message2.getId().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'OUTBOUND',
        content: 'Hi, how can I help?',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:01:00Z'),
        isFromAdmin: true,
      });

      // Act
      const result = await repository.findByConversationId(conversationId.getValue());

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
      expect(result[0].direction).toBe('INBOUND');
      expect(result[0].isFromAdmin).toBe(false);
      expect(result[1].content).toBe('Hi, how can I help?');
      expect(result[1].direction).toBe('OUTBOUND');
      expect(result[1].isFromAdmin).toBe(true);
    });

    it('should return messages ordered by sentAt ASC (chronological)', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const messageRepo = dataSource.getRepository(MessageModel);

      // Insert messages in random order
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'Third message',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:02:00Z'),
        isFromAdmin: false,
      });
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'First message',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:00:00Z'),
        isFromAdmin: false,
      });
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'OUTBOUND',
        content: 'Second message',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:01:00Z'),
        isFromAdmin: true,
      });

      // Act
      const result = await repository.findByConversationId(conversationId.getValue());

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('First message');
      expect(result[1].content).toBe('Second message');
      expect(result[2].content).toBe('Third message');

      // Verify chronological order
      expect(new Date(result[0].sentAt).getTime()).toBeLessThan(
        new Date(result[1].sentAt).getTime(),
      );
      expect(new Date(result[1].sentAt).getTime()).toBeLessThan(
        new Date(result[2].sentAt).getTime(),
      );
    });

    it('should return messages with all properties', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const messageId = UUID.generate();
      const messageRepo = dataSource.getRepository(MessageModel);

      await messageRepo.save({
        id: messageId.getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'Test message',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:00:00Z'),
        isFromAdmin: false,
      });

      // Act
      const result = await repository.findByConversationId(conversationId.getValue());

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: messageId.getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'Test message',
        messageType: 'TEXT',
        isFromAdmin: false,
      });
      expect(result[0].sentAt).toBe('2024-12-23T10:00:00.000Z');
    });

    it('should return messages with different types', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const messageRepo = dataSource.getRepository(MessageModel);

      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'INBOUND',
        content: 'Text message',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:00:00Z'),
        isFromAdmin: false,
      });
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'OUTBOUND',
        content: 'Button message',
        messageType: 'BUTTON',
        sentAt: new Date('2024-12-23T10:01:00Z'),
        isFromAdmin: true,
      });
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId.getValue(),
        direction: 'OUTBOUND',
        content: 'Location message',
        messageType: 'LOCATION',
        sentAt: new Date('2024-12-23T10:02:00Z'),
        isFromAdmin: false,
      });

      // Act
      const result = await repository.findByConversationId(conversationId.getValue());

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].messageType).toBe('TEXT');
      expect(result[1].messageType).toBe('BUTTON');
      expect(result[2].messageType).toBe('LOCATION');
    });

    it('should not return messages from other conversations', async () => {
      // Arrange
      const conversationId1 = UUID.generate();
      const conversationId2 = UUID.generate();
      await createConversation(conversationId1);
      await createConversation(conversationId2);

      const messageRepo = dataSource.getRepository(MessageModel);

      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId1.getValue(),
        direction: 'INBOUND',
        content: 'Message for conversation 1',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:00:00Z'),
        isFromAdmin: false,
      });
      await messageRepo.save({
        id: UUID.generate().getValue(),
        conversationId: conversationId2.getValue(),
        direction: 'INBOUND',
        content: 'Message for conversation 2',
        messageType: 'TEXT',
        sentAt: new Date('2024-12-23T10:01:00Z'),
        isFromAdmin: false,
      });

      // Act
      const result = await repository.findByConversationId(conversationId1.getValue());

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Message for conversation 1');
    });

    it('should handle large number of messages', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const messageRepo = dataSource.getRepository(MessageModel);

      // Insert 50 messages (avoid invalid dates with > 59 minutes)
      const messages = [];
      for (let i = 0; i < 50; i++) {
        const minutes = i % 60;
        const hours = 10 + Math.floor(i / 60);
        messages.push({
          id: UUID.generate().getValue(),
          conversationId: conversationId.getValue(),
          direction: i % 2 === 0 ? 'INBOUND' : 'OUTBOUND',
          content: `Message ${i}`,
          messageType: 'TEXT',
          sentAt: new Date(
            `2024-12-23T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`,
          ),
          isFromAdmin: i % 2 === 1,
        });
      }
      await messageRepo.save(messages);

      // Act
      const result = await repository.findByConversationId(conversationId.getValue());

      // Assert
      expect(result).toHaveLength(50);
      expect(result[0].content).toBe('Message 0');
      expect(result[49].content).toBe('Message 49');
    });
  });
});
