import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { SendAdminResponseHandler } from '../handler';
import { SendAdminResponseCommand } from '../command';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';

describe('SendAdminResponseHandler - Integration Tests', () => {
  let handler: SendAdminResponseHandler;
  let conversationFactory: jest.Mocked<IConversationFactory>;
  let conversationWriteRepo: jest.Mocked<IConversationWriteRepository>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    // Create mocks
    conversationFactory = {
      loadById: jest.fn(),
    } as any;

    conversationWriteRepo = {
      save: jest.fn(),
    } as any;

    commandBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAdminResponseHandler,
        {
          provide: 'IConversationFactory',
          useValue: conversationFactory,
        },
        {
          provide: 'IConversationWriteRepository',
          useValue: conversationWriteRepo,
        },
        {
          provide: CommandBus,
          useValue: commandBus,
        },
      ],
    }).compile();

    handler = module.get<SendAdminResponseHandler>(SendAdminResponseHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('4.5. Integration test: SendAdminResponseHandler successfully sends response', () => {
    it('should resolve conversation and send WhatsApp message', async () => {
      // Arrange: Create conversation with status='AWAITING_ADMIN'
      const conversationId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();
      const customerId = UUID.generate().getValue();
      const customerPhone = '+18095551234';

      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.fromString(businessId),
        UUID.fromString(customerId),
        customerPhone,
        ConversationState.initial(), // state
        'AWAITING_ADMIN', // status
        undefined, // selectedOfferingId
        undefined, // selectedDate
        undefined, // selectedTime
        undefined, // createdAppointmentId
        1, // version
      );

      conversationFactory.loadById.mockResolvedValue(conversation);
      conversationWriteRepo.save.mockResolvedValue();
      commandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(
        conversationId,
        'Thank you for your inquiry. We will get back to you soon.',
      );

      // Act: Execute command
      await handler.execute(command);

      // Assert: Conversation status is 'RESOLVED'
      expect(conversation.getStatus()).toBe('RESOLVED');

      // Assert: Conversation was saved
      expect(conversationWriteRepo.save).toHaveBeenCalledWith(conversation);
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(1);

      // Assert: SendWhatsAppMessageCommand was dispatched
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId,
          content: command.message,
          messageType: 'TEXT',
          recipientPhone: customerPhone,
          isFromAdmin: true,
        }),
      );
    });

    it('should increment conversation version', async () => {
      // Arrange
      const conversationId = UUID.generate().getValue();
      const conversation = Conversation.fromPersistence(
        UUID.fromString(conversationId),
        UUID.generate(),
        UUID.generate(),
        '+18095551234',
        ConversationState.initial(), // state
        'AWAITING_ADMIN', // status
        undefined, // selectedOfferingId
        undefined, // selectedDate
        undefined, // selectedTime
        undefined, // createdAppointmentId
        5, // Initial version
      );

      conversationFactory.loadById.mockResolvedValue(conversation);
      conversationWriteRepo.save.mockResolvedValue();
      commandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act
      await handler.execute(command);

      // Assert: Version incremented
      expect(conversation.getVersion().getValue()).toBe(6);
    });
  });

  describe('4.6. Integration test: SendAdminResponseHandler throws NotFoundException', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      // Arrange: Factory returns null (conversation not found)
      const conversationId = UUID.generate().getValue();
      conversationFactory.loadById.mockResolvedValue(null);

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act & Assert: Should throw NotFoundException
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        `Conversation with id ${conversationId} not found`,
      );

      // Assert: Save and SendWhatsAppMessage were NOT called
      expect(conversationWriteRepo.save).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });
});
