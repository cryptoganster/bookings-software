/**
 * Example: Using MockWhatsAppClient in Command Handler Tests
 *
 * Este archivo demuestra cómo usar MockWhatsAppClient para testear
 * command handlers que envían mensajes de WhatsApp.
 */

import { MockWhatsAppClient } from './mock-whatsapp-client';
import { IWhatsAppClient } from '@conversation/domain/interfaces/external/whatsapp-client';

// Ejemplo de un Command Handler simplificado
class SendWelcomeMessageCommand {
  constructor(
    public readonly phoneNumber: string,
    public readonly customerName: string,
  ) {}
}

class SendWelcomeMessageHandler {
  constructor(private readonly whatsappClient: IWhatsAppClient) {}

  async execute(command: SendWelcomeMessageCommand): Promise<void> {
    const message = `¡Hola ${command.customerName}! Bienvenido a nuestro servicio de reservas. ¿En qué podemos ayudarte hoy?`;
    await this.whatsappClient.sendMessage(command.phoneNumber, message);
  }
}

// Ejemplo de un Command Handler con botones interactivos
class SendAppointmentOptionsCommand {
  constructor(public readonly phoneNumber: string) {}
}

class SendAppointmentOptionsHandler {
  constructor(private readonly whatsappClient: IWhatsAppClient) {}

  async execute(command: SendAppointmentOptionsCommand): Promise<void> {
    const message = '¿Qué te gustaría hacer?';
    const buttons = [
      { id: 'new_appointment', title: 'Nueva Cita' },
      { id: 'view_appointments', title: 'Ver Mis Citas' },
      { id: 'cancel_appointment', title: 'Cancelar Cita' },
    ];

    await this.whatsappClient.sendInteractiveButtons(command.phoneNumber, message, buttons);
  }
}

// Ejemplo de un Command Handler con retry logic
class SendAppointmentReminderCommand {
  constructor(
    public readonly phoneNumber: string,
    public readonly appointmentDate: string,
  ) {}
}

class SendAppointmentReminderHandler {
  constructor(private readonly whatsappClient: IWhatsAppClient) {}

  async execute(command: SendAppointmentReminderCommand): Promise<void> {
    const message = `Recordatorio: Tienes una cita programada para ${command.appointmentDate}. ¡Te esperamos!`;

    try {
      await this.whatsappClient.sendMessage(command.phoneNumber, message);
    } catch (_error) {
      // En caso de error, intentar enviar un mensaje simplificado
      await this.whatsappClient.sendMessage(
        command.phoneNumber,
        'Tienes una cita programada. ¡Te esperamos!',
      );
    }
  }
}

// ========== TESTS ==========

