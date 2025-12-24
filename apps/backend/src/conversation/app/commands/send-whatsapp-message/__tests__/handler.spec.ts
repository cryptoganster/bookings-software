import { Test, TestingModule } from '@nestjs/testing';
import { SendWhatsAppMessageHandler } from '@conversation/app/commands/send-whatsapp-message/handler';
import { SendWhatsAppMessageCommand } from '@conversation/app/commands/send-whatsapp-message/command';
import { IMessageWriteRepository } from '@conversation/domain/interfaces/repositories/message-write.repository.interface';
import { IWhatsAppClient } from '@conversation/domain/interfaces/external/whatsapp-client';
import { IUnitOfWork } from '@shared/kernel/uow';
import { WhatsAppMessageFailedException } from '@conversation/domain/exceptions/whatsapp-message-failed.exception';

describe('SendWhatsAppMessageHandler', () => {
  let handler: SendWhatsAppMessageHandler;
  let messageRepository: jest.Mocked<IMessageWriteRepository>;
  let whatsappClient: jest.Mocked<IWhatsAppClient>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Create mocks
    messageRepository = {
      save: jest.fn(),
    } as any;

    whatsappClient = {
      sendMessage: jest.fn(),
      sendInteractiveButtons: jest.fn(),
      sendLocation: jest.fn(),
    } as any;

    uow = {
      transaction: jest.fn((work) => work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendWhatsAppMessageHandler,
        {
          provide: 'IMessageWriteRepository',
          useValue: messageRepository,
        },
        {
          provide: 'IWhatsAppClient',
          useValue: whatsappClient,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    handler = module.get<SendWhatsAppMessageHandler>(SendWhatsAppMessageHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - success path', () => {
    it('should send message and persist successfully', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Hello, this is a test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);
      messageRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.messageId).toBeDefined();
      expect(typeof result.messageId).toBe('string');

      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(whatsappClient.sendMessage).toHaveBeenCalledWith(
        '+1234567890',
        'Hello, this is a test message',
      );

      expect(messageRepository.save).toHaveBeenCalledTimes(1);
      expect(uow.transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle TEXT message type', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440001',
        'Text message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(whatsappClient.sendMessage).toHaveBeenCalledWith('+1234567890', 'Text message');
    });

    it('should handle BUTTON message type', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440002',
        'Button message',
        'BUTTON',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(whatsappClient.sendMessage).toHaveBeenCalledWith('+1234567890', 'Button message');
    });

    it('should handle LOCATION message type', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440003',
        'Location message',
        'LOCATION',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(whatsappClient.sendMessage).toHaveBeenCalledWith('+1234567890', 'Location message');
    });
  });

  describe('execute - retry logic', () => {
    it('should retry on WhatsApp API failure and succeed on second attempt', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440004',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(2);
      expect(messageRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should retry on WhatsApp API failure and succeed on third attempt', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440005',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(3);
      expect(messageRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw WhatsAppMessageFailedException after 3 failed attempts', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440006',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(WhatsAppMessageFailedException);
      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(3);
      expect(messageRepository.save).not.toHaveBeenCalled();
    });

    it('should include error message in exception', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440007',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      const errorMessage = 'Specific network error';
      whatsappClient.sendMessage.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      try {
        await handler.execute(command);
        fail('Should have thrown WhatsAppMessageFailedException');
      } catch (error) {
        expect(error).toBeInstanceOf(WhatsAppMessageFailedException);
        expect((error as Error).message).toContain('550e8400-e29b-41d4-a716-446655440007');
        expect((error as Error).message).toContain(errorMessage);
      }
    });
  });

  describe('execute - exponential backoff', () => {
    it('should wait with exponential backoff between retries', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440008',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(undefined);

      const startTime = Date.now();

      // Act
      await handler.execute(command);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      // First retry: 100ms, Second retry: 200ms
      // Total minimum: 300ms
      expect(duration).toBeGreaterThanOrEqual(300);
      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('execute - transaction rollback', () => {
    it('should not persist message if WhatsApp API fails after all retries', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-446655440009',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(WhatsAppMessageFailedException);
      expect(messageRepository.save).not.toHaveBeenCalled();
      expect(uow.transaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction if repository save fails', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-44665544000a',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);
      messageRepository.save.mockRejectedValue(new Error('Database error'));
      uow.transaction.mockImplementation(async (work) => {
        try {
          return await work();
        } catch (error) {
          throw error;
        }
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database error');
      expect(whatsappClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(messageRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute - message creation', () => {
    it('should create message with correct properties', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-44665544000b',
        'Test message',
        'TEXT',
        '+1234567890',
        true,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);

      let savedMessage: any;
      messageRepository.save.mockImplementation(async (message) => {
        savedMessage = message;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(savedMessage).toBeDefined();
      expect(savedMessage.getContent()).toBe('Test message');
      expect(savedMessage.getDirection().getValue()).toBe('OUTBOUND');
      expect(savedMessage.getMessageType().getValue()).toBe('TEXT');
      expect(savedMessage.getIsFromAdmin()).toBe(true);
    });

    it('should create message with isFromAdmin false', async () => {
      // Arrange
      const command = new SendWhatsAppMessageCommand(
        '550e8400-e29b-41d4-a716-44665544000c',
        'Test message',
        'TEXT',
        '+1234567890',
        false,
      );

      whatsappClient.sendMessage.mockResolvedValue(undefined);

      let savedMessage: any;
      messageRepository.save.mockImplementation(async (message) => {
        savedMessage = message;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(savedMessage.getIsFromAdmin()).toBe(false);
    });
  });
});
