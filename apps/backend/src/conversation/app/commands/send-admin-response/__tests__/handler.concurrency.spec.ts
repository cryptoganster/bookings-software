import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { SendAdminResponseHandler } from '../handler';
import { SendAdminResponseCommand } from '../command';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

describe('SendAdminResponseHandler - Concurrency Tests', () => {
  let handler: SendAdminResponseHandler;
  let conversationFactory: jest.Mocked<IConversationFactory>;
  let conversationWriteRepo: jest.Mocked<IConversationWriteRepository>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    // Create mocks
    conversationFactory = {
      loadById: jest.fn(),
      loadByCustomerIdAndBusinessId: jest.fn(),
    } as jest.Mocked<IConversationFactory>;

    conversationWriteRepo = {
      save: jest.fn(),
    } as jest.Mocked<IConversationWriteRepository>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

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

  describe('4.7. Concurrency test: Concurrent updates detected', () => {
    it('should throw ConcurrencyException when version mismatch occurs', async () => {
      // Arrange: Create conversation with version=5
      const conversationId = UUID.generate().getValue();

      // Mock factory to return a fresh conversation on each call (simulating reload)
      conversationFactory.loadById.mockImplementation(() => {
        const conversation = Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.generate(),
          UUID.generate(),
          '+18095551234',
          ConversationState.initial(), // state
          'AWAITING_ADMIN', // status - always AWAITING_ADMIN (simulating fresh load)
          undefined, // selectedOfferingId
          undefined, // selectedDate
          undefined, // selectedTime
          undefined, // createdAppointmentId
          5, // version
        );
        return Promise.resolve(conversation);
      });

      // Mock: Save throws ConcurrencyException on all attempts
      conversationWriteRepo.save.mockRejectedValue(
        new ConcurrencyException('Conversation was modified by another transaction'),
      );

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act & Assert: Should throw error after 3 retries
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to send admin response after 3 attempts due to concurrent modifications',
      );

      // Assert: Save was called 3 times (3 retries)
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(3);

      // Assert: Factory.loadById was called 3 times (reload on each retry)
      expect(conversationFactory.loadById).toHaveBeenCalledTimes(3);
    });
  });

  describe('4.8. Concurrency test: Retry logic succeeds on second attempt', () => {
    it('should succeed on second attempt after ConcurrencyException', async () => {
      // Arrange: Create conversation
      const conversationId = UUID.generate().getValue();

      // Mock factory to return a fresh conversation on each call
      conversationFactory.loadById.mockImplementation(() => {
        const conversation = Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.generate(),
          UUID.generate(),
          '+18095551234',
          ConversationState.initial(), // state
          'AWAITING_ADMIN', // status - always AWAITING_ADMIN
          undefined, // selectedOfferingId
          undefined, // selectedDate
          undefined, // selectedTime
          undefined, // createdAppointmentId
          5, // version
        );
        return Promise.resolve(conversation);
      });

      // Mock: First save fails with ConcurrencyException, second succeeds
      conversationWriteRepo.save
        .mockRejectedValueOnce(
          new ConcurrencyException('Conversation was modified by another transaction'),
        )
        .mockResolvedValueOnce(undefined);

      commandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act: Execute command
      await handler.execute(command);

      // Assert: Save was called 2 times (1 failure + 1 success)
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(2);

      // Assert: Factory.loadById was called 2 times (initial + 1 retry)
      expect(conversationFactory.loadById).toHaveBeenCalledTimes(2);

      // Assert: SendWhatsAppMessageCommand was dispatched (success)
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should implement exponential backoff between retries', async () => {
      // Arrange
      const conversationId = UUID.generate().getValue();

      // Mock factory to return a fresh conversation on each call
      conversationFactory.loadById.mockImplementation(() => {
        const conversation = Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.generate(),
          UUID.generate(),
          '+18095551234',
          ConversationState.initial(), // state
          'AWAITING_ADMIN', // status - always AWAITING_ADMIN
          undefined, // selectedOfferingId
          undefined, // selectedDate
          undefined, // selectedTime
          undefined, // createdAppointmentId
          5, // version
        );
        return Promise.resolve(conversation);
      });

      // Mock: First two saves fail, third succeeds
      conversationWriteRepo.save
        .mockRejectedValueOnce(new ConcurrencyException('Conflict'))
        .mockRejectedValueOnce(new ConcurrencyException('Conflict'))
        .mockResolvedValueOnce(undefined);

      commandBus.execute.mockResolvedValue(undefined);

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act: Execute command and measure time
      const startTime = Date.now();
      await handler.execute(command);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert: Total duration should be at least 100ms + 200ms = 300ms
      // (exponential backoff: 100 * 2^1 + 100 * 2^2)
      expect(duration).toBeGreaterThanOrEqual(300);

      // Assert: Save was called 3 times
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('4.9. Concurrency test: Retry logic fails after max retries', () => {
    it('should throw error after 3 failed retry attempts', async () => {
      // Arrange
      const conversationId = UUID.generate().getValue();

      // Mock factory to return a fresh conversation on each call
      conversationFactory.loadById.mockImplementation(() => {
        const conversation = Conversation.fromPersistence(
          UUID.fromString(conversationId),
          UUID.generate(),
          UUID.generate(),
          '+18095551234',
          ConversationState.initial(), // state
          'AWAITING_ADMIN', // status - always AWAITING_ADMIN
          undefined, // selectedOfferingId
          undefined, // selectedDate
          undefined, // selectedTime
          undefined, // createdAppointmentId
          5, // version
        );
        return Promise.resolve(conversation);
      });

      // Mock: All saves fail with ConcurrencyException
      conversationWriteRepo.save.mockRejectedValue(
        new ConcurrencyException('Conversation was modified by another transaction'),
      );

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act & Assert: Should throw error after 3 retries
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to send admin response after 3 attempts due to concurrent modifications. Please try again.',
      );

      // Assert: Save was called exactly 3 times (max retries)
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(3);

      // Assert: Factory.loadById was called 3 times
      expect(conversationFactory.loadById).toHaveBeenCalledTimes(3);

      // Assert: SendWhatsAppMessageCommand was NOT dispatched (all failed)
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('should propagate non-concurrency errors immediately without retry', async () => {
      // Arrange
      const conversationId = UUID.generate().getValue();

      // Mock factory to return a fresh conversation
      conversationFactory.loadById.mockImplementation(() => {
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
          5, // version
        );
        return Promise.resolve(conversation);
      });

      // Mock: Save fails with non-concurrency error
      const databaseError = new Error('Database connection lost');
      conversationWriteRepo.save.mockRejectedValue(databaseError);

      const command = new SendAdminResponseCommand(conversationId, 'Response message');

      // Act & Assert: Should throw error immediately (no retry)
      await expect(handler.execute(command)).rejects.toThrow('Database connection lost');

      // Assert: Save was called only once (no retry for non-concurrency errors)
      expect(conversationWriteRepo.save).toHaveBeenCalledTimes(1);

      // Assert: Factory.loadById was called only once
      expect(conversationFactory.loadById).toHaveBeenCalledTimes(1);
    });
  });
});
