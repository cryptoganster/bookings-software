import { Test, TestingModule } from '@nestjs/testing';
import { GetConversationHistoryHandler } from '@conversation/app/queries/get-conversation-history/handler';
import { GetConversationHistoryQuery } from '@conversation/app/queries/get-conversation-history/query';
import { IMessageReadRepository } from '@conversation/domain/interfaces/repositories/message-read.repository.interface';
import { MessageReadModel } from '@conversation/domain/read-models/message';

describe('GetConversationHistoryHandler', () => {
  let handler: GetConversationHistoryHandler;
  let messageReadRepository: jest.Mocked<IMessageReadRepository>;

  beforeEach(async () => {
    // Create mock
    messageReadRepository = {
      findByConversationId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetConversationHistoryHandler,
        {
          provide: 'IMessageReadRepository',
          useValue: messageReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetConversationHistoryHandler>(GetConversationHistoryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - message retrieval', () => {
    it('should retrieve messages for a conversation', async () => {
      // Arrange
      const conversationId = 'conversation-123';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'Hello',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'Hi, how can I help you?',
          'TEXT',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockMessages);
      expect(messageReadRepository.findByConversationId).toHaveBeenCalledTimes(1);
      expect(messageReadRepository.findByConversationId).toHaveBeenCalledWith(conversationId);
    });

    it('should retrieve multiple messages', async () => {
      // Arrange
      const conversationId = 'conversation-456';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'Message 1',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'Message 2',
          'TEXT',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
        new MessageReadModel(
          'message-3',
          conversationId,
          'INBOUND',
          'Message 3',
          'TEXT',
          '2024-12-23T10:02:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-4',
          conversationId,
          'OUTBOUND',
          'Message 4',
          'TEXT',
          '2024-12-23T10:03:00.000Z',
          true,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('message-1');
      expect(result[1].id).toBe('message-2');
      expect(result[2].id).toBe('message-3');
      expect(result[3].id).toBe('message-4');
    });

    it('should retrieve messages with different types', async () => {
      // Arrange
      const conversationId = 'conversation-789';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'Text message',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'Button message',
          'BUTTON',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
        new MessageReadModel(
          'message-3',
          conversationId,
          'OUTBOUND',
          'Location message',
          'LOCATION',
          '2024-12-23T10:02:00.000Z',
          true,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].messageType).toBe('TEXT');
      expect(result[1].messageType).toBe('BUTTON');
      expect(result[2].messageType).toBe('LOCATION');
    });
  });

  describe('execute - message ordering', () => {
    it('should return messages ordered by sentAt ASC (chronological)', async () => {
      // Arrange
      const conversationId = 'conversation-123';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'First message',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'Second message',
          'TEXT',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
        new MessageReadModel(
          'message-3',
          conversationId,
          'INBOUND',
          'Third message',
          'TEXT',
          '2024-12-23T10:02:00.000Z',
          false,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(new Date(result[0].sentAt).getTime()).toBeLessThan(
        new Date(result[1].sentAt).getTime(),
      );
      expect(new Date(result[1].sentAt).getTime()).toBeLessThan(
        new Date(result[2].sentAt).getTime(),
      );
      expect(result[0].content).toBe('First message');
      expect(result[1].content).toBe('Second message');
      expect(result[2].content).toBe('Third message');
    });

    it('should maintain chronological order with multiple messages', async () => {
      // Arrange
      const conversationId = 'conversation-456';
      const query = new GetConversationHistoryQuery(conversationId);

      const dates = [
        '2024-12-23T09:00:00.000Z',
        '2024-12-23T09:30:00.000Z',
        '2024-12-23T10:00:00.000Z',
        '2024-12-23T10:30:00.000Z',
        '2024-12-23T11:00:00.000Z',
      ];

      const mockMessages: MessageReadModel[] = dates.map(
        (date, index) =>
          new MessageReadModel(
            `message-${index + 1}`,
            conversationId,
            index % 2 === 0 ? 'INBOUND' : 'OUTBOUND',
            `Message ${index + 1}`,
            'TEXT',
            date,
            index % 2 === 1,
          ),
      );

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(5);
      for (let i = 0; i < result.length - 1; i++) {
        expect(new Date(result[i].sentAt).getTime()).toBeLessThanOrEqual(
          new Date(result[i + 1].sentAt).getTime(),
        );
      }
    });
  });

  describe('execute - empty conversation', () => {
    it('should return empty array when conversation has no messages', async () => {
      // Arrange
      const conversationId = 'empty-conversation';
      const query = new GetConversationHistoryQuery(conversationId);

      messageReadRepository.findByConversationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(messageReadRepository.findByConversationId).toHaveBeenCalledTimes(1);
      expect(messageReadRepository.findByConversationId).toHaveBeenCalledWith(conversationId);
    });

    it('should not throw error for non-existent conversation', async () => {
      // Arrange
      const conversationId = 'non-existent-conversation';
      const query = new GetConversationHistoryQuery(conversationId);

      messageReadRepository.findByConversationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(messageReadRepository.findByConversationId).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('execute - message properties', () => {
    it('should return messages with all properties', async () => {
      // Arrange
      const conversationId = 'conversation-123';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'Customer message',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'Admin response',
          'TEXT',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result[0]).toMatchObject({
        id: 'message-1',
        conversationId,
        direction: 'INBOUND',
        content: 'Customer message',
        messageType: 'TEXT',
        isFromAdmin: false,
      });
      expect(result[0].sentAt).toBe('2024-12-23T10:00:00.000Z');

      expect(result[1]).toMatchObject({
        id: 'message-2',
        conversationId,
        direction: 'OUTBOUND',
        content: 'Admin response',
        messageType: 'TEXT',
        isFromAdmin: true,
      });
      expect(result[1].sentAt).toBe('2024-12-23T10:01:00.000Z');
    });

    it('should distinguish between admin and customer messages', async () => {
      // Arrange
      const conversationId = 'conversation-456';
      const query = new GetConversationHistoryQuery(conversationId);

      const mockMessages: MessageReadModel[] = [
        new MessageReadModel(
          'message-1',
          conversationId,
          'INBOUND',
          'From customer',
          'TEXT',
          '2024-12-23T10:00:00.000Z',
          false,
        ),
        new MessageReadModel(
          'message-2',
          conversationId,
          'OUTBOUND',
          'From admin',
          'TEXT',
          '2024-12-23T10:01:00.000Z',
          true,
        ),
        new MessageReadModel(
          'message-3',
          conversationId,
          'OUTBOUND',
          'From bot',
          'TEXT',
          '2024-12-23T10:02:00.000Z',
          false,
        ),
      ];

      messageReadRepository.findByConversationId.mockResolvedValue(mockMessages);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result[0].isFromAdmin).toBe(false);
      expect(result[1].isFromAdmin).toBe(true);
      expect(result[2].isFromAdmin).toBe(false);
    });
  });
});
