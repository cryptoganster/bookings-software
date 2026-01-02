import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { SendAdminResponseHandler } from '@conversation/app/commands/send-admin-response/handler';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';
import { ConversationAlreadyResolvedException } from '@conversation/domain/exceptions/conversation-already-resolved.exception';
import { InvalidConversationStatusException } from '@conversation/domain/exceptions/invalid-conversation-status.exception';

describe('SendAdminResponseHandler (Integration)', () => {
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
      execute: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
    } as unknown as jest.Mocked<CommandBus>;

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

  describe('execute - integration scenarios', () => {
    it('should complete full workflow: load -> resolve -> save -> send', async () => {
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

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert - Verify complete workflow
      expect(mockFactory.loadById).toHaveBeenCalledWith(UUID.fromString(conversationId));
      expect(conversation.getStatus()).toBe('RESOLVED');
      expect(mockWriteRepo.save).toHaveBeenCalledWith(conversation);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId,
          content: adminMessage,
          recipientPhone: customerPhone,
          isFromAdmin: true,
        }),
      );
    });

    it('should handle conversation with different initial statuses', async () => {
      // Test with AWAITING_ADMIN status (valid for resolving)
      const awaitingAdminConversation = Conversation.fromPersistence(
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

      mockFactory.loadById.mockResolvedValue(awaitingAdminConversation);
      mockWriteRepo.save.mockResolvedValue();

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      await handler.execute(command);

      expect(awaitingAdminConversation.getStatus()).toBe('RESOLVED');
      expect(mockWriteRepo.save).toHaveBeenCalled();
    });

    it('should throw InvalidConversationStatusException when status is ACTIVE', async () => {
      // Test with ACTIVE status (invalid for resolving)
      const activeConversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(),
        'ACTIVE',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      mockFactory.loadById.mockResolvedValue(activeConversation);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidConversationStatusException);

      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should preserve conversation data during resolution', async () => {
      // Arrange - Conversation with selected offering and date
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.selectingTime(),
        'AWAITING_ADMIN',
        'offering-123',
        new Date('2025-01-15'),
        undefined,
        undefined,
        2,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert - Verify conversation data preserved
      expect(conversation.getSelectedOfferingId()).toBe('offering-123');
      expect(conversation.getSelectedDate()).toEqual(new Date('2025-01-15'));
      expect(conversation.getState().getValue()).toBe('SELECTING_TIME');
      expect(conversation.getStatus()).toBe('RESOLVED');
    });

    it('should handle error when conversation not found', async () => {
      // Arrange
      mockFactory.loadById.mockResolvedValue(null);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);

      // Verify no side effects
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should handle error when conversation already resolved', async () => {
      // Arrange
      const resolvedConversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.completed(),
        'RESOLVED',
        undefined,
        undefined,
        undefined,
        undefined,
        3,
      );

      mockFactory.loadById.mockResolvedValue(resolvedConversation);

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(ConversationAlreadyResolvedException);

      // Verify no save or message sent
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should use customer phone from aggregate for WhatsApp message', async () => {
      // Arrange
      const differentPhone = '+18095559999';
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        differentPhone, // Different phone
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

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert - Verify correct phone used
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientPhone: differentPhone,
        }),
      );
    });

    it('should increment version when resolving admin query', async () => {
      // Arrange
      const initialVersion = 5;
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
        initialVersion,
      );

      mockFactory.loadById.mockResolvedValue(conversation);
      mockWriteRepo.save.mockResolvedValue();

      const command = new SendAdminResponseCommand(conversationId, adminMessage);

      // Act
      await handler.execute(command);

      // Assert - Verify version incremented
      expect(conversation.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });
});
