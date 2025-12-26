import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageWriteRepository } from '@conversation/infra/persistence/repositories/message-write.repository';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { Message } from '@conversation/domain/aggregates/message';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { MessageWriteMapper } from '@conversation/infra/persistence/mappers/message-write.mapper';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('MessageWriteRepository (Integration)', () => {
  let repository: MessageWriteRepository;
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;

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
        MessageWriteRepository,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
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

    repository = module.get<MessageWriteRepository>(MessageWriteRepository);
    uow = module.get<TypeOrmUnitOfWork>('IUnitOfWork');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('save', () => {
    it('should persist a message to the database', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.inbound(),
        'Hello, I want to book an appointment',
        MessageType.text(),
        false,
      );

      // Act
      await repository.save(message);

      // Assert
      const savedModel = await dataSource
        .getRepository(MessageModel)
        .findOne({ where: { id: message.getId().getValue() } });

      expect(savedModel).toBeDefined();
      expect(savedModel!.id).toBe(message.getId().getValue());
      expect(savedModel!.conversationId).toBe(message.getConversationId().getValue());
      expect(savedModel!.direction).toBe('INBOUND');
      expect(savedModel!.content).toBe('Hello, I want to book an appointment');
      expect(savedModel!.messageType).toBe('TEXT');
      expect(savedModel!.isFromAdmin).toBe(false);
      expect(savedModel!.sentAt).toBeInstanceOf(Date);
    });

    it('should persist message with OUTBOUND direction', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.outbound(),
        'Your appointment is confirmed',
        MessageType.text(),
        true,
      );

      // Act
      await repository.save(message);

      // Assert
      const savedModel = await dataSource
        .getRepository(MessageModel)
        .findOne({ where: { id: message.getId().getValue() } });

      expect(savedModel).toBeDefined();
      expect(savedModel!.direction).toBe('OUTBOUND');
      expect(savedModel!.isFromAdmin).toBe(true);
    });

    it('should persist message with BUTTON type', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.outbound(),
        'Select a service',
        MessageType.button(),
        false,
      );

      // Act
      await repository.save(message);

      // Assert
      const savedModel = await dataSource
        .getRepository(MessageModel)
        .findOne({ where: { id: message.getId().getValue() } });

      expect(savedModel).toBeDefined();
      expect(savedModel!.messageType).toBe('BUTTON');
    });

    it('should persist message with LOCATION type', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.outbound(),
        'Here is our location',
        MessageType.location(),
        false,
      );

      // Act
      await repository.save(message);

      // Assert
      const savedModel = await dataSource
        .getRepository(MessageModel)
        .findOne({ where: { id: message.getId().getValue() } });

      expect(savedModel).toBeDefined();
      expect(savedModel!.messageType).toBe('LOCATION');
    });

    it('should persist multiple messages for same conversation', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message1 = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.inbound(),
        'First message',
        MessageType.text(),
        false,
      );
      const message2 = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.outbound(),
        'Second message',
        MessageType.text(),
        true,
      );

      // Act
      await repository.save(message1);
      await repository.save(message2);

      // Assert
      const savedMessages = await dataSource
        .getRepository(MessageModel)
        .find({ where: { conversationId: conversationId.getValue() } });

      expect(savedMessages).toHaveLength(2);
      expect(savedMessages[0].content).toBe('First message');
      expect(savedMessages[1].content).toBe('Second message');
    });

    it('should use transaction when saving message', async () => {
      // Arrange
      const conversationId = UUID.generate();
      await createConversation(conversationId);

      const message = Message.create(
        UUID.generate(),
        conversationId,
        MessageDirection.inbound(),
        'Test message',
        MessageType.text(),
        false,
      );

      // Act & Assert
      await uow.transaction(async () => {
        await repository.save(message);

        // Verify message is saved within transaction
        const savedModel = await dataSource
          .getRepository(MessageModel)
          .findOne({ where: { id: message.getId().getValue() } });

        expect(savedModel).toBeDefined();
      });
    });
  });
});
