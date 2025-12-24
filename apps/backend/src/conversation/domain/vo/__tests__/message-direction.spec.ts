import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { InvalidMessageDirectionException } from '@conversation/domain/exceptions/invalid-message-direction.exception';

describe('MessageDirection Value Object', () => {
  describe('factory methods', () => {
    it('should create inbound direction', () => {
      // Act
      const direction = MessageDirection.inbound();

      // Assert
      expect(direction).toBeDefined();
      expect(direction.getValue()).toBe('INBOUND');
      expect(direction.isInbound()).toBe(true);
      expect(direction.isOutbound()).toBe(false);
    });

    it('should create outbound direction', () => {
      // Act
      const direction = MessageDirection.outbound();

      // Assert
      expect(direction).toBeDefined();
      expect(direction.getValue()).toBe('OUTBOUND');
      expect(direction.isInbound()).toBe(false);
      expect(direction.isOutbound()).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create direction from valid string "INBOUND"', () => {
      // Act
      const direction = MessageDirection.fromString('INBOUND');

      // Assert
      expect(direction.getValue()).toBe('INBOUND');
      expect(direction.isInbound()).toBe(true);
    });

    it('should create direction from valid string "OUTBOUND"', () => {
      // Act
      const direction = MessageDirection.fromString('OUTBOUND');

      // Assert
      expect(direction.getValue()).toBe('OUTBOUND');
      expect(direction.isOutbound()).toBe(true);
    });

    it('should reject invalid direction string', () => {
      // Act & Assert
      expect(() => {
        MessageDirection.fromString('INVALID');
      }).toThrow(InvalidMessageDirectionException);
    });

    it('should reject empty string', () => {
      // Act & Assert
      expect(() => {
        MessageDirection.fromString('');
      }).toThrow(InvalidMessageDirectionException);
    });

    it('should reject lowercase string', () => {
      // Act & Assert
      expect(() => {
        MessageDirection.fromString('inbound');
      }).toThrow(InvalidMessageDirectionException);
    });
  });

  describe('equality', () => {
    it('should be equal when values are the same', () => {
      // Arrange
      const direction1 = MessageDirection.inbound();
      const direction2 = MessageDirection.inbound();

      // Act & Assert
      expect(direction1.equals(direction2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      // Arrange
      const direction1 = MessageDirection.inbound();
      const direction2 = MessageDirection.outbound();

      // Act & Assert
      expect(direction1.equals(direction2)).toBe(false);
    });

    it('should be equal when created from string and factory method', () => {
      // Arrange
      const direction1 = MessageDirection.fromString('INBOUND');
      const direction2 = MessageDirection.inbound();

      // Act & Assert
      expect(direction1.equals(direction2)).toBe(true);
    });
  });

  describe('isInbound', () => {
    it('should return true for inbound direction', () => {
      // Arrange
      const direction = MessageDirection.inbound();

      // Act & Assert
      expect(direction.isInbound()).toBe(true);
    });

    it('should return false for outbound direction', () => {
      // Arrange
      const direction = MessageDirection.outbound();

      // Act & Assert
      expect(direction.isInbound()).toBe(false);
    });
  });

  describe('isOutbound', () => {
    it('should return true for outbound direction', () => {
      // Arrange
      const direction = MessageDirection.outbound();

      // Act & Assert
      expect(direction.isOutbound()).toBe(true);
    });

    it('should return false for inbound direction', () => {
      // Arrange
      const direction = MessageDirection.inbound();

      // Act & Assert
      expect(direction.isOutbound()).toBe(false);
    });
  });
});
