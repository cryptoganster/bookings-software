import { MockWhatsAppClient } from './mock-whatsapp-client';
import {
  Button,
  ListSection,
  Location,
} from '@conversation/domain/interfaces/external/whatsapp-client';

describe('MockWhatsAppClient', () => {
  let mockClient: MockWhatsAppClient;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
  });

  describe('sendMessage', () => {
    it('should track sent messages', async () => {
      // Arrange
      const to = '1234567890';
      const message = 'Hello, World!';

      // Act
      await mockClient.sendMessage(to, message);

      // Assert
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.sentMessages[0]).toEqual({ to, message });
    });

    it('should track multiple messages', async () => {
      // Arrange & Act
      await mockClient.sendMessage('1111111111', 'Message 1');
      await mockClient.sendMessage('2222222222', 'Message 2');
      await mockClient.sendMessage('3333333333', 'Message 3');

      // Assert
      expect(mockClient.sentMessages).toHaveLength(3);
      expect(mockClient.getTotalMessagesSent()).toBe(3);
    });

    it('should throw error when configured to fail', async () => {
      // Arrange
      mockClient.setShouldFail(true, 'Custom error message');

      // Act & Assert
      await expect(mockClient.sendMessage('1234567890', 'Test')).rejects.toThrow(
        'Custom error message',
      );
    });

    it('should simulate network delay', async () => {
      // Arrange
      mockClient.setDelay(100);
      const startTime = Date.now();

      // Act
      await mockClient.sendMessage('1234567890', 'Test');

      // Assert
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('sendInteractiveButtons', () => {
    it('should track sent interactive buttons', async () => {
      // Arrange
      const to = '1234567890';
      const message = 'Choose an option:';
      const buttons: Button[] = [
        { id: 'btn1', title: 'Option 1' },
        { id: 'btn2', title: 'Option 2' },
      ];

      // Act
      await mockClient.sendInteractiveButtons(to, message, buttons);

      // Assert
      expect(mockClient.sentInteractiveButtons).toHaveLength(1);
      expect(mockClient.sentInteractiveButtons[0]).toEqual({ to, message, buttons });
    });

    it('should throw error when configured to fail', async () => {
      // Arrange
      mockClient.setShouldFail(true);
      const buttons: Button[] = [{ id: 'btn1', title: 'Option 1' }];

      // Act & Assert
      await expect(
        mockClient.sendInteractiveButtons('1234567890', 'Test', buttons),
      ).rejects.toThrow();
    });
  });

  describe('sendInteractiveList', () => {
    it('should track sent interactive lists', async () => {
      // Arrange
      const to = '1234567890';
      const bodyText = 'Select a service:';
      const buttonText = 'View Services';
      const sections: ListSection[] = [
        {
          title: 'Available Services',
          rows: [
            { id: 'svc1', title: 'Service 1', description: 'Description 1' },
            { id: 'svc2', title: 'Service 2', description: 'Description 2' },
          ],
        },
      ];

      // Act
      await mockClient.sendInteractiveList(to, bodyText, buttonText, sections);

      // Assert
      expect(mockClient.sentInteractiveLists).toHaveLength(1);
      expect(mockClient.sentInteractiveLists[0]).toEqual({
        to,
        bodyText,
        buttonText,
        sections,
      });
    });

    it('should throw error when configured to fail', async () => {
      // Arrange
      mockClient.setShouldFail(true);
      const sections: ListSection[] = [
        {
          title: 'Test',
          rows: [{ id: 'test', title: 'Test' }],
        },
      ];

      // Act & Assert
      await expect(
        mockClient.sendInteractiveList('1234567890', 'Body', 'Button', sections),
      ).rejects.toThrow();
    });
  });

  describe('sendLocation', () => {
    it('should track sent locations', async () => {
      // Arrange
      const to = '1234567890';
      const location: Location = {
        latitude: 40.7128,
        longitude: -74.006,
        name: 'New York City',
        address: '123 Main St, New York, NY',
      };

      // Act
      await mockClient.sendLocation(to, location);

      // Assert
      expect(mockClient.sentLocations).toHaveLength(1);
      expect(mockClient.sentLocations[0]).toEqual({ to, location });
    });

    it('should throw error when configured to fail', async () => {
      // Arrange
      mockClient.setShouldFail(true);
      const location: Location = {
        latitude: 0,
        longitude: 0,
        name: 'Test',
        address: 'Test Address',
      };

      // Act & Assert
      await expect(mockClient.sendLocation('1234567890', location)).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      // Enviar varios tipos de mensajes
      await mockClient.sendMessage('1111111111', 'Text message');
      await mockClient.sendInteractiveButtons('2222222222', 'Buttons', [
        { id: 'btn1', title: 'Button 1' },
      ]);
      await mockClient.sendInteractiveList('3333333333', 'List', 'View', [
        { title: 'Section', rows: [{ id: 'item1', title: 'Item 1' }] },
      ]);
      await mockClient.sendLocation('4444444444', {
        latitude: 0,
        longitude: 0,
        name: 'Test',
        address: 'Test',
      });
    });

    it('should count total messages sent', () => {
      expect(mockClient.getTotalMessagesSent()).toBe(4);
    });

    it('should check if message was sent', () => {
      expect(mockClient.hasMessageBeenSent('1111111111', 'Text message')).toBe(true);
      expect(mockClient.hasMessageBeenSent('1111111111', 'Wrong message')).toBe(false);
      expect(mockClient.hasMessageBeenSent('9999999999', 'Text message')).toBe(false);
    });

    it('should check if interactive buttons were sent', () => {
      expect(mockClient.hasInteractiveButtonsBeenSent('2222222222')).toBe(true);
      expect(mockClient.hasInteractiveButtonsBeenSent('9999999999')).toBe(false);
    });

    it('should check if interactive list was sent', () => {
      expect(mockClient.hasInteractiveListBeenSent('3333333333')).toBe(true);
      expect(mockClient.hasInteractiveListBeenSent('9999999999')).toBe(false);
    });

    it('should check if location was sent', () => {
      expect(mockClient.hasLocationBeenSent('4444444444')).toBe(true);
      expect(mockClient.hasLocationBeenSent('9999999999')).toBe(false);
    });

    it('should get last message to recipient', () => {
      expect(mockClient.getLastMessageTo('1111111111')).toBe('Text message');
      expect(mockClient.getLastMessageTo('9999999999')).toBeUndefined();
    });

    it('should get all messages to recipient', async () => {
      // Arrange
      await mockClient.sendMessage('5555555555', 'Message 1');
      await mockClient.sendMessage('5555555555', 'Message 2');
      await mockClient.sendMessage('5555555555', 'Message 3');

      // Act
      const messages = mockClient.getMessagesTo('5555555555');

      // Assert
      expect(messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
    });

    it('should reset all tracked data', () => {
      // Act
      mockClient.reset();

      // Assert
      expect(mockClient.sentMessages).toHaveLength(0);
      expect(mockClient.sentInteractiveButtons).toHaveLength(0);
      expect(mockClient.sentInteractiveLists).toHaveLength(0);
      expect(mockClient.sentLocations).toHaveLength(0);
      expect(mockClient.getTotalMessagesSent()).toBe(0);
    });

    it('should reset failure configuration', () => {
      // Arrange
      mockClient.setShouldFail(true, 'Custom error');
      mockClient.setDelay(100);

      // Act
      mockClient.reset();

      // Assert - should not throw
      expect(async () => {
        await mockClient.sendMessage('1234567890', 'Test');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', async () => {
      await mockClient.sendMessage('1234567890', '');
      expect(mockClient.sentMessages[0].message).toBe('');
    });

    it('should handle empty buttons array', async () => {
      await mockClient.sendInteractiveButtons('1234567890', 'Message', []);
      expect(mockClient.sentInteractiveButtons[0].buttons).toHaveLength(0);
    });

    it('should handle empty sections array', async () => {
      await mockClient.sendInteractiveList('1234567890', 'Body', 'Button', []);
      expect(mockClient.sentInteractiveLists[0].sections).toHaveLength(0);
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = 'Hello! 👋 ¿Cómo estás? 你好';
      await mockClient.sendMessage('1234567890', specialMessage);
      expect(mockClient.sentMessages[0].message).toBe(specialMessage);
    });

    it('should handle very long phone numbers', async () => {
      const longNumber = '123456789012345678901234567890';
      await mockClient.sendMessage(longNumber, 'Test');
      expect(mockClient.sentMessages[0].to).toBe(longNumber);
    });
  });
});