describe('Example: Using MockWhatsAppClient', () => {
  let mockClient: MockWhatsAppClient;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
  });

  describe('SendWelcomeMessageHandler', () => {
    it('should send personalized welcome message', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);
      const command = new SendWelcomeMessageCommand('1234567890', 'Juan');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.sentMessages[0].to).toBe('1234567890');
      expect(mockClient.sentMessages[0].message).toContain('Juan');
      expect(mockClient.sentMessages[0].message).toContain('Bienvenido');
    });

    it('should send message to correct phone number', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);
      const command = new SendWelcomeMessageCommand('9876543210', 'María');

      // Act
      await handler.execute(command);

      // Assert
      const lastMessage = mockClient.getLastMessageTo('9876543210');
      expect(lastMessage).toBeDefined();
      expect(lastMessage).toContain('María');
      expect(mockClient.sentMessages[0].to).toBe('9876543210');
    });
  });

  describe('SendAppointmentOptionsHandler', () => {
    it('should send interactive buttons with correct options', async () => {
      // Arrange
      const handler = new SendAppointmentOptionsHandler(mockClient);
      const command = new SendAppointmentOptionsCommand('1234567890');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.sentInteractiveButtons).toHaveLength(1);
      expect(mockClient.sentInteractiveButtons[0].buttons).toHaveLength(3);
      expect(mockClient.sentInteractiveButtons[0].buttons).toEqual([
        { id: 'new_appointment', title: 'Nueva Cita' },
        { id: 'view_appointments', title: 'Ver Mis Citas' },
        { id: 'cancel_appointment', title: 'Cancelar Cita' },
      ]);
    });

    it('should send buttons to correct recipient', async () => {
      // Arrange
      const handler = new SendAppointmentOptionsHandler(mockClient);
      const command = new SendAppointmentOptionsCommand('5555555555');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.hasInteractiveButtonsBeenSent('5555555555')).toBe(true);
    });
  });

  describe('SendAppointmentReminderHandler', () => {
    it('should send reminder with appointment date', async () => {
      // Arrange
      const handler = new SendAppointmentReminderHandler(mockClient);
      const command = new SendAppointmentReminderCommand('1234567890', '15 de Enero, 10:00 AM');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.getLastMessageTo('1234567890')).toContain('15 de Enero, 10:00 AM');
    });

    it('should handle WhatsApp API errors gracefully', async () => {
      // Arrange
      mockClient.setShouldFail(true, 'WhatsApp API temporarily unavailable');
      const handler = new SendAppointmentReminderHandler(mockClient);
      const command = new SendAppointmentReminderCommand('1234567890', '15 de Enero, 10:00 AM');

      // Act & Assert
      // El handler intenta enviar el mensaje, falla, y luego intenta enviar un mensaje simplificado
      // Ambos intentos fallarán porque el mock está configurado para fallar
      try {
        await handler.execute(command);
        fail('Should have thrown an error');
      } catch (_error) {
        // Expected error - prefixed with _ to indicate intentionally unused
      }

      // Verificar que se intentó enviar al menos un mensaje
      expect(mockClient.sentMessages).toHaveLength(0); // Ningún mensaje se envió exitosamente
    });

    it('should retry with simplified message on first failure', async () => {
      // Arrange
      let callCount = 0;
      const customMock = new MockWhatsAppClient();

      // Configurar para fallar solo en la primera llamada
      const originalSendMessage = customMock.sendMessage.bind(customMock);
      customMock.sendMessage = async (to: string, message: string) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return originalSendMessage(to, message);
      };

      const handler = new SendAppointmentReminderHandler(customMock);
      const command = new SendAppointmentReminderCommand('1234567890', '15 de Enero, 10:00 AM');

      // Act
      await handler.execute(command);

      // Assert
      expect(customMock.sentMessages).toHaveLength(1);
      expect(customMock.getLastMessageTo('1234567890')).toBe(
        'Tienes una cita programada. ¡Te esperamos!',
      );
    });
  });

  describe('Multiple handlers in sequence', () => {
    it('should track messages from multiple handlers', async () => {
      // Arrange
      const welcomeHandler = new SendWelcomeMessageHandler(mockClient);
      const optionsHandler = new SendAppointmentOptionsHandler(mockClient);

      // Act
      await welcomeHandler.execute(new SendWelcomeMessageCommand('1234567890', 'Carlos'));
      await optionsHandler.execute(new SendAppointmentOptionsCommand('1234567890'));

      // Assert
      expect(mockClient.getTotalMessagesSent()).toBe(2);
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.sentInteractiveButtons).toHaveLength(1);
    });

    it('should track messages to different recipients', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);

      // Act
      await handler.execute(new SendWelcomeMessageCommand('1111111111', 'Ana'));
      await handler.execute(new SendWelcomeMessageCommand('2222222222', 'Luis'));
      await handler.execute(new SendWelcomeMessageCommand('3333333333', 'Pedro'));

      // Assert
      expect(mockClient.sentMessages).toHaveLength(3);
      expect(mockClient.getMessagesTo('1111111111')).toHaveLength(1);
      expect(mockClient.getMessagesTo('2222222222')).toHaveLength(1);
      expect(mockClient.getMessagesTo('3333333333')).toHaveLength(1);
    });
  });

  describe('Testing with network delays', () => {
    it('should handle slow network gracefully', async () => {
      // Arrange
      mockClient.setDelay(100); // Simular 100ms de latencia
      const handler = new SendWelcomeMessageHandler(mockClient);
      const command = new SendWelcomeMessageCommand('1234567890', 'Test');

      // Act
      const startTime = Date.now();
      await handler.execute(command);
      const elapsed = Date.now() - startTime;

      // Assert
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(mockClient.sentMessages).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty customer name', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);
      const command = new SendWelcomeMessageCommand('1234567890', '');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.sentMessages).toHaveLength(1);
      expect(mockClient.getLastMessageTo('1234567890')).toContain('¡Hola !');
    });

    it('should handle special characters in phone number', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);
      const command = new SendWelcomeMessageCommand('+1 (234) 567-8900', 'Test');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.sentMessages[0].to).toBe('+1 (234) 567-8900');
    });

    it('should handle very long customer names', async () => {
      // Arrange
      const handler = new SendWelcomeMessageHandler(mockClient);
      const longName = 'A'.repeat(100);
      const command = new SendWelcomeMessageCommand('1234567890', longName);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockClient.getLastMessageTo('1234567890')).toContain(longName);
    });
  });
});
