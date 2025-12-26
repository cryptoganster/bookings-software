import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { SendAdminResponseHandler } from '@conversation/app/commands/send-admin-response/handler';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { SendWhatsAppMessageCommand } from '@conversation/app/commands/send-whatsapp-message/command';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

describe('SendAdminResponseHandler', () => {
  let handler: SendAdminResponseHandler;
  let mockFactory: jest.Mocked<IConversationFactory>;
  let mockWriteRepo: jest.Mocked<IConversationWriteRepository>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  const conversationId = '550e8400-e29b-41d4-a716-446655440001';
  const businessId = '550e8400-e29b-41d4-a716-446655440002';
  const customerId = '550e8400-e29b-41d4-a716-446655440003';
  const customerPhone = '+18095551234';
  const adminMessage = 'Hello, how can I help you?';

  beforeEach(async () => {
    // Create mocks
    mockFactory = {
      loadById: jest.fn(),
      loadByCustomerIdAndBusinessId: jest.fn(),
    };

    mockWriteRepo = {
      save: jest.fn(),
    };

    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAdminResponseHandler,
        {
          provide: 'IConversationFactory',
          useValue: mockFactory,
        },
        {
          provide: 'IConversationWriteRepository',
          useValue: mockWriteRepo,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    handler = module.get<SendAdminResponseHandler>(SendAdminResponseHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should load conversation using factory', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();
      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(UUID.fromString(conversationId));
      expect(mockFactory.loadById).toHaveBeenCalledTimes(1);
    });

    it('should call conversation.resolveAdminQuery()', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      const resolveAdminQuerySpy = jest.spyOn(conversation, 'resolveAdminQuery');

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();
      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(resolveAdminQuerySpy).toHaveBeenCalledTimes(1);
      expect(conversation.getStatus()).toBe('RESOLVED');
    });

    it('should save conversation using write repository', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();
      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockWriteRepo.save).toHaveBeenCalledWith(conversation);
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should dispatch SendWhatsAppMessageCommand with correct parameters', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();
      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId,
          content: adminMessage,
          messageType: 'TEXT',
          recipientPhone: customerPhone,
          isFromAdmin: true,
        }),
      );
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should get customer phone from aggregate', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      const getCustomerPhoneSpy = jest.spyOn(conversation, 'getCustomerPhone');

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();
      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(getCustomerPhoneSpy).toHaveBeenCalledTimes(1);
      const whatsappCommand = mockCommandBus.execute.mock.calls[0][0] as SendWhatsAppMessageCommand;
      expect(whatsappCommand.recipientPhone).toBe(customerPhone);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      // Arrange
      mockFactory.loadById.mockResolvedValue(null);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        `Conversation with id ${conversationId} not found`,
      );

      expect(mockFactory.loadById).toHaveBeenCalledWith(UUID.fromString(conversationId));
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should execute all steps in correct order', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      const callOrder: string[] = [];

      mockFactory.loadById.mockImplementation(async () => {
        callOrder.push('loadById');
        return conversation;
      });

      jest.spyOn(conversation, 'resolveAdminQuery').mockImplementation(() => {
        callOrder.push('resolveAdminQuery');
      });

      mockWriteRepo.save.mockImplementation(async () => {
        callOrder.push('save');
      });

      mockCommandBus.execute.mockImplementation(async () => {
        callOrder.push('execute');
      });

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(callOrder).toEqual(['loadById', 'resolveAdminQuery', 'save', 'execute']);
    });

    it('should not save or send message if conversation not found', async () => {
      // Arrange
      mockFactory.loadById.mockResolvedValue(null);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);

      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should propagate error if resolveAdminQuery throws', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'RESOLVED', // Already resolved
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Conversation is already resolved');

      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should propagate error if save fails', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockRejectedValue(new Error('Database error'));

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database error');

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry on ConcurrencyException', async () => {
      // Arrange
      // Create fresh conversation instances for each retry
      const createConversation = () =>
        Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.fromString(businessId),
          UUID.fromString(customerId),
          customerPhone,
          ConversationState.initial(),
          'AWAITING_ADMIN',
          undefined,
          undefined,
          undefined,
          undefined,
          1,
        );

      mockFactory.loadById
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation());

      // First attempt fails with ConcurrencyException
      mockWriteRepo.save
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockResolvedValueOnce(undefined); // Second attempt succeeds

      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(2);
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1); // Only on success
    });

    it('should implement exponential backoff', async () => {
      // Arrange
      jest.useFakeTimers();

      // Create fresh conversation instances for each retry
      const createConversation = () =>
        Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.fromString(businessId),
          UUID.fromString(customerId),
          customerPhone,
          ConversationState.initial(),
          'AWAITING_ADMIN',
          undefined,
          undefined,
          undefined,
          undefined,
          1,
        );

      mockFactory.loadById
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation());

      // First attempt fails, second succeeds
      mockWriteRepo.save
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockResolvedValueOnce(undefined);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      const executePromise = handler.execute(command);

      // Fast-forward through backoff (100ms * 2^1 = 200ms)
      await jest.advanceTimersByTimeAsync(200);

      await executePromise;

      // Assert
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should reload aggregate on retry', async () => {
      // Arrange
      const conversation1 = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      const conversation2 = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        2, // Different version
      );

      // Return different conversation instances on each load
      mockFactory.loadById
        .mockResolvedValueOnce(conversation1)
        .mockResolvedValueOnce(conversation2);

      // First save fails, second succeeds
      mockWriteRepo.save
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockResolvedValueOnce(undefined);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledTimes(2);
      expect(mockWriteRepo.save).toHaveBeenNthCalledWith(1, conversation1);
      expect(mockWriteRepo.save).toHaveBeenNthCalledWith(2, conversation2);
    });

    it('should throw error after max retries', async () => {
      // Arrange
      // Create fresh conversation instances for each retry
      const createConversation = () =>
        Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.fromString(businessId),
          UUID.fromString(customerId),
          customerPhone,
          ConversationState.initial(),
          'AWAITING_ADMIN',
          undefined,
          undefined,
          undefined,
          undefined,
          1,
        );

      mockFactory.loadById
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation());

      // All attempts fail
      mockWriteRepo.save.mockRejectedValue(new ConcurrencyException('Version mismatch'));

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to send admin response after 3 attempts',
      );

      expect(mockFactory.loadById).toHaveBeenCalledTimes(3); // 3 attempts
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(3);
      expect(mockCommandBus.execute).not.toHaveBeenCalled(); // Never succeeded
    });

    it('should succeed on retry', async () => {
      // Arrange
      // Create fresh conversation instances for each retry
      const createConversation = () =>
        Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.fromString(businessId),
          UUID.fromString(customerId),
          customerPhone,
          ConversationState.initial(),
          'AWAITING_ADMIN',
          undefined,
          undefined,
          undefined,
          undefined,
          1,
        );

      mockFactory.loadById
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation())
        .mockResolvedValueOnce(createConversation());

      // Fail twice, succeed on third attempt
      mockWriteRepo.save
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockResolvedValueOnce(undefined);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledTimes(3);
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(3);
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1); // Only on final success
    });

    it('should not retry on non-concurrency errors', async () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(conversation);

      // Fail with non-concurrency error
      const databaseError = new Error('Database connection failed');
      mockWriteRepo.save.mockRejectedValue(databaseError);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database connection failed');

      // Should not retry
      expect(mockFactory.loadById).toHaveBeenCalledTimes(1);
      expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should not retry on NotFoundException', async () => {
      // Arrange
      mockFactory.loadById.mockResolvedValue(null);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);

      // Should not retry
      expect(mockFactory.loadById).toHaveBeenCalledTimes(1);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });
  });
});
