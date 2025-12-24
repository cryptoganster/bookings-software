import { MessageType } from '@conversation/domain/vo/message-type';
import { InvalidMessageTypeException } from '@conversation/domain/exceptions/invalid-message-type.exception';

describe('MessageType Value Object', () => {
  describe('factory methods', () => {
    it('should create text message type', () => {
      // Act
      const messageType = MessageType.text();

      // Assert
      expect(messageType).toBeDefined();
      expect(messageType.getValue()).toBe('TEXT');
    });

    it('should create button message type', () => {
      // Act
      const messageType = MessageType.button();

      // Assert
      expect(messageType).toBeDefined();
      expect(messageType.getValue()).toBe('BUTTON');
    });

    it('should create location message type', () => {
      // Act
      const messageType = MessageType.location();

      // Assert
      expect(messageType).toBeDefined();
      expect(messageType.getValue()).toBe('LOCATION');
    });
  });

  describe('fromString', () => {
    it('should create message type from valid string "TEXT"', () => {
      // Act
      const messageType = MessageType.fromString('TEXT');

      // Assert
      expect(messageType.getValue()).toBe('TEXT');
    });

    it('should create message type from valid string "BUTTON"', () => {
      // Act
      const messageType = MessageType.fromString('BUTTON');

      // Assert
      expect(messageType.getValue()).toBe('BUTTON');
    });

    it('should create message type from valid string "LOCATION"', () => {
      // Act
      const messageType = MessageType.fromString('LOCATION');

      // Assert
      expect(messageType.getValue()).toBe('LOCATION');
    });

    it('should reject invalid message type string', () => {
      // Act & Assert
      expect(() => {
        MessageType.fromString('INVALID');
      }).toThrow(InvalidMessageTypeException);
    });

    it('should reject empty string', () => {
      // Act & Assert
      expect(() => {
        MessageType.fromString('');
      }).toThrow(InvalidMessageTypeException);
    });

    it('should reject lowercase string', () => {
      // Act & Assert
      expect(() => {
        MessageType.fromString('text');
      }).toThrow(InvalidMessageTypeException);
    });
  });

  describe('equality', () => {
    it('should be equal when values are the same', () => {
      // Arrange
      const type1 = MessageType.text();
      const type2 = MessageType.text();

      // Act & Assert
      expect(type1.equals(type2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      // Arrange
      const type1 = MessageType.text();
      const type2 = MessageType.button();

      // Act & Assert
      expect(type1.equals(type2)).toBe(false);
    });

    it('should be equal when created from string and factory method', () => {
      // Arrange
      const type1 = MessageType.fromString('TEXT');
      const type2 = MessageType.text();

      // Act & Assert
      expect(type1.equals(type2)).toBe(true);
    });

    it('should handle all three types correctly', () => {
      // Arrange
      const text1 = MessageType.text();
      const text2 = MessageType.text();
      const button1 = MessageType.button();
      const button2 = MessageType.button();
      const location1 = MessageType.location();
      const location2 = MessageType.location();

      // Act & Assert
      expect(text1.equals(text2)).toBe(true);
      expect(button1.equals(button2)).toBe(true);
      expect(location1.equals(location2)).toBe(true);

      expect(text1.equals(button1)).toBe(false);
      expect(text1.equals(location1)).toBe(false);
      expect(button1.equals(location1)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return correct value for text type', () => {
      // Arrange
      const messageType = MessageType.text();

      // Act & Assert
      expect(messageType.getValue()).toBe('TEXT');
    });

    it('should return correct value for button type', () => {
      // Arrange
      const messageType = MessageType.button();

      // Act & Assert
      expect(messageType.getValue()).toBe('BUTTON');
    });

    it('should return correct value for location type', () => {
      // Arrange
      const messageType = MessageType.location();

      // Act & Assert
      expect(messageType.getValue()).toBe('LOCATION');
    });
  });
});
