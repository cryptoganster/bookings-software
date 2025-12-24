import { Message } from '@conversation/domain/aggregates/message';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import { EmptyMessageContentException } from '@conversation/domain/exceptions/empty-message-content.exception';

describe('Message Aggregate', () => {
  const validId = UUID.generate();
  const validConversationId = UUID.generate();
  const validDirection = MessageDirection.outbound();
  const validContent = 'Hello, this is a test message';
  const validMessageType = MessageType.text();
  const validIsFromAdmin = true;

  describe('create', () => {
    it('should create a message with valid data', () => {
      // Act
      const message = Message.create(
        validId,
        validConversationId,
        validDirection,
        validContent,
        validMessageType,
        validIsFromAdmin,
      );

      // Assert
      expect(message).toBeDefined();
      expect(message.getId().equals(validId)).toBe(true);
      expect(message.getConversationId().equals(validConversationId)).toBe(true);
      expect(message.getDirection().equals(validDirection)).toBe(true);
      expect(message.getContent()).toBe(validContent);
      expect(message.getMessageType().equals(validMessageType)).toBe(true);
      expect(message.getIsFromAdmin()).toBe(validIsFromAdmin);
      expect(message.getSentAt()).toBeInstanceOf(Date);
    });

    it('should reject empty content', () => {
      // Arrange
      const emptyContent = '';

      // Act & Assert
      expect(() => {
        Message.create(
          validId,
          validConversationId,
          validDirection,
          emptyContent,
          validMessageType,
          validIsFromAdmin,
        );
      }).toThrow(EmptyMessageContentException);
    });

    it('should reject whitespace-only content', () => {
      // Arrange
      const whitespaceContent = '   ';

      // Act & Assert
      expect(() => {
        Message.create(
          validId,
          validConversationId,
          validDirection,
          whitespaceContent,
          validMessageType,
          validIsFromAdmin,
        );
      }).toThrow(EmptyMessageContentException);
    });

    it('should trim content', () => {
      // Arrange
      const contentWithSpaces = '  Hello World  ';

      // Act
      const message = Message.create(
        validId,
        validConversationId,
        validDirection,
        contentWithSpaces,
        validMessageType,
        validIsFromAdmin,
      );

      // Assert
      expect(message.getContent()).toBe('Hello World');
    });

    it('should create message with isFromAdmin false', () => {
      // Act
      const message = Message.create(
        validId,
        validConversationId,
        validDirection,
        validContent,
        validMessageType,
        false,
      );

      // Assert
      expect(message.getIsFromAdmin()).toBe(false);
    });

    it('should create message with different message types', () => {
      // Arrange
      const buttonType = MessageType.button();
      const locationType = MessageType.location();

      // Act
      const buttonMessage = Message.create(
        validId,
        validConversationId,
        validDirection,
        validContent,
        buttonType,
        validIsFromAdmin,
      );

      const locationMessage = Message.create(
        UUID.generate(),
        validConversationId,
        validDirection,
        validContent,
        locationType,
        validIsFromAdmin,
      );

      // Assert
      expect(buttonMessage.getMessageType().equals(buttonType)).toBe(true);
      expect(locationMessage.getMessageType().equals(locationType)).toBe(true);
    });

    it('should create message with inbound direction', () => {
      // Arrange
      const inboundDirection = MessageDirection.inbound();

      // Act
      const message = Message.create(
        validId,
        validConversationId,
        inboundDirection,
        validContent,
        validMessageType,
        false,
      );

      // Assert
      expect(message.getDirection().equals(inboundDirection)).toBe(true);
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct message from persistence data', () => {
      // Arrange
      const id = UUID.generate();
      const conversationId = UUID.generate();
      const direction = MessageDirection.outbound();
      const content = 'Persisted message';
      const messageType = MessageType.text();
      const isFromAdmin = true;
      const sentAt = new Date('2024-12-23T10:00:00Z');

      // Act
      const message = Message.fromPersistence(
        id,
        conversationId,
        direction,
        content,
        messageType,
        sentAt,
        isFromAdmin,
      );

      // Assert
      expect(message).toBeDefined();
      expect(message.getId().equals(id)).toBe(true);
      expect(message.getConversationId().equals(conversationId)).toBe(true);
      expect(message.getDirection().equals(direction)).toBe(true);
      expect(message.getContent()).toBe(content);
      expect(message.getMessageType().equals(messageType)).toBe(true);
      expect(message.getIsFromAdmin()).toBe(isFromAdmin);
      expect(message.getSentAt()).toEqual(sentAt);
    });

    it('should reconstruct message with all message types', () => {
      // Arrange
      const textType = MessageType.text();
      const buttonType = MessageType.button();
      const locationType = MessageType.location();

      // Act
      const textMessage = Message.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        MessageDirection.outbound(),
        'Text message',
        textType,
        new Date(),
        true,
      );

      const buttonMessage = Message.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        MessageDirection.outbound(),
        'Button message',
        buttonType,
        new Date(),
        true,
      );

      const locationMessage = Message.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        MessageDirection.outbound(),
        'Location message',
        locationType,
        new Date(),
        true,
      );

      // Assert
      expect(textMessage.getMessageType().equals(textType)).toBe(true);
      expect(buttonMessage.getMessageType().equals(buttonType)).toBe(true);
      expect(locationMessage.getMessageType().equals(locationType)).toBe(true);
    });

    it('should reconstruct message with both directions', () => {
      // Arrange
      const inbound = MessageDirection.inbound();
      const outbound = MessageDirection.outbound();

      // Act
      const inboundMessage = Message.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        inbound,
        'Inbound message',
        MessageType.text(),
        new Date(),
        false,
      );

      const outboundMessage = Message.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        outbound,
        'Outbound message',
        MessageType.text(),
        new Date(),
        true,
      );

      // Assert
      expect(inboundMessage.getDirection().equals(inbound)).toBe(true);
      expect(outboundMessage.getDirection().equals(outbound)).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      // Arrange
      const id = UUID.generate();
      const conversationId = UUID.generate();
      const direction = MessageDirection.outbound();
      const content = 'Test message';
      const messageType = MessageType.text();
      const isFromAdmin = true;

      // Act
      const message = Message.create(
        id,
        conversationId,
        direction,
        content,
        messageType,
        isFromAdmin,
      );

      // Assert
      expect(message.getId()).toBe(id);
      expect(message.getConversationId()).toBe(conversationId);
      expect(message.getDirection()).toBe(direction);
      expect(message.getContent()).toBe(content);
      expect(message.getMessageType()).toBe(messageType);
      expect(message.getIsFromAdmin()).toBe(isFromAdmin);
      expect(message.getSentAt()).toBeInstanceOf(Date);
    });
  });
});
