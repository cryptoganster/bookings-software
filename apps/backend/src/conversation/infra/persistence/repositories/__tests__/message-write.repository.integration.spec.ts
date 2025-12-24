import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MessageWriteRepository } from '@conversation/infra/persistence/repositories/message-write.repository';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { Message } from '@conversation/domain/aggregates/message';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { MessageWriteMapper } from '@conversation/infra/persistence/mappers/message-write.mapper';

describe('MessageWriteRepository (Integration)', () => {
  let repository: MessageWriteRepository;
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;

  // Helper function to create a conversation
  const createConversation = async (conversationId: UUID): Promise<void> => {
    const conversationRepo = dataSource.getRepository(ConversationModel);
    await conversationRepo.save({
      id: conversationId.getValue(),
      businessId: UUID.generate().getValue(),
      customerId: UUID.generate().getValue(),
      customerPhone: '+18095551234',
      status: 'ACTIVE',
      state: 'AWAITING_SERVICE_SELECTION',
      version: 0,
    });
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [MessageModel, ConversationModel],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([MessageModel, ConversationModel]),
      ],
      providers: [
        MessageWriteRepository,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    repository = module.get<MessageWriteRepository>(MessageWriteRepository);
    dataSource = module.get<DataSource>(DataSource);
    uow = module.get<TypeOrmUnitOfWork>('IUnitOfWork');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(MessageModel).clear();
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
